import { Router } from "express";
import {
  analyzePortfolioWithAI,
  executeRebalance,
  getMyStocksData,
  resetMyStocks,
} from "../services/myStocksService.ts";

export const myStocksRoutes = Router();

// GET /api/my-stocks
myStocksRoutes.get("/api/my-stocks", (req, res) => {
  const data = getMyStocksData();
  res.json({
    success: true,
    ...data,
  });
});

// POST /api/my-stocks/rebalance
myStocksRoutes.post("/api/my-stocks/rebalance", (req, res) => {
  const { recommendationId, executeAll } = req.body || {};
  const result = executeRebalance(recommendationId, executeAll);
  res.json({
    success: true,
    ...result,
  });
});

// POST /api/my-stocks/analyze
myStocksRoutes.post("/api/my-stocks/analyze", async (req, res) => {
  try {
    const { customQuestion } = req.body || {};
    const result = await analyzePortfolioWithAI(customQuestion);
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("[My Stocks Analyze Error]", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to analyze portfolio" });
  }
});

// POST /api/my-stocks/reset
myStocksRoutes.post("/api/my-stocks/reset", (req, res) => {
  const result = resetMyStocks();
  res.json({
    success: true,
    message: "Portfolio successfully rolled back to original Zerodha statement holdings",
    ...result,
  });
});
