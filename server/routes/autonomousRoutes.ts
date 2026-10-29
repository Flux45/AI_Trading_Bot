import { Router } from "express";
import {
  execute7DayAutonomousCycle,
  executeLiveAutonomousScanAndTrade,
  get7DaySummary,
  getAdaptiveTradingModel,
  getAutonomousDaemonStatus,
  getLiveCampaign,
  resetEverythingToZero,
  startLive7DayCampaign,
  toggleAutonomousDaemon,
} from "../services/autonomousService.ts";
import {
  getExecutedPositions,
  getPortfolioAccounting,
  getSystemConfig,
  getTradeHistory,
  getTransactionsLedger,
} from "../services/tradingService.ts";

export const autonomousRoutes = Router();

// POST /api/portfolio/reset-zero
autonomousRoutes.post("/api/portfolio/reset-zero", (req, res) => {
  const startingCapital = Number(req.body?.startingCapital) || 50000.0;
  const accounting = resetEverythingToZero(startingCapital);
  res.json({
    success: true,
    capital: accounting.liquidCash,
    accounting,
    message: `Paper portfolio and episodic memory reset to zero with starting capital of ₹${startingCapital.toLocaleString(
      "en-IN"
    )}.`,
  });
});

// POST /api/portfolio/reset (Legacy alias)
autonomousRoutes.post("/api/portfolio/reset", (req, res) => {
  const startingCapital = Number(req.body?.startingCapital) || 50000.0;
  const accounting = resetEverythingToZero(startingCapital);
  res.json({ success: true, capital: accounting.liquidCash, accounting });
});

// POST /api/autonomous/run-7day
autonomousRoutes.post("/api/autonomous/run-7day", async (req, res) => {
  try {
    const startingCapital = Number(req.body?.startingCapital) || 50000.0;
    const summary = await execute7DayAutonomousCycle(startingCapital);
    const accounting = getPortfolioAccounting();
    const executedPositions = getExecutedPositions();
    const tradeHistory = getTradeHistory();
    const transactionsLedger = getTransactionsLedger();
    const systemConfig = getSystemConfig();

    res.json({
      success: true,
      summary,
      accounting,
      openPositions: executedPositions,
      tradeHistory,
      transactions: transactionsLedger.slice(0, 20),
      systemConfig,
    });
  } catch (error: any) {
    console.error("[Autonomous 7-Day Cycle Error]:", error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to execute 7-day autonomous cycle",
    });
  }
});

// GET /api/autonomous/7day-summary
autonomousRoutes.get("/api/autonomous/7day-summary", (req, res) => {
  const accounting = getPortfolioAccounting();
  const summary = get7DaySummary();
  const status = getAutonomousDaemonStatus();
  res.json({
    success: true,
    summary,
    status,
    accounting,
  });
});

// GET /api/autonomous/status
autonomousRoutes.get("/api/autonomous/status", (req, res) => {
  const accounting = getPortfolioAccounting();
  const status = getAutonomousDaemonStatus();
  const campaign = getLiveCampaign();
  const adaptiveModel = getAdaptiveTradingModel();
  const executedPositions = getExecutedPositions();

  res.json({
    success: true,
    status,
    campaign,
    adaptiveModel,
    accounting,
    activePositionsCount: executedPositions.length,
    currentCapital: accounting.totalEquity,
  });
});

// POST /api/autonomous/toggle
autonomousRoutes.post("/api/autonomous/toggle", (req, res) => {
  const { enabled } = req.body || {};
  const status = toggleAutonomousDaemon(enabled);
  const campaign = getLiveCampaign();
  res.json({ success: true, status, campaign });
});

// POST /api/autonomous/live-campaign/start
autonomousRoutes.post("/api/autonomous/live-campaign/start", async (req, res) => {
  const startingCapital = Number(req.body?.startingCapital) || 50000.0;
  startLive7DayCampaign(startingCapital);

  let firstTrade = null;
  try {
    firstTrade = await executeLiveAutonomousScanAndTrade("Campaign Day 1 Kickoff");
  } catch (err: any) {
    console.warn("[Live Campaign Start] First trade scan error:", err?.message || err);
  }

  const updatedAccounting = getPortfolioAccounting();
  const campaign = getLiveCampaign();
  const adaptiveModel = getAdaptiveTradingModel();

  res.json({
    success: true,
    message:
      "Live 7-Day Autonomous Trading Campaign launched on Day 1. Taking active trades in real time with zero price hindsight.",
    campaign,
    adaptiveModel,
    firstTrade,
    accounting: updatedAccounting,
  });
});

// POST /api/autonomous/live-campaign/trade-now
autonomousRoutes.post("/api/autonomous/live-campaign/trade-now", async (req, res) => {
  try {
    const newPosition = await executeLiveAutonomousScanAndTrade("Manual UI Request");
    const accounting = getPortfolioAccounting();
    const campaign = getLiveCampaign();
    const adaptiveModel = getAdaptiveTradingModel();
    const status = getAutonomousDaemonStatus();

    res.json({
      success: true,
      executed: Boolean(newPosition),
      position: newPosition,
      campaign,
      adaptiveModel,
      accounting,
      lastActionSummary: status.lastActionSummary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to execute live trade" });
  }
});

// GET /api/autonomous/live-campaign
autonomousRoutes.get("/api/autonomous/live-campaign", (req, res) => {
  const accounting = getPortfolioAccounting();
  const campaign = getLiveCampaign();
  const adaptiveModel = getAdaptiveTradingModel();
  const executedPositions = getExecutedPositions();
  const tradeHistory = getTradeHistory();

  res.json({
    success: true,
    campaign,
    adaptiveModel,
    accounting,
    openPositions: executedPositions,
    recentHistory: tradeHistory.slice(0, 10),
  });
});
