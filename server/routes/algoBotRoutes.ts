import { Router } from "express";
import {
  approveStrategyForPaper,
  loadDiscoveredStrategies,
  revokeStrategyApproval,
  runAutonomousAlgoDiscoverySweep,
  runSandboxedBacktest,
  getAllStrategyLedgers,
  getStrategyLedger,
  getStrategyLeaderboard,
  resetStrategyLedger,
  runAutonomousMultiStrategyEvaluation,
} from "../algoResearchBot.ts";

export const algoBotRoutes = Router();

// GET /api/algo-bot/strategies - List all discovered quantitative strategies
algoBotRoutes.get("/api/algo-bot/strategies", (req, res) => {
  try {
    const strategies = loadDiscoveredStrategies();
    res.json({
      success: true,
      strategies,
      total: strategies.length,
      approved_count: strategies.filter((s) => s.is_approved_for_paper).length,
    });
  } catch (err: any) {
    console.error("[Algo Bot Strategies Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load strategies" });
  }
});

// GET /api/algo-bot/leaderboard - Global Strategy Arena & Institutional Ranking
algoBotRoutes.get("/api/algo-bot/leaderboard", (req, res) => {
  try {
    const leaderboard = getStrategyLeaderboard();
    res.json({
      success: true,
      leaderboard,
      total_strategies: leaderboard.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Algo Bot Leaderboard Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load leaderboard" });
  }
});

// GET /api/algo-bot/strategy-ledger/:id - Dedicated breakdown view for specific strategy
algoBotRoutes.get("/api/algo-bot/strategy-ledger/:id", (req, res) => {
  try {
    const { id } = req.params;
    const ledger = getStrategyLedger(id);
    if (!ledger) {
      return res.status(404).json({ success: false, message: "Strategy ledger not found" });
    }
    res.json({
      success: true,
      ledger,
    });
  } catch (err: any) {
    console.error("[Algo Bot Strategy Ledger Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load strategy ledger" });
  }
});

// GET /api/algo-bot/all-ledgers - Retrieve all isolated strategy sub-ledgers
algoBotRoutes.get("/api/algo-bot/all-ledgers", (req, res) => {
  try {
    const ledgers = getAllStrategyLedgers();
    res.json({
      success: true,
      ledgers,
      count: ledgers.length,
    });
  } catch (err: any) {
    console.error("[Algo Bot All Ledgers Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load all ledgers" });
  }
});

// POST /api/algo-bot/strategy-ledger/:id/reset - Reset isolated capital to ₹25,000
algoBotRoutes.post("/api/algo-bot/strategy-ledger/:id/reset", (req, res) => {
  try {
    const { id } = req.params;
    const { capital } = req.body || {};
    const ledger = resetStrategyLedger(id, Number(capital) || 25000);
    if (!ledger) {
      return res.status(404).json({ success: false, message: "Strategy not found for reset" });
    }
    res.json({
      success: true,
      message: `Strategy '${ledger.strategy_name}' sub-ledger reset to ₹${ledger.initial_capital.toLocaleString("en-IN")}`,
      ledger,
    });
  } catch (err: any) {
    console.error("[Algo Bot Reset Ledger Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to reset ledger" });
  }
});

// POST /api/algo-bot/evaluate-multi - Manually trigger 24/7 multi-strategy pulse
algoBotRoutes.post("/api/algo-bot/evaluate-multi", async (req, res) => {
  try {
    await runAutonomousMultiStrategyEvaluation();
    const leaderboard = getStrategyLeaderboard();
    res.json({
      success: true,
      message: "Multi-strategy evaluation cycle completed across all isolated ledgers",
      leaderboard,
    });
  } catch (err: any) {
    console.error("[Algo Bot Evaluate Multi Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Evaluation cycle failed" });
  }
});

// POST /api/algo-bot/discover - Run autonomous internet research sweep across quant sources
algoBotRoutes.post("/api/algo-bot/discover", async (req, res) => {
  try {
    const { category } = req.body || {};
    const result = await runAutonomousAlgoDiscoverySweep(category || "ALL");
    const allStrategies = loadDiscoveredStrategies();
    res.json({
      success: true,
      new_strategies: result.new_strategies,
      total_count: allStrategies.length,
      sweep_summary: result.sweep_summary,
      strategies: allStrategies,
    });
  } catch (err: any) {
    console.error("[Algo Bot Discover Sweep Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Research discovery sweep failed" });
  }
});

// POST /api/algo-bot/backtest - Run deterministic sandbox simulation against historical candles
algoBotRoutes.post("/api/algo-bot/backtest", (req, res) => {
  try {
    const { strategy_id, time_horizon, initial_capital, slippage_pct, stt_and_fees, selected_tickers } =
      req.body || {};
    if (!strategy_id) {
      return res.status(400).json({ success: false, message: "Missing strategy_id" });
    }

    const result = runSandboxedBacktest({
      strategy_id,
      time_horizon: time_horizon || "90D",
      initial_capital: Number(initial_capital) || 50000,
      slippage_pct: slippage_pct !== undefined ? Number(slippage_pct) : 0.05,
      stt_and_fees: stt_and_fees !== undefined ? Boolean(stt_and_fees) : true,
      selected_tickers: Array.isArray(selected_tickers) ? selected_tickers : undefined,
    });

    res.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("[Algo Bot Backtest Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Backtest simulation failed" });
  }
});

// POST /api/algo-bot/approve - Human-in-the-loop approval for paper forward testing
algoBotRoutes.post("/api/algo-bot/approve", (req, res) => {
  try {
    const { strategy_id, max_capital_allocation, hard_stop_loss_pct, auto_paper_execution } = req.body || {};
    if (!strategy_id) {
      return res.status(400).json({ success: false, message: "strategy_id is required" });
    }

    const approved = approveStrategyForPaper(strategy_id, {
      max_capital_allocation: Number(max_capital_allocation) || 25000,
      hard_stop_loss_pct: Number(hard_stop_loss_pct) || 1.5,
      auto_paper_execution: auto_paper_execution !== undefined ? Boolean(auto_paper_execution) : true,
    });

    if (!approved) {
      return res.status(404).json({ success: false, message: "Strategy not found" });
    }

    res.json({
      success: true,
      message: `Strategy '${approved.name}' approved for paper forward-testing under safety limits`,
      strategy: approved,
    });
  } catch (err: any) {
    console.error("[Algo Bot Approval Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Approval failed" });
  }
});

// POST /api/algo-bot/revoke - Revoke/pause paper testing deployment
algoBotRoutes.post("/api/algo-bot/revoke", (req, res) => {
  try {
    const { strategy_id } = req.body || {};
    if (!strategy_id) {
      return res.status(400).json({ success: false, message: "strategy_id is required" });
    }

    const revoked = revokeStrategyApproval(strategy_id);
    if (!revoked) {
      return res.status(404).json({ success: false, message: "Strategy not found" });
    }

    res.json({
      success: true,
      message: `Paper testing approval for '${revoked.name}' paused`,
      strategy: revoked,
    });
  } catch (err: any) {
    console.error("[Algo Bot Revoke Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Revoke failed" });
  }
});

// GET /api/algo-bot/deployments - Get list of deployed / approved strategies
algoBotRoutes.get("/api/algo-bot/deployments", (req, res) => {
  try {
    const strategies = loadDiscoveredStrategies();
    const approved = strategies.filter((s) => s.is_approved_for_paper);
    res.json({
      success: true,
      deployments: approved,
      count: approved.length,
    });
  } catch (err: any) {
    console.error("[Algo Bot Deployments Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load deployments" });
  }
});
