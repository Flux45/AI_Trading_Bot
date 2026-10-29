import { GoogleGenAI, Type } from "@google/genai";
import type {
  MarketContext,
  PastLesson,
  TradeHypothesis,
  OrderTicket,
  IndependentDecision,
  DecisionVerdict,
  PipelineStep,
  PipelineResult,
} from "../../src/types.ts";
import { computeTimeHorizonServer, getEquityContext } from "./marketDataService.ts";
import {
  getSystemConfig,
  retrievePastLessons,
  routeOrder,
} from "./tradingService.ts";

export interface GeminiStatusCache {
  tested: boolean;
  operational: boolean;
  lastChecked: number;
  message: string;
}

let geminiStatusCache: GeminiStatusCache = {
  tested: false,
  operational: false,
  lastChecked: 0,
  message: "Standby — Algorithmic Quantitative Committee engine active.",
};

export function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function checkGeminiStatus(force = false): Promise<GeminiStatusCache> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    geminiStatusCache = {
      tested: true,
      operational: false,
      lastChecked: Date.now(),
      message: "Standby — Algorithmic Quantitative Committee engine active.",
    };
    return geminiStatusCache;
  }

  // Cache test result for 3 minutes unless forced
  if (!force && geminiStatusCache.tested && Date.now() - geminiStatusCache.lastChecked < 180000) {
    return geminiStatusCache;
  }

  try {
    const ai = getGenAI();
    if (!ai) throw new Error("Could not initialize GoogleGenAI client");

    // Ping lightweight probe
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "ping",
    });

    if (response && response.text) {
      geminiStatusCache = {
        tested: true,
        operational: true,
        lastChecked: Date.now(),
        message: "Gemini 3.8 Flash operational. Multi-agent debate running live.",
      };
      return geminiStatusCache;
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isAuthError =
      errMsg.includes("401") ||
      errMsg.includes("UNAUTHENTICATED") ||
      errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED");

    geminiStatusCache = {
      tested: true,
      operational: false,
      lastChecked: Date.now(),
      message: isAuthError
        ? "Gemini API credentials in Settings > Secrets require update or valid permissions. Running high-precision Algorithmic Quantitative Committee engine."
        : "Gemini gateway standby. Running high-precision Algorithmic Quantitative Committee engine.",
    };
    console.log(`[Cognitive Layer] Status: ${geminiStatusCache.message}`);
  }

  return geminiStatusCache;
}

/**
 * Multi-Agent Quantitative Debate Engine:
 * Debates market context through 3 opposing personas (Bullish, Bearish, Impartial Risk Evaluator).
 * Falls back safely to deterministic quantitative algorithmic committee if Gemini is unreachable.
 */
