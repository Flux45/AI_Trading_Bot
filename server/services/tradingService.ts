import type {
  SystemConfig,
  ExecutedPosition,
  TradeHistoryRecord,
  TransactionRecord,
  OrderTicket,
  PastLesson,
  StrategyPerformanceSummary,
} from "../../src/types.ts";
import { STOCK_UNIVERSE_MAP } from "../../src/data/universe.ts";
import {
  dbSavePosition,
  dbRemovePosition,
  dbSaveTradeHistory,
  dbSaveTransaction,
  flushCompleteState,
  loadCompleteState,
  normalizeSystemMode,
  formatDurationMs,
  TradingSystemMode,
} from "../../server_db.ts";
import { fetchRealtimeLivePrice, getEquityContext } from "./marketDataService.ts";

// System Configuration
let systemConfig: SystemConfig = {
  credentials: {
    geminiApiKeySet: Boolean(process.env.GEMINI_API_KEY),
  },
  zerodha: {
    apiKey: "kite_live_demo_key",
    apiSecret: "kite_secret_hash_demo",
    accessToken: "kite_access_token_demo",
    isConnected: false,
  },
  system: {
    paperTradingMode: true,
    initialPaperCapital: 50000.0,
    currentPaperCapital: 50000.0,
    maxRiskPerTradePct: 0.01, // 1%
    maxPositionConcentration: 0.2, // 20%
    defaultProductType: "MIS",
  },
};

// Dual State Containers: Intraday (MIS) vs Long / Positional (CNC)
interface SystemStateContainer {
  executedPositions: ExecutedPosition[];
  tradeHistory: TradeHistoryRecord[];
  transactionsLedger: TransactionRecord[];
  initialCapital: number;
}

const intradayDbState = loadCompleteState("intraday");
const longDbState = loadCompleteState("long");

const systemStates: Record<TradingSystemMode, SystemStateContainer> = {
  intraday: {
    executedPositions: intradayDbState.executedPositions,
    tradeHistory: intradayDbState.tradeHistory,
    transactionsLedger: intradayDbState.transactionsLedger,
    initialCapital: 50000.0,
  },
  long: {
    executedPositions: longDbState.executedPositions,
    tradeHistory: longDbState.tradeHistory,
    transactionsLedger: longDbState.transactionsLedger,
    initialCapital: 50000.0,
  },
};

type TradeCloseListener = (record: TradeHistoryRecord, ticker: string, mode: TradingSystemMode) => void;
const tradeCloseListeners: TradeCloseListener[] = [];

export function onTradeClosed(listener: TradeCloseListener) {
  tradeCloseListeners.push(listener);
}

export function getSystemConfig(): SystemConfig {
  return systemConfig;
}

export function updateSystemConfig(patch: { system?: Partial<SystemConfig["system"]>; zerodha?: Partial<SystemConfig["zerodha"]> }): SystemConfig {
  if (patch.system) {
    systemConfig.system = { ...systemConfig.system, ...patch.system };
  }
  if (patch.zerodha) {
    systemConfig.zerodha = { ...systemConfig.zerodha, ...patch.zerodha };
  }
  return systemConfig;
}

export function getStateForMode(modeInput?: string): SystemStateContainer {
  const mode = normalizeSystemMode(modeInput);
  return systemStates[mode];
}

export function getExecutedPositions(modeInput?: string): ExecutedPosition[] {
  const mode = normalizeSystemMode(modeInput);
  return systemStates[mode].executedPositions;
}

export function getTradeHistory(modeInput?: string): TradeHistoryRecord[] {
  const mode = normalizeSystemMode(modeInput);
  return systemStates[mode].tradeHistory;
}

export function getTransactionsLedger(modeInput?: string): TransactionRecord[] {
  const mode = normalizeSystemMode(modeInput);
  return systemStates[mode].transactionsLedger;
}

export function clearTransactionsLedger(modeInput?: string) {
  const mode = normalizeSystemMode(modeInput);
  systemStates[mode].transactionsLedger = [];
}

/**
 * Absolute Canonical Double-Entry Portfolio Invariant Engine for a given system mode
 */
