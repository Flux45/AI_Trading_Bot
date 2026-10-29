import { Router } from "express";
import {
  getTitanMasters,
  getTitanMasterById,
  resetTitanLedger,
  evaluateTitanMastersLive,
} from "../services/titansService.ts";

export const titansRoutes = Router();

// GET /api/titans - Retrieve all Titan masters, bibliographies, mathematical rules, and live signals
titansRoutes.get("/api/titans", (req, res) => {
  try {
    const titans = getTitanMasters();
    res.json({
      success: true,
      titans,
      count: titans.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Titans Routes Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load Titans" });
  }
});

// GET /api/titans/:id - Retrieve specific Titan master
titansRoutes.get("/api/titans/:id", (req, res) => {
  try {
    const { id } = req.params;
    const titan = getTitanMasterById(id);
    if (!titan) {
      return res.status(404).json({ success: false, message: "Titan not found" });
    }
    res.json({ success: true, titan });
  } catch (err: any) {
    console.error("[Titan By ID Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to load Titan" });
  }
});

// POST /api/titans/:id/reset - Reset isolated capital to ₹25,000
titansRoutes.post("/api/titans/:id/reset", (req, res) => {
  try {
    const { id } = req.params;
    const { capital } = req.body || {};
    const titan = resetTitanLedger(id, Number(capital) || 25000);
    if (!titan) {
      return res.status(404).json({ success: false, message: "Titan not found for reset" });
    }
    res.json({
      success: true,
      message: `Master ${titan.name} ledger reset to ₹${titan.sub_ledger.initial_capital.toLocaleString("en-IN")}`,
      titan,
    });
  } catch (err: any) {
    console.error("[Titan Reset Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to reset Titan ledger" });
  }
});

// POST /api/titans/evaluate-live - Force live quote mark-to-market evaluation
titansRoutes.post("/api/titans/evaluate-live", async (req, res) => {
  try {
    const titans = await evaluateTitanMastersLive();
    res.json({
      success: true,
      message: "Titans live evaluation pulse completed successfully",
      titans,
    });
  } catch (err: any) {
    console.error("[Titan Evaluate Error]:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to evaluate Titans" });
  }
});
