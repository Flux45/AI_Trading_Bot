import { Router } from "express";
import type { ExecutedPosition, OrderTicket } from "../../src/types.ts";
import {
  clearTransactionsLedger,
  closePosition,
  getExecutedPositions,
  getPortfolioAccounting,
  getSystemConfig,
  getTradeHistory,
  getTransactionsLedger,
  refreshOpenPositions,
  retrievePastLessons,
  routeOrder,
  getStrategyPerformanceMetrics,
  resetTradingState,
} from "../services/tradingService.ts";
import { fetchRealtimeLivePrice } from "../services/marketDataService.ts";
import { checkGeminiStatus, getGenAI } from "../services/aiDebateService.ts";

export const tradingRoutes = Router();

// GET /api/positions - Open positions with MTM calculations for a given mode
tradingRoutes.get("/api/positions", async (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  const isIntra = mode.toLowerCase() === "intraday";
  try {
    const rawPositions = await refreshOpenPositions(mode);
    const openPositions = rawPositions.filter((p) => {
      if (isIntra) return p.trade_mode === "INTRADAY" || p.product_type === "MIS" || (!p.trade_mode && p.product_type !== "CNC");
      return p.trade_mode === "LONG" || p.product_type === "CNC" || (!p.trade_mode && p.product_type !== "MIS");
    });
    const accounting = getPortfolioAccounting(mode);
    res.json({
      success: true,
      mode: mode.toUpperCase(),
      openPositions,
      accounting,
      summary: {
        count: openPositions.length,
        totalInvested: accounting.investedCapital,
        totalCurrentValue: accounting.currentHoldingsValue,
        totalUnrealizedPnl: accounting.totalUnrealizedPnl,
        totalUnrealizedPnlPct:
          accounting.investedCapital > 0
            ? Number(((accounting.totalUnrealizedPnl / accounting.investedCapital) * 100).toFixed(2))
            : 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load positions" });
  }
});

// GET /api/portfolio/accounting - Portfolio Accounting for a given mode
tradingRoutes.get("/api/portfolio/accounting", async (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  try {
    await refreshOpenPositions(mode);
    const accounting = getPortfolioAccounting(mode);
    const systemConfig = getSystemConfig();
    res.json({
      success: true,
      mode: mode.toUpperCase(),
      accounting,
      systemConfig,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to compute accounting" });
  }
});

// GET /api/trade-history - Trade History with precise entry/exit timing and diagnosis
tradingRoutes.get("/api/trade-history", async (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  const isIntra = mode.toLowerCase() === "intraday";
  try {
    const rawHistory = getTradeHistory(mode);
    const history = rawHistory.filter((t) => {
      if (isIntra) return t.trade_mode === "INTRADAY" || t.product_type === "MIS" || (!t.trade_mode && t.product_type !== "CNC");
      return t.trade_mode === "LONG" || t.product_type === "CNC" || (!t.trade_mode && t.product_type !== "MIS");
    });
    res.json({
      success: true,
      mode: mode.toUpperCase(),
      total: history.length,
      tradeHistory: history,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load trade history" });
  }
});

// GET /api/strategy-performance - Evaluates strategies for user selection guidance
tradingRoutes.get("/api/strategy-performance", (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  try {
    const metrics = getStrategyPerformanceMetrics(mode);
    res.json({
      success: true,
      mode: mode.toUpperCase(),
      strategies: metrics,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to compute strategy performance" });
  }
});

// GET /api/portfolio/cumulative-pnl - Chronological Cumulative PnL curves for Intraday & Long modes independently
tradingRoutes.get("/api/portfolio/cumulative-pnl", (req, res) => {
  try {
    const intradayHistory = [...getTradeHistory("intraday")].reverse(); // Oldest first
    const longHistory = [...getTradeHistory("long")].reverse(); // Oldest first

    let intraPnl = 0;
    const intradaySeries = [
      {
        step: 0,
        time: "09:15 AM",
        timestamp: new Date().toISOString(),
        tradePnl: 0,
        cumulativePnl: 0,
        equity: 50000,
        ticker: "START",
        strategy: "Session Open (₹50,000 Reserve)",
        isProfit: true,
      },
      ...intradayHistory.map((t, idx) => {
        intraPnl += t.pnl_realized;
        const timeLabel = t.exit_time
          ? new Date(t.exit_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : `Trade #${idx + 1}`;
        return {
          step: idx + 1,
          time: timeLabel,
          timestamp: t.exit_time || t.timestamp,
          tradePnl: t.pnl_realized,
          cumulativePnl: Number(intraPnl.toFixed(2)),
          equity: Number((50000 + intraPnl).toFixed(2)),
          ticker: t.ticker,
          strategy: t.strategy_name || "Intraday Strategy",
          isProfit: t.pnl_realized >= 0,
          duration: t.duration,
          exitReason: t.exit_reason,
        };
      }),
    ];

    let longPnl = 0;
    const longSeries = [
      {
        step: 0,
        time: "Day 1 Open",
        timestamp: new Date().toISOString(),
        tradePnl: 0,
        cumulativePnl: 0,
        equity: 50000,
        ticker: "START",
        strategy: "Campaign Open (₹50,000 Reserve)",
        isProfit: true,
      },
      ...longHistory.map((t, idx) => {
        longPnl += t.pnl_realized;
        const timeLabel = t.exit_time
          ? new Date(t.exit_time).toLocaleDateString([], { month: "short", day: "numeric" })
          : `Swing #${idx + 1}`;
        return {
          step: idx + 1,
          time: timeLabel,
          timestamp: t.exit_time || t.timestamp,
          tradePnl: t.pnl_realized,
          cumulativePnl: Number(longPnl.toFixed(2)),
          equity: Number((50000 + longPnl).toFixed(2)),
          ticker: t.ticker,
          strategy: t.strategy_name || "Long Positional Strategy",
          isProfit: t.pnl_realized >= 0,
          duration: t.duration,
          exitReason: t.exit_reason,
        };
      }),
    ];

    // Build unified comparison series across trade steps
    const maxSteps = Math.max(intradaySeries.length, longSeries.length);
    const comparisonSeries = [];
    let curIntra = 0;
    let curLong = 0;

    for (let i = 0; i < maxSteps; i++) {
      if (i < intradaySeries.length) curIntra = intradaySeries[i].cumulativePnl;
      if (i < longSeries.length) curLong = longSeries[i].cumulativePnl;
      comparisonSeries.push({
        step: i,
        label: i === 0 ? "Start" : `Trade ${i}`,
        intradayCumulativePnl: curIntra,
        longCumulativePnl: curLong,
        netCombinedPnl: Number((curIntra + curLong).toFixed(2)),
      });
    }

    res.json({
      success: true,
      intraday: {
        series: intradaySeries,
        netPnl: Number(intraPnl.toFixed(2)),
        tradeCount: intradayHistory.length,
        winRatePct:
          intradayHistory.length > 0
            ? Number(((intradayHistory.filter((t) => t.pnl_realized > 0).length / intradayHistory.length) * 100).toFixed(1))
            : 0,
      },
      long: {
        series: longSeries,
        netPnl: Number(longPnl.toFixed(2)),
        tradeCount: longHistory.length,
        winRatePct:
          longHistory.length > 0
            ? Number(((longHistory.filter((t) => t.pnl_realized > 0).length / longHistory.length) * 100).toFixed(1))
            : 0,
      },
      comparisonSeries,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to generate cumulative PnL series" });
  }
});

// GET /api/portfolio/rebalance-config - Presets for risk profiles and sector targets
tradingRoutes.get("/api/portfolio/rebalance-config", async (req, res) => {
  try {
    const { DEFAULT_SECTOR_TARGETS } = await import("../services/rebalancingService.ts");
    res.json({
      success: true,
      defaultTargets: DEFAULT_SECTOR_TARGETS,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load rebalance config" });
  }
});

// POST /api/portfolio/ai-rebalance - Run Gemini AI + Quantitative Rebalancing Analysis
tradingRoutes.post("/api/portfolio/ai-rebalance", async (req, res) => {
  try {
    const { riskProfile = "BALANCED", sectorTargets } = req.body || {};
    const { computeAiRebalancing } = await import("../services/rebalancingService.ts");
    const report = await computeAiRebalancing(riskProfile, sectorTargets);
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error("[AI Rebalancing Error]:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate AI rebalancing report" });
  }
});

// POST /api/portfolio/apply-rebalance-action - Execute a rebalance suggestion (Trim, Close, New Entry)
tradingRoutes.post("/api/portfolio/apply-rebalance-action", async (req, res) => {
  try {
    const action = req.body;
    if (!action || !action.actionType || !action.ticker) {
      return res.status(400).json({ success: false, error: "Missing required action parameters" });
    }
    const { applyRebalanceAction } = await import("../services/rebalancingService.ts");
    const result = await applyRebalanceAction(action);
    res.json(result);
  } catch (err: any) {
    console.error("[Apply Rebalance Action Error]:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to apply rebalancing action" });
  }
});

// POST /api/positions/close - Close a position with detailed timing and diagnosis
tradingRoutes.post("/api/positions/close", async (req, res) => {
  const { order_id, exit_price, mode = "intraday", exit_reason } = req.body || {};
  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    const aiLessonGen = async (pos: ExecutedPosition, exitP: number, pnl: number, pnlPct: number) => {
      const gemStatus = await checkGeminiStatus();
      if (gemStatus.operational) {
        const ai = getGenAI();
        if (ai) {
          const resp = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Generate a concise 1-sentence quantitative trading lesson for this closed trade:
Stock: ${pos.ticker}
Action: ${pos.action}
Entry Fill: ₹${pos.fill_price}
Exit Price: ₹${exitP}
Realized PnL: ₹${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)
Duration: ${pos.holding_duration || "Intraday session"}
System: ${mode.toUpperCase()}`,
          });
          return resp.text?.trim() || "";
        }
      }
      return "";
    };

    const result = await closePosition(
      order_id,
      exit_price ? Number(exit_price) : undefined,
      aiLessonGen,
      mode,
      exit_reason
    );

    if (!result) {
      return res.status(404).json({ error: "Position not found in system state" });
    }

    res.json({
      success: true,
      mode: mode.toUpperCase(),
      closedRecord: result.closedRecord,
      transaction: result.transaction,
      updatedCapital: result.accounting.liquidCash,
      accounting: result.accounting,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to close position" });
  }
});

// POST /api/orders/execute - Execute Order Manually into designated mode
tradingRoutes.post("/api/orders/execute", async (req, res) => {
  try {
    const {
      ticker,
      action = "BUY",
      shares,
      stop_loss,
      target_price,
      ticket: incomingTicket,
      mode = "intraday",
      product_type,
    } = req.body || {};

    const cleanTicker = (ticker || incomingTicket?.ticker || "RELIANCE").toUpperCase().replace(".NS", "");
    const sysConfig = getSystemConfig();
    let finalTicket: OrderTicket;

    if (incomingTicket && incomingTicket.status === "APPROVED" && incomingTicket.shares && incomingTicket.shares > 0) {
      finalTicket = {
        ...incomingTicket,
        ticker: cleanTicker,
        action: incomingTicket.action || action,
        trade_mode: (mode.toUpperCase() === "LONG" ? "LONG" : "INTRADAY") as any,
        product_type: (product_type || (mode.toLowerCase() === "long" ? "CNC" : "MIS")) as any,
      };
    } else {
      const liveData = await fetchRealtimeLivePrice(cleanTicker);
      const curPrice = liveData.current_price;
      const atr = liveData.atr_14;
      const orderShares = shares
        ? parseInt(shares, 10)
        : Math.max(1, Math.floor((sysConfig.system.currentPaperCapital * 0.05) / curPrice));

      const slMul = mode.toLowerCase() === "long" ? 2.0 : 1.5;
      const tpMul = mode.toLowerCase() === "long" ? 4.5 : 3.0;

      const sl =
        stop_loss && Math.abs(curPrice - Number(stop_loss)) / curPrice < 0.15
          ? Number(stop_loss)
          : Number((curPrice - atr * slMul).toFixed(2));
      const tp =
        target_price && Math.abs(Number(target_price) - curPrice) / curPrice < 0.25
          ? Number(target_price)
          : Number((curPrice + atr * tpMul).toFixed(2));

      const riskPerShare = Math.abs(curPrice - sl);
      finalTicket = {
        status: "APPROVED",
        ticker: cleanTicker,
        action: action === "SELL" ? "SELL" : "BUY",
        shares: orderShares,
        entry_price: curPrice,
        stop_loss: sl,
        target_price: tp,
        capital_allocated: Number((orderShares * curPrice).toFixed(2)),
        rupee_risk: Number((orderShares * riskPerShare).toFixed(2)),
        risk_per_share: Number(riskPerShare.toFixed(2)),
        atr_multiplier: Number((riskPerShare / Math.max(atr, 0.01)).toFixed(2)),
        risk_reward_ratio: Number((Math.abs(tp - curPrice) / Math.max(riskPerShare, 0.01)).toFixed(2)),
        trade_mode: (mode.toUpperCase() === "LONG" ? "LONG" : "INTRADAY") as any,
        product_type: (product_type || (mode.toLowerCase() === "long" ? "CNC" : "MIS")) as any,
      } as any;
    }

    const executed = await routeOrder(finalTicket, mode);
    if (!executed) {
      return res.status(400).json({
        success: false,
        error: `Failed to route order: Risk limits exceeded or sector concentration reached in ${mode.toUpperCase()}.`,
      });
    }

    const openPositions = await refreshOpenPositions(mode);
    const ledger = getTransactionsLedger(mode);

    res.json({
      success: true,
      mode: mode.toUpperCase(),
      position: executed,
      openPositions,
      message: `${mode.toUpperCase()} (${executed.product_type || "MIS"}) ${executed.action} order executed: ${executed.shares} shares of ${executed.ticker} @ ₹${executed.fill_price}.`,
      transactions: ledger.slice(0, 15),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Order execution failed",
    });
  }
});

// GET /api/transactions - Transaction Audit Ledger for requested mode
tradingRoutes.get("/api/transactions", async (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  const isIntra = mode.toLowerCase() === "intraday";
  const { ticker, action, type } = req.query;

  try {
    await refreshOpenPositions(mode);
  } catch {
    // Non-fatal
  }

  const rawPositions = getExecutedPositions(mode);
  const executedPositions = rawPositions.filter((p) => {
    if (isIntra) return p.trade_mode === "INTRADAY" || p.product_type === "MIS" || (!p.trade_mode && p.product_type !== "CNC");
    return p.trade_mode === "LONG" || p.product_type === "CNC" || (!p.trade_mode && p.product_type !== "MIS");
  });

  const rawLedger = getTransactionsLedger(mode);
  const transactionsLedger = rawLedger.filter((t) => {
    if (isIntra) return t.trade_mode === "INTRADAY" || t.product_type === "MIS" || (!t.trade_mode && t.product_type !== "CNC");
    return t.trade_mode === "LONG" || t.product_type === "CNC" || (!t.trade_mode && t.product_type !== "MIS");
  });

  const activePositionsMap = new Map<string, ExecutedPosition>();
  for (const pos of executedPositions) {
    activePositionsMap.set(pos.order_id, pos);
  }

  const enrichedTransactions = transactionsLedger.map((t) => {
    let activePos = activePositionsMap.get(t.order_id);
    if (!activePos && (t.type === "ENTRY_BUY" || t.type === "ENTRY_SELL")) {
      activePos = executedPositions.find((p) => p.ticker === t.ticker);
    }
    if (activePos) {
      return {
        ...t,
        current_price: activePos.current_price || activePos.fill_price,
        current_pnl: activePos.unrealized_pnl,
        current_pnl_pct: activePos.unrealized_pnl_pct,
        is_active: true,
      };
    }
    return {
      ...t,
      is_active: false,
    };
  });

  let filtered = [...enrichedTransactions];
  if (ticker && typeof ticker === "string") {
    filtered = filtered.filter((t) => t.ticker.toUpperCase() === ticker.toUpperCase());
  }
  if (action && typeof action === "string") {
    filtered = filtered.filter((t) => t.action.toUpperCase() === action.toUpperCase());
  }
  if (type && typeof type === "string") {
    filtered = filtered.filter((t) => t.type.toUpperCase() === type.toUpperCase());
  }

  const activeTxns = enrichedTransactions.filter((t) => t.is_active);
  const totalActiveUnrealizedPnl = activeTxns.reduce((sum, t) => sum + (t.current_pnl || 0), 0);

  res.json({
    mode: mode.toUpperCase(),
    total: filtered.length,
    transactions: filtered,
    summary: {
      totalExecutedValue: transactionsLedger.reduce((sum, t) => sum + t.total_value, 0),
      totalBuyVolume: transactionsLedger
        .filter((t) => t.action === "BUY")
        .reduce((sum, t) => sum + t.total_value, 0),
      totalSellVolume: transactionsLedger
        .filter((t) => t.action === "SELL")
        .reduce((sum, t) => sum + t.total_value, 0),
      totalRealizedPnl: transactionsLedger.reduce((sum, t) => sum + (t.realized_pnl || 0), 0),
      entriesCount: transactionsLedger.filter((t) => t.type === "ENTRY_BUY" || t.type === "ENTRY_SELL").length,
      exitsCount: transactionsLedger.filter(
        (t) => t.type === "EXIT_CLOSE" || t.type === "STOP_LOSS" || t.type === "TARGET_EXIT"
      ).length,
      activeTradesCount: activeTxns.length,
      totalActiveUnrealizedPnl,
    },
  });
});

// DELETE /api/transactions - Clear transaction ledger for a mode
tradingRoutes.delete("/api/transactions", (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  clearTransactionsLedger(mode);
  res.json({ success: true, message: `Transaction ledger for ${mode.toUpperCase()} cleared.` });
});

// POST /api/portfolio/reset - Reset a mode's portfolio
tradingRoutes.post("/api/portfolio/reset", (req, res) => {
  const mode = (req.body?.mode as string) || "intraday";
  const capital = Number(req.body?.capital) || 50000.0;
  const accounting = resetTradingState(capital, mode);
  res.json({ success: true, mode: mode.toUpperCase(), accounting });
});

// GET /api/export-trades-pdf - Stream complete trades and portfolio audit PDF
tradingRoutes.get("/api/export-trades-pdf", async (req, res) => {
  try {
    const { generateTradesAuditPdf } = await import("../services/pdfReportService.ts");
    const pdfBuffer = await generateTradesAuditPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="AI_BOT_ADVANCE_Trades_Audit_Report.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: "Failed to generate PDF audit report", details: err?.message });
  }
});

// GET /api/export-trades-pdf-base64 - Base64 encoded PDF for inline viewer
tradingRoutes.get("/api/export-trades-pdf-base64", async (req, res) => {
  try {
    const { generateTradesAuditPdf } = await import("../services/pdfReportService.ts");
    const pdfBuffer = await generateTradesAuditPdf();
    res.json({
      success: true,
      filename: "AI_BOT_ADVANCE_Trades_Audit_Report.pdf",
      base64: pdfBuffer.toString("base64"),
      sizeBytes: pdfBuffer.length,
      mimeType: "application/pdf",
    });
  } catch (err: any) {
    console.error("PDF Base64 generation failed:", err);
    res.status(500).json({ error: "Failed to generate PDF base64", details: err?.message });
  }
});

// GET /api/memory - Retrieve past lessons or full memory dump for requested mode
tradingRoutes.get("/api/memory", async (req, res) => {
  const mode = (req.query.mode as string) || "intraday";
  const ticker = req.query.ticker as string;
  if (ticker) {
    res.json(retrievePastLessons(ticker, 10, mode));
  } else {
    const isIntra = mode.toLowerCase() === "intraday";
    const rawPositions = await refreshOpenPositions(mode);
    const openPositions = rawPositions.filter((p) => {
      if (isIntra) return p.trade_mode === "INTRADAY" || p.product_type === "MIS" || (!p.trade_mode && p.product_type !== "CNC");
      return p.trade_mode === "LONG" || p.product_type === "CNC" || (!p.trade_mode && p.product_type !== "MIS");
    });
    const accounting = getPortfolioAccounting(mode);
    const rawHistory = getTradeHistory(mode);
    const tradeHistory = rawHistory.filter((t) => {
      if (isIntra) return t.trade_mode === "INTRADAY" || t.product_type === "MIS" || (!t.trade_mode && t.product_type !== "CNC");
      return t.trade_mode === "LONG" || t.product_type === "CNC" || (!t.trade_mode && t.product_type !== "MIS");
    });
    const systemConfig = getSystemConfig();
    res.json({
      success: true,
      mode: mode.toUpperCase(),
      tradeHistory,
      openPositions,
      accounting,
      systemConfig,
    });
  }
});