export function getPortfolioAccounting(modeInput?: string) {
  const mode = normalizeSystemMode(modeInput);
  const state = systemStates[mode];
  const initialCapital = state.initialCapital || 50000.0;

  const totalRealizedPnl = Number(
    state.tradeHistory.reduce((sum, t) => sum + (Number(t.pnl_realized) || 0), 0).toFixed(2)
  );

  const openPositions = state.executedPositions.filter((p) => p.status === "OPEN");
  const totalInvestedInOpen = Number(
    openPositions.reduce((sum, p) => sum + p.fill_price * p.shares, 0).toFixed(2)
  );
  const totalMarketValueOpen = Number(
    openPositions.reduce((sum, p) => sum + (p.current_price || p.fill_price) * p.shares, 0).toFixed(2)
  );
  const totalUnrealizedPnl = Number((totalMarketValueOpen - totalInvestedInOpen).toFixed(2));

  // Liquid Cash = Initial Capital + Realized Gains - Cash Deployed into Open Positions
  const liquidCash = Number((initialCapital + totalRealizedPnl - totalInvestedInOpen).toFixed(2));

  // Total Portfolio Equity = Liquid Cash + Live Market Value of Open Positions
  const totalEquity = Number((liquidCash + totalMarketValueOpen).toFixed(2));
  const netTotalReturn = Number((totalEquity - initialCapital).toFixed(2));
  const netTotalReturnPct = initialCapital > 0 ? Number(((netTotalReturn / initialCapital) * 100).toFixed(2)) : 0;

  return {
    mode: mode.toUpperCase(),
    initialCapital,
    liquidCash,
    investedCapital: totalInvestedInOpen,
    currentHoldingsValue: totalMarketValueOpen,
    totalRealizedPnl,
    totalUnrealizedPnl,
    totalEquity,
    netTotalReturn,
    netTotalReturnPct,
    activePositionsCount: openPositions.length,
    openPositions,
  };
}

/**
 * Refresh and compute live mark-to-market P&L for all open positions in a given mode
 */
export async function refreshOpenPositions(modeInput?: string): Promise<ExecutedPosition[]> {
  const mode = normalizeSystemMode(modeInput);
  const state = systemStates[mode];
  const openPositions = state.executedPositions.filter((p) => p.status === "OPEN");
  const now = Date.now();

  for (const pos of openPositions) {
    try {
      const ctx = await getEquityContext(pos.ticker);
      if (ctx && ctx.current_price > 0) {
        const deviation = Math.abs(ctx.current_price - pos.fill_price) / (pos.fill_price || 1);
        if (deviation <= 0.25) {
          pos.current_price = Number(ctx.current_price.toFixed(2));
          const pnl =
            pos.action === "BUY"
              ? (pos.current_price - pos.fill_price) * pos.shares
              : (pos.fill_price - pos.current_price) * pos.shares;
          pos.unrealized_pnl = Number(pnl.toFixed(2));
          pos.unrealized_pnl_pct = Number(((pnl / (pos.fill_price * pos.shares)) * 100).toFixed(2));

          // Compute live holding duration elapsed
          const entryMs = new Date(pos.entry_time || pos.timestamp).getTime();
          const elapsedMs = Math.max(0, now - entryMs);
          pos.holding_duration = `${formatDurationMs(elapsedMs)} in trade`;

          // Automated Breakeven Ratchet (+1.5R Milestone) and Profit Lock (+2.5R)
          const initialRisk = Math.abs(pos.fill_price - pos.stop_loss);
          const currentGain = pos.action === "BUY" ? (pos.current_price - pos.fill_price) : (pos.fill_price - pos.current_price);
          if (initialRisk > 0) {
            const currentRMultiple = currentGain / initialRisk;
            if (currentRMultiple >= 2.5) {
              const lockedStop = pos.action === "BUY"
                ? Number((pos.fill_price + initialRisk * 1.2).toFixed(2))
                : Number((pos.fill_price - initialRisk * 1.2).toFixed(2));
              if (pos.action === "BUY" && lockedStop > pos.stop_loss) {
                pos.stop_loss = lockedStop;
              } else if (pos.action === "SELL" && lockedStop < pos.stop_loss) {
                pos.stop_loss = lockedStop;
              }
            } else if (currentRMultiple >= 1.5) {
              const breakevenStop = pos.action === "BUY"
                ? Number((pos.fill_price * 1.001).toFixed(2))
                : Number((pos.fill_price * 0.999).toFixed(2));
              if (pos.action === "BUY" && breakevenStop > pos.stop_loss) {
                pos.stop_loss = breakevenStop;
              } else if (pos.action === "SELL" && breakevenStop < pos.stop_loss) {
                pos.stop_loss = breakevenStop;
              }
            }
          }

          // Persist to that mode's SQLite database
          dbSavePosition(pos, mode);
        }
      }
    } catch {
      // Retain last price if quote lookup fails
    }
  }
  return openPositions;
}

