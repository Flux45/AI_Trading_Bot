import { Router } from "express";
import fs from "fs";
import path from "path";
import {
  getWeeklyScheduleConfig,
  updateWeeklyScheduleConfig,
  getDispatchHistory,
  sendWeeklyEmailReport,
} from "../services/emailReportService.ts";
import { generateTradesAuditPdf } from "../services/pdfReportService.ts";

export const reportRoutes = Router();

// GET /api/reports/weekly-schedule - Retrieve current schedule settings & history
reportRoutes.get("/api/reports/weekly-schedule", (req, res) => {
  try {
    const schedule = getWeeklyScheduleConfig();
    const history = getDispatchHistory();
    res.json({
      success: true,
      schedule,
      history,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve weekly report schedule",
    });
  }
});

// POST /api/reports/weekly-schedule - Update schedule configuration
reportRoutes.post("/api/reports/weekly-schedule", (req, res) => {
  try {
    const updated = updateWeeklyScheduleConfig(req.body || {});
    res.json({
      success: true,
      message: "Weekly report schedule updated successfully.",
      schedule: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to update weekly report schedule",
    });
  }
});

// POST /api/reports/send-test-email - Trigger on-demand generation and email dispatch
reportRoutes.post("/api/reports/send-test-email", async (req, res) => {
  try {
    const recipientOverride = req.body?.recipientEmail;
    const result = await sendWeeklyEmailReport({
      isTest: true,
      recipientOverride,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Test email report dispatch error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate and email weekly report",
    });
  }
});

// GET /api/reports/preview-latest-pdf - Stream current weekly audit PDF
reportRoutes.get("/api/reports/preview-latest-pdf", async (req, res) => {
  try {
    const cachedPath = path.resolve(process.cwd(), "data", "reports", "weekly_audit_latest.pdf");
    let pdfBuffer: Buffer;

    if (fs.existsSync(cachedPath)) {
      pdfBuffer = fs.readFileSync(cachedPath);
    } else {
      pdfBuffer = await generateTradesAuditPdf();
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf"'
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Failed to stream preview PDF:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate preview PDF",
    });
  }
});

// GET /api/reports/preview-latest-pdf-base64 - Base64 version for iframe / modal integration
reportRoutes.get("/api/reports/preview-latest-pdf-base64", async (req, res) => {
  try {
    const pdfBuffer = await generateTradesAuditPdf();
    res.json({
      success: true,
      filename: "AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf",
      base64: pdfBuffer.toString("base64"),
      sizeBytes: pdfBuffer.length,
      mimeType: "application/pdf",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate preview base64 PDF",
    });
  }
});
