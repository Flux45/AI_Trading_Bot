import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Flame,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  BrainCircuit,
  Award,
  Layers,
  AlertTriangle,
  Zap,
  Info,
  Calendar,
} from 'lucide-react';

interface CatchupTradeItem {
  order_id: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  shares: number;
  entry_price: number;
  exit_price?: number;
  current_price?: number;
  pnlRupees: number;
  pnlPct: number;
  strategyName: string;
  status: 'OPEN' | 'CLOSED_PROFIT' | 'CLOSED_LOSS' | 'CLOSED_BREAKEVEN';
  time: string;
  reason: string;
}

interface AnalystCatchupBriefData {
  id: string;
  generatedAt: string;
  sinceTimestamp: string;
  elapsedFormatted: string;
  timeframeLabel: string;
  welcomeHeadline: string;
  executiveSummary: string;
  analystActionsCompleted: string[];
  marketAnalysisSnapshot: {
    niftyStructure: string;
    vixRegime: string;
    leadingSectors: string[];
    sentimentScore: number;
    catalystsMonitored: string[];
  };
  tradesWindowSummary: {
    totalTradesCount: number;
    closedTradesCount: number;
    openTradesCount: number;
    netPnlRupees: number;
    winRatePct: number;
    tradesList: CatchupTradeItem[];
  };
  immediateDirectives: string[];
  generatedVia: string;
}

