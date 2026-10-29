import { Router } from "express";
import {
  generateAutomatedBuyReasoning,
  getLossAnalysisReport,
  simulateLossScenario,
} from "../services/lossAnalysisService.ts";
import { runTradingPipeline } from "../services/aiDebateService.ts";

export const analysisRoutes = Router();

// GET /api/decision-reasoning/:ticker
analysisRoutes.get("/api/decision-reasoning/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker || "RELIANCE";
    const reasoning = await generateAutomatedBuyReasoning(ticker);
    res.json({
      success: true,
      reasoning,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate decision reasoning",
    });
  }
});

// GET /api/loss-analysis
analysisRoutes.get("/api/loss-analysis", (req, res) => {
  try {
    const mode = (req.query.mode as string) || "intraday";
    const report = getLossAnalysisReport(mode);
    res.json({
      success: true,
      ...report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to generate loss analysis" });
  }
});

// POST /api/loss-analysis/simulate
analysisRoutes.post("/api/loss-analysis/simulate", async (req, res) => {
  const { ticker = "TCS", scenario = "FALSE_BREAKOUT_TRAP", customLossPct = 2.5 } = req.body || {};
  try {
    const simulatedPostMortem = await simulateLossScenario(ticker, scenario, customLossPct);
    res.json({ success: true, simulatedPostMortem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Simulation failed" });
  }
});

// POST /api/pipeline/run
analysisRoutes.post("/api/pipeline/run", async (req, res) => {
  const ticker = (req.body.ticker || "RELIANCE").toUpperCase().replace(".NS", "");
  const shouldAutoExecute = Boolean(req.body.autoExecute);

  try {
    const result = await runTradingPipeline(ticker, shouldAutoExecute);
    res.json(result);
  } catch (err: any) {
    console.warn("Pipeline run exception:", err?.message || err);
    res.status(500).json({
      ticker,
      timestamp: new Date().toISOString(),
      steps: [],
      success: false,
      message: err.message || "Failed running pipeline",
    });
  }
});
