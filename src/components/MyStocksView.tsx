import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RotateCcw,
  Zap,
  Info,
  Scale,
  ShieldCheck,
  Percent,
  Check,
  Send,
  Loader2,
  BarChart3,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import type { UserHolding, MyStocksPortfolioSummary, RebalanceRecommendation } from '../types';
import { INITIAL_USER_HOLDINGS, INITIAL_MY_STOCKS_SUMMARY } from '../data/myStocksData';

interface MyStocksViewProps {
  onExecuteManualTrade?: (ticker: string, action: 'BUY' | 'SELL', shares: number) => void;
}

export const MyStocksView: React.FC<MyStocksViewProps> = ({ onExecuteManualTrade }) => {
  const [holdings, setHoldings] = useState<UserHolding[]>(INITIAL_USER_HOLDINGS);
  const [summary, setSummary] = useState<MyStocksPortfolioSummary>(INITIAL_MY_STOCKS_SUMMARY);
  const [recommendations, setRecommendations] = useState<RebalanceRecommendation[]>(INITIAL_MY_STOCKS_SUMMARY.recommendations);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [executingRecId, setExecutingRecId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'ACCUMULATE' | 'CUT_LOSS'>('ALL');
  const [selectedHolding, setSelectedHolding] = useState<UserHolding | null>(null);

  // AI BOT ADVANCE live interactive Q&A state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Fetch current holdings & analysis from backend
  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/my-stocks');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHoldings(data.holdings);
          setSummary(data.summary);
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from backend, using local state', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  // Execute single recommendation
  const handleExecuteSingle = async (rec: RebalanceRecommendation) => {
    setExecutingRecId(rec.id);
    try {
      const res = await fetch('/api/my-stocks/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: rec.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHoldings(data.holdings);
          setSummary(data.summary);
          setRecommendations(data.recommendations);
          if (onExecuteManualTrade) {
            const isBuy = rec.sharesDelta > 0;
            onExecuteManualTrade(rec.symbol, isBuy ? 'BUY' : 'SELL', Math.abs(rec.sharesDelta));
          }
        }
      }
    } catch (err) {
      console.error('Failed to execute rebalance recommendation', err);
    } finally {
      setExecutingRecId(null);
    }
  };

  // Execute ALL recommendations in single click
  const handleExecuteAll = async () => {
    setIsExecutingAll(true);
    try {
      const res = await fetch('/api/my-stocks/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeAll: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHoldings(data.holdings);
          setSummary(data.summary);
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.error('Failed to execute all rebalance recommendations', err);
    } finally {
      setIsExecutingAll(false);
    }
  };

  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  // Reset to original statement (Roll Back)
  const handleResetStatement = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/my-stocks/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHoldings(data.holdings);
          setSummary(data.summary);
          setRecommendations(data.recommendations);
          setNotification({
            message: 'Portfolio successfully rolled back to original Zerodha statement (0 changes executed).',
            type: 'success',
          });
        }
      } else {
        // Fallback to local pristine state
        setHoldings(INITIAL_USER_HOLDINGS);
        setSummary(INITIAL_MY_STOCKS_SUMMARY);
        setRecommendations(INITIAL_MY_STOCKS_SUMMARY.recommendations);
        setNotification({
          message: 'Portfolio rolled back to original Zerodha statement holdings.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to reset statement', err);
      setHoldings(INITIAL_USER_HOLDINGS);
      setSummary(INITIAL_MY_STOCKS_SUMMARY);
      setRecommendations(INITIAL_MY_STOCKS_SUMMARY.recommendations);
      setNotification({
        message: 'Portfolio rolled back to original Zerodha statement holdings.',
        type: 'success',
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Generate live AI BOT ADVANCE audit via Gemini
  const handleGenerateAiAudit = async (query?: string) => {
    setIsGeneratingAiReport(true);
    setShowAiModal(true);
    try {
      const res = await fetch('/api/my-stocks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuestion: query || customAiQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          setAiReport(data.analysis);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI report', err);
      setAiReport('Failed to generate live audit. Please retry.');
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  // Filtered holdings list
  const filteredHoldings = holdings.filter((h) => {
    const matchesSearch =
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.isin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = sectorFilter === 'ALL' || h.sector === sectorFilter;

    let matchesVerdict = true;
    if (verdictFilter === 'ACTION_REQUIRED') {
      matchesVerdict = h.aiVerdict === 'EXIT_CUT_LOSS' || h.aiVerdict === 'TRIM_REDUCE' || h.aiVerdict === 'ACCUMULATE' || h.aiVerdict === 'BOOK_PROFIT';
    } else if (verdictFilter === 'ACCUMULATE') {
      matchesVerdict = h.aiVerdict === 'ACCUMULATE';
    } else if (verdictFilter === 'CUT_LOSS') {
      matchesVerdict = h.aiVerdict === 'EXIT_CUT_LOSS';
    }

    return matchesSearch && matchesSector && matchesVerdict;
  });

  const uniqueSectors = Array.from(new Set(holdings.map((h) => h.sector)));
  const pendingRecsCount = recommendations.filter((r) => r.status === 'PENDING').length;
  const executedRecsCount = recommendations.filter((r) => r.status === 'EXECUTED').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">My Stocks — Zerodha Statement</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI BOT ADVANCE AUDIT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statement as on <strong className="text-slate-200">{summary.statementDate}</strong> &bull; Broker:{' '}
                  <strong className="text-slate-200">{summary.broker}</strong> &bull; Client ID: Verified Statement PDF
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleGenerateAiAudit()}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Ask AI BOT Live Audit
            </button>

            {pendingRecsCount > 0 ? (
              <button
                onClick={handleExecuteAll}
                disabled={isExecutingAll}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {isExecutingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Execute All Changes ({pendingRecsCount} Actions)
              </button>
            ) : null}

            {executedRecsCount > 0 ? (
              <button
                onClick={handleResetStatement}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Roll Back to Original Statement
              </button>
            ) : (
              <button
                onClick={handleResetStatement}
                disabled={isLoading}
                title="Reload original Zerodha statement"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* State Feedback Banner */}
        {notification && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {executedRecsCount > 0 && !notification && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Simulated Rebalance Active:</strong> {executedRecsCount} of {recommendations.length} recommended changes have been executed in this view.
              </span>
            </div>
            <button
              onClick={handleResetStatement}
              disabled={isLoading}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Roll Back to Original Statement
            </button>
          </div>
        )}

        {executedRecsCount === 0 && !notification && (
          <div className="mt-4 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Original Statement View:</strong> Showing your verified unadjusted Zerodha statement (0 changes executed).
              </span>
            </div>
            <span className="text-[11px] font-mono text-indigo-300">8 Optimization Changes Ready</span>
          </div>
        )}

        {/* Quick Executive Health Bar */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Invested Capital</span>
            <span className="text-base font-bold text-slate-100 mt-0.5 block">
              ₹{summary.investedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Current Portfolio Value</span>
            <span className="text-base font-bold text-slate-100 mt-0.5 block">
              ₹{summary.presentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Unrealized P&L</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-base font-bold ${
                  summary.totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.totalUnrealizedPnl >= 0 ? '+' : ''}₹{summary.totalUnrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  summary.totalUnrealizedPnlPct >= 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {summary.totalUnrealizedPnlPct >= 0 ? '+' : ''}
                {summary.totalUnrealizedPnlPct}%
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Health Score</span>
              <span className="text-xs font-bold text-amber-400">{summary.portfolioHealthScore}/100</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.portfolioHealthScore >= 80
                    ? 'bg-emerald-500'
                    : summary.portfolioHealthScore >= 65
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${summary.portfolioHealthScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Target post-rebalance: 89/100</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Capital to Harvest</span>
            <span className="text-base font-bold text-amber-300 mt-0.5 block">
              ₹{summary.capitalToBeHarvested.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-400">Liquidate deadweight</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Projected Alpha Gain</span>
            <span className="text-base font-bold text-emerald-300 mt-0.5 block">
              {summary.projectedAlphaImprovement}
            </span>
            <span className="text-[10px] text-slate-400">Beta: {summary.currentBeta} &rarr; 0.94</span>
          </div>
        </div>
      </div>

      {/* AI BOT ADVANCE Strategic Diagnosis Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <Flame className="w-5 h-5" />
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
                AI BOT ADVANCE Executive Diagnosis: The &quot;Sprinkler Fallacy&quot;
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Required on 8 Holdings
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {summary.overallDiagnosis}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-rose-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Immediate Bleeders Dragging Capital Down (-₹5,373 Total Loss):
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-rose-400">IRCTC</strong> (13 sh @ ₹695.84 &bull; CMP ₹462.90)
                    </span>
                    <span className="font-bold text-rose-400">-₹3,028.20 (-33.5%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-rose-400">IRFC</strong> (31 sh @ ₹117.97 &bull; CMP ₹81.09)
                    </span>
                    <span className="font-bold text-rose-400">-₹1,143.14 (-31.3%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-rose-400">CENTRALBK</strong> (88 sh @ ₹41.66 &bull; CMP ₹30.75)
                    </span>
                    <span className="font-bold text-rose-400">-₹960.26 (-26.2%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-xs mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Top Multi-Baggers &amp; High-Alpha Compounders (+₹5,115 Total Gain):
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-emerald-400">JIOFIN</strong> (+153.1%) &amp; <strong className="text-emerald-400">IDEA</strong> (+109.9%)
                    </span>
                    <span className="font-bold text-emerald-400">Massive Winners, Undersized</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-emerald-400">RELIANCE</strong> (+35.9%) &amp; <strong className="text-emerald-400">SBIN</strong> (+31.2%)
                    </span>
                    <span className="font-bold text-emerald-400">+₹2,514 Profit &bull; Tier-1 Core</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-indigo-300">VBL</strong> (-2.4% dip on 30% ROCE powerhouse)
                    </span>
                    <span className="font-bold text-indigo-300">Prime Accumulation Target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Changes Matrix by AI BOT ADVANCE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              Recommended Changes to be Done — Algorithmic Rebalance Plan
            </h2>
            <p className="text-xs text-slate-400">
              Prioritized by risk-adjusted mathematical edge. Executing reclaims ₹24,658 in liquidity and concentrates into high-ROE winners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Progress: <strong className="text-emerald-400">{executedRecsCount}</strong> / {recommendations.length} Executed
            </span>
            {executedRecsCount > 0 && (
              <button
                onClick={handleResetStatement}
                disabled={isLoading}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Roll Back All
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {recommendations.map((rec) => {
            const isExecuted = rec.status === 'EXECUTED';
            const isExit = rec.actionType === 'EXIT_CUT_LOSS';
            const isTrim = rec.actionType === 'TRIM_CONCENTRATION';
            const isAccumulate = rec.actionType === 'ACCUMULATE_WINNER';
            const isBook = rec.actionType === 'BOOK_PARTIAL_PROFIT';

            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  isExecuted
                    ? 'bg-slate-900/60 border-slate-800 opacity-75'
                    : isExit
                    ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/20'
                    : isTrim
                    ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-950/20'
                    : isAccumulate
                    ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-500/70 shadow-lg shadow-indigo-950/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      #{rec.priority} &bull; {rec.symbol}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        isExit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isTrim
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isAccumulate
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {isExit
                        ? 'CUT LOSS / EXIT'
                        : isTrim
                        ? 'TRIM EXTREME WEIGHT'
                        : isAccumulate
                        ? 'STRONG ACCUMULATE'
                        : 'BOOK 50% PROFIT'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">{rec.title}</h3>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{rec.reasoning}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Position Delta:</span>
                      <span className="font-semibold text-slate-200">
                        {rec.currentShares} &rarr; {rec.targetShares} shares ({rec.sharesDelta > 0 ? `+${rec.sharesDelta}` : rec.sharesDelta})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Capital Impact:</span>
                      <span
                        className={`font-bold ${
                          rec.approxCapitalImpact > 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {rec.approxCapitalImpact > 0
                          ? `Free ₹${rec.approxCapitalImpact.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                          : `Deploy ₹${Math.abs(rec.approxCapitalImpact).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  {isExecuted ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Executed
                      </div>
                      <button
                        onClick={handleResetStatement}
                        disabled={isLoading}
                        title="Roll Back to Original Statement"
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" /> Undo
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExecuteSingle(rec)}
                      disabled={executingRecId === rec.id}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        isExit
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : isTrim
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : isAccumulate
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {executingRecId === rec.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      Execute Recommendation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings Filter & Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search stock, sector, ISIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sectors ({holdings.length})</option>
              {uniqueSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setVerdictFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  verdictFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerdictFilter('ACTION_REQUIRED')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  verdictFilter === 'ACTION_REQUIRED'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Action Needed
              </button>
              <button
                onClick={() => setVerdictFilter('ACCUMULATE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  verdictFilter === 'ACCUMULATE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Accumulate
              </button>
              <button
                onClick={() => setVerdictFilter('CUT_LOSS')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  verdictFilter === 'CUT_LOSS'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cut Loss
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-200">{filteredHoldings.length}</strong> of {holdings.length} holdings
          </div>
        </div>

        {/* Holdings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">Symbol / ISIN</th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Avg Price</th>
                <th className="py-3 px-3 text-right">CMP</th>
                <th className="py-3 px-3 text-right">Current Value</th>
                <th className="py-3 px-3 text-right">Unrealized P&amp;L</th>
                <th className="py-3 px-4 text-center">AI BOT Verdict</th>
                <th className="py-3 px-4">Recommended Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredHoldings.map((h) => {
                const isLoss = h.unrealizedPnl < 0;
                const isProfit = h.unrealizedPnl > 0;
                const isExit = h.aiVerdict === 'EXIT_CUT_LOSS';
                const isAccumulate = h.aiVerdict === 'ACCUMULATE';
                const isTrim = h.aiVerdict === 'TRIM_REDUCE';
                const isBook = h.aiVerdict === 'BOOK_PROFIT';

                return (
                  <tr
                    key={h.symbol}
                    onClick={() => setSelectedHolding(h)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {h.symbol}
                        {h.quantity === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-700 text-slate-300 font-sans">
                            LIQUIDATED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans tracking-tight">{h.isin}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {h.sector}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-200">
                      {h.quantity}
                      {h.discrepantQuantity > 0 && (
                        <span className="text-[10px] text-amber-400 block" title="Discrepant quantity in statement">
                          ({h.discrepantQuantity} disc)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300">
                      ₹{h.averagePrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-100">
                      ₹{h.previousClosingPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div
                        className={`font-bold ${
                          isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}₹{h.unrealizedPnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isProfit ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-slate-500'
                        }`}
                      >
                        {h.unrealizedPnlPct >= 0 ? '+' : ''}
                        {h.unrealizedPnlPct}%
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                          isExit
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isAccumulate
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isTrim
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isBook
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {h.aiVerdict.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="text-[11px] text-slate-200 line-clamp-1">{h.recommendedAction}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-indigo-400 font-semibold">
                          Target: ₹{h.targetPrice.toFixed(0)} &bull; SL: ₹{h.stopLoss.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">R:R {h.riskReward}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holding Deep Dive Drawer / Modal */}
      {selectedHolding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedHolding.symbol}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedHolding.sector}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedHolding.aiVerdict === 'EXIT_CUT_LOSS'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : selectedHolding.aiVerdict === 'ACCUMULATE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    {selectedHolding.aiVerdict.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedHolding.isin}</p>
              </div>

              <button
                onClick={() => setSelectedHolding(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block">Holding / Avg Price</span>
                <span className="text-sm font-bold text-slate-100 mt-0.5 block">
                  {selectedHolding.quantity} shares @ ₹{selectedHolding.averagePrice.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block">CMP / Value</span>
                <span className="text-sm font-bold text-slate-100 mt-0.5 block">
                  ₹{selectedHolding.previousClosingPrice.toFixed(2)} (₹{selectedHolding.currentValue.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block">Unrealized P&amp;L</span>
                <span
                  className={`text-sm font-bold mt-0.5 block ${
                    selectedHolding.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedHolding.unrealizedPnl >= 0 ? '+' : ''}₹{selectedHolding.unrealizedPnl.toFixed(2)} (
                  {selectedHolding.unrealizedPnlPct}%)
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <span className="text-indigo-400 font-bold uppercase tracking-wide block mb-1.5 text-[11px]">
                  AI BOT ADVANCE Algorithmic Rationale:
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedHolding.aiRationale}</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <span className="text-amber-400 font-bold uppercase tracking-wide block mb-1.5 text-[11px]">
                  Actionable Prescription:
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">{selectedHolding.recommendedAction}</p>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Target Price</span>
                    <span className="text-emerald-400 font-bold">₹{selectedHolding.targetPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Stop Loss</span>
                    <span className="text-rose-400 font-bold">₹{selectedHolding.stopLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Reward : Risk</span>
                    <span className="text-indigo-400 font-bold">{selectedHolding.riskReward}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedHolding.keyFlags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    &bull; {flag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedHolding(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI BOT ADVANCE Live Interactive Audit Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">AI BOT ADVANCE — Live Portfolio Audit</h3>
                  <p className="text-xs text-slate-400">Powered by Gemini 3.8 Flash &bull; Deep Equities Reasoning</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {isGeneratingAiReport ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-sm font-medium text-slate-200">
                    AI BOT ADVANCE is performing real-time multi-agent portfolio analysis...
                  </p>
                  <p className="text-xs text-slate-500">
                    Auditing 20 holdings, sector correlations, tax-loss harvest viability, and alpha optimization...
                  </p>
                </div>
              ) : aiReport ? (
                <div className="prose prose-invert prose-sm max-w-none bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 text-slate-300 text-xs leading-relaxed space-y-3 whitespace-pre-line font-sans">
                  {aiReport}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Click generate to query AI BOT ADVANCE for your Zerodha portfolio.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask specific question (e.g. 'Should I sell IRCTC right now or wait for break-even?')..."
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiAudit()}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleGenerateAiAudit()}
                disabled={isGeneratingAiReport}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isGeneratingAiReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