interface AnalystCatchupViewProps {
  onSelectStrategy?: (strategyIdOrName: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onAskAnalyst?: (question: string) => void;
}

export const AnalystCatchupView: React.FC<AnalystCatchupViewProps> = ({
  onSelectStrategy,
  onNavigateToTab,
  onAskAnalyst,
}) => {
  const [brief, setBrief] = useState<AnalystCatchupBriefData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'TODAY' | 'PAST_2_HOURS' | 'PAST_24_HOURS' | 'LAST_VISIT'>('TODAY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBrief = async (fresh = false, selectedTf = timeframe) => {
    setIsLoading(true);
    try {
      let sinceTs: string | undefined;
      const lastSeen = localStorage.getItem('last_user_visit_timestamp');

      if (selectedTf === 'LAST_VISIT' && lastSeen) {
        sinceTs = lastSeen;
      }

      const res = await fetch('/api/analyst/catchup-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sinceTimestamp: sinceTs,
          timeframe: selectedTf === 'LAST_VISIT' ? undefined : selectedTf,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate catch-up brief');
      const data = await res.json();
      if (data.success && data.brief) {
        setBrief(data.brief);
      }
    } catch (err: any) {
      console.error('Error fetching catchup brief:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief(false, timeframe);
    // Update last visit timestamp when leaving or mounting
    localStorage.setItem('last_user_visit_timestamp', new Date().toISOString());
  }, [timeframe]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const trades = brief?.tradesWindowSummary.tradesList || [];
  const isNetProfit = (brief?.tradesWindowSummary.netPnlRupees || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-purple-950 border border-purple-500/50 px-4 py-3 text-sm text-purple-100 shadow-2xl animate-in fade-in">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* WELCOME BACK HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-stone-900 via-[#181326] to-[#0f0b18] p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-300 font-mono">
                Executive Catch-Up &amp; Daily Briefing
              </span>
              <span className="rounded-full bg-stone-800/80 px-2.5 py-0.5 text-[10px] font-mono text-stone-300 border border-stone-700">
                Window: {brief?.timeframeLabel || 'Today'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              {brief?.welcomeHeadline || 'While You Were Away: Analyst Activity & Trade Debrief'}
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Whenever you step away or return to the platform, the Analyst continuously tracks market structure, audits volatility, and manages your strategy positions so you never miss a beat.
            </p>
          </div>

          {/* Timeframe Selectors & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchBrief(true, timeframe);
                showToast('Refreshed Analyst session catch-up brief.');
              }}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Synthesizing...' : 'Re-Run Catch-Up Brief'}</span>
            </button>
          </div>
        </div>

        {/* TIMEFRAME FILTER BAR */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-stone-400 text-[11px] font-semibold">Select Catch-Up Window:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTimeframe('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'TODAY'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Today's Full Session
            </button>
            <button
              onClick={() => setTimeframe('LAST_VISIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'LAST_VISIT'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Since Last Away ({brief?.elapsedFormatted || 'Recent'})
            </button>
            <button
              onClick={() => setTimeframe('PAST_2_HOURS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'PAST_2_HOURS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Past 2 Hours
            </button>
            <button
              onClick={() => setTimeframe('PAST_24_HOURS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === 'PAST_24_HOURS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Past 24 Hours
            </button>
          </div>
        </div>
      </div>

      {/* TOP KPI OVERVIEW METRICS */}
      {brief && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Net PnL in Window */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Performance in Window</span>
              {isNetProfit ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isNetProfit ? '+' : ''}₹{brief.tradesWindowSummary.netPnlRupees.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Win Rate: {brief.tradesWindowSummary.winRatePct}% on closed trades
            </p>
          </div>

          {/* Trades Monitored */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Trades Managed in Period</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white">
                {brief.tradesWindowSummary.totalTradesCount}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                ({brief.tradesWindowSummary.openTradesCount} Active Open)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Closed in window: {brief.tradesWindowSummary.closedTradesCount}
            </p>
          </div>

          {/* Market Structure Shift */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Nifty Regime</span>
              <Compass className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white line-clamp-1">
                {brief.marketAnalysisSnapshot.niftyStructure}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              VIX: {brief.marketAnalysisSnapshot.vixRegime.split(' ')[0] || 'Normal'}
            </p>
          </div>

          {/* Analyst Status */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Analyst Autonomy</span>
              <BrainCircuit className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Active Vigilance
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              {brief.generatedVia === 'GEMINI_3_8_FLASH' ? 'Gemini 3.8 Flash' : 'Quant Intelligence'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: EXECUTIVE DIGEST & WHAT ANALYST DID WHILE AWAY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Executive Digest */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Executive Situation Report
            </h3>
            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
              Analyst Briefing
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
            {brief?.executiveSummary}
          </p>

          {/* Quick ask button */}
          {onAskAnalyst && (
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Have specific questions about this interval?</span>
              <button
                onClick={() => onAskAnalyst('Give me a detailed explanation of the trades taken while I was away')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500 flex items-center gap-1 transition"
              >
                <span>Ask Analyst</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* What Analyst Did While You Were Away */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              What the Analyst Executed While You Were Away
            </h3>
            <span className="text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-bold">
              Autonomous
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {(brief?.analystActionsCompleted || []).map((action, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-3 text-xs text-stone-800 dark:text-stone-200 flex items-start gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: TRADES TAKEN DURING THIS WINDOW (CLICKABLE INTO STRATEGY INSPECTOR) */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Trades Taken &amp; Managed During This Window ({trades.length})
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Live trades are enclosed in <strong className="text-blue-600">Blue boundary boxes</strong> and ended trades are enclosed in <strong className="text-yellow-700">boxes with Yellow lines</strong>. Click any strategy to inspect.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 rounded-md border-2 border-blue-500 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
              🔵 Blue Box = LIVE TRADE
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border-2 border-yellow-400 bg-yellow-50 px-2 py-0.5 text-[10px] font-black text-yellow-900">
              🟡 Yellow Line Box = ENDED TRADE
            </span>
            <span className="text-xs font-mono text-stone-400">
              Net Window P&amp;L:{' '}
              <strong className={isNetProfit ? 'text-emerald-500' : 'text-rose-500'}>
                {isNetProfit ? '+' : ''}₹{brief?.tradesWindowSummary.netPnlRupees.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>
        </div>

        {trades.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center text-xs text-stone-500">
            No trades were entered or exited during this specific window. Open positions remain defended under trailing stops.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trades.map((t, idx) => {
              const isOpen = t.status === 'OPEN';
              const isProfit = t.pnlRupees >= 0;

              return (
                <div
                  key={t.order_id || idx}
                  className={`rounded-xl p-3.5 transition ${
                    isOpen
                      ? 'border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/15 shadow-xs'
                      : 'border-2 border-yellow-400 bg-yellow-50/35 dark:bg-yellow-950/20 ring-2 ring-yellow-400/20 shadow-xs'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 pb-2 mb-2.5 ${
                      isOpen
                        ? 'border-b-2 border-blue-300 dark:border-blue-800'
                        : 'border-b-2 border-dashed border-yellow-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                          LIVE TRADE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-stone-950 border border-yellow-500">
                          ENDED TRADE
                        </span>
                      )}
                      <span className="font-mono text-sm font-black text-stone-900 dark:text-white">
                        {t.ticker}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                          t.action === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {t.action} ({t.shares} sh)
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`text-xs font-black ${
                          isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}₹{t.pnlRupees.toLocaleString('en-IN')} ({isProfit ? '+' : ''}{t.pnlPct}%)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-3 gap-2 font-mono text-[11px] rounded-lg p-2 mb-2 ${
                      isOpen
                        ? 'bg-white/80 dark:bg-stone-900/70 border border-blue-200 dark:border-blue-900'
                        : 'bg-white/85 dark:bg-stone-900/70 border-y-2 border-yellow-300 dark:border-yellow-700/60'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Entry</span>
                      <strong className="text-stone-800 dark:text-stone-200">₹{t.entry_price}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">
                        {isOpen ? 'Live LTP' : 'Exit Price'}
                      </span>
                      <strong className={isOpen ? 'text-blue-700 dark:text-blue-300' : 'text-stone-900 dark:text-white'}>
                        ₹{isOpen ? t.current_price : t.exit_price}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Outcome</span>
                      <strong className={isOpen ? 'text-blue-600' : isProfit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isOpen ? 'ACTIVE' : isProfit ? 'TARGET' : 'STOPPED'}
                      </strong>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between gap-2 pt-1 text-[11px] ${
                      !isOpen ? 'border-t border-dashed border-yellow-400' : ''
                    }`}
                  >
                    <button
                      onClick={() => onSelectStrategy && onSelectStrategy(t.strategyName)}
                      className="text-left group flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold hover:underline truncate max-w-[200px]"
                      title={`Click to inspect all trades and return for ${t.strategyName}`}
                    >
                      <span className="truncate">{t.strategyName}</span>
                      <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 shrink-0" />
                    </button>
                    <span className="text-stone-500 dark:text-stone-400 truncate max-w-[220px]">
                      {t.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: MARKET ANALYSIS SNAPSHOT & IMMEDIATE DIRECTIVES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Market Analysis Snapshot */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-500" />
              Market Analysis &amp; News Catalysts Monitored
            </h3>
            <span className="text-[11px] font-mono text-stone-400">NSE Index Depth</span>
          </div>

          <div className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
              <strong className="text-stone-900 dark:text-white block font-semibold mb-0.5">Nifty 50 Structure:</strong>
              <span>{brief?.marketAnalysisSnapshot.niftyStructure}</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
              <strong className="text-stone-900 dark:text-white block font-semibold mb-0.5">Leading Outperforming Sectors:</strong>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {(brief?.marketAnalysisSnapshot.leadingSectors || []).map((sec, i) => (
                  <span
                    key={i}
                    className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] px-2 py-0.5 font-bold"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            {brief?.marketAnalysisSnapshot.catalystsMonitored && brief.marketAnalysisSnapshot.catalystsMonitored.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
                <strong className="text-stone-900 dark:text-white block font-semibold mb-1">Key Catalysts Monitored:</strong>
                <div className="space-y-1">
                  {brief.marketAnalysisSnapshot.catalystsMonitored.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                      <span className="text-purple-500 font-mono">&bull;</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Immediate Directives for Returning User */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-stone-900 to-stone-950 p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
              Immediate Action Directives for You Right Now
            </h3>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            Rule of the world's best trader: Upon returning, first secure open risk, then survey freshly validated edges.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            {(brief?.immediateDirectives || []).map((dir, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-black/40 border border-amber-500/20 p-3 flex items-start gap-2.5 font-mono"
              >
                <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                <span className="text-stone-200 leading-relaxed">{dir}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('portfolio')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition"
            >
              <span>Inspect Portfolio Live Status</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
