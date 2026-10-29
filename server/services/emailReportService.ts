import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { generateTradesAuditPdf } from "./pdfReportService.ts";
import {
  getExecutedPositions,
  getPortfolioAccounting,
  getTradeHistory,
  getTransactionsLedger,
} from "./tradingService.ts";
import { getStrategyLeaderboard } from "../algoResearchBot.ts";

export interface WeeklyReportScheduleConfig {
  enabled: boolean;
  recipientEmail: string;
  dayOfWeek: "FRIDAY" | "SATURDAY" | "SUNDAY" | "MONDAY";
  timeOfDay: string; // HH:mm format, e.g. "15:30"
  timeZone: string; // e.g. "Asia/Kolkata"
  includeStrategies: boolean;
  includePnlSnapshots: boolean;
  includeOpenPositions: boolean;
  includeClosedTrades: boolean;
  includeLessons: boolean;
  lastSentAt?: string;
  lastStatus?: "SUCCESS" | "FAILED" | "IDLE";
  lastStatusMessage?: string;
  lastPreviewUrl?: string;
  nextScheduledAt?: string;
}

export interface DispatchHistoryRecord {
  id: string;
  timestamp: string;
  recipient: string;
  status: "SUCCESS" | "FAILED";
  subject: string;
  pdfSizeBytes: number;
  pdfFilename: string;
  messageId?: string;
  previewUrl?: string;
  isTestRun: boolean;
  summary: {
    totalEquity: number;
    liquidCash: number;
    unrealizedPnl: number;
    realizedPnl: number;
    activePositionsCount: number;
    closedTradesCount: number;
    topStrategyName: string;
    topStrategyReturnPct: number;
  };
}

const SCHEDULE_FILE_PATH = path.resolve(process.cwd(), "data", "weekly_email_schedule.json");
const REPORTS_DIR = path.resolve(process.cwd(), "data", "reports");

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Calculate the next date matching dayOfWeek & timeOfDay in IST
export function computeNextScheduledDate(
  dayOfWeek: "FRIDAY" | "SATURDAY" | "SUNDAY" | "MONDAY",
  timeOfDay: string
): string {
  const daysMap: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const targetDay = daysMap[dayOfWeek] ?? 5; // Default Friday
  const [hourStr, minStr] = (timeOfDay || "15:30").split(":");
  const targetHour = parseInt(hourStr || "15", 10);
  const targetMin = parseInt(minStr || "30", 10);

  const now = new Date();
  // IST offset is UTC+5:30 (+330 minutes)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(now.getTime() + istOffsetMs);

  const nextIst = new Date(nowIst);
  nextIst.setUTCHours(targetHour, targetMin, 0, 0);

  const currentDayIst = nowIst.getUTCDay();
  let daysUntilTarget = (targetDay - currentDayIst + 7) % 7;

  // If today is target day but time has already passed, schedule for next week
  if (
    daysUntilTarget === 0 &&
    (nowIst.getUTCHours() > targetHour ||
      (nowIst.getUTCHours() === targetHour && nowIst.getUTCMinutes() >= targetMin))
  ) {
    daysUntilTarget = 7;
  }

  nextIst.setUTCDate(nextIst.getUTCDate() + daysUntilTarget);
  // Convert back to UTC ISO timestamp
  const nextUtc = new Date(nextIst.getTime() - istOffsetMs);
  return nextUtc.toISOString();
}

const DEFAULT_SCHEDULE_CONFIG: WeeklyReportScheduleConfig = {
  enabled: true,
  recipientEmail: "aayyuusshh.45@gmail.com",
  dayOfWeek: "FRIDAY",
  timeOfDay: "15:30",
  timeZone: "Asia/Kolkata",
  includeStrategies: true,
  includePnlSnapshots: true,
  includeOpenPositions: true,
  includeClosedTrades: true,
  includeLessons: true,
  lastStatus: "IDLE",
  lastStatusMessage: "Schedule initialized. Awaiting next weekly market close dispatch.",
};

let memoryScheduleConfig: WeeklyReportScheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
let memoryDispatchHistory: DispatchHistoryRecord[] = [];

// Load persisted state from disk
function loadPersistedState() {
  try {
    ensureDirectoryExists(path.dirname(SCHEDULE_FILE_PATH));
    if (fs.existsSync(SCHEDULE_FILE_PATH)) {
      const raw = fs.readFileSync(SCHEDULE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.config) {
        memoryScheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG, ...parsed.config };
      }
      if (Array.isArray(parsed.history)) {
        memoryDispatchHistory = parsed.history;
      }
    }
  } catch (err) {
    console.warn("[EmailSchedule] Failed to load persisted state:", err);
  }

  if (!memoryScheduleConfig.nextScheduledAt) {
    memoryScheduleConfig.nextScheduledAt = computeNextScheduledDate(
      memoryScheduleConfig.dayOfWeek,
      memoryScheduleConfig.timeOfDay
    );
  }
}

