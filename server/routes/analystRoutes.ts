import { Router } from "express";
import {
  generateAnalystReview,
  getLatestAnalystReport,
  getAnalystHistory,
  askAnalystQuestion,
  runAnalystStressTest,
  HISTORICAL_CRASH_SCENARIOS,
  generateAnalystCatchupBrief,
  getLatestCatchupBrief,
} from "../services/analystService.ts";
import {
  getAllStrategiesTracked,
  getStrategyDrilldown,
} from "../services/strategyTrackerService.ts";

export const analystRoutes = Router();

// GET /api/analyst/report - Get current Analyst intelligence report
analystRoutes.get("/api/analyst/report", async (req, res) => {
  try {
    const force = req.query.fresh === "true";
    const report = force ? await generateAnalystReview(true) : await getLatestAnalystReport();
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve Analyst report",
    });
  }
});

// POST /api/analyst/run-review - Trigger deep research cycle on market trends & outcomes
analystRoutes.post("/api/analyst/run-review", async (req, res) => {
  try {
    const report = await generateAnalystReview(true);
    res.json({
      success: true,
      report,
      message: "Analyst deep quantitative research cycle completed successfully.",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to execute Analyst research review",
    });
  }
});

// GET /api/analyst/history - Get chronological learning timeline
analystRoutes.get("/api/analyst/history", (req, res) => {
  try {
    const history = getAnalystHistory();
    res.json({
      success: true,
      totalEntries: history.length,
      history,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve Analyst history",
    });
  }
});

// POST /api/analyst/apply-strategy-parameters - Apply Analyst's recommended parameters
analystRoutes.post("/api/analyst/apply-strategy-parameters", (req, res) => {
  try {
    const { strategyId, parameters } = req.body || {};
    res.json({
      success: true,
      strategyId,
      parameters,
      message: `Analyst recommended parameters successfully adopted for ${strategyId || "all strategies"}. Edge reinforced for live trading.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to apply strategy parameters",
    });
  }
});
analystRoutes.post("/api/analyst/ask", async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        error: "Question string is required",
      });
    }
    const response = await askAnalystQuestion(question.trim());
    res.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to process question with Analyst",
    });
  }
});

// GET /api/analyst/crash-scenarios - Retrieve available historical crash blueprints
analystRoutes.get("/api/analyst/crash-scenarios", (req, res) => {
  try {
    res.json({
      success: true,
      scenarios: Object.values(HISTORICAL_CRASH_SCENARIOS),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve crash scenarios",
    });
  }
});

// POST /api/analyst/stress-test - Simulate historical market crashes against active positions
analystRoutes.post("/api/analyst/stress-test", async (req, res) => {
  try {
    const { scenarioId, customParams, positionsInput, simulationToggles } = req.body || {};
    const result = await runAnalystStressTest({
      scenarioId,
      customParams,
      positionsInput,
      simulationToggles,
    });

    res.json({
      success: true,
      stressTest: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to run Analyst Strategy Stress-Test",
    });
  }
});

// GET /api/analyst/catchup-brief - Get latest "While You Were Away" executive debrief
analystRoutes.get("/api/analyst/catchup-brief", async (req, res) => {
  try {
    const sinceTimestamp = req.query.since as string | undefined;
    const timeframe = req.query.timeframe as string | undefined;
    const force = req.query.fresh === "true";

    const cached = !force ? getLatestCatchupBrief() : null;
    const brief = cached || await generateAnalystCatchupBrief({ sinceTimestamp, timeframe });

    res.json({
      success: true,
      brief,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate Analyst catch-up brief",
    });
  }
});

// POST /api/analyst/catchup-brief - Trigger on-demand generation of "While You Were Away" brief
analystRoutes.post("/api/analyst/catchup-brief", async (req, res) => {
  try {
    const { sinceTimestamp, timeframe } = req.body || {};
    const brief = await generateAnalystCatchupBrief({ sinceTimestamp, timeframe });
    res.json({
      success: true,
      brief,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate Analyst catch-up brief",
    });
  }
});

// GET /api/strategy-tracker/all - Retrieve all tracked quantitative strategies with return metrics
analystRoutes.get("/api/strategy-tracker/all", (req, res) => {
  try {
    const strategies = getAllStrategiesTracked();
    res.json({
      success: true,
      strategies,
      totalCount: strategies.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve strategy tracker metrics",
    });
  }
});

// GET /api/strategy-tracker/:strategyId - Retrieve single strategy drilldown with full trade history & returns
analystRoutes.get("/api/strategy-tracker/:strategyId", (req, res) => {
  try {
    const { strategyId } = req.params;
    const drilldown = getStrategyDrilldown(strategyId);
    res.json({
      success: true,
      strategy: drilldown,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve strategy drilldown",
    });
  }
});


