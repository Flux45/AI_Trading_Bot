import { Router } from "express";
import { checkGeminiStatus } from "../services/aiDebateService.ts";
import { getSystemConfig, updateSystemConfig } from "../services/tradingService.ts";
import {
  fetchCronjobList,
  getDatabaseStatus,
  getHeartbeatTelemetry,
  handleHeartbeatPing,
  performTestPing,
  setupCronjob,
  triggerDatabaseCheckpoint,
} from "../services/systemService.ts";

export const systemRoutes = Router();

// GET /api/config
systemRoutes.get("/api/config", async (req, res) => {
  const gemStatus = await checkGeminiStatus();
  const systemConfig = getSystemConfig();
  systemConfig.credentials.geminiApiKeySet = Boolean(process.env.GEMINI_API_KEY);
  systemConfig.credentials.geminiOperational = gemStatus.operational;
  systemConfig.credentials.geminiMessage = gemStatus.message;
  res.json(systemConfig);
});

// POST /api/config
systemRoutes.post("/api/config", (req, res) => {
  const { system, zerodha } = req.body || {};
  const updated = updateSystemConfig({ system, zerodha });
  res.json({ success: true, config: updated });
});

// Heartbeat ping routes
systemRoutes.all(["/api/heartbeat", "/api/ping", "/api/health"], handleHeartbeatPing);

// GET /api/heartbeat/telemetry
systemRoutes.get("/api/heartbeat/telemetry", (req, res) => {
  try {
    const telemetry = getHeartbeatTelemetry(req);
    res.json(telemetry);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to retrieve telemetry" });
  }
});

// POST /api/heartbeat/test-ping
systemRoutes.post("/api/heartbeat/test-ping", (req, res) => {
  try {
    const pingResult = performTestPing();
    res.json(pingResult);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to trigger test ping" });
  }
});

// POST /api/cronjob/setup
systemRoutes.post("/api/cronjob/setup", async (req, res) => {
  try {
    const result = await setupCronjob(req.body, req);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Cronjob setup failed" });
  }
});

// GET /api/cronjob/jobs
systemRoutes.get("/api/cronjob/jobs", async (req, res) => {
  try {
    const apiKey = (req.query.apiKey as string) || "";
    const result = await fetchCronjobList(apiKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to fetch cronjob jobs" });
  }
});

// GET /api/database/status
systemRoutes.get("/api/database/status", (req, res) => {
  try {
    const status = getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to inspect database status",
    });
  }
});

// POST /api/database/checkpoint
systemRoutes.post("/api/database/checkpoint", (req, res) => {
  try {
    const result = triggerDatabaseCheckpoint();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
