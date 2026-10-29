import { getGenAI } from "./aiDebateService.ts";
import {
  getExecutedPositions,
  getPortfolioAccounting,
  refreshOpenPositions,
  closePosition,
  routeOrder,
} from "./tradingService.ts";
import { STOCK_UNIVERSE_MAP } from "../../src/data/universe.ts";
import { fetchRealtimeLivePrice } from "./marketDataService.ts";

export type RiskProfileType = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE_GROWTH";

export interface SectorTargetInput {
  sector: string;
  targetPct: number;
}

export interface RebalanceAction {
  id: string;
  order_id?: string;
  ticker: string;
  company_name: string;
  sector: string;
  action: "TRIM" | "CLOSE" | "EXPAND" | "HOLD" | "NEW_ENTRY";
  currentShares: number;
  suggestedShares: number;
  sharesDelta: number;
  currentPrice: number;
  estimatedCashImpactRupees: number; // positive = cash freed, negative = cash required
  currentWeightPct: number;
  suggestedWeightPct: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
  suggestedStopLoss?: number;
  suggestedTargetPrice?: number;
}

export interface SectorDriftAnalysis {
  sector: string;
  currentValueRupees: number;
  currentWeightPct: number;
  targetWeightPct: number;
  driftPct: number; // current - target
  status: "OVERWEIGHT" | "UNDERWEIGHT" | "ALIGNED";
}

export interface RebalancingReport {
  timestamp: string;
  riskProfile: RiskProfileType;
  healthScore: number; // 0-100
  overallAssessment: string;
  riskHighlights: string[];
  totalEquity: number;
  currentLiquidCash: number;
  investedCapital: number;
  sectorDrift: SectorDriftAnalysis[];
  suggestedActions: RebalanceAction[];
  projectedMetrics: {
    projectedLiquidCash: number;
    projectedCashRatioPct: number;
    projectedHealthScore: number;
    netCashFreedRupees: number;
  };
}

export const DEFAULT_SECTOR_TARGETS: Record<RiskProfileType, SectorTargetInput[]> = {
  CONSERVATIVE: [
    { sector: "Banking & Finance", targetPct: 15 },
    { sector: "Energy & Oil", targetPct: 20 },
    { sector: "FMCG", targetPct: 20 },
    { sector: "Pharma & Healthcare", targetPct: 20 },
    { sector: "IT & Tech", targetPct: 15 },
    { sector: "Automobile", targetPct: 10 },
  ],
  BALANCED: [
    { sector: "Banking & Finance", targetPct: 20 },
    { sector: "IT & Tech", targetPct: 20 },
    { sector: "Energy & Oil", targetPct: 15 },
    { sector: "Automobile", targetPct: 15 },
    { sector: "Pharma & Healthcare", targetPct: 15 },
    { sector: "Infrastructure & Capital Goods", targetPct: 15 },
  ],
  AGGRESSIVE_GROWTH: [
    { sector: "Banking & Finance", targetPct: 25 },
    { sector: "IT & Tech", targetPct: 25 },
    { sector: "Infrastructure & Capital Goods", targetPct: 20 },
    { sector: "Automobile", targetPct: 15 },
    { sector: "Telecom", targetPct: 15 },
  ],
};

const RISK_PROFILE_RULES: Record<
  RiskProfileType,
  {
    maxTargetExposurePerSectorPct: number;
    maxSingleStockWeightPct: number;
    minCashReservePct: number;
    label: string;
  }
> = {
  CONSERVATIVE: {
    maxTargetExposurePerSectorPct: 25,
    maxSingleStockWeightPct: 12,
    minCashReservePct: 35,
    label: "Conservative Capital Preservation",
  },
  BALANCED: {
    maxTargetExposurePerSectorPct: 30,
    maxSingleStockWeightPct: 18,
    minCashReservePct: 20,
    label: "Balanced All-Weather Growth",
  },
  AGGRESSIVE_GROWTH: {
    maxTargetExposurePerSectorPct: 40,
    maxSingleStockWeightPct: 28,
    minCashReservePct: 10,
    label: "Aggressive Asymmetric Alpha",
  },
};

