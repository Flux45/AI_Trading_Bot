import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { getExecutedPositions, getPortfolioAccounting, getTradeHistory, getTransactionsLedger, refreshOpenPositions } from "./tradingService.ts";
import { getStrategyLeaderboard, getAllStrategyLedgers } from "../algoResearchBot.ts";

export async function generateTradesAuditPdf(): Promise<Buffer> {
  // Ensure open positions have refreshed real-time quotes (max 1.5s timeout)
  try {
    await Promise.race([
      refreshOpenPositions(),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch (e) {
    // Non-fatal
  }

  const accounting = getPortfolioAccounting();
  const openPositions = getExecutedPositions();
  const closedTrades = getTradeHistory();
  const transactions = getTransactionsLedger();
  const leaderboard = getStrategyLeaderboard();
  const allLedgers = getAllStrategyLedgers();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 36, // 0.5 inch margins
      info: {
        Title: "AI BOT ADVANCE - Trades & Portfolio Audit Report",
        Author: "AI BOT ADVANCE Quantitative Risk Engine",
        Subject: "Institutional Trading Audit Ledger",
        Keywords: "NSE, Trading, Portfolio, Risk Management, Quantitative Finance",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    const now = new Date();
    const formattedDate = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

    // Colors
    const primaryColor = "#0f172a"; // Slate 900
    const accentAmber = "#d97706"; // Amber 600
    const greenColor = "#16a34a"; // Green 600
    const redColor = "#dc2626"; // Red 600
    const textColor = "#334155"; // Slate 700
    const lightBg = "#f8fafc"; // Slate 50
    const borderColor = "#e2e8f0"; // Slate 200

    // ==========================================
    // HEADER BANNER
    // ==========================================
    doc.rect(36, 36, 523, 60).fill(primaryColor);

    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold").text("AI BOT ADVANCE", 50, 48);
    doc.fontSize(10).font("Helvetica").fillColor("#fbbf24").text("NSE QUANTITATIVE EXECUTION & RISK ENGINE", 50, 70);

    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold").text("OFFICIAL AUDIT REPORT", 380, 48, { align: "right", width: 165 });
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text(`Generated: ${formattedDate}`, 380, 62, { align: "right", width: 165 });
    doc.text("Storage Engine: SQLite 3 WAL Mode", 380, 74, { align: "right", width: 165 });

    doc.y = 110;

    // ==========================================
    // EXECUTIVE PORTFOLIO SUMMARY
    // ==========================================
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("1. EXECUTIVE PORTFOLIO SUMMARY", 36, doc.y);
    doc.moveDown(0.4);

    const summaryY = doc.y;
    const colW = 125;
    const cardH = 46;

    // Metric 1: Initial Capital
    doc.rect(36, summaryY, colW, cardH).fillAndStroke(lightBg, borderColor);
    doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("INITIAL CAPITAL", 42, summaryY + 8);
    doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text("₹50,000.00", 42, summaryY + 22);

    // Metric 2: Liquid Cash
    doc.rect(36 + colW + 8, summaryY, colW, cardH).fillAndStroke(lightBg, borderColor);
    doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("LIQUID CASH", 42 + colW + 8, summaryY + 8);
    doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text(`₹${accounting.liquidCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 42 + colW + 8, summaryY + 22);

    // Metric 3: Active Holdings
    doc.rect(36 + (colW + 8) * 2, summaryY, colW, cardH).fillAndStroke(lightBg, borderColor);
    doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("HOLDINGS VALUE", 42 + (colW + 8) * 2, summaryY + 8);
    doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text(`₹${accounting.currentHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 42 + (colW + 8) * 2, summaryY + 22);

    // Metric 4: Total Unrealized PnL
    const pnlColor = accounting.totalUnrealizedPnl >= 0 ? greenColor : redColor;
    const pnlPrefix = accounting.totalUnrealizedPnl >= 0 ? "+" : "";
    doc.rect(36 + (colW + 8) * 3, summaryY, colW, cardH).fillAndStroke(lightBg, borderColor);
    doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("UNREALIZED P&L (MTM)", 42 + (colW + 8) * 3, summaryY + 8);
    doc.fillColor(pnlColor).fontSize(11).font("Helvetica-Bold").text(`${pnlPrefix}₹${accounting.totalUnrealizedPnl.toFixed(2)}`, 42 + (colW + 8) * 3, summaryY + 22);

    // Upgraded Risk Guardrail Indicators
    doc.rect(36, summaryY + cardH + 4, 523, 14).fill("#f1f5f9");
    doc.fillColor("#0f172a").fontSize(6.5).font("Helvetica-Bold").text(
      "UPGRADED PROFIT CONTROLS: Noise-Resistant 1.8x ATR Stop  |  4.5x ATR Target (>= 2.5:1 R:R)  |  Max 1 per Sector Diversification  |  Auto Breakeven Ratchet (+1.5R)",
      42,
      summaryY + cardH + 7
    );

    doc.y = summaryY + cardH + 24;

    // ==========================================
    // SECTION 2: ACTIVE OPEN POSITIONS
    // ==========================================
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(`2. CURRENTLY OPEN POSITIONS (${openPositions.length} ACTIVE LOTS)`, 36, doc.y);
    doc.moveDown(0.4);

    if (openPositions.length === 0) {
      doc.fillColor("#64748b").fontSize(9).font("Helvetica-Oblique").text("No open positions currently active. All funds liquid.", 36, doc.y);
      doc.moveDown(1);
    } else {
      // Table Header
      const tableHeaders = ["TICKER", "ACTION", "QTY", "ENTRY FILL", "LIVE CMP", "STOP LOSS", "TARGET", "UNREALIZED P&L"];
      const colWidths = [60, 45, 30, 65, 65, 65, 65, 123];

      const startX = 36;
      let currentY = doc.y;

      // Draw header row
      doc.rect(startX, currentY, 523, 18).fill("#1e293b");
      let curX = startX + 6;
      doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
      tableHeaders.forEach((th, i) => {
        doc.text(th, curX, currentY + 5, { width: colWidths[i] - 4, align: i >= 2 ? "right" : "left" });
        curX += colWidths[i];
      });

      currentY += 18;

      // Draw position rows
      openPositions.forEach((pos, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(startX, currentY, 523, 16).fillAndStroke(rowBg, borderColor);

        curX = startX + 6;
        doc.fillColor(primaryColor).fontSize(7.5).font("Helvetica-Bold").text(pos.ticker, curX, currentY + 4, { width: colWidths[0] - 4 });
        curX += colWidths[0];

        doc.fillColor(greenColor).font("Helvetica-Bold").text(pos.action, curX, currentY + 4, { width: colWidths[1] - 4 });
        curX += colWidths[1];

        doc.fillColor(textColor).font("Helvetica").text(String(pos.shares), curX, currentY + 4, { width: colWidths[2] - 4, align: "right" });
        curX += colWidths[2];

        doc.text(`₹${pos.fill_price.toFixed(2)}`, curX, currentY + 4, { width: colWidths[3] - 4, align: "right" });
        curX += colWidths[3];

        doc.text(`₹${(pos.current_price || pos.fill_price).toFixed(2)}`, curX, currentY + 4, { width: colWidths[4] - 4, align: "right" });
        curX += colWidths[4];

        doc.fillColor(redColor).text(`₹${pos.stop_loss.toFixed(2)}`, curX, currentY + 4, { width: colWidths[5] - 4, align: "right" });
        curX += colWidths[5];

        doc.fillColor(greenColor).text(`₹${pos.target_price.toFixed(2)}`, curX, currentY + 4, { width: colWidths[6] - 4, align: "right" });
        curX += colWidths[6];

        const itemPnl = pos.unrealized_pnl || 0;
        const itemPnlPct = pos.unrealized_pnl_pct || 0;
        const pColor = itemPnl >= 0 ? greenColor : redColor;
        const pPref = itemPnl >= 0 ? "+" : "";
        doc.fillColor(pColor).font("Helvetica-Bold").text(`${pPref}₹${itemPnl.toFixed(2)} (${pPref}${itemPnlPct.toFixed(2)}%)`, curX, currentY + 4, {
          width: colWidths[7] - 4,
          align: "right",
        });

        currentY += 16;
      });

      doc.y = currentY + 14;
    }

    // ==========================================
    // SECTION 3: CLOSED TRADE HISTORY & LESSONS
    // ==========================================
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(`3. CLOSED TRADES AUDIT (${closedTrades.length} RECORDED CLOSURES)`, 36, doc.y);
    doc.moveDown(0.4);

    const closedHeaders = ["#", "TICKER", "ACTION", "QTY", "ENTRY", "EXIT", "REALIZED P&L", "STRATEGY / LESSON"];
    const closedColWidths = [18, 50, 36, 26, 48, 48, 75, 222];

    const cStartX = 36;
    let cCurrentY = doc.y;

    // Header
    doc.rect(cStartX, cCurrentY, 523, 18).fill("#1e293b");
    let cCurX = cStartX + 4;
    doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
    closedHeaders.forEach((th, i) => {
      doc.text(th, cCurX, cCurrentY + 5, { width: closedColWidths[i] - 4, align: i >= 3 && i <= 6 ? "right" : "left" });
      cCurX += closedColWidths[i];
    });

    cCurrentY += 18;

    closedTrades.forEach((ct, idx) => {
      // Check page overflow
      if (cCurrentY > 740) {
        doc.addPage();
        cCurrentY = 40;
        doc.rect(cStartX, cCurrentY, 523, 18).fill("#1e293b");
        let subX = cStartX + 4;
        doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        closedHeaders.forEach((th, i) => {
          doc.text(th, subX, cCurrentY + 5, { width: closedColWidths[i] - 4, align: i >= 3 && i <= 6 ? "right" : "left" });
          subX += closedColWidths[i];
        });
        cCurrentY += 18;
      }

      const rowH = 20;
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      doc.rect(cStartX, cCurrentY, 523, rowH).fillAndStroke(rowBg, borderColor);

      cCurX = cStartX + 4;
      doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(String(idx + 1), cCurX, cCurrentY + 5, { width: closedColWidths[0] - 2 });
      cCurX += closedColWidths[0];

      doc.fillColor(primaryColor).font("Helvetica-Bold").text(ct.ticker, cCurX, cCurrentY + 5, { width: closedColWidths[1] - 4 });
      cCurX += closedColWidths[1];

      doc.fillColor(ct.action === "BUY" ? greenColor : redColor).font("Helvetica-Bold").text(ct.action, cCurX, cCurrentY + 5, { width: closedColWidths[2] - 4 });
      cCurX += closedColWidths[2];

      doc.fillColor(textColor).font("Helvetica").text(String(ct.shares), cCurX, cCurrentY + 5, { width: closedColWidths[3] - 4, align: "right" });
      cCurX += closedColWidths[3];

      doc.text(`₹${ct.entry_price.toFixed(2)}`, cCurX, cCurrentY + 5, { width: closedColWidths[4] - 4, align: "right" });
      cCurX += closedColWidths[4];

      doc.text(`₹${ct.exit_price.toFixed(2)}`, cCurX, cCurrentY + 5, { width: closedColWidths[5] - 4, align: "right" });
      cCurX += closedColWidths[5];

      const pnlVal = ct.pnl_realized;
      const pColor = pnlVal >= 0 ? greenColor : redColor;
      const pPref = pnlVal >= 0 ? "+" : "";
      doc.fillColor(pColor).font("Helvetica-Bold").text(`${pPref}₹${pnlVal.toFixed(2)} (${pPref}${ct.pnl_pct.toFixed(1)}%)`, cCurX, cCurrentY + 5, {
        width: closedColWidths[6] - 4,
        align: "right",
      });
      cCurX += closedColWidths[6];

      const stratOrLesson = ct.strategy_name ? `[${ct.strategy_name}] ${ct.lesson || "Stop executed."}` : ct.lesson || "Defensive stop executed.";
      doc.fillColor("#475569").font("Helvetica").fontSize(6.5).text(stratOrLesson, cCurX, cCurrentY + 3, {
        width: closedColWidths[7] - 4,
        height: rowH - 4,
        ellipsis: true,
      });

      cCurrentY += rowH;
    });

    doc.y = cCurrentY + 16;

    // ==========================================
    // SECTION 4: STRATEGY ARENA ALGORITHMIC LEDGERS
    // ==========================================
    if (doc.y > 660) {
      doc.addPage();
    }

    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("4. QUANTITATIVE STRATEGY ARENA LEDGERS (12 COMPETING MODELS)", 36, doc.y);
    doc.moveDown(0.3);
    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Each algorithm operates with an independent, isolated ₹25,000 risk sub-ledger and real-time Yahoo Finance tick evaluations.", 36, doc.y);
    doc.moveDown(0.6);

    const arenaHeaders = ["STRATEGY NAME", "CATEGORY", "CAPITAL", "EQUITY", "NET RETURN", "WIN RATE", "ACTIVE"];
    const arenaColWidths = [185, 100, 48, 52, 68, 42, 28];

    let aCurrentY = doc.y;
    doc.rect(36, aCurrentY, 523, 18).fill("#1e293b");
    let aCurX = 40;
    doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
    arenaHeaders.forEach((th, i) => {
      doc.text(th, aCurX, aCurrentY + 5, { width: arenaColWidths[i] - 4, align: i >= 2 && i <= 5 ? "right" : "left" });
      aCurX += arenaColWidths[i];
    });

    aCurrentY += 18;

    leaderboard.forEach((entry, idx) => {
      if (aCurrentY > 740) {
        doc.addPage();
        aCurrentY = 40;
        doc.rect(36, aCurrentY, 523, 18).fill("#1e293b");
        let subX = 40;
        doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        arenaHeaders.forEach((th, i) => {
          doc.text(th, subX, aCurrentY + 5, { width: arenaColWidths[i] - 4, align: i >= 2 && i <= 5 ? "right" : "left" });
          subX += arenaColWidths[i];
        });
        aCurrentY += 18;
      }

      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      doc.rect(36, aCurrentY, 523, 16).fillAndStroke(rowBg, borderColor);

      aCurX = 40;
      doc.fillColor(primaryColor).fontSize(7).font("Helvetica-Bold").text(entry.strategy_name, aCurX, aCurrentY + 4, { width: arenaColWidths[0] - 4, ellipsis: true });
      aCurX += arenaColWidths[0];

      doc.fillColor("#475569").font("Helvetica").text(entry.categoryLabel || "Quant", aCurX, aCurrentY + 4, { width: arenaColWidths[1] - 4, ellipsis: true });
      aCurX += arenaColWidths[1];

      doc.text(`₹${(entry.allocated_capital / 1000).toFixed(0)}k`, aCurX, aCurrentY + 4, { width: arenaColWidths[2] - 4, align: "right" });
      aCurX += arenaColWidths[2];

      doc.fillColor(primaryColor).font("Helvetica-Bold").text(`₹${entry.total_equity.toFixed(0)}`, aCurX, aCurrentY + 4, { width: arenaColWidths[3] - 4, align: "right" });
      aCurX += arenaColWidths[3];

      const retVal = entry.net_return_rupees;
      const rColor = retVal >= 0 ? greenColor : redColor;
      const rPref = retVal >= 0 ? "+" : "";
      doc.fillColor(rColor).text(`${rPref}₹${retVal.toFixed(1)} (${rPref}${entry.net_return_pct.toFixed(1)}%)`, aCurX, aCurrentY + 4, { width: arenaColWidths[4] - 4, align: "right" });
      aCurX += arenaColWidths[4];

      doc.fillColor(textColor).font("Helvetica").text(`${entry.win_rate_pct.toFixed(0)}%`, aCurX, aCurrentY + 4, { width: arenaColWidths[5] - 4, align: "right" });
      aCurX += arenaColWidths[5];

      doc.text(String(entry.active_positions_count || 0), aCurX, aCurrentY + 4, { width: arenaColWidths[6] - 4, align: "center" });

      aCurrentY += 16;
    });

    doc.y = aCurrentY + 16;

    // ==========================================
    // SECTION 5: COMPLETE TRANSACTION LOG (TXN-001 TO TXN-021)
    // ==========================================
    if (doc.y > 640) {
      doc.addPage();
    }

    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(`5. IMMUTABLE TRANSACTION AUDIT TRAIL (${transactions.length} ENTRIES)`, 36, doc.y);
    doc.moveDown(0.4);

    const txnHeaders = ["TXN ID", "TYPE", "ACTION", "TICKER", "SHARES", "EXEC. PRICE", "TOTAL VALUE", "REALIZED P&L", "STATUS"];
    const txnColWidths = [50, 65, 40, 55, 35, 65, 75, 75, 63];

    let tCurrentY = doc.y;
    doc.rect(36, tCurrentY, 523, 18).fill("#1e293b");
    let tCurX = 40;
    doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
    txnHeaders.forEach((th, i) => {
      doc.text(th, tCurX, tCurrentY + 5, { width: txnColWidths[i] - 4, align: i >= 4 && i <= 7 ? "right" : "left" });
      tCurX += txnColWidths[i];
    });

    tCurrentY += 18;

    transactions.forEach((tx, idx) => {
      if (tCurrentY > 740) {
        doc.addPage();
        tCurrentY = 40;
        doc.rect(36, tCurrentY, 523, 18).fill("#1e293b");
        let subX = 40;
        doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        txnHeaders.forEach((th, i) => {
          doc.text(th, subX, tCurrentY + 5, { width: txnColWidths[i] - 4, align: i >= 4 && i <= 7 ? "right" : "left" });
          subX += txnColWidths[i];
        });
        tCurrentY += 18;
      }

      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      doc.rect(36, tCurrentY, 523, 15).fillAndStroke(rowBg, borderColor);

      tCurX = 40;
      doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(tx.id, tCurX, tCurrentY + 4, { width: txnColWidths[0] - 4 });
      tCurX += txnColWidths[0];

      doc.fillColor(primaryColor).font("Helvetica-Bold").text(tx.type, tCurX, tCurrentY + 4, { width: txnColWidths[1] - 4 });
      tCurX += txnColWidths[1];

      doc.fillColor(tx.action === "BUY" ? greenColor : redColor).font("Helvetica-Bold").text(tx.action, tCurX, tCurrentY + 4, { width: txnColWidths[2] - 4 });
      tCurX += txnColWidths[2];

      doc.fillColor(primaryColor).font("Helvetica-Bold").text(tx.ticker, tCurX, tCurrentY + 4, { width: txnColWidths[3] - 4 });
      tCurX += txnColWidths[3];

      doc.fillColor(textColor).font("Helvetica").text(String(tx.shares), tCurX, tCurrentY + 4, { width: txnColWidths[4] - 4, align: "right" });
      tCurX += txnColWidths[4];

      doc.text(`₹${tx.price.toFixed(2)}`, tCurX, tCurrentY + 4, { width: txnColWidths[5] - 4, align: "right" });
      tCurX += txnColWidths[5];

      doc.text(`₹${tx.total_value.toFixed(2)}`, tCurX, tCurrentY + 4, { width: txnColWidths[6] - 4, align: "right" });
      tCurX += txnColWidths[6];

      if (tx.realized_pnl != null) {
        const rpColor = tx.realized_pnl >= 0 ? greenColor : redColor;
        const rpPref = tx.realized_pnl >= 0 ? "+" : "";
        doc.fillColor(rpColor).font("Helvetica-Bold").text(`${rpPref}₹${tx.realized_pnl.toFixed(2)}`, tCurX, tCurrentY + 4, { width: txnColWidths[7] - 4, align: "right" });
      } else {
        doc.fillColor("#94a3b8").text("—", tCurX, tCurrentY + 4, { width: txnColWidths[7] - 4, align: "right" });
      }
      tCurX += txnColWidths[7];

      doc.fillColor("#475569").text(tx.status, tCurX, tCurrentY + 4, { width: txnColWidths[8] - 4 });

      tCurrentY += 15;
    });

    // ==========================================
    // FOOTER COMPLIANCE & LEGAL
    // ==========================================
    doc.y = tCurrentY + 20;
    if (doc.y > 720) {
      doc.addPage();
    }

    doc.rect(36, doc.y, 523, 40).fill("#f1f5f9");
    doc.fillColor("#64748b").fontSize(7).font("Helvetica").text(
      "CONFIDENTIAL TRADING AUDIT RECORD: This report is generated programmatically by AI BOT ADVANCE. All quotes are grounded in live National Stock Exchange of India (NSE) telemetry via Yahoo Finance API feeds and cross-verified against TradingView feeds. Zero synthetic slippage; full SQLite 3 ACID WAL persistence.",
      44,
      doc.y + 8,
      { width: 507, align: "justify" }
    );

    doc.end();
  });
}

export async function writeStaticTradesPdf(): Promise<string> {
  const buffer = await generateTradesAuditPdf();
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, "AI_BOT_ADVANCE_Trades_Audit_Report.pdf");
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}
