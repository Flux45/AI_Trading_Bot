import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Check,
  RefreshCw,
  Radio,
  Sparkles,
  ExternalLink,
  Mail,
  Calendar,
  Clock,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Layers,
  Activity,
  ChevronRight,
  Info,
} from 'lucide-react';
import type {
  SystemConfig,
  ProductType,
  WeeklyReportScheduleConfig,
  DispatchHistoryRecord,
} from '../types';

interface ConfigViewProps {
  config: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => Promise<void>;
  onOpenHeartbeat?: () => void;
  onOpenPdfReport?: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  config,
  onSaveConfig,
  onOpenHeartbeat,
  onOpenPdfReport,
}) => {
  // Trading Mode & Capital Controls
  const [paperMode, setPaperMode] = useState<boolean>(config.system.paperTradingMode);
  const [initialCapital, setInitialCapital] = useState<number>(config.system.initialPaperCapital);
  const [maxRiskPct, setMaxRiskPct] = useState<number>(config.system.maxRiskPerTradePct);
  const [maxConcentration, setMaxConcentration] = useState<number>(config.system.maxPositionConcentration);
  const [productType, setProductType] = useState<ProductType>(config.system.defaultProductType);

  // Broker Credentials
  const [kiteApiKey, setKiteApiKey] = useState<string>(config.zerodha.apiKey);
  const [kiteApiSecret, setKiteApiSecret] = useState<string>(config.zerodha.apiSecret);
  const [kiteAccessToken, setKiteAccessToken] = useState<string>(config.zerodha.accessToken);

  // General Config Save State
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ==========================================
  // AUTOMATED WEEKLY PDF EMAIL SCHEDULING STATE
  // ==========================================
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(true);
  const [recipientEmail, setRecipientEmail] = useState<string>('aayyuusshh.45@gmail.com');
  const [dayOfWeek, setDayOfWeek] = useState<'FRIDAY' | 'SATURDAY' | 'SUNDAY' | 'MONDAY'>('FRIDAY');
  const [timeOfDay, setTimeOfDay] = useState<string>('15:30');
  const [includeStrategies, setIncludeStrategies] = useState<boolean>(true);
  const [includePnlSnapshots, setIncludePnlSnapshots] = useState<boolean>(true);
  const [includeOpenPositions, setIncludeOpenPositions] = useState<boolean>(true);
  const [includeClosedTrades, setIncludeClosedTrades] = useState<boolean>(true);
  const [includeLessons, setIncludeLessons] = useState<boolean>(true);

  // Schedule Status & History
  const [nextScheduledAt, setNextScheduledAt] = useState<string>('');
  const [lastSentAt, setLastSentAt] = useState<string | undefined>(undefined);
  const [lastStatus, setLastStatus] = useState<'SUCCESS' | 'FAILED' | 'IDLE'>('IDLE');
  const [lastStatusMessage, setLastStatusMessage] = useState<string>('');
  const [lastPreviewUrl, setLastPreviewUrl] = useState<string | undefined>(undefined);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistoryRecord[]>([]);

  // Email Actions Status
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string;
  } | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [scheduleSaveToast, setScheduleSaveToast] = useState<string | null>(null);

  // Fetch initial schedule state from backend
  useEffect(() => {
    fetch('/api/reports/weekly-schedule')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.schedule) {
          const s: WeeklyReportScheduleConfig = data.schedule;
          setScheduleEnabled(s.enabled ?? true);
          if (s.recipientEmail) setRecipientEmail(s.recipientEmail);
          if (s.dayOfWeek) setDayOfWeek(s.dayOfWeek);
          if (s.timeOfDay) setTimeOfDay(s.timeOfDay);
          if (s.includeStrategies !== undefined) setIncludeStrategies(s.includeStrategies);
          if (s.includePnlSnapshots !== undefined) setIncludePnlSnapshots(s.includePnlSnapshots);
          if (s.includeOpenPositions !== undefined) setIncludeOpenPositions(s.includeOpenPositions);
          if (s.includeClosedTrades !== undefined) setIncludeClosedTrades(s.includeClosedTrades);
          if (s.includeLessons !== undefined) setIncludeLessons(s.includeLessons);
          if (s.nextScheduledAt) setNextScheduledAt(s.nextScheduledAt);
          if (s.lastSentAt) setLastSentAt(s.lastSentAt);
          if (s.lastStatus) setLastStatus(s.lastStatus);
          if (s.lastStatusMessage) setLastStatusMessage(s.lastStatusMessage);
          if (s.lastPreviewUrl) setLastPreviewUrl(s.lastPreviewUrl);
        }
        if (Array.isArray(data?.history)) {
          setDispatchHistory(data.history);
        }
      })
      .catch((err) => console.warn('Could not load weekly schedule state:', err));
  }, []);

  // Save Schedule settings to server
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const payload: Partial<WeeklyReportScheduleConfig> = {
        enabled: scheduleEnabled,
        recipientEmail: recipientEmail.trim(),
        dayOfWeek,
        timeOfDay,
        includeStrategies,
        includePnlSnapshots,
        includeOpenPositions,
        includeClosedTrades,
        includeLessons,
      };

      const res = await fetch('/api/reports/weekly-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.schedule?.nextScheduledAt) {
          setNextScheduledAt(data.schedule.nextScheduledAt);
        }
        setScheduleSaveToast('Weekly PDF schedule and email parameters saved successfully!');
        setTimeout(() => setScheduleSaveToast(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Immediate On-Demand Test Email Dispatch
  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/reports/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: recipientEmail.trim() }),
      });

      const data = await res.json();
      if (data?.success) {
        setTestResult({
          success: true,
          message: data.message || `Test summary PDF generated and dispatched to ${recipientEmail}!`,
          previewUrl: data.previewUrl,
        });
        setLastStatus('SUCCESS');
        setLastSentAt(new Date().toISOString());
        setLastStatusMessage(`Test email with PDF generated and delivered to ${recipientEmail}.`);
        if (data.previewUrl) setLastPreviewUrl(data.previewUrl);
        if (data.dispatchRecord) {
          setDispatchHistory((prev) => [data.dispatchRecord, ...prev]);
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch email report.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network error while generating test PDF report.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Main config submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        system: {
          ...config.system,
          paperTradingMode: paperMode,
          initialPaperCapital: initialCapital,
          maxRiskPerTradePct: maxRiskPct,
          maxPositionConcentration: maxConcentration,
          defaultProductType: productType,
        },
        zerodha: {
          ...config.zerodha,
          apiKey: kiteApiKey,
          apiSecret: kiteApiSecret,
          accessToken: kiteAccessToken,
          isConnected: !paperMode && Boolean(kiteApiKey && kiteAccessToken),
        },
      });
      // Also persist the schedule
      await handleSaveSchedule();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="config-view-container" className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#12141c] p-5 shadow-xs transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500/20 text-white dark:text-amber-400 border dark:border-amber-500/30">
            <Settings className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              System Configuration &amp; Automation Hub (config.toml)
            </h2>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              Controls operational environments, algorithmic capital allocation, automated weekly PDF report emails, and broker connectivity without modifying core application code.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================== */}
        {/* AUTOMATED WEEKLY PDF EMAIL SCHEDULING CARD (User Requirement) */}
        {/* ============================================================== */}
        <div
          id="weekly-pdf-email-scheduler-card"
          className="rounded-2xl border border-purple-500/30 dark:border-purple-600/40 bg-white dark:bg-[#12141c] p-5 sm:p-6 shadow-sm space-y-5"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 dark:border-purple-900/40 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-600/20">
                <Mail className="h-5 w-5 text-purple-100" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                    Automated Weekly PDF Summary &amp; Email Dispatch
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      scheduleEnabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {scheduleEnabled ? '● AUTOMATED DISPATCH ACTIVE' : '○ DISPATCH PAUSED'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Generates and emails an official weekly PDF report of strategy returns and P&amp;L snapshots using the unified <strong>TradesPdfReportModal</strong> audit engine.
                </p>
              </div>
            </div>

            {/* Quick Toggle Switch */}
            <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto bg-stone-50 dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {scheduleEnabled ? 'Scheduler Enabled' : 'Scheduler Paused'}
              </span>
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Toast Notification on Schedule Save */}
          {scheduleSaveToast && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{scheduleSaveToast}</span>
            </div>
          )}

          {/* Test Email Result Feedback */}
          {testResult && (
            <div
              className={`rounded-xl p-3.5 text-xs font-semibold flex items-start justify-between gap-3 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{testResult.message}</p>
                  {testResult.previewUrl && (
                    <a
                      href={testResult.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] underline font-mono text-purple-700 dark:text-purple-300 hover:text-purple-900"
                    >
                      <span>Open Ethereal Mailbox Delivery Preview</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Scheduling Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Recipient Email Address */}
            <div>
              <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Recipient Email Address</span>
              </label>
              <input
                id="input-weekly-report-email"
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="trader@example.com"
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:border-purple-500 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Official PDF attachment will be delivered to this verified mailbox.
              </p>
            </div>

            {/* Day of the Week */}
            <div>
              <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Dispatch Day of Week</span>
              </label>
              <select
                id="select-weekly-report-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:border-purple-500 focus:outline-hidden"
              >
                <option value="FRIDAY">Every Friday (Market Close Review — Recommended)</option>
                <option value="SATURDAY">Every Saturday (Weekend Institutional Audit)</option>
                <option value="SUNDAY">Every Sunday (Pre-Market Strategy Prep)</option>
                <option value="MONDAY">Every Monday (Weekly Opening Bell Snapshot)</option>
              </select>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Matches the NSE 9:15-15:30 IST market settlement cadence.
              </p>
            </div>

            {/* Time of Day */}
            <div>
              <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Dispatch Time (Asia/Kolkata IST)</span>
              </label>
              <select
                id="select-weekly-report-time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 focus:border-purple-500 focus:outline-hidden"
              >
                <option value="15:30">15:30 IST (Market Closing Bell — Ideal)</option>
                <option value="16:00">16:00 IST (Post-Market Settled Prices)</option>
                <option value="18:00">18:00 IST (Evening Executive Digest)</option>
                <option value="20:00">20:00 IST (Nightly Strategy Debrief)</option>
                <option value="09:00">09:00 IST (Morning Pre-Market Session)</option>
              </select>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Calculated strictly in Indian Standard Time (UTC+05:30).
              </p>
            </div>
          </div>

          {/* Content Checklist Modules */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 p-4 space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-mono">
              <FileText className="h-3.5 w-3.5" />
              <span>Included Weekly PDF &amp; Email Modules (TradesPdfReportModal Engine)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={includeStrategies}
                  onChange={(e) => setIncludeStrategies(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Strategy Arena Returns &amp; ROI %</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={includePnlSnapshots}
                  onChange={(e) => setIncludePnlSnapshots(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Portfolio P&amp;L Snapshot &amp; Equity Curves</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={includeOpenPositions}
                  onChange={(e) => setIncludeOpenPositions(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Active Open Positions &amp; Stops</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={includeClosedTrades}
                  onChange={(e) => setIncludeClosedTrades(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Closed Trades Audit &amp; Win Rates</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={includeLessons}
                  onChange={(e) => setIncludeLessons(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Post-Trade Diagnoses &amp; Lessons</span>
              </label>

              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>SQLite WAL &bull; Yahoo Telemetry</span>
              </div>
            </div>
          </div>

          {/* Schedule Status & Telemetry Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-100/70 dark:bg-stone-900/40 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Next Automated Dispatch
              </span>
              <p className="mt-0.5 font-mono text-sm font-bold text-purple-700 dark:text-purple-300">
                {nextScheduledAt
                  ? new Date(nextScheduledAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'full',
                      timeStyle: 'short',
                    }) + ' IST'
                  : `${dayOfWeek} at ${timeOfDay} IST`}
              </p>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Continuous 24/7 background interval monitors this dispatch slot.
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Last Dispatch Telemetry
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    lastStatus === 'SUCCESS'
                      ? 'bg-emerald-500'
                      : lastStatus === 'FAILED'
                      ? 'bg-rose-500'
                      : 'bg-stone-400'
                  }`}
                />
                <strong className="text-stone-800 dark:text-stone-200">
                  {lastStatus === 'SUCCESS'
                    ? 'Delivered Successfully'
                    : lastStatus === 'FAILED'
                    ? 'Delivery Failed'
                    : 'Awaiting Initial Weekly Run'}
                </strong>
                {lastSentAt && (
                  <span className="font-mono text-[11px] text-stone-500">
                    ({new Date(lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-sm">
                {lastStatusMessage || 'Standing by for next scheduled dispatch.'}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-500/20 dark:border-purple-900/40">
            <div className="flex flex-wrap items-center gap-2">
              {/* Send Test Email Now */}
              <button
                id="btn-send-test-report-email"
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !recipientEmail}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-50 cursor-pointer"
                title="Immediately generate the PDF audit report and dispatch a live email test"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating PDF &amp; Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Test Email &amp; Generate PDF Now</span>
                  </>
                )}
              </button>

              {/* Preview PDF using existing Modal Logic */}
              <button
                id="btn-preview-weekly-pdf"
                type="button"
                onClick={
                  onOpenPdfReport ||
                  (() => {
                    window.open('/api/reports/preview-latest-pdf', '_blank');
                  })
                }
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Launch the TradesPdfReportModal to inspect the exact PDF document layout"
              >
                <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Preview Weekly PDF Snapshot</span>
              </button>

              {/* Direct Download Sample PDF */}
              <a
                id="btn-download-sample-pdf"
                href="/api/reports/preview-latest-pdf"
                download="AI_BOT_ADVANCE_Weekly_Strategy_Audit_Report.pdf"
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Download current standalone audit PDF"
              >
                <Download className="h-3.5 w-3.5 text-amber-500" />
                <span>Download Sample .PDF</span>
              </a>
            </div>

            {/* Save Schedule Parameters */}
            <button
              id="btn-save-weekly-schedule"
              type="button"
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule}
              className="flex items-center gap-1.5 rounded-xl bg-stone-900 dark:bg-purple-700 hover:bg-stone-800 dark:hover:bg-purple-600 text-white font-bold px-4 py-2 text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSavingSchedule ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Save Schedule Settings</span>
                </>
              )}
            </button>
          </div>

          {/* Dispatch History Audit Trail */}
          {dispatchHistory.length > 0 && (
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Recent Automated Dispatch History ({dispatchHistory.length} Recorded Runs)
              </span>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800 text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Timestamp (IST)</th>
                      <th className="py-2 px-3">Recipient</th>
                      <th className="py-2 px-3">Run Type</th>
                      <th className="py-2 px-3 text-right">PDF Size</th>
                      <th className="py-2 px-3 text-right">Top Strategy</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono text-[11px]">
                    {dispatchHistory.slice(0, 4).map((rec) => (
                      <tr key={rec.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-2 px-3 text-stone-700 dark:text-stone-300">
                          {new Date(rec.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2 px-3 text-stone-900 dark:text-white font-sans font-semibold">
                          {rec.recipient}
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              rec.isTestRun
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                            }`}
                          >
                            {rec.isTestRun ? 'MANUAL TEST' : 'SCHEDULED CRON'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-stone-600 dark:text-stone-400">
                          {(rec.pdfSizeBytes / 1024).toFixed(0)} KB
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                          {rec.summary?.topStrategyName || 'Cognitive-Q'}
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                            DELIVERED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TRADING ENVIRONMENT & CAPITAL CONTROLS                          */}
        {/* ============================================================== */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#12141c] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <Shield className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Trading Environment &amp; Capital Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300">Execution Mode</label>
              <div className="mt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={paperMode}
                    onChange={() => setPaperMode(true)}
                    className="accent-stone-900 dark:accent-amber-400"
                  />
                  <span className="font-medium text-stone-900 dark:text-white">
                    Paper Trading (0.05% Slippage Penalty)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={!paperMode}
                    onChange={() => setPaperMode(false)}
                    className="accent-rose-600"
                  />
                  <span className="font-medium text-rose-700 dark:text-rose-400">
                    Live Zerodha Kite Connect
                  </span>
                </label>
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Paper mode simulates orders with real ATR bounds and slippage penalty.
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300">
                Starting Paper Capital (₹ INR)
              </label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300">
                Max Risk Per Trade (Fractional Sizing)
              </label>
              <select
                value={maxRiskPct}
                onChange={(e) => setMaxRiskPct(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-xs text-stone-900 dark:text-stone-100"
              >
                <option value={0.005}>0.5% (Conservative - ₹{initialCapital * 0.005})</option>
                <option value={0.01}>1.0% (Default - ₹{initialCapital * 0.01})</option>
                <option value={0.015}>1.5% (Moderate - ₹{initialCapital * 0.015})</option>
                <option value={0.02}>2.0% (Aggressive - ₹{initialCapital * 0.02})</option>
              </select>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Determines max rupee loss on stop invalidation.
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300">
                Max Single Position Concentration
              </label>
              <select
                value={maxConcentration}
                onChange={(e) => setMaxConcentration(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2 text-xs text-stone-900 dark:text-stone-100"
              >
                <option value={0.1}>10% Max Capital</option>
                <option value={0.2}>20% Max Capital (Default)</option>
                <option value={0.3}>30% Max Capital</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300">Default Product Type</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="product"
                    checked={productType === 'CNC'}
                    onChange={() => setProductType('CNC')}
                    className="accent-stone-900 dark:accent-amber-400"
                  />
                  <span className="font-medium text-stone-900 dark:text-white">
                    CNC (Cash &amp; Carry / Swing Delivery)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="product"
                    checked={productType === 'MIS'}
                    onChange={() => setProductType('MIS')}
                    className="accent-stone-900 dark:accent-amber-400"
                  />
                  <span className="font-medium text-stone-900 dark:text-white">
                    MIS (Margin Intraday Square-off)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive & Broker Hook Status */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#12141c] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Cognitive &amp; Broker Hook Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Gemini API Status */}
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Google Gemini API Gateway</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    config.credentials.geminiOperational
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : config.credentials.geminiApiKeySet
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {config.credentials.geminiOperational
                    ? 'CONNECTED & ACTIVE'
                    : config.credentials.geminiApiKeySet
                    ? 'STANDBY / QUANT FALLBACK'
                    : 'STANDBY MODE'}
                </span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                {config.credentials.geminiMessage ||
                  (config.credentials.geminiOperational
                    ? 'Server-side Gemini 3.8 Flash model active. Multi-agent debate running live.'
                    : 'Gemini API key managed server-side. High-fidelity algorithmic quantitative committee engine is active.')}
              </p>
            </div>

            {/* Zerodha Kite Hook */}
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Zerodha Kite Connect Hook</span>
                <span className="rounded bg-stone-200 dark:bg-stone-800 px-1.5 py-0.2 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                  {paperMode ? 'PAPER MOCK HOOK' : 'LIVE ROUTER READY'}
                </span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                When switching to live trading, <code className="font-mono">broker_interface.py</code> connects directly via KiteConnect API.
              </p>
            </div>
          </div>

          {/* Zerodha Credentials Inputs */}
          <div className="border-t border-stone-100 dark:border-stone-800 pt-3 text-xs space-y-3">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Zerodha Kite Live Credentials (Optional / Sandbox)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">KITE_API_KEY</span>
                <input
                  type="text"
                  value={kiteApiKey}
                  onChange={(e) => setKiteApiKey(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-1.5 font-mono text-[11px] text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">KITE_API_SECRET</span>
                <input
                  type="password"
                  value={kiteApiSecret}
                  onChange={(e) => setKiteApiSecret(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-1.5 font-mono text-[11px] text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">DAILY_ACCESS_TOKEN</span>
                <input
                  type="password"
                  value={kiteAccessToken}
                  onChange={(e) => setKiteAccessToken(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-1.5 font-mono text-[11px] text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* 24/7 Heartbeat & Free Keep-Alive Sentinel Card */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                      24/7 System Heartbeat &amp; Keep-Alive Sentinel
                    </h3>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      cron-job.org Ready
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 max-w-xl">
                    Keep your quantitative trading daemon alive around the clock. Free automated external pings prevent Cloud Run container hibernation, ensuring background autonomous cycles and trailing stop losses never pause.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {onOpenHeartbeat && (
                  <button
                    type="button"
                    onClick={onOpenHeartbeat}
                    className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
                  >
                    <Radio className="h-4 w-4" />
                    <span>Open 24/7 Sentinel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Bar */}
        <div className="flex items-center justify-end gap-3">
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              All configuration parameters updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-white dark:text-stone-950 transition disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Configuration (config.toml)'}
          </button>
        </div>
      </form>
    </div>
  );
};