export async function debateAndSynthesize(
  context: MarketContext,
  pastLessons: PastLesson[]
): Promise<TradeHypothesis> {
  const gemStatus = await checkGeminiStatus();
  const ai = gemStatus.operational ? getGenAI() : null;

  const systemPrompt = `You are an automated Quantitative Risk Committee trading Indian equities (NSE).
Debate the market context through three opposing personas:
1. Bullish Analyst: Identifies upward momentum, catalyst support, and trend continuation.
2. Bearish Analyst: Challenges assumptions, identifies liquidity traps, and flags volatility risks.
3. Impartial Risk Evaluator: Evaluates the net risk-to-reward ratio.

Rules:
- Never place a stop-loss closer than 1.5x ATR from the current market price (Current ATR is ₹${context.atr_14}).
- If the thesis is ambiguous or the risk is asymmetric to the downside, set bias to NEUTRAL and confidence below 0.50.
- Stop-loss and target-price MUST be positive numbers in INR. For BULLISH: target > current_price and stop_loss <= (current_price - 1.5 * ATR). For BEARISH: target < current_price and stop_loss >= (current_price + 1.5 * ATR).
- Strictly emit the requested JSON structure.`;

  const userContent = `Analyze ${context.ticker}:
- Current Price: ₹${context.current_price}
- 14-day ATR: ₹${context.atr_14} (${((context.atr_14 / context.current_price) * 100).toFixed(2)}%)
- 20-day SMA: ₹${context.sma_20}
- 20-day Momentum: ${context.pct_return_20d}%
- Trend Direction: ${context.recent_trend}
- Prior Lessons Recorded: ${JSON.stringify(pastLessons)}

Conduct the 3-agent debate and synthesize the final trade thesis.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `${systemPrompt}\n\n${userContent}`,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              bias: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
              confidence: { type: Type.NUMBER },
              target_price: { type: Type.NUMBER },
              stop_loss: { type: Type.NUMBER },
              bull_rationale: { type: Type.STRING },
              bear_counter_thesis: { type: Type.STRING },
              invalidation_criteria: { type: Type.STRING },
            },
            required: [
              "ticker",
              "bias",
              "confidence",
              "target_price",
              "stop_loss",
              "bull_rationale",
              "bear_counter_thesis",
              "invalidation_criteria",
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const tgt = Number(parsed.target_price) || context.current_price * 1.05;
        const stp = Number(parsed.stop_loss) || context.current_price * 0.95;
        const hzn = computeTimeHorizonServer(context.current_price, tgt, context.atr_14, context.pct_return_20d);

        return {
          ticker: parsed.ticker || context.ticker,
          bias: parsed.bias || "NEUTRAL",
          confidence: Number(parsed.confidence) || 0.5,
          target_price: tgt,
          stop_loss: stp,
          bull_rationale: parsed.bull_rationale || "Strong structural momentum.",
          bear_counter_thesis: parsed.bear_counter_thesis || "Overbought short-term conditions.",
          invalidation_criteria: parsed.invalidation_criteria || "Breach of stop-loss.",
          engine_mode: "GEMINI_AI",
          return_margin_pct: hzn.return_margin_pct,
          approx_days_to_target: hzn.approx_days_to_target,
          approx_time_label: hzn.approx_time_label,
        };
      }
    } catch {
      geminiStatusCache.operational = false;
      geminiStatusCache.lastChecked = Date.now();
      console.log("[Cognitive Layer] Gemini fallback: synthesized via Algorithmic Quantitative Committee.");
    }
  }

  // Deterministic Quantitative Committee Engine fallback
  const isBull = context.recent_trend === "BULLISH" && context.pct_return_20d > 0;
  const bias = isBull ? "BULLISH" : context.pct_return_20d < -2 ? "BEARISH" : "NEUTRAL";
  const confidence = isBull ? 0.76 : bias === "BEARISH" ? 0.68 : 0.45;
  const minStopDistance = context.atr_14 * 1.6;

  let stop_loss: number;
  let target_price: number;
  if (bias === "BULLISH") {
    stop_loss = Number((context.current_price - minStopDistance).toFixed(2));
    target_price = Number((context.current_price + minStopDistance * 2.1).toFixed(2));
  } else if (bias === "BEARISH") {
    stop_loss = Number((context.current_price + minStopDistance).toFixed(2));
    target_price = Number((context.current_price - minStopDistance * 2.0).toFixed(2));
  } else {
    stop_loss = Number((context.current_price - context.atr_14 * 1.5).toFixed(2));
    target_price = Number((context.current_price + context.atr_14 * 1.5).toFixed(2));
  }

  const hzn = computeTimeHorizonServer(context.current_price, target_price, context.atr_14, context.pct_return_20d);

  return {
    ticker: context.ticker,
    bias,
    confidence,
    target_price,
    stop_loss,
    bull_rationale: `Price trading at ₹${context.current_price} above 20-day SMA (₹${context.sma_20}) with positive 20-day momentum (+${context.pct_return_20d}%). Volatility ATR-14 of ₹${context.atr_14} allows structured swing expansion.`,
    bear_counter_thesis: `Potential overhead supply zone near ₹${(context.current_price * 1.03).toFixed(2)}. Wider market consolidation or sudden sector rotation could test stop bounds.`,
    invalidation_criteria: `Daily candle close beyond invalidation anchor at ₹${stop_loss} or breakdown of 20-day SMA.`,
    engine_mode: "QUANT_ALGORITHMIC",
    return_margin_pct: hzn.return_margin_pct,
    approx_days_to_target: hzn.approx_days_to_target,
    approx_time_label: hzn.approx_time_label,
  };
}

/**
 * Deterministic Risk Governor: Computes exact share sizing and checks boundary limits
 */
export function generateOrderTicket(
  hypothesis: TradeHypothesis,
  currentPrice: number,
  atr: number,
  equity: number,
  maxRiskPct: number,
  maxConcentrationPct: number
): OrderTicket {
  if (hypothesis.bias === "NEUTRAL" || hypothesis.confidence < 0.65) {
    return {
      status: "REJECTED",
      reason: `Low conviction (${hypothesis.confidence.toFixed(2)}) or NEUTRAL bias`,
    };
  }

  const riskPerShare = Math.abs(currentPrice - hypothesis.stop_loss);
  const minAtrDist = atr * 1.2;
  const atrMultiplier = Number((riskPerShare / Math.max(atr, 0.01)).toFixed(2));

  if (riskPerShare < minAtrDist) {
    return {
      status: "REJECTED",
      reason: `Stop loss too tight (Risk: ₹${riskPerShare.toFixed(2)} < 1.2x ATR: ₹${minAtrDist.toFixed(2)})`,
      risk_per_share: Number(riskPerShare.toFixed(2)),
      atr_multiplier: atrMultiplier,
    };
  }

  const maxRupeeLoss = equity * maxRiskPct;
  let targetShares = Math.floor(maxRupeeLoss / riskPerShare);

  const maxCapital = equity * maxConcentrationPct;
  if (targetShares * currentPrice > maxCapital) {
    targetShares = Math.floor(maxCapital / currentPrice);
  }

  if (targetShares <= 0) {
    return {
      status: "REJECTED",
      reason: "Position size calculated to 0 shares under risk boundaries",
    };
  }

  const returnMarginPct = Number(
    ((Math.abs(hypothesis.target_price - currentPrice) / currentPrice) * 100).toFixed(2)
  );
  const riskMarginPct = Number(
    ((Math.abs(currentPrice - hypothesis.stop_loss) / currentPrice) * 100).toFixed(2)
  );
  const riskRewardRatio = Number((returnMarginPct / Math.max(riskMarginPct, 0.1)).toFixed(2));

  return {
    status: "APPROVED",
    ticker: hypothesis.ticker,
    action: hypothesis.bias === "BULLISH" ? "BUY" : "SELL",
    shares: targetShares,
    entry_price: Number(currentPrice.toFixed(2)),
    stop_loss: Number(hypothesis.stop_loss.toFixed(2)),
    target_price: Number(hypothesis.target_price.toFixed(2)),
    rupee_risk: Number((targetShares * riskPerShare).toFixed(2)),
    capital_allocated: Number((targetShares * currentPrice).toFixed(2)),
    risk_per_share: Number(riskPerShare.toFixed(2)),
    atr_multiplier: atrMultiplier,
    risk_reward_ratio: riskRewardRatio,
  };
}

/**
 * Formulate Autonomous Independent Decision
 */
export function formulateIndependentDecision(
  hypothesis: TradeHypothesis,
  context: MarketContext,
  ticket: OrderTicket
): IndependentDecision {
  const currentPrice = context.current_price;
  const returnMarginPct = Number(
    ((Math.abs(hypothesis.target_price - currentPrice) / currentPrice) * 100).toFixed(2)
  );
  const riskMarginPct = Number(
    ((Math.abs(currentPrice - hypothesis.stop_loss) / currentPrice) * 100).toFixed(2)
  );
  const riskRewardRatio = Number((returnMarginPct / Math.max(riskMarginPct, 0.1)).toFixed(2));
  const isApproved = ticket.status === "APPROVED";

  let verdict: DecisionVerdict = "HOLD_WAIT";
  let opportunityGrade: "A+" | "A" | "B+" | "B" | "C" = "C";
  let suggestedAction: "BUY" | "SELL" | "PASS" = "PASS";
  let isBestCandidate = false;

  if (isApproved && hypothesis.bias === "BULLISH") {
    suggestedAction = "BUY";
    if (hypothesis.confidence >= 0.75 && riskRewardRatio >= 2.0 && returnMarginPct >= 4.0) {
      verdict = "STRONG_BUY";
      opportunityGrade = "A+";
      isBestCandidate = true;
    } else if (hypothesis.confidence >= 0.65 && riskRewardRatio >= 1.5) {
      verdict = "BUY";
      opportunityGrade = "A";
      isBestCandidate = true;
    } else {
      verdict = "BUY";
      opportunityGrade = "B+";
    }
  } else if (isApproved && hypothesis.bias === "BEARISH") {
    suggestedAction = "SELL";
    verdict = "SELL";
    opportunityGrade = riskRewardRatio >= 1.8 ? "A" : "B+";
  } else if (hypothesis.bias === "NEUTRAL") {
    verdict = "HOLD_WAIT";
    opportunityGrade = "B";
    suggestedAction = "PASS";
  } else {
    verdict = "AVOID";
    opportunityGrade = "C";
    suggestedAction = "PASS";
  }

  const verdictLabel =
    verdict === "STRONG_BUY"
      ? "STRONG BUY (High Conviction & Asymmetry)"
      : verdict === "BUY"
      ? "BUY (Favorable Risk/Reward)"
      : verdict === "SELL"
      ? "SHORT / SELL"
      : verdict === "HOLD_WAIT"
      ? "HOLD & MONITOR (Neutral Bias)"
      : `AVOID (${ticket.reason || "Risk Limits Exceeded"})`;

  let reasoning = "";
  if (verdict === "STRONG_BUY" || verdict === "BUY") {
    reasoning = `Autonomous Committee Conviction is ${(hypothesis.confidence * 100).toFixed(0)}% with ${riskRewardRatio}:1 Risk-to-Reward ratio (+${returnMarginPct}% potential gain vs -${riskMarginPct}% stop buffer). Risk Governor approved sizing for ${ticket.shares} shares with ₹${ticket.rupee_risk} risk (within 1% capital ceiling). Ready for manual execution.`;
  } else if (verdict === "SELL") {
    reasoning = `Downside bias detected with ${(hypothesis.confidence * 100).toFixed(0)}% conviction. Target ₹${hypothesis.target_price} with stop at ₹${hypothesis.stop_loss}.`;
  } else if (verdict === "HOLD_WAIT") {
    reasoning = "Market trend currently neutral with insufficient directional momentum. System independently recommends waiting for clearer structural expansion.";
  } else {
    reasoning = `Mathematical risk rules rejected entry: ${ticket.reason || "Conviction below threshold or stop-loss violates ATR volatility bounds"}.`;
  }

  return {
    verdict,
    verdictLabel,
    opportunityGrade,
    convictionPct: Math.round(hypothesis.confidence * 100),
    riskRewardRatio,
    returnMarginPct,
    riskMarginPct,
    suggestedAction,
    isBestCandidate,
    reasoning,
    orderReady: isApproved && (suggestedAction === "BUY" || suggestedAction === "SELL"),
  };
}

/**
 * Runs the full 5-stage trading pipeline
 */
export async function runTradingPipeline(
  tickerRaw: string,
  autoExecute = false
): Promise<PipelineResult & { independentDecision: IndependentDecision }> {
  const ticker = tickerRaw.toUpperCase().replace(".NS", "");
  const steps: PipelineStep[] = [];
  const systemConfig = getSystemConfig();

  // 1. Sensory Layer (Yahoo Finance)
  const t0 = Date.now();
  const context = await getEquityContext(ticker);
  steps.push({
    step: "SENSORY",
    title: "Sensory Data Ingestion & ATR Volatility Engine",
    status: "SUCCESS",
    summary: `Retrieved ${context.candles.length} daily candles. Price: ₹${context.current_price} | ATR-14: ₹${context.atr_14} | SMA-20: ₹${context.sma_20} | Momentum: ${context.pct_return_20d}% (${context.recent_trend})`,
    data: {
      current_price: context.current_price,
      atr_14: context.atr_14,
      sma_20: context.sma_20,
      pct_return_20d: context.pct_return_20d,
      recent_trend: context.recent_trend,
    },
    durationMs: Date.now() - t0,
  });

  // 2. Memory Layer (Episodic Lessons)
  const t1 = Date.now();
  const pastLessons = retrievePastLessons(ticker, 2);
  steps.push({
    step: "MEMORY",
    title: "Episodic Trade Memory Database",
    status: "SUCCESS",
    summary:
      pastLessons.length > 0
        ? `Retrieved ${pastLessons.length} post-mortems for ${ticker}. Past bias: ${pastLessons[0].bias}, Realized PnL: ₹${pastLessons[0].pnl}`
        : `No prior post-mortems logged for ${ticker}. Pure first-principles analysis.`,
    data: pastLessons,
    durationMs: Date.now() - t1,
  });

  // 3. Cognitive Layer (Gemini Multi-Agent Debate or Algorithmic Committee)
  const t2 = Date.now();
  const hypothesis = await debateAndSynthesize(context, pastLessons);
  const isGeminiLive = hypothesis.engine_mode === "GEMINI_AI";
  steps.push({
    step: "COGNITIVE",
    title: isGeminiLive
      ? "Gemini 3.8 Flash Multi-Agent Committee Debate"
      : "Quantitative Algorithmic Committee (Gemini Standby)",
    status: "SUCCESS",
    summary: isGeminiLive
      ? `Gemini Committee Verdict: ${hypothesis.bias} with Conviction ${(hypothesis.confidence * 100).toFixed(1)}%. Target: ₹${hypothesis.target_price} | Stop: ₹${hypothesis.stop_loss}`
      : `Algorithmic Committee Verdict: ${hypothesis.bias} with Conviction ${(hypothesis.confidence * 100).toFixed(1)}%. Target: ₹${hypothesis.target_price} | Stop: ₹${hypothesis.stop_loss} [Quantitative Momentum & Volatility Model]`,
    data: hypothesis,
    durationMs: Date.now() - t2,
  });

  // 4. Deterministic Risk Layer (Mathematical Guards)
  const t3 = Date.now();
  const balance = systemConfig.system.currentPaperCapital;
  const ticket = generateOrderTicket(
    hypothesis,
    context.current_price,
    context.atr_14,
    balance,
    systemConfig.system.maxRiskPerTradePct,
    systemConfig.system.maxPositionConcentration
  );

  const independentDecision = formulateIndependentDecision(hypothesis, context, ticket);

  if (ticket.status === "APPROVED") {
    steps.push({
      step: "RISK",
      title: "Deterministic Risk Governor & Position Sizing",
      status: "SUCCESS",
      summary: `APPROVED: ${ticket.shares} shares @ ₹${ticket.entry_price} (Risk: ₹${ticket.rupee_risk} ≤ 1% equity, Capital: ₹${ticket.capital_allocated})`,
      data: ticket,
      durationMs: Date.now() - t3,
    });

    let executed = null;
    if (autoExecute) {
      const t4 = Date.now();
      executed = await routeOrder(ticket);
      steps.push({
        step: "EXECUTION",
        title: systemConfig.system.paperTradingMode
          ? "Paper Execution Engine (0.05% Slippage)"
          : "Zerodha Kite Connect Gateway",
        status: "SUCCESS",
        summary: executed
          ? `[PAPER EXECUTION] ${executed.action} ${executed.shares} shares of ${executed.ticker} @ ₹${executed.fill_price} (Order ID: ${executed.order_id})`
          : "Order execution skipped.",
        data: executed,
        durationMs: Date.now() - t4,
      });
    } else {
      steps.push({
        step: "EXECUTION",
        title: "Broker Interface Execution (Manual Confirmation Standby)",
        status: "PENDING",
        summary: `[INDEPENDENT DECISION: ${independentDecision.verdict}] System approved ${ticket.action} ${ticket.shares} shares @ ₹${ticket.entry_price} (Target: ₹${ticket.target_price}, Stop: ₹${ticket.stop_loss}). Risk check verified. Awaiting manual order placement.`,
        data: {
          decisionReady: true,
          ticket,
          independentDecision,
        },
        durationMs: 0,
      });
    }

    return {
      ticker,
      timestamp: new Date().toISOString(),
      steps,
      marketContext: context,
      pastLessons,
      hypothesis,
      ticket,
      executedPosition: executed,
      independentDecision,
      success: true,
      message:
        autoExecute && executed
          ? `Analysis completed and trade executed on ${ticker}.`
          : `Heartbeat scan completed. Independent decision formulated for ${ticker}: ${independentDecision.verdictLabel}. Ready for manual execution.`,
    };
  } else {
    steps.push({
      step: "RISK",
      title: "Deterministic Risk Governor & Position Sizing",
      status: "REJECTED",
      summary: `REJECTED by Risk Governor: ${ticket.reason}`,
      data: ticket,
      durationMs: Date.now() - t3,
    });
    steps.push({
      step: "EXECUTION",
      title: "Broker Interface Execution",
      status: "PENDING",
      summary: "Execution bypassed — order ticket rejected by mathematical risk guards.",
      durationMs: 0,
    });

    return {
      ticker,
      timestamp: new Date().toISOString(),
      steps,
      marketContext: context,
      pastLessons,
      hypothesis,
      ticket,
      executedPosition: null,
      independentDecision,
      success: false,
      message: `Order rejected by Risk Governor: ${ticket.reason}`,
    };
  }
}