/**
 * Executes algorithmic + Gemini AI portfolio rebalancing assessment
 */
export async function computeAiRebalancing(
  riskProfile: RiskProfileType = "BALANCED",
  customSectorTargets?: SectorTargetInput[]
): Promise<RebalancingReport> {
  // 1. Refresh live MTM quotes
  try {
    await refreshOpenPositions();
  } catch (err) {
    console.warn("Non-fatal quote refresh error before rebalancing:", err);
  }

  const accounting = getPortfolioAccounting();
  const openPositions = getExecutedPositions().filter((p) => p.status === "OPEN");
  const totalEquity = Math.max(accounting.totalEquity, 1000);
  const liquidCash = accounting.liquidCash;
  const investedCapital = accounting.investedCapital;

  const targets = customSectorTargets && customSectorTargets.length > 0
    ? customSectorTargets
    : DEFAULT_SECTOR_TARGETS[riskProfile];

  const profileRule = RISK_PROFILE_RULES[riskProfile];

  // 2. Compute Sector Breakdown & Drift
  const sectorValues: Record<string, number> = {};
  for (const pos of openPositions) {
    const info = STOCK_UNIVERSE_MAP[pos.ticker];
    const sec = info?.sector || "NSE Equities";
    const val = (pos.current_price || pos.fill_price) * pos.shares;
    sectorValues[sec] = (sectorValues[sec] || 0) + val;
  }

  // Create unified sector drift table
  const allSectors = Array.from(new Set([...targets.map((t) => t.sector), ...Object.keys(sectorValues)]));
  const sectorDrift: SectorDriftAnalysis[] = allSectors.map((sec) => {
    const curVal = sectorValues[sec] || 0;
    const curPct = Number(((curVal / totalEquity) * 100).toFixed(1));
    const targetObj = targets.find((t) => t.sector === sec);
    const targetPct = targetObj ? targetObj.targetPct : 0;
    const drift = Number((curPct - targetPct).toFixed(1));
    let status: "OVERWEIGHT" | "UNDERWEIGHT" | "ALIGNED" = "ALIGNED";
    if (drift > 4) status = "OVERWEIGHT";
    else if (drift < -4) status = "UNDERWEIGHT";

    return {
      sector: sec,
      currentValueRupees: Number(curVal.toFixed(2)),
      currentWeightPct: curPct,
      targetWeightPct: targetPct,
      driftPct: drift,
      status,
    };
  });

  // Calculate Health Score
  // Penalties for: sector concentration, overweight single stocks, extreme cash drift
  let healthScore = 95;
  const riskHighlights: string[] = [];

  // Check sector overweight
  for (const sd of sectorDrift) {
    if (sd.driftPct > 12) {
      healthScore -= 18;
      riskHighlights.push(
        `Critical Sector Overweight: ${sd.sector} represents ${sd.currentWeightPct}% vs target ${sd.targetWeightPct}% (+${sd.driftPct}% drift).`
      );
    } else if (sd.driftPct > 6) {
      healthScore -= 8;
      riskHighlights.push(
        `Moderate Sector Overweight: ${sd.sector} is +${sd.driftPct}% above target allocation.`
      );
    }
  }

  // Check single stock concentration
  for (const pos of openPositions) {
    const val = (pos.current_price || pos.fill_price) * pos.shares;
    const weight = (val / totalEquity) * 100;
    if (weight > profileRule.maxSingleStockWeightPct) {
      healthScore -= 10;
      riskHighlights.push(
        `Single Stock Exposure Warning: ${pos.ticker} holds ${weight.toFixed(1)}% of total equity (cap: ${profileRule.maxSingleStockWeightPct}%).`
      );
    }
  }

  // Check cash reserve
  const cashRatio = (liquidCash / totalEquity) * 100;
  if (cashRatio < profileRule.minCashReservePct) {
    healthScore -= 12;
    riskHighlights.push(
      `Liquid Cash Buffer Depleted: Current cash is ${cashRatio.toFixed(1)}% (minimum recommended: ${profileRule.minCashReservePct}%).`
    );
  }

  healthScore = Math.max(35, Math.min(100, Math.round(healthScore)));

  // 3. Quantitative baseline actions
  const suggestedActions: RebalanceAction[] = [];

  for (const pos of openPositions) {
    const curP = pos.current_price || pos.fill_price;
    const posVal = curP * pos.shares;
    const weight = Number(((posVal / totalEquity) * 100).toFixed(1));
    const info = STOCK_UNIVERSE_MAP[pos.ticker];
    const sec = info?.sector || "NSE Equities";
    const drift = sectorDrift.find((s) => s.sector === sec)?.driftPct || 0;

    // Check if this position should be trimmed or held
    if (drift > 5 || weight > profileRule.maxSingleStockWeightPct) {
      // Calculate shares to trim to bring weight closer to target
      const excessVal = Math.max(
        (weight - profileRule.maxSingleStockWeightPct) * (totalEquity / 100),
        (drift * (totalEquity / 100)) * 0.5
      );
      const trimShares = Math.min(pos.shares - 1, Math.max(1, Math.round(excessVal / curP)));
      if (trimShares > 0 && pos.shares > 1) {
        const cashFreed = Number((trimShares * curP).toFixed(2));
        suggestedActions.push({
          id: `ACT_TRIM_${pos.order_id}`,
          order_id: pos.order_id,
          ticker: pos.ticker,
          company_name: info?.name || pos.ticker,
          sector: sec,
          action: "TRIM",
          currentShares: pos.shares,
          suggestedShares: pos.shares - trimShares,
          sharesDelta: -trimShares,
          currentPrice: curP,
          estimatedCashImpactRupees: cashFreed,
          currentWeightPct: weight,
          suggestedWeightPct: Number((((pos.shares - trimShares) * curP / totalEquity) * 100).toFixed(1)),
          urgency: drift > 12 ? "HIGH" : "MEDIUM",
          rationale: `Sector '${sec}' is overweight by +${drift}%. Trimming ${trimShares} shares frees ₹${cashFreed} to restore balance.`,
        });
        continue;
      }
    }

    // Default: Position is aligned
    suggestedActions.push({
      id: `ACT_HOLD_${pos.order_id}`,
      order_id: pos.order_id,
      ticker: pos.ticker,
      company_name: info?.name || pos.ticker,
      sector: sec,
      action: "HOLD",
      currentShares: pos.shares,
      suggestedShares: pos.shares,
      sharesDelta: 0,
      currentPrice: curP,
      estimatedCashImpactRupees: 0,
      currentWeightPct: weight,
      suggestedWeightPct: weight,
      urgency: "LOW",
      rationale: `Holding is aligned within ${profileRule.label} risk boundaries and stop-loss brackets.`,
    });
  }

  // 4. Recommend entry into underweight sectors if capital is available
  const underweightSectors = sectorDrift.filter((s) => s.status === "UNDERWEIGHT" && s.targetWeightPct > 0);
  const potentialCashFreed = suggestedActions.reduce((sum, a) => sum + (a.estimatedCashImpactRupees > 0 ? a.estimatedCashImpactRupees : 0), 0);
  const deployableCash = liquidCash + potentialCashFreed;

  if (underweightSectors.length > 0 && deployableCash > 4000) {
    const candidateMap: Record<string, string> = {
      "IT & Tech": "TCS",
      "Energy & Oil": "RELIANCE",
      "Pharma & Healthcare": "SUNPHARMA",
      "Automobile": "TATAMOTORS",
      FMCG: "ITC",
      "Infrastructure & Capital Goods": "LT",
      Telecom: "BHARTIARTL",
    };

    for (const uw of underweightSectors.slice(0, 2)) {
      const suggestedTicker = candidateMap[uw.sector] || "RELIANCE";
      // Ensure we don't already have an open position in that ticker
      if (!openPositions.some((p) => p.ticker === suggestedTicker)) {
        const item = STOCK_UNIVERSE_MAP[suggestedTicker];
        if (item) {
          const allocCapital = Math.min(deployableCash * 0.4, 8000);
          const estShares = Math.max(1, Math.floor(allocCapital / item.basePrice));
          const estCost = estShares * item.basePrice;
          suggestedActions.push({
            id: `ACT_NEW_${suggestedTicker}`,
            ticker: suggestedTicker,
            company_name: item.name,
            sector: uw.sector,
            action: "NEW_ENTRY",
            currentShares: 0,
            suggestedShares: estShares,
            sharesDelta: estShares,
            currentPrice: item.basePrice,
            estimatedCashImpactRupees: -estCost,
            currentWeightPct: 0,
            suggestedWeightPct: Number(((estCost / totalEquity) * 100).toFixed(1)),
            urgency: "MEDIUM",
            rationale: `Underweight in ${uw.sector} (${uw.currentWeightPct}% vs ${uw.targetWeightPct}% target). Deploy ${estShares} shares of ${suggestedTicker} to capture sector balance.`,
            suggestedStopLoss: Number((item.basePrice * 0.965).toFixed(2)),
            suggestedTargetPrice: Number((item.basePrice * 1.085).toFixed(2)),
          });
        }
      }
    }
  }

  // 5. Try Gemini AI Enhanced Reasoning
  let aiOverallAssessment = `Portfolio aligns with ${profileRule.label} with an overall health score of ${healthScore}/100. ${riskHighlights.length > 0 ? riskHighlights[0] : "All asset weights and sector exposures currently respect mathematical risk budgets."}`;

  try {
    const ai = getGenAI();
    if (ai) {
      const prompt = `You are the Lead Quantitative Portfolio Risk Officer for an institutional Indian equities desk.
Analyze the following portfolio state and provide an executive rebalancing recommendation:

Risk Profile Mandate: ${riskProfile} (${profileRule.label})
Total Portfolio Equity: ₹${totalEquity.toFixed(2)}
Liquid Cash: ₹${liquidCash.toFixed(2)} (${cashRatio.toFixed(1)}%)
Invested in Holdings: ₹${investedCapital.toFixed(2)}
Current Holdings (${openPositions.length}):
${openPositions.map((p) => `- ${p.ticker} (${STOCK_UNIVERSE_MAP[p.ticker]?.sector || "Equities"}): ${p.shares} shares @ ₹${p.fill_price}, CMP ₹${p.current_price}, P&L: ₹${p.unrealized_pnl}`).join("\n") || "No open positions (100% Cash)"}

Sector Allocations vs User Targets:
${sectorDrift.map((s) => `- ${s.sector}: Current ${s.currentWeightPct}% | Target ${s.targetWeightPct}% | Drift: ${s.driftPct > 0 ? "+" : ""}${s.driftPct}% (${s.status})`).join("\n")}

Respond with a concise, authoritative 2-3 sentence executive summary explaining the strategic portfolio drift, concentration risk, and the rationale for the recommended adjustments to achieve optimal Sharpe ratio and drawdown resilience.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      if (response.text && response.text.trim().length > 30) {
        aiOverallAssessment = response.text.trim();
      }
    }
  } catch (err: any) {
    console.warn("Gemini AI generation for rebalancing fell back to deterministic rules:", err?.message);
  }

  // 6. Projected Metrics after rebalancing
  const netCashFreed = suggestedActions.reduce((sum, a) => sum + a.estimatedCashImpactRupees, 0);
  const projectedCash = Math.max(0, liquidCash + netCashFreed);
  const projectedCashRatio = Number(((projectedCash / totalEquity) * 100).toFixed(1));
  const projectedHealthScore = Math.min(98, healthScore + (riskHighlights.length > 0 ? 18 : 5));

  return {
    timestamp: new Date().toISOString(),
    riskProfile,
    healthScore,
    overallAssessment: aiOverallAssessment,
    riskHighlights,
    totalEquity: Number(totalEquity.toFixed(2)),
    currentLiquidCash: Number(liquidCash.toFixed(2)),
    investedCapital: Number(investedCapital.toFixed(2)),
    sectorDrift,
    suggestedActions,
    projectedMetrics: {
      projectedLiquidCash: Number(projectedCash.toFixed(2)),
      projectedCashRatioPct: projectedCashRatio,
      projectedHealthScore,
      netCashFreedRupees: Number(netCashFreed.toFixed(2)),
    },
  };
}

/**
 * Apply a specific rebalancing adjustment (Trim, Close, or New Entry) directly
 */
export async function applyRebalanceAction(action: {
  actionType: "TRIM" | "CLOSE" | "NEW_ENTRY";
  order_id?: string;
  ticker: string;
  shares: number;
  currentPrice?: number;
}): Promise<{ success: boolean; message: string; accounting: any }> {
  const { actionType, order_id, ticker, shares } = action;

  if (actionType === "CLOSE" && order_id) {
    const res = await closePosition(order_id);
    if (!res) throw new Error("Position not found to close");
    return {
      success: true,
      message: `Successfully closed position ${ticker} (${shares} shares). Cash returned to reserve.`,
      accounting: res.accounting,
    };
  }

  if (actionType === "TRIM" && order_id) {
    const positions = getExecutedPositions();
    const pos = positions.find((p) => p.order_id === order_id);
    if (!pos) throw new Error("Position not found to trim");

    if (shares >= pos.shares) {
      const res = await closePosition(order_id);
      return {
        success: true,
        message: `Trimmed entire lot of ${ticker}. Position closed.`,
        accounting: res?.accounting,
      };
    }

    // Partially trim shares
    const liveData = await fetchRealtimeLivePrice(ticker);
    const exitPrice = liveData.current_price || pos.current_price || pos.fill_price;
    const trimmedPnl = (exitPrice - pos.fill_price) * shares * (pos.action === "BUY" ? 1 : -1);

    pos.shares -= shares;
    pos.capital_allocated = Number((pos.shares * pos.fill_price).toFixed(2));
    pos.rupee_risk = Number((pos.shares * Math.abs(pos.fill_price - pos.stop_loss)).toFixed(2));

    const accounting = getPortfolioAccounting();
    return {
      success: true,
      message: `Trimmed ${shares} shares of ${ticker} @ ₹${exitPrice}. Retaining ${pos.shares} shares. Realized PnL on trimmed lot: ₹${trimmedPnl.toFixed(2)}.`,
      accounting,
    };
  }

  if (actionType === "NEW_ENTRY") {
    const liveData = await fetchRealtimeLivePrice(ticker);
    const entryPrice = liveData.current_price;
    const atr = liveData.atr_14 > 0 ? liveData.atr_14 : entryPrice * 0.018;

    const ticket = {
      status: "APPROVED" as const,
      ticker,
      action: "BUY" as const,
      shares: Math.max(1, shares),
      entry_price: entryPrice,
      stop_loss: Number((entryPrice - atr * 1.8).toFixed(2)),
      target_price: Number((entryPrice + atr * 4.5).toFixed(2)),
      capital_allocated: Number((shares * entryPrice).toFixed(2)),
      rupee_risk: Number((shares * atr * 1.8).toFixed(2)),
    };

    const newPos = await routeOrder(ticket as any);
    if (!newPos) {
      throw new Error("Order routing failed for new rebalance entry.");
    }

    const accounting = getPortfolioAccounting();
    return {
      success: true,
      message: `Rebalancing entry executed: ${newPos.shares} shares of ${ticker} @ ₹${newPos.fill_price}.`,
      accounting,
    };
  }

  throw new Error("Unsupported rebalance action type");
}