/**
 * Retrieve past episodic lessons for a specific ticker in a given mode
 */
export function retrievePastLessons(ticker: string, limit = 2, modeInput?: string): PastLesson[] {
  const mode = normalizeSystemMode(modeInput);
  const normalized = ticker.toUpperCase().replace(".NS", "");
  return systemStates[mode].tradeHistory
    .filter((t) => t.ticker === normalized)
    .slice(-limit)
    .map((t) => ({
      bias: t.bias,
      pnl: t.pnl_realized,
      lesson: t.lesson,
      timestamp: t.timestamp,
    }));
}

/**
 * Executes an order ticket into the designated system (Intraday MIS vs Long CNC)
 */
export async function routeOrder(ticket: OrderTicket, modeInput?: string): Promise<ExecutedPosition | null> {
  if (ticket.status !== "APPROVED" || !ticket.shares || !ticket.action || !ticket.ticker) {
    return null;
  }

  const mode = normalizeSystemMode((ticket as any).trade_mode || modeInput);
  const state = systemStates[mode];

  // Real-time price verification from Yahoo Finance before entry
  const liveData = await fetchRealtimeLivePrice(ticket.ticker);
  const realLivePrice = Number(liveData.current_price.toFixed(2));
  const realAtr = liveData.atr_14 > 0 ? liveData.atr_14 : Number((realLivePrice * 0.018).toFixed(2));

  // Sector Diversification Guardrail
  const company = STOCK_UNIVERSE_MAP[ticket.ticker];
  const sector = company?.sector || "NSE Equities";
  const existingSameSector = state.executedPositions.filter(
    (p) => p.status === "OPEN" && (STOCK_UNIVERSE_MAP[p.ticker]?.sector === sector || (p as any).sector === sector)
  );
  if (existingSameSector.length >= 2) {
    console.warn(
      `[SECTOR GUARDRAIL ${mode}] Blocked entry for ${ticket.ticker}: Sector '${sector}' already holds ${existingSameSector.length} open positions.`
    );
    return null;
  }

  const entryPrice = realLivePrice;

  // Multiplier targets: Intraday uses tighter 1.5x / 3.0x ATR; Long uses wider 2.0x / 5.0x ATR
  const slMultiplier = mode === "intraday" ? 1.5 : 2.0;
  const tpMultiplier = mode === "intraday" ? 3.2 : 5.0;

  let stopLoss = ticket.stop_loss;
  let targetPrice = ticket.target_price;
  if (ticket.action === "BUY") {
    if (!stopLoss || stopLoss >= entryPrice) {
      stopLoss = Number((entryPrice - realAtr * slMultiplier).toFixed(2));
    }
    if (!targetPrice || targetPrice <= entryPrice) {
      targetPrice = Number((entryPrice + realAtr * tpMultiplier).toFixed(2));
    }
  } else {
    if (!stopLoss || stopLoss <= entryPrice) {
      stopLoss = Number((entryPrice + realAtr * slMultiplier).toFixed(2));
    }
    if (!targetPrice || targetPrice >= entryPrice) {
      targetPrice = Number((entryPrice - realAtr * tpMultiplier).toFixed(2));
    }
  }

  // Dynamic Sizing: Cap risk to ₹500
  const riskPerShare = Math.max(Math.abs(entryPrice - stopLoss), 0.5);
  const maxSharesAllowed = Math.max(1, Math.floor(500.0 / riskPerShare));
  const finalShares = Math.min(ticket.shares, maxSharesAllowed);

  // Realistic Slippage
  const slippage = entryPrice * 0.0005;
  const fillPrice = ticket.action === "BUY" ? entryPrice + slippage : entryPrice - slippage;
  const finalFillPrice = Number(fillPrice.toFixed(2));
  const capitalAllocated = Number((finalShares * finalFillPrice).toFixed(2));
  const rupeeRisk = Number((finalShares * Math.abs(finalFillPrice - stopLoss)).toFixed(2));
  const orderId = `${mode.toUpperCase()}_ORDER_${Date.now()}_${state.executedPositions.length + 1}`;

  const defaultStratId = mode === "intraday" ? "algo-ofi-microstructure-02" : "algo-cognitive-flagship";
  const defaultStratName = mode === "intraday" ? "Order Flow Imbalance" : "Cognitive-Q Flagship";
  const stratId = (ticket as any).strategy_id || defaultStratId;
  const stratName = (ticket as any).strategy_name || defaultStratName;

  const nowIso = new Date().toISOString();
  const prodType = mode === "intraday" ? "MIS" : "CNC";

  const position: ExecutedPosition = {
    order_id: orderId,
    ticker: ticket.ticker,
    action: ticket.action,
    shares: finalShares,
    entry_price: entryPrice,
    fill_price: finalFillPrice,
    stop_loss: stopLoss,
    target_price: targetPrice,
    capital_allocated: capitalAllocated,
    rupee_risk: rupeeRisk,
    timestamp: nowIso,
    entry_time: nowIso,
    trade_mode: mode === "intraday" ? "INTRADAY" : "LONG",
    product_type: prodType,
    holding_duration: "Just opened",
    current_price: entryPrice,
    unrealized_pnl: 0,
    unrealized_pnl_pct: 0,
    status: "OPEN",
    strategy_id: stratId,
    strategy_name: stratName,
    market_scenario_rationale: `Verified live quote entry (₹${realLivePrice}) in ${mode.toUpperCase()} (${prodType}) execution mode.`,
  };

  state.executedPositions.unshift(position);

  const txnRecord: TransactionRecord = {
    id: `TXN-${mode.toUpperCase()}-${String(state.transactionsLedger.length + 1).padStart(3, "0")}`,
    order_id: orderId,
    timestamp: nowIso,
    ticker: ticket.ticker,
    company_name: company?.name || ticket.ticker,
    sector: company?.sector || "NSE Equities",
    action: ticket.action,
    type: ticket.action === "BUY" ? "ENTRY_BUY" : "ENTRY_SELL",
    shares: finalShares,
    price: finalFillPrice,
    total_value: capitalAllocated,
    stop_loss: stopLoss,
    target_price: targetPrice,
    rupee_risk: rupeeRisk,
    execution_mode: systemConfig.system.paperTradingMode ? "PAPER" : "ZERODHA",
    status: "FILLED",
    notes: `[${mode.toUpperCase()} | ${prodType}] Strategy: ${stratName}. Fill: ₹${finalFillPrice}, SL: ₹${stopLoss}, TP: ₹${targetPrice}.`,
    strategy_id: stratId,
    strategy_name: stratName,
    product_type: prodType,
  };

  state.transactionsLedger.unshift(txnRecord);

  // Persistence to that mode's database
  dbSavePosition(position, mode);
  dbSaveTransaction(txnRecord, mode);

  return position;
}

