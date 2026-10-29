import { Router } from "express";
import {
  executeNewsBuy,
  getCachedNewsItems,
  getCachedRecommendations,
  getLastScanTime,
  getMarketSentimentSummary,
  scanAndGenerateNewsRecommendations,
} from "../services/newsSentimentService.ts";

export const newsRoutes = Router();

// GET /api/market-sentiment
newsRoutes.get("/api/market-sentiment", async (req, res) => {
  try {
    const sentiment = await getMarketSentimentSummary();
    res.json({
      success: true,
      sentiment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to load market sentiment" });
  }
});

// GET /api/market-sentiment/trend
newsRoutes.get("/api/market-sentiment/trend", async (req, res) => {
  try {
    const sentiment = await getMarketSentimentSummary();
    res.json({
      success: true,
      trend30d: sentiment.trend30d,
      summary: sentiment.trendSummary,
      currentScore: sentiment.overallScore,
      currentLabel: sentiment.label,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to load sentiment trend" });
  }
});

// GET /api/news-recommendations
newsRoutes.get("/api/news-recommendations", async (req, res) => {
  let recommendations = getCachedRecommendations();
  let newsItems = getCachedNewsItems();

  if (recommendations.length === 0) {
    try {
      const scanRes = await scanAndGenerateNewsRecommendations();
      recommendations = scanRes.recommendations;
      newsItems = scanRes.newsItems;
    } catch (e: any) {
      console.warn("[News Engine] Auto-fetch error:", e?.message);
    }
  }

  res.json({
    success: true,
    totalRecommendations: recommendations.length,
    recommendations,
    totalNewsItems: newsItems.length,
    newsItems,
    lastScannedAt: getLastScanTime() || new Date().toISOString(),
  });
});

// POST /api/news-recommendations/scan
newsRoutes.post("/api/news-recommendations/scan", async (req, res) => {
  try {
    const { recommendations, newsItems } = await scanAndGenerateNewsRecommendations();
    res.json({
      success: true,
      message: `Successfully analyzed leading financial news sites. Generated ${recommendations.length} high-conviction trade setups.`,
      recommendations,
      newsItems,
      lastScannedAt: getLastScanTime(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to scan news portals",
    });
  }
});

// POST /api/news-recommendations/buy
newsRoutes.post("/api/news-recommendations/buy", async (req, res) => {
  const { ticker, customShares, customStopLoss, customTarget, headline, catalystType } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, message: "Missing stock ticker" });
  }

  try {
    const result = await executeNewsBuy(
      ticker,
      customShares,
      customStopLoss,
      customTarget,
      headline,
      catalystType
    );

    res.json({
      success: true,
      message: `Purchase option executed successfully for ${result.targetShares} shares of ${ticker}.`,
      position: result.executed,
      updatedCapital: result.updatedCapital,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Execution failed",
    });
  }
});
