import { Router } from "express";
import type { BestStockOpportunity, RiskLevel, ScannedStock } from "../../src/types.ts";
import { STOCK_UNIVERSE_MAP } from "../../src/data/universe.ts";
import {
  computeTimeHorizonServer,
  fetchRealtimeLivePrice,
  getDynamicUniverse,
  getEquityContext,
  addCustomTickerToUniverse,
  verifyPriceWithYahooAndTradingView,
} from "../services/marketDataService.ts";
import { generateOrderTicket, formulateIndependentDecision } from "../services/aiDebateService.ts";
import { getPortfolioAccounting, getSystemConfig } from "../services/tradingService.ts";

export const marketRoutes = Router();

// Full liquid stock universe
marketRoutes.get("/api/universe", (req, res) => {
  const universe = getDynamicUniverse();
  res.json({
    total: universe.length,
    stocks: universe,
  });
});

// Add custom ticker to universe
marketRoutes.post("/api/universe/add", async (req, res) => {
  try {
    const { ticker, name, sector, exchange = "NSE" } = req.body || {};
    if (!ticker) {
      return res.status(400).json({ success: false, error: "Ticker is required" });
    }
    const cleanTicker = ticker.toUpperCase().replace(".NS", "").replace(".BO", "").trim();
    const live = await fetchRealtimeLivePrice(cleanTicker);
    const added = addCustomTickerToUniverse({
      ticker: cleanTicker,
      name: name || `${cleanTicker} Ltd`,
      sector: sector || "Equities",
      basePrice: live.current_price,
    });
    res.json({
      success: true,
      added,
      ticker: cleanTicker,
      current_price: live.current_price,
      message: added
        ? `Added ${cleanTicker} to live stock universe.`
        : `${cleanTicker} already present in universe.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to add ticker" });
  }
});

// Single Stock Context (Defaults to Intraday everywhere)
marketRoutes.get("/api/market-context/:ticker", async (req, res) => {
  try {
    const forceFresh = req.query.fresh === "true";
    const mode = (req.query.mode as any) || "INTRADAY";
    const context = await getEquityContext(req.params.ticker, forceFresh, mode);
    res.json(context);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch market context" });
  }
});

// Dual-Feed Price Verification: Yahoo Live vs TradingView NSE Feed
marketRoutes.get("/api/market/verify-price/:ticker", async (req, res) => {
  try {
    const verification = await verifyPriceWithYahooAndTradingView(req.params.ticker);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Price verification failed" });
  }
});

// Market Scanner
marketRoutes.post("/api/scanner/run", async (req, res) => {
  const { sector, lowRiskOnly, riskTier, tickers: customTickers } = req.body || {};
  let targetItems = [...getDynamicUniverse()];

  if (sector && sector !== "All Sectors") {
    targetItems = targetItems.filter((s) => s.sector.toLowerCase() === sector.toLowerCase());
  }
  if (Array.isArray(customTickers) && customTickers.length > 0) {
    const set = new Set(customTickers.map((t: string) => t.toUpperCase().replace(".NS", "")));
    targetItems = targetItems.filter((s) => set.has(s.ticker));
  }

  const scannedResults: ScannedStock[] = [];
  const batchSize = 10;
  const sysConfig = getSystemConfig();

  for (let i = 0; i < targetItems.length; i += batchSize) {
    const batch = targetItems.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      try {
        const context = await getEquityContext(item.ticker);
        const currentPrice = context.current_price;
        const atr = context.atr_14;
        const atr_pct = Number(((atr / currentPrice) * 100).toFixed(2));
        const isTrendBullish = currentPrice > context.sma_20;
        const isMomentumPositive = context.pct_return_20d > 0;

        let bias: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
        let confidence = 0.5;
        let stop_loss = currentPrice;
        let target_price = currentPrice;
        const atrBuffer = atr * 1.6;

        if (isTrendBullish && isMomentumPositive) {
          bias = "BULLISH";
          confidence = Number((0.7 + Math.min(context.pct_return_20d * 0.015, 0.18)).toFixed(2));
          stop_loss = Number((currentPrice - atrBuffer).toFixed(2));
          target_price = Number((currentPrice + atrBuffer * 2.4).toFixed(2));
        } else if (!isTrendBullish && context.pct_return_20d < -2.0) {
          bias = "BEARISH";
          confidence = Number((0.65 + Math.min(Math.abs(context.pct_return_20d) * 0.01, 0.15)).toFixed(2));
          stop_loss = Number((currentPrice + atrBuffer).toFixed(2));
          target_price = Number((currentPrice - atrBuffer * 2.2).toFixed(2));
        } else {
          bias = "NEUTRAL";
          confidence = 0.48;
          stop_loss = Number((currentPrice - atr * 1.5).toFixed(2));
          target_price = Number((currentPrice + atr * 1.5).toFixed(2));
        }

        const return_margin_pct = Number(
          (((Math.abs(target_price - currentPrice)) / currentPrice) * 100).toFixed(2)
        );
        const risk_margin_pct = Number((((Math.abs(currentPrice - stop_loss)) / currentPrice) * 100).toFixed(2));
        const risk_reward_ratio = Number((return_margin_pct / Math.max(risk_margin_pct, 0.1)).toFixed(2));

        let risk_level: RiskLevel = "MEDIUM";
        if (atr_pct <= 2.2 && currentPrice >= context.sma_20 * 0.97 && risk_margin_pct <= 3.8) {
          risk_level = "LOW";
        } else if (atr_pct > 3.2 || risk_margin_pct > 5.5) {
          risk_level = "HIGH";
        } else {
          risk_level = "MEDIUM";
        }

        const balance = sysConfig.system.currentPaperCapital;
        const hypothesisMock = {
          ticker: item.ticker,
          bias,
          confidence,
          target_price,
          stop_loss,
          bull_rationale: `Price above 20d SMA with +${context.pct_return_20d}% 20-day momentum.`,
          bear_counter_thesis: "Overhead supply buffer.",
          invalidation_criteria: `Invalidation below ₹${stop_loss}.`,
        };

        const ticket = generateOrderTicket(
          hypothesisMock,
          currentPrice,
          atr,
          balance,
          sysConfig.system.maxRiskPerTradePct,
          sysConfig.system.maxPositionConcentration
        );

        const qualifying_reasons: string[] = [];
        if (return_margin_pct >= 4.0) {
          qualifying_reasons.push(`High Return Margin: +${return_margin_pct}% upside potential`);
        }
        if (risk_level === "LOW") {
          qualifying_reasons.push(`Low Volatility Risk: ATR is only ${atr_pct}% of price (sub-2.2% threshold)`);
        } else if (risk_level === "MEDIUM") {
          qualifying_reasons.push(
            `Balanced Risk: ATR ${atr_pct}%, controlled stop distance ₹${(currentPrice - stop_loss).toFixed(1)}`
          );
        } else {
          qualifying_reasons.push(`High-Beta Momentum: ATR ${atr_pct}%, wide return potential +${return_margin_pct}%`);
        }
        if (risk_reward_ratio >= 1.8) {
          qualifying_reasons.push(`Favorable Asymmetry: ${risk_reward_ratio}:1 Risk-to-Reward ratio`);
        }
        if (isTrendBullish) {
          qualifying_reasons.push(`Trend Alignment: Trading above 20-day SMA (₹${context.sma_20})`);
        }
        if (ticket.status === "APPROVED") {
          qualifying_reasons.push(`Approved by Risk Governor: ₹${ticket.rupee_risk} risk (≤ 1% capital cap)`);
        }

        const is_good_opportunity =
          (risk_level === "LOW" || atr_pct <= 2.2) &&
          return_margin_pct >= 3.8 &&
          ticket.status === "APPROVED";

        let opportunity_score = Math.round(
          Math.min(30, risk_reward_ratio * 12) +
            Math.min(25, return_margin_pct * 3.5) +
            Math.max(0, (3.2 - atr_pct) * 8) +
            (isTrendBullish ? 10 : 0) +
            confidence * 15
        );
        opportunity_score = Math.max(10, Math.min(99, opportunity_score));

        const horizon = computeTimeHorizonServer(currentPrice, target_price, atr, context.pct_return_20d);

        return {
          ticker: item.ticker,
          name: item.name,
          sector: item.sector,
          current_price: currentPrice,
          atr_14: atr,
          atr_pct,
          sma_20: context.sma_20,
          pct_return_20d: context.pct_return_20d,
          recent_trend: context.recent_trend,
          bias,
          confidence,
          target_price,
          stop_loss,
          return_margin_pct,
          risk_margin_pct,
          risk_reward_ratio,
          risk_level,
          opportunity_score,
          is_good_opportunity,
          approx_days_to_target: horizon.approx_days_to_target,
          approx_time_label: horizon.approx_time_label,
          qualifying_reasons,
          ticket_status: ticket.status,
          shares: ticket.shares,
          rupee_risk: ticket.rupee_risk,
          capital_allocated: ticket.capital_allocated,
          rejection_reason: ticket.reason,
          rationale: `${item.name} (${item.ticker}) offers +${return_margin_pct}% return margin with ${risk_level} risk profile (${atr_pct}% ATR) and ${risk_reward_ratio}:1 R:R (est. ${horizon.approx_time_label}).`,
          scannedAt: new Date().toISOString(),
        } as ScannedStock;
      } catch (e: any) {
        console.warn(`[Scanner] Note for ${item.ticker}:`, e?.message || e);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    for (const r of batchResults) {
      if (r) scannedResults.push(r);
    }
  }

  let output = scannedResults;
  if (lowRiskOnly) {
    output = output.filter((s) => s.is_good_opportunity || s.risk_level === "LOW");
  } else if (riskTier && riskTier !== "ALL") {
    output = output.filter((s) => s.risk_level === riskTier);
  }

  output.sort((a, b) => b.opportunity_score - a.opportunity_score);

  const goodOpportunitiesCount = output.filter((s) => s.is_good_opportunity).length;
  const lowRiskCount = scannedResults.filter((s) => s.risk_level === "LOW").length;
  const mediumRiskCount = scannedResults.filter((s) => s.risk_level === "MEDIUM").length;
  const highRiskCount = scannedResults.filter((s) => s.risk_level === "HIGH").length;

  res.json({
    success: true,
    scannedTotal: scannedResults.length,
    goodOpportunitiesCount,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    results: output,
    timestamp: new Date().toISOString(),
  });
});

// Best Opportunities
marketRoutes.get("/api/best-opportunities", async (req, res) => {
  try {
    const candidateUniverse = [
      "RELIANCE",
      "TCS",
      "INFY",
      "HDFCBANK",
      "ICICIBANK",
      "TATAMOTORS",
      "BHARTIARTL",
      "SBIN",
      "LICI",
      "LT",
      "KOTAKBANK",
      "ITC",
      "HINDUNILVR",
      "BAJFINANCE",
    ];
    const sysConfig = getSystemConfig();
    const evalList = candidateUniverse.slice(0, 8);

    const evalPromises = evalList.map(async (ticker) => {
      try {
        const context = await getEquityContext(ticker);
        const currentPrice = context.current_price;
        const atr = context.atr_14;
        const isTrendBullish = currentPrice >= context.sma_20;
        const momentum = context.pct_return_20d;

        let bias: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
        let confidence = 0.5;
        let stop_loss = currentPrice;
        let target_price = currentPrice;
        const atrBuffer = atr * 1.6;

        if (isTrendBullish && momentum > 0) {
          bias = "BULLISH";
          confidence = Number((0.72 + Math.min(momentum * 0.015, 0.18)).toFixed(2));
          stop_loss = Number((currentPrice - atrBuffer).toFixed(2));
          target_price = Number((currentPrice + atrBuffer * 2.4).toFixed(2));
        } else if (!isTrendBullish && momentum < -2.0) {
          bias = "BEARISH";
          confidence = Number((0.65 + Math.min(Math.abs(momentum) * 0.01, 0.15)).toFixed(2));
          stop_loss = Number((currentPrice + atrBuffer).toFixed(2));
          target_price = Number((currentPrice - atrBuffer * 2.2).toFixed(2));
        } else {
          bias = "NEUTRAL";
          confidence = 0.5;
          stop_loss = Number((currentPrice - atr * 1.5).toFixed(2));
          target_price = Number((currentPrice + atr * 1.5).toFixed(2));
        }

        const hypothesisMock = {
          ticker,
          bias,
          confidence,
          target_price,
          stop_loss,
          bull_rationale: `Price trading at ₹${currentPrice} above 20d SMA (₹${context.sma_20}) with +${momentum}% momentum.`,
          bear_counter_thesis: "Market volatility and resistance buffer.",
          invalidation_criteria: `Invalidation below ₹${stop_loss}.`,
        };

        const ticket = generateOrderTicket(
          hypothesisMock,
          currentPrice,
          atr,
          sysConfig.system.currentPaperCapital,
          sysConfig.system.maxRiskPerTradePct,
          sysConfig.system.maxPositionConcentration
        );

        const decision = formulateIndependentDecision(hypothesisMock, context, ticket);
        const comp = STOCK_UNIVERSE_MAP[ticker];

        return {
          ticker,
          name: comp?.name || ticker,
          sector: comp?.sector || "NSE Large Cap",
          current_price: currentPrice,
          decision: decision.verdict,
          grade: decision.opportunityGrade as "A+" | "A" | "B+" | "B",
          conviction: decision.convictionPct,
          returnMarginPct: decision.returnMarginPct,
          riskRewardRatio: decision.riskRewardRatio,
          targetPrice: target_price,
          stopLoss: stop_loss,
          suggestedShares: ticket.shares || Math.max(1, Math.floor(10000 / currentPrice)),
          capitalRequired: ticket.capital_allocated || Math.round(currentPrice * 5),
          riskAmount: ticket.rupee_risk || Math.round(currentPrice * 0.02 * 5),
          rationale: decision.reasoning,
        };
      } catch {
        return null;
      }
    });

    const evaluated = (await Promise.all(evalPromises)).filter((item): item is BestStockOpportunity => item !== null);

    evaluated.sort((a, b) => {
      const gradeScore = (g: string) => (g === "A+" ? 4 : g === "A" ? 3 : g === "B+" ? 2 : 1);
      const diff = gradeScore(b.grade) - gradeScore(a.grade);
      if (diff !== 0) return diff;
      return b.conviction - a.conviction;
    });

    res.json({
      success: true,
      opportunities: evaluated,
      bestPick: evaluated.find((o) => o.decision === "STRONG_BUY") || evaluated[0] || null,
      message: `Autonomous evaluation scanned ${evaluated.length} liquid equities and identified top opportunities.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to analyze best opportunities" });
  }
});