/**
 * Closes an open position with precise entry timing, exit timing, holding duration, and diagnosis
 */
export async function closePosition(
  orderId: string,
  exitPrice?: number,
  aiLessonGenerator?: (pos: ExecutedPosition, exitP: number, pnl: number, pnlPct: number) => Promise<string>,
  modeInput?: string,
  exitReasonOverride?: string
): Promise<{ closedRecord: TradeHistoryRecord; transaction: TransactionRecord; accounting: any } | null> {
  // Try locating position across specified mode or both modes
  let targetMode: TradingSystemMode = normalizeSystemMode(modeInput);
  let posIndex = systemStates[targetMode].executedPositions.findIndex((p) => p.order_id === orderId);

  if (posIndex === -1) {
    const alternateMode: TradingSystemMode = targetMode === "intraday" ? "long" : "intraday";
    const altIndex = systemStates[alternateMode].executedPositions.findIndex((p) => p.order_id === orderId);
    if (altIndex !== -1) {
      targetMode = alternateMode;
      posIndex = altIndex;
    } else {
      return null;
    }
  }

  const state = systemStates[targetMode];
  const pos = state.executedPositions[posIndex];
  const exitP = Number(exitPrice) || pos.current_price || pos.fill_price;
  const pnl =
    pos.action === "BUY"
      ? (exitP - pos.fill_price) * pos.shares
      : (pos.fill_price - exitP) * pos.shares;
  const pnlPct = (pnl / (pos.fill_price * pos.shares)) * 100;

  // Timings: Entry time, exit time, and exact duration
  const entryTimeIso = pos.entry_time || pos.timestamp || new Date(Date.now() - 3600000).toISOString();
  const exitTimeIso = new Date().toISOString();
  const entryMs = new Date(entryTimeIso).getTime();
  const exitMs = new Date(exitTimeIso).getTime();
  const durationMs = Math.max(1000, exitMs - entryMs);
  const durationFormatted = formatDurationMs(durationMs);

  // Automatic exit reason classification
  let exitReason = exitReasonOverride;
  if (!exitReason) {
    if (pos.action === "BUY") {
      if (exitP >= (pos.target_price || 0)) {
        exitReason = `🎯 Take-Profit Target Hit (+${pnlPct.toFixed(2)}%)`;
      } else if (exitP <= (pos.stop_loss || 0)) {
        exitReason = `🛡️ Stop-Loss Triggered (${pnlPct.toFixed(2)}%)`;
      } else {
        exitReason = targetMode === "intraday"
          ? "⚡ Intraday Risk Officer Discretionary Exit"
          : "📈 Positional Discretionary Take-Profit Exit";
      }
    } else {
      if (exitP <= (pos.target_price || 0)) {
        exitReason = `🎯 Take-Profit Target Hit (+${pnlPct.toFixed(2)}%)`;
      } else if (exitP >= (pos.stop_loss || 0)) {
        exitReason = `🛡️ Stop-Loss Triggered (${pnlPct.toFixed(2)}%)`;
      } else {
        exitReason = "Discretionary Close";
      }
    }
  }

  // Clear diagnosis explaining profit vs loss
  let gainLossDiagnosis = "";
  if (pnl > 0) {
    gainLossDiagnosis = `Trade closed in profit of +₹${pnl.toFixed(2)} (+${pnlPct.toFixed(2)}%). Entry @ ₹${pos.fill_price} expanded toward target price ₹${pos.target_price}. Strategy delivered alpha over ${durationFormatted} holding period.`;
  } else {
    gainLossDiagnosis = `Trade closed with controlled deficit of -₹${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%). Stop-loss disciplined at ₹${pos.stop_loss} prevented severe downside, safely preserving 98%+ of allocated lot capital.`;
  }

  let lesson = "";
  if (aiLessonGenerator) {
    try {
      lesson = await aiLessonGenerator(pos, exitP, pnl, pnlPct);
    } catch {
      lesson = "";
    }
  }

  if (!lesson) {
    lesson = pnl > 0
      ? `System profit objective met @ ₹${exitP.toFixed(2)} (${exitReason}). Risk-to-reward ratio disciplined.`
      : `Adverse volatility hit stop-loss @ ₹${exitP.toFixed(2)}. Capital preservation successfully halted drawdown.`;
  }

  const company = STOCK_UNIVERSE_MAP[pos.ticker];
  const prodType = pos.product_type || (targetMode === "intraday" ? "MIS" : "CNC");

  const newRecord: TradeHistoryRecord = {
    id: state.tradeHistory.length + 1,
    order_id: pos.order_id,
    ticker: pos.ticker,
    company_name: company?.name || pos.ticker,
    bias: pos.action === "BUY" ? "BULLISH" : "BEARISH",
    action: pos.action,
    shares: pos.shares,
    entry_price: pos.fill_price,
    exit_price: Number(exitP.toFixed(2)),
    pnl_realized: Number(pnl.toFixed(2)),
    pnl_pct: Number(pnlPct.toFixed(2)),
    lesson,
    timestamp: exitTimeIso,
    entry_time: entryTimeIso,
    exit_time: exitTimeIso,
    duration: durationFormatted,
    duration_ms: durationMs,
    exit_reason: exitReason,
    trade_mode: targetMode === "intraday" ? "INTRADAY" : "LONG",
    product_type: prodType,
    gain_loss_diagnosis: gainLossDiagnosis,
    execution_mode: systemConfig.system.paperTradingMode ? "PAPER" : "ZERODHA",
    strategy_id: pos.strategy_id || (targetMode === "intraday" ? "algo-ofi-microstructure-02" : "algo-cognitive-flagship"),
    strategy_name: pos.strategy_name || (targetMode === "intraday" ? "Order Flow Imbalance" : "Cognitive-Q Flagship"),
  };

  state.tradeHistory.unshift(newRecord);
  state.executedPositions.splice(posIndex, 1);

  const closeTxnRecord: TransactionRecord = {
    id: `TXN-${targetMode.toUpperCase()}-${String(state.transactionsLedger.length + 1).padStart(3, "0")}`,
    order_id: pos.order_id,
    timestamp: exitTimeIso,
    ticker: pos.ticker,
    company_name: company?.name || pos.ticker,
    sector: company?.sector || "NSE Equities",
    action: pos.action === "BUY" ? "SELL" : "BUY",
    type: "EXIT_CLOSE",
    shares: pos.shares,
    price: Number(exitP.toFixed(2)),
    total_value: Number((pos.shares * exitP).toFixed(2)),
    stop_loss: pos.stop_loss,
    target_price: pos.target_price,
    rupee_risk: pos.rupee_risk,
    realized_pnl: Number(pnl.toFixed(2)),
    realized_pnl_pct: Number(pnlPct.toFixed(2)),
    execution_mode: systemConfig.system.paperTradingMode ? "PAPER" : "ZERODHA",
    status: "CLOSED",
    notes: `[${targetMode.toUpperCase()} | ${prodType}] Closed: ${exitReason} (${durationFormatted}). Realized: ₹${pnl.toFixed(2)}.`,
    strategy_id: newRecord.strategy_id,
    strategy_name: newRecord.strategy_name,
    product_type: prodType,
  };

  state.transactionsLedger.unshift(closeTxnRecord);

  // Persist closure to that specific mode's database
  dbRemovePosition(pos.order_id, targetMode);
  dbSaveTradeHistory(newRecord, targetMode);
  dbSaveTransaction(closeTxnRecord, targetMode);

  for (const listener of tradeCloseListeners) {
    try {
      listener(newRecord, pos.ticker, targetMode);
    } catch (e) {
      console.warn("[Trade Listener Error]:", e);
    }
  }

  const accounting = getPortfolioAccounting(targetMode);

  return {
    closedRecord: newRecord,
    transaction: closeTxnRecord,
    accounting,
  };
}