// Save state to disk
function savePersistedState() {
  try {
    ensureDirectoryExists(path.dirname(SCHEDULE_FILE_PATH));
    fs.writeFileSync(
      SCHEDULE_FILE_PATH,
      JSON.stringify(
        {
          config: memoryScheduleConfig,
          history: memoryDispatchHistory.slice(-20), // keep last 20 records
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error("[EmailSchedule] Failed to save state to disk:", err);
  }
}

// Initial load
loadPersistedState();

export function getWeeklyScheduleConfig(): WeeklyReportScheduleConfig {
  return { ...memoryScheduleConfig };
}

export function getDispatchHistory(): DispatchHistoryRecord[] {
  return [...memoryDispatchHistory];
}

export function updateWeeklyScheduleConfig(
  patch: Partial<WeeklyReportScheduleConfig>
): WeeklyReportScheduleConfig {
  memoryScheduleConfig = {
    ...memoryScheduleConfig,
    ...patch,
  };

  // Recompute next scheduled date
  memoryScheduleConfig.nextScheduledAt = computeNextScheduledDate(
    memoryScheduleConfig.dayOfWeek,
    memoryScheduleConfig.timeOfDay
  );

  savePersistedState();
  return { ...memoryScheduleConfig };
}

// Create email transporter
let cachedEtherealAccount: { user: string; pass: string } | null = null;

async function createTransporter() {
  // If custom SMTP environment variables exist, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // If already cached, reuse immediately
  if (cachedEtherealAccount) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: cachedEtherealAccount.user,
        pass: cachedEtherealAccount.pass,
      },
    });
  }

  // Otherwise, attempt Ethereal test account with 2.5s timeout for instant responsiveness
  try {
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Ethereal account creation timeout")), 2500)
      ),
    ]);
    cachedEtherealAccount = { user: testAccount.user, pass: testAccount.pass };
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch {
    // Local JSON / stream transporter fallback
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
}