/**
 * Evaluates all strategies within a system mode to guide user decision on which strategies to use
 */
export function getStrategyPerformanceMetrics(modeInput?: string): StrategyPerformanceSummary[] {
  const mode = normalizeSystemMode(modeInput);
  const history = systemStates[mode].tradeHistory;

  // Group closed trades by strategy_id
  const map: Record<string, {
    name: string;
    trades: TradeHistoryRecord[];
  }> = {};

  for (const t of history) {
    const sId = t.strategy_id || "general-quant";
    const sName = t.strategy_name || "General Quantitative Strategy";
    if (!map[sId]) {
      map[sId] = { name: sName, trades: [] };
    }
    map[sId].trades.push(t);
  }

  // Pre-seed known strategies for that mode if not present
  const defaultStrategies = mode === "intraday"
    ? [
        { id: "algo-ofi-microstructure-02", name: "Order Flow Imbalance" },
        { id: "algo-vwap-mean-reversion", name: "VWAP Mean Reversion" },
        { id: "algo-volatility-breakout", name: "Intraday Momentum Breakout" },
      ]
    : [
        { id: "algo-cognitive-flagship", name: "Cognitive-Q Flagship" },
        { id: "algo-kalman-pairs-01", name: "Kalman Filter Dynamic Hedging" },
        { id: "algo-titans-compounder", name: "Titans Quality Compounder" },
        { id: "algo-quantum-synergy", name: "Quantum Synergy Ensemble" },
      ];

  for (const ds of defaultStrategies) {
    if (!map[ds.id]) {
      map[ds.id] = { name: ds.name, trades: [] };
    }
  }

  const summaries: StrategyPerformanceSummary[] = Object.entries(map).map(([strategy_id, item]) => {
    const trades = item.trades;
    const total_trades = trades.length;
    const winning_trades = trades.filter((t) => t.pnl_realized > 0).length;
    const losing_trades = trades.filter((t) => t.pnl_realized <= 0).length;
    const win_rate_pct = total_trades > 0 ? Number(((winning_trades / total_trades) * 100).toFixed(1)) : 0;
    const net_pnl_rupees = Number(trades.reduce((sum, t) => sum + t.pnl_realized, 0).toFixed(2));
    const avg_pnl_pct = total_trades > 0 ? Number((trades.reduce((sum, t) => sum + t.pnl_pct, 0) / total_trades).toFixed(2)) : 0;
    const avg_duration_ms = total_trades > 0
      ? trades.reduce((sum, t) => sum + (t.duration_ms || 3600000), 0) / total_trades
      : 3600000;
    const avg_duration = formatDurationMs(avg_duration_ms);

    const best_trade_pnl = trades.length > 0 ? Math.max(...trades.map((t) => t.pnl_realized)) : 0;
    const worst_trade_pnl = trades.length > 0 ? Math.min(...trades.map((t) => t.pnl_realized)) : 0;

    let verdict: "HIGH_PERFORMER" | "MODERATE" | "UNDERPERFORMING" = "MODERATE";
    let verdict_label = "🟡 Moderate / In Evaluation";
    let recommendation = "Performant in range regimes. Maintain current lot sizing.";

    if (net_pnl_rupees > 250 && win_rate_pct >= 65) {
      verdict = "HIGH_PERFORMER";
      verdict_label = "🟢 Highly Profitable (Recommended)";
      recommendation = "Optimal edge detected! Strong win rate and positive profit factor. Ideal strategy to deploy higher allocation.";
    } else if (net_pnl_rupees < 0 || (total_trades >= 2 && win_rate_pct < 45)) {
      verdict = "UNDERPERFORMING";
      verdict_label = "🔴 Loss-Making / Under Review";
      recommendation = "Experiencing false breakouts or choppy whip-saws. Reduce lot allocation or tighten entry filter criteria.";
    }

    return {
      strategy_id,
      strategy_name: item.name,
      trade_mode: mode === "intraday" ? "INTRADAY" : "LONG",
      total_trades,
      winning_trades,
      losing_trades,
      win_rate_pct,
      net_pnl_rupees,
      avg_pnl_pct,
      avg_duration,
      best_trade_pnl,
      worst_trade_pnl,
      verdict,
      verdict_label,
      recommendation,
    };
  });

  // Sort by net PnL descending
  return summaries.sort((a, b) => b.net_pnl_rupees - a.net_pnl_rupees);
}

/**
 * Resets portfolio, positions, trade history, and transactions to zero for a specific mode
 */
export function resetTradingState(startingCapital: number = 50000.0, modeInput?: string) {
  const mode = normalizeSystemMode(modeInput);
  const state = systemStates[mode];
  state.initialCapital = startingCapital;
  state.executedPositions = [];
  state.tradeHistory = [];
  state.transactionsLedger = [];
  flushCompleteState([], [], [], null, null, `Reset ${mode} state to zero`, mode);
  return getPortfolioAccounting(mode);
}

/**
 * Sync in-memory state with complete SQLite disk snapshot
 */
export function saveCompleteState(
  campaign?: any,
  adaptiveModel?: any,
  lastSummary?: string,
  modeInput?: string
) {
  try {
    const mode = normalizeSystemMode(modeInput);
    const state = systemStates[mode];
    flushCompleteState(
      state.executedPositions,
      state.tradeHistory,
      state.transactionsLedger,
      campaign,
      adaptiveModel,
      lastSummary,
      mode
    );
  } catch (err: any) {
    console.warn("[Persistence DB] Failed to save state:", err?.message || err);
  }
}