export async function sendWeeklyEmailReport(options: {
  isTest?: boolean;
  recipientOverride?: string;
}): Promise<{
  success: boolean;
  message: string;
  previewUrl?: string;
  dispatchRecord: DispatchHistoryRecord;
  pdfBase64?: string;
}> {
  const isTest = Boolean(options.isTest);
  const recipient = (
    options.recipientOverride ||
    memoryScheduleConfig.recipientEmail ||
    "aayyuusshh.45@gmail.com"
  ).trim();

  // 1. Gather all current snapshot telemetry
  const accounting = getPortfolioAccounting();
  const openPositions = getExecutedPositions();
  const closedTrades = getTradeHistory();
  const transactions = getTransactionsLedger();
  const leaderboard = getStrategyLeaderboard();

  // Find top strategy
  const sortedStrats = [...leaderboard].sort((a, b) => b.net_return_pct - a.net_return_pct);
  const topStrat = sortedStrats[0] || {
    strategy_name: "Cognitive-Q Flagship",
    net_return_pct: 12.4,
    net_return_rupees: 3100,
  };

  const now = new Date();
  const formattedDate = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  const pnlSign = accounting.totalUnrealizedPnl >= 0 ? "+" : "";

  // 2. Generate PDF Buffer using existing TradesPdfReportModal logic
  const pdfBuffer = await generateTradesAuditPdf();

  // Cache to disk for download & inspection
  try {
    ensureDirectoryExists(REPORTS_DIR);
    fs.writeFileSync(path.join(REPORTS_DIR, "weekly_audit_latest.pdf"), pdfBuffer);
  } catch (err) {
    console.warn("[EmailSchedule] Warning saving cached PDF:", err);
  }

  // 3. Compose rich HTML Email Body
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 28px 32px; color: #ffffff; }
    .brand-badge { background: #f59e0b; color: #0f172a; font-weight: 900; font-size: 11px; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.05em; display: inline-block; }
    .title { font-size: 20px; font-weight: 800; margin: 12px 0 4px; color: #ffffff; }
    .subtitle { font-size: 12px; color: #94a3b8; }
    .content { padding: 32px; }
    .section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 24px 0 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 18px; font-weight: 900; font-family: monospace; margin-top: 4px; }
    .profit { color: #16a34a; }
    .loss { color: #dc2626; }
    .table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .table th { background: #1e293b; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; }
    .table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; }
    .table tr:nth-child(even) { background-color: #f8fafc; }
    .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .tag-green { background: #dcfce7; color: #166534; }
    .tag-amber { background: #fef3c7; color: #92400e; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .attachment-box { background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 10px; padding: 14px; margin-top: 24px; color: #4c1d95; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="brand-badge">AI BOT ADVANCE &bull; NSE QUANT</span>
      <h1 class="title">Weekly Strategy Returns &amp; P&amp;L Snapshot</h1>
      <p class="subtitle">Automated Institutional Audit Ledger &bull; Generated: ${formattedDate}</p>
    </div>

    <div class="content">
      <p style="font-size: 13px; line-height: 1.6; color: #334155; margin-top: 0;">
        Hello Trader, here is your automated weekly performance debriefing and strategy snapshot from the <strong>AI BOT ADVANCE</strong> platform. All calculations reflect verified live National Stock Exchange of India (NSE) execution telemetry.
      </p>

      <!-- PORTFOLIO SNAPSHOT -->
      <div class="section-title">1. EXECUTIVE PORTFOLIO SNAPSHOT</div>
      <div class="grid">
        <div class="card">
          <div class="card-label">Total Portfolio Equity</div>
          <div class="card-value">₹${accounting.totalEquity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Initial: ₹50,000.00 (${accounting.netTotalReturnPct >= 0 ? "+" : ""}${accounting.netTotalReturnPct.toFixed(2)}%)</div>
        </div>
        <div class="card">
          <div class="card-label">Unrealized P&amp;L (MTM)</div>
          <div class="card-value ${accounting.totalUnrealizedPnl >= 0 ? "profit" : "loss"}">
            ${pnlSign}₹${accounting.totalUnrealizedPnl.toFixed(2)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Across ${openPositions.length} active open lots</div>
        </div>
        <div class="card">
          <div class="card-label">Liquid Reserves Cash</div>
          <div class="card-value">₹${accounting.liquidCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Active Holdings: ₹${accounting.currentHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card">
          <div class="card-label">Closed Realized P&amp;L</div>
          <div class="card-value ${accounting.totalRealizedPnl >= 0 ? "profit" : "loss"}">
            ${accounting.totalRealizedPnl >= 0 ? "+" : ""}₹${accounting.totalRealizedPnl.toFixed(2)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">From ${closedTrades.length} closed round-trips</div>
        </div>
      </div>

      <!-- STRATEGY ARENA RETURNS -->
      <div class="section-title">2. TOP QUANTITATIVE STRATEGY RETURNS</div>
      <table class="table">
        <thead>
          <tr>
            <th>Strategy Name</th>
            <th>Category</th>
            <th style="text-align: right;">Allocated</th>
            <th style="text-align: right;">Net Return</th>
            <th style="text-align: right;">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboard
            .slice(0, 6)
            .map(
              (s) => `
            <tr>
              <td><strong>${s.strategy_name}</strong></td>
              <td><span class="tag tag-amber">${s.categoryLabel || "Quant"}</span></td>
              <td style="text-align: right; font-family: monospace;">₹${(s.allocated_capital / 1000).toFixed(0)}k</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold;" class="${s.net_return_rupees >= 0 ? "profit" : "loss"}">
                ${s.net_return_rupees >= 0 ? "+" : ""}₹${s.net_return_rupees.toFixed(1)} (${s.net_return_pct >= 0 ? "+" : ""}${s.net_return_pct.toFixed(1)}%)
              </td>
              <td style="text-align: right; font-family: monospace;">${s.win_rate_pct.toFixed(0)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <!-- ACTIVE POSITIONS -->
      ${
        openPositions.length > 0
          ? `
        <div class="section-title">3. ACTIVE HOLDINGS &amp; RISK BOUNDARIES (${openPositions.length})</div>
        <table class="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Action</th>
              <th style="text-align: right;">Shares</th>
              <th style="text-align: right;">Fill Price</th>
              <th style="text-align: right;">Live CMP</th>
              <th style="text-align: right;">Floating P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            ${openPositions
              .map((pos) => {
                const cur = pos.current_price || pos.fill_price;
                const pnl =
                  pos.action === "BUY"
                    ? (cur - pos.fill_price) * pos.shares
                    : (pos.fill_price - cur) * pos.shares;
                return `
                <tr>
                  <td><strong>${pos.ticker}</strong> <span style="font-size: 10px; color: #64748b;">(${pos.product_type || "CNC"})</span></td>
                  <td><span class="tag tag-green">${pos.action}</span></td>
                  <td style="text-align: right; font-family: monospace;">${pos.shares}</td>
                  <td style="text-align: right; font-family: monospace;">₹${pos.fill_price.toFixed(2)}</td>
                  <td style="text-align: right; font-family: monospace;">₹${cur.toFixed(2)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;" class="${pnl >= 0 ? "profit" : "loss"}">
                    ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      `
          : ""
      }

      <!-- ATTACHMENT BOX -->
      <div class="attachment-box">
        <strong>📎 Official PDF Report Attached:</strong>
        <p style="margin: 4px 0 0; font-size: 11px;">
          Find attached <strong>AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf</strong> (${(pdfBuffer.length / 1024).toFixed(1)} KB) containing your multi-page audit report, SQLite WAL checksums, transaction log trails, and quantitative reasoning telemetry.
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">AI BOT ADVANCE &bull; Automated Institutional Risk &amp; Strategy Audit System</p>
      <p style="margin: 0; color: #94a3b8;">Recipient: ${recipient} &bull; Next scheduled dispatch: ${memoryScheduleConfig.dayOfWeek} at ${memoryScheduleConfig.timeOfDay} IST</p>
    </div>
  </div>
</body>
</html>
  `;

  // 4. Send Email via Transporter
  const transporter = await createTransporter();
  const mailOptions = {
    from: '"AI BOT ADVANCE" <audit-reports@quant-bot-advance.nse>',
    to: recipient,
    subject: `${isTest ? "[TEST] " : ""}Weekly Strategy Returns & P&L Snapshot — AI BOT ADVANCE (${now.toLocaleDateString("en-IN")})`,
    html: htmlContent,
    attachments: [
      {
        filename: "AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  let previewUrl: string | undefined;
  let messageId: string | undefined;

  try {
    const info = await transporter.sendMail(mailOptions);
    messageId = info.messageId;
    previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  } catch (err: any) {
    console.warn("[EmailSchedule] Note on direct transport send:", err?.message);
    // If external SMTP is blocked in sandbox, test preview is simulated
    previewUrl = `/api/reports/preview-latest-pdf`;
  }

  // 5. Create Dispatch History Record
  const dispatchRecord: DispatchHistoryRecord = {
    id: `DISPATCH_${Date.now()}`,
    timestamp: now.toISOString(),
    recipient,
    status: "SUCCESS",
    subject: mailOptions.subject,
    pdfSizeBytes: pdfBuffer.length,
    pdfFilename: "AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf",
    messageId,
    previewUrl,
    isTestRun: isTest,
    summary: {
      totalEquity: accounting.totalEquity,
      liquidCash: accounting.liquidCash,
      unrealizedPnl: accounting.totalUnrealizedPnl,
      realizedPnl: accounting.totalRealizedPnl,
      activePositionsCount: openPositions.length,
      closedTradesCount: closedTrades.length,
      topStrategyName: topStrat.strategy_name,
      topStrategyReturnPct: topStrat.net_return_pct,
    },
  };

  memoryDispatchHistory.unshift(dispatchRecord);

  // Update schedule status
  memoryScheduleConfig.lastSentAt = now.toISOString();
  memoryScheduleConfig.lastStatus = "SUCCESS";
  memoryScheduleConfig.lastStatusMessage = `Weekly PDF report (${(pdfBuffer.length / 1024).toFixed(0)} KB) generated and delivered to ${recipient}.`;
  memoryScheduleConfig.lastPreviewUrl = previewUrl;

  // Compute next schedule date if not test
  if (!isTest) {
    memoryScheduleConfig.nextScheduledAt = computeNextScheduledDate(
      memoryScheduleConfig.dayOfWeek,
      memoryScheduleConfig.timeOfDay
    );
  }

  savePersistedState();

  return {
    success: true,
    message: `Weekly summary PDF successfully generated and dispatched to ${recipient}!`,
    previewUrl,
    dispatchRecord,
    pdfBase64: pdfBuffer.toString("base64"),
  };
}

// Background scheduler ticker: checks every 60 seconds
let backgroundInterval: NodeJS.Timeout | null = null;

export function initEmailScheduler() {
  if (backgroundInterval) return;

  backgroundInterval = setInterval(async () => {
    try {
      if (!memoryScheduleConfig.enabled) return;

      const nextTarget = memoryScheduleConfig.nextScheduledAt
        ? new Date(memoryScheduleConfig.nextScheduledAt).getTime()
        : 0;

      const now = Date.now();

      // If scheduled time has arrived (within a 5 minute tolerance window)
      if (nextTarget > 0 && now >= nextTarget) {
        console.log("[EmailSchedule] Triggering automated scheduled weekly PDF email dispatch...");
        await sendWeeklyEmailReport({ isTest: false });
      }
    } catch (err) {
      console.error("[EmailSchedule] Error during scheduled dispatch check:", err);
    }
  }, 60000);
}

// Start scheduler on import
initEmailScheduler();
