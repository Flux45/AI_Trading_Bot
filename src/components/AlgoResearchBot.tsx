import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Zap,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Play,
  CheckCircle2,
  ExternalLink,
  Code,
  Sliders,
  BarChart3,
  Layers,
  ArrowUpRight,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Compass,
  FileCheck2,
  Lock,
  ChevronRight,
  Scale,
  Trophy,
  Eye,
  RotateCcw,
} from 'lucide-react';
import type {
  DiscoveredAlgoStrategy,
  AlgoStrategyCategory,
  BacktestSimulationResult,
  StrategyLedger,
  StrategyLeaderboardEntry,
} from '../types';
import { StrategyDeepDiveDrawer } from './StrategyDeepDiveDrawer';

interface AlgoResearchBotProps {
  onStrategyApproved?: (strategy: DiscoveredAlgoStrategy) => void;
  onNavigateToPortfolio?: () => void;
  tradingMode?: 'SWING' | 'INTRADAY';
}

const CATEGORY_LABELS: Record<AlgoStrategyCategory | 'ALL', string> = {
  ALL: 'All Quant Categories',
  MOMENTUM_BREAKOUT: 'Momentum & Breakout',
  MEAN_REVERSION_PAIRS: 'Mean Reversion & Pairs',
  VOLATILITY_EXPANSION: 'Volatility & Expansion',
  ORDER_FLOW_MICROSTRUCTURE: 'Institutional Order Flow',
  AI_ML_REGIME: 'AI/ML Ensemble',
  INTRADAY_QUANT: 'Intraday Quant & VWAP',
  INTRADAY_MOMENTUM: 'Intraday Momentum & Breakout',
  INTRADAY_HFT: 'Microstructure Scalping',
};

export const AlgoResearchBot: React.FC<AlgoResearchBotProps> = ({
  onStrategyApproved,
  onNavigateToPortfolio,
  tradingMode = 'INTRADAY',
}) => {
  const [activeMainView, setActiveMainView] = useState<'ARENA_LEADERBOARD' | 'SANDBOX_LAB'>('ARENA_LEADERBOARD');
  const [horizonFilter, setHorizonFilter] = useState<'ALL' | 'INTRADAY' | 'SWING'>(
    tradingMode === 'INTRADAY' ? 'INTRADAY' : 'ALL'
  );
  const [strategies, setStrategies] = useState<DiscoveredAlgoStrategy[]>([]);
  const [leaderboard, setLeaderboard] = useState<StrategyLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [isEvaluatingMulti, setIsEvaluatingMulti] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<AlgoStrategyCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sweepNotice, setSweepNotice] = useState<string | null>(null);

  useEffect(() => {
    if (tradingMode === 'INTRADAY') {
      setHorizonFilter('INTRADAY');
    }
  }, [tradingMode]);

  // Selected Strategy for Sandbox & Inspection
  const [selectedStrategy, setSelectedStrategy] = useState<DiscoveredAlgoStrategy | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestSimulationResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);

  // Deep-Dive Drawer State
  const [deepDiveStrategy, setDeepDiveStrategy] = useState<DiscoveredAlgoStrategy | null>(null);
  const [deepDiveLedger, setDeepDiveLedger] = useState<StrategyLedger | null>(null);

  // Backtest Controls
  const [horizon, setHorizon] = useState<'30D' | '90D' | '180D' | '1Y'>('90D');
  const [capital, setCapital] = useState<number>(50000);
  const [useSlippage, setUseSlippage] = useState<boolean>(true);
  const [useSttTaxes, setUseSttTaxes] = useState<boolean>(true);

  // Approval Modal State
  const [approvingStrategy, setApprovingStrategy] = useState<DiscoveredAlgoStrategy | null>(null);
  const [allocCapital, setAllocCapital] = useState<number>(20000);
  const [hardStopLoss, setHardStopLoss] = useState<number>(1.5);
  const [autoExecute, setAutoExecute] = useState<boolean>(true);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);

  // Code / Math Modal
  const [inspectingStrategy, setInspectingStrategy] = useState<DiscoveredAlgoStrategy | null>(null);

  // Fetch strategies & leaderboard on mount
  useEffect(() => {
    fetchStrategies();
    fetchLeaderboard();
  }, []);

  const fetchStrategies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/algo-bot/strategies');
      if (res.ok) {
        const data = await res.json();
        if (data.strategies && data.strategies.length > 0) {
          setStrategies(data.strategies);
          if (!selectedStrategy) {
            setSelectedStrategy(data.strategies[0]);
            // Run initial sandbox backtest for first strategy
            runBacktest(data.strategies[0].id, '90D', 50000);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/algo-bot/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch strategy leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleOpenDeepDive = async (strat: DiscoveredAlgoStrategy) => {
    setDeepDiveStrategy(strat);
    try {
      const res = await fetch(`/api/algo-bot/strategy-ledger/${strat.id}`);
      if (res.ok) {
        const data = await res.json();
        setDeepDiveLedger(data.ledger || null);
      }
    } catch (err) {
      console.warn('Failed to load strategy deep-dive ledger:', err);
    }
  };

  const handleResetLedger = async (strategyId: string) => {
    try {
      const res = await fetch(`/api/algo-bot/strategy-ledger/${strategyId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: 25000 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          setDeepDiveLedger(data.ledger);
        }
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to reset strategy ledger:', err);
    }
  };

  const handleForceEvaluateMulti = async () => {
    setIsEvaluatingMulti(true);
    try {
      const res = await fetch('/api/algo-bot/evaluate-multi', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        if (deepDiveStrategy) {
          await handleOpenDeepDive(deepDiveStrategy);
        }
      }
    } catch (err) {
      console.error('Failed to force evaluate multi-strategies:', err);
    } finally {
      setIsEvaluatingMulti(false);
    }
  };

  const handleRunDiscoverySweep = async () => {
    setIsSweeping(true);
    setSweepNotice(null);
    try {
      const res = await fetch('/api/algo-bot/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies || []);
        setSweepNotice(data.sweep_summary || 'Discovery sweep finished successfully.');
        if (data.new_strategies && data.new_strategies.length > 0) {
          setSelectedStrategy(data.new_strategies[0]);
          runBacktest(data.new_strategies[0].id, horizon, capital);
        }
      }
    } catch (err) {
      console.error('Discovery sweep failed:', err);
      setSweepNotice('Network error during discovery sweep. Please retry.');
    } finally {
      setIsSweeping(false);
    }
  };

  const runBacktest = async (strategyId: string, timeHorizon: string, cap: number) => {
    setIsBacktesting(true);
    try {
      const res = await fetch('/api/algo-bot/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: strategyId,
          time_horizon: timeHorizon,
          initial_capital: cap,
          slippage_pct: useSlippage ? 0.05 : 0.0,
          stt_and_fees: useSttTaxes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBacktestResult(data.result);
      }
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSelectStrategyForSandbox = (strat: DiscoveredAlgoStrategy) => {
    setSelectedStrategy(strat);
    runBacktest(strat.id, horizon, capital);
  };

  const handleConfirmApproval = async () => {
    if (!approvingStrategy) return;
    setIsSubmittingApproval(true);
    try {
      const res = await fetch('/api/algo-bot/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: approvingStrategy.id,
          max_capital_allocation: allocCapital,
          hard_stop_loss_pct: hardStopLoss,
          auto_paper_execution: autoExecute,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setStrategies((prev) =>
          prev.map((s) => (s.id === data.strategy.id ? data.strategy : s))
        );
        if (selectedStrategy?.id === data.strategy.id) {
          setSelectedStrategy(data.strategy);
        }
        if (onStrategyApproved) onStrategyApproved(data.strategy);
        setApprovingStrategy(null);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleRevokeApproval = async (strategyId: string) => {
    try {
      const res = await fetch('/api/algo-bot/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id: strategyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies((prev) =>
          prev.map((s) => (s.id === data.strategy.id ? data.strategy : s))
        );
        if (selectedStrategy?.id === data.strategy.id) {
          setSelectedStrategy(data.strategy);
        }
      }
    } catch (err) {
      console.error('Revoke failed:', err);
    }
  };

  // Strategy classification helper
  const isStrategyIntraday = (stratId: string, category?: string, label?: string) => {
    const sId = (stratId || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    const lbl = (label || '').toLowerCase();
    return sId.includes('intraday') || sId.includes('orb') || sId.includes('vwap') || sId.includes('scalp') || cat.includes('intraday') || lbl.includes('intraday');
  };

  // Filtered strategies
  const filteredStrategies = strategies.filter((s) => {
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author_or_source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isIntro = isStrategyIntraday(s.id, s.category, s.categoryLabel);
    const matchesHorizon =
      horizonFilter === 'ALL' || (horizonFilter === 'INTRADAY' ? isIntro : !isIntro);
    return matchesCat && matchesQuery && matchesHorizon;
  });

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (horizonFilter === 'ALL') return true;
    const isIntro = isStrategyIntraday(entry.strategy_id, entry.categoryLabel, entry.strategy_name);
    return horizonFilter === 'INTRADAY' ? isIntro : !isIntro;
  });

  const intradayCount = strategies.filter((s) => isStrategyIntraday(s.id, s.category, s.categoryLabel)).length;
  const swingCount = strategies.length - intradayCount;

  const approvedCount = strategies.filter((s) => s.is_approved_for_paper).length;
  const bestSharpe = Math.max(...strategies.map((s) => s.audited_metrics.sharpe_ratio), 0);
  const bestWinRate = Math.max(...strategies.map((s) => s.audited_metrics.win_rate_pct), 0);

  return (
    <div className="space-y-6">
      {/* 0. Top Mode Switcher: Arena Leaderboard vs Sandbox Workbench */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-white dark:bg-[#11131a] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainView('ARENA_LEADERBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              activeMainView === 'ARENA_LEADERBOARD'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Strategy Arena &amp; Rankings</span>
            <span className="rounded-full bg-stone-900/15 dark:bg-stone-950/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              ₹25k Each &bull; 24/7 Live
            </span>
          </button>

          <button
            onClick={() => setActiveMainView('SANDBOX_LAB')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              activeMainView === 'SANDBOX_LAB'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Sandbox Workbench &amp; Backtester</span>
            <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-mono">
              {strategies.length} Models
            </span>
          </button>
        </div>

        {/* 24/7 Background Pulse Trigger & Status */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            24/7 Multi-Strategy Pulse Active (25s)
          </span>

          <button
            onClick={handleForceEvaluateMulti}
            disabled={isEvaluatingMulti}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
            title="Manually trigger 24/7 evaluation pulse across all strategy ledgers"
          >
            <Activity className={`h-3.5 w-3.5 text-emerald-500 ${isEvaluatingMulti ? 'animate-spin' : ''}`} />
            <span>{isEvaluatingMulti ? 'Evaluating...' : 'Force 24/7 Pulse'}</span>
          </button>

          <button
            onClick={fetchLeaderboard}
            disabled={isLoadingLeaderboard}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW A: STRATEGY ARENA & GLOBAL LEADERBOARD */}
      {activeMainView === 'ARENA_LEADERBOARD' && (
        <div className="space-y-6">
          {/* Executive Overview Deck */}
          <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-100">
                    Autonomous Multi-Strategy Arena &amp; Leaderboard
                  </h2>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-3xl leading-relaxed">
                  Every quantitative strategy operates with an independent, isolated paper capital allocation of ₹25,000. All strategies run 24/7 autonomously in the background via our 25-second evaluation loop, tracking mark-to-market live NSE quotes, trailing stops, and profit targets with zero hindsight bias.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Total Capital</div>
                  <div className="text-base font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                    ₹{(leaderboard.length * 25000).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-stone-400">₹25k per strategy</span>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Total Net P&amp;L</div>
                  {(() => {
                    const totalPnl = leaderboard.reduce((acc, curr) => acc + curr.net_return_rupees, 0);
                    return (
                      <div className={`text-base font-mono font-bold tabular-nums ${totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(0)}
                      </div>
                    );
                  })()}
                  <span className="text-[10px] text-stone-400">Cumulative Realized+MTM</span>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Active Live Models</div>
                  <div className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {leaderboard.filter((s) => s.status !== 'PAUSED').length} / {leaderboard.length}
                  </div>
                  <span className="text-[10px] text-stone-400">24/7 Background Loop</span>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Open Positions</div>
                  <div className="text-base font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {leaderboard.reduce((acc, curr) => acc + curr.active_positions_count, 0)} Active
                  </div>
                  <span className="text-[10px] text-stone-400">Across all sub-ledgers</span>
                </div>
              </div>
            </div>
          </section>

          {/* Leaderboard Table Card */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Institutional Strategy Standings</span>
                  <span className="text-xs text-stone-400 font-mono">({filteredLeaderboard.length} of {leaderboard.length} strategies)</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Ranked by institutional risk-adjusted return (Net ROI %, Sharpe Ratio, Win Rate, and Drawdown). Click any strategy to inspect its active positioning, entry timestamps, and interactive chart with stop loss &amp; target.
                </p>
              </div>

              {/* Execution Horizon Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => setHorizonFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    horizonFilter === 'ALL'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  All ({leaderboard.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonFilter('INTRADAY')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold transition ${
                    horizonFilter === 'INTRADAY'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
                  }`}
                >
                  <Zap className="h-3 w-3 fill-current" />
                  <span>Intraday Algos ({intradayCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonFilter('SWING')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    horizonFilter === 'SWING'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span>Swing ({swingCount})</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                  <tr>
                    <th className="py-3 px-3 text-center">Rank</th>
                    <th className="py-3 px-4">Strategy &amp; System</th>
                    <th className="py-3 px-3 text-right">Allocated</th>
                    <th className="py-3 px-3 text-right">Total Equity</th>
                    <th className="py-3 px-3 text-right">Net Return (₹ / %)</th>
                    <th className="py-3 px-3 text-right">Win Rate</th>
                    <th className="py-3 px-3 text-right">Profit Factor</th>
                    <th className="py-3 px-3 text-right">Sharpe</th>
                    <th className="py-3 px-3 text-right">Max DD</th>
                    <th className="py-3 px-3 text-center">Active Positions</th>
                    <th className="py-3 px-3 text-center">Engine Status</th>
                    <th className="py-3 px-4 text-center">Deep Dive &amp; Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                  {filteredLeaderboard.map((entry) => {
                    const isFlagship = entry.is_flagship;
                    const isEnsemble = entry.is_ensemble;
                    const isIntro = isStrategyIntraday(entry.strategy_id, entry.categoryLabel, entry.strategy_name);
                    const stratObj = strategies.find((s) => s.id === entry.strategy_id);
                    const isWin = entry.net_return_rupees >= 0;

                    return (
                      <tr
                        key={entry.strategy_id}
                        onClick={() => stratObj && handleOpenDeepDive(stratObj)}
                        className={`cursor-pointer transition hover:bg-stone-50 dark:hover:bg-stone-900/50 ${
                          isFlagship ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : isEnsemble ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3 text-center font-bold">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                              entry.rank === 1
                                ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                                : entry.rank === 2
                                ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                                : entry.rank === 3
                                ? 'bg-amber-700/60 text-amber-100'
                                : 'text-stone-400'
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>

                        {/* Strategy Name & Category */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-900 dark:text-stone-100 hover:text-amber-500 transition">
                              {entry.strategy_name}
                            </span>
                            {isIntro && (
                              <span className="rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-extrabold uppercase flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5 fill-amber-500 text-amber-600 dark:text-amber-300" />
                                Intraday (15:15 Flat)
                              </span>
                            )}
                            {isFlagship && (
                              <span className="rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                                Flagship Benchmark
                              </span>
                            )}
                            {isEnsemble && (
                              <span className="rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                                Multi-Factor Meta
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {entry.categoryLabel}
                          </div>
                        </td>

                        {/* Capital */}
                        <td className="py-3 px-3 text-right text-stone-600 dark:text-stone-400 font-semibold tabular-nums">
                          ₹{entry.allocated_capital.toLocaleString('en-IN')}
                        </td>

                        {/* Total Equity */}
                        <td className="py-3 px-3 text-right font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                          ₹{entry.total_equity.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>

                        {/* Net Return */}
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          <span className={isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {isWin ? '+' : ''}₹{entry.net_return_rupees.toFixed(0)}
                          </span>
                          <span className={`block text-[10px] ${isWin ? 'text-emerald-500' : 'text-rose-400'}`}>
                            ({isWin ? '+' : ''}{entry.net_return_pct.toFixed(2)}%)
                          </span>
                        </td>

                        {/* Win Rate */}
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300 font-semibold tabular-nums">
                          {entry.win_rate_pct.toFixed(1)}%
                        </td>

                        {/* Profit Factor */}
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300 font-semibold tabular-nums">
                          {entry.profit_factor.toFixed(2)}x
                        </td>

                        {/* Sharpe */}
                        <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {entry.sharpe_ratio.toFixed(2)}x
                        </td>

                        {/* Drawdown */}
                        <td className="py-3 px-3 text-right text-rose-500 font-semibold tabular-nums">
                          -{entry.max_drawdown_pct.toFixed(1)}%
                        </td>

                        {/* Active Positions */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.active_positions_count > 0
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'text-stone-400'
                          }`}>
                            {entry.active_positions_count} Open
                          </span>
                        </td>

                        {/* Engine Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            entry.status === 'BENCHMARK_FLAGSHIP'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : entry.status === 'ACTIVE_PAPER'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${entry.status !== 'PAUSED' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                            {entry.status === 'BENCHMARK_FLAGSHIP' ? 'FLAGSHIP 24/7' : entry.status === 'ACTIVE_PAPER' ? 'ACTIVE 24/7' : 'PAUSED'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center font-sans" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => stratObj && handleOpenDeepDive(stratObj)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold transition shadow-xs"
                              title="Inspect positions, execution timestamps, and interactive charts"
                            >
                              <Eye className="h-3 w-3" />
                              Deep Dive
                            </button>

                            <button
                              onClick={() => handleResetLedger(entry.strategy_id)}
                              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                              title="Reset isolated sub-ledger to ₹25,000"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Sandbox Link */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800/80 pt-3">
              <span>All 6+ quantitative algorithms run in isolated multi-tenant sub-ledgers.</span>
              <button
                onClick={() => setActiveMainView('SANDBOX_LAB')}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                Open Sandbox Workbench &amp; Custom Backtester &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: SANDBOX WORKBENCH & DISCOVERY LAB */}
      {activeMainView === 'SANDBOX_LAB' && (
        <div className="space-y-6">
          {/* Header & Discovery Control Deck */}
          <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Compass className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    Autonomous Quantitative Strategy Scout &amp; Testing Lab
                  </h2>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-3xl leading-relaxed">
                  Crawls academic quant publications (arXiv quant-ph/q-fin, QuantConnect, Alpha Vantage research, GitHub quant libraries), extracts rigorous mathematical formulas, adapts them to Indian NSE/BSE equities with STT &amp; 0.05% slippage, and executes sandboxed backtests before human-in-the-loop paper deployment.
                </p>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Scouted Strategies</div>
                  <div className="text-base font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                    {strategies.length} Models
                  </div>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Approved for Paper</div>
                  <div className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {approvedCount} Active
                  </div>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Max Sharpe Ratio</div>
                  <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {bestSharpe.toFixed(2)}x
                  </div>
                </div>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Top Win Rate</div>
                  <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {bestWinRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Discovery Action Toolbar */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-stone-100 dark:border-stone-800/80 pt-5">
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900/90 rounded-xl">
                {(Object.keys(CATEGORY_LABELS) as Array<AlgoStrategyCategory | 'ALL'>).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-amber-400 shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative min-w-[200px] flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search formulas, authors, arXiv..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 pl-8 pr-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                {/* Sweep Trigger Button */}
                <button
                  onClick={handleRunDiscoverySweep}
                  disabled={isSweeping}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-60 whitespace-nowrap"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
                  {isSweeping ? 'Searching Quant Repos...' : 'Run Internet Discovery Sweep'}
                </button>
              </div>
            </div>

            {/* Sweep Feedback Banner */}
            {sweepNotice && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{sweepNotice}</span>
                </div>
                <button
                  onClick={() => setSweepNotice(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </section>

      {/* 2. Main Two-Column Layout: Strategy Leaderboard vs Sandbox Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Strategy Candidate Matrix (Leaderboard) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Strategy Candidate Matrix
              </h3>
              <span className="text-xs text-stone-400 font-mono">({filteredStrategies.length})</span>
            </div>
            <span className="text-[11px] text-stone-400">Click to load into sandbox</span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-8 text-center text-xs text-stone-400">
              <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
              Loading scouted quantitative algorithms...
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-8 text-center text-xs text-stone-400">
              No strategies found matching filter. Try running an internet discovery sweep above.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStrategies.map((strat) => {
                const isSelected = selectedStrategy?.id === strat.id;
                return (
                  <div
                    key={strat.id}
                    onClick={() => handleSelectStrategyForSandbox(strat)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/20 dark:bg-amber-500/5 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {strat.categoryLabel}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <span className="truncate max-w-[180px]">{strat.author_or_source}</span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {strat.name}
                        </h4>
                      </div>

                      {/* Credibility & Status Indicators */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {strat.is_approved_for_paper && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md border ${
                            strat.credibility_rating === 'A+'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                              : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                          }`}
                          title={`Credibility Grade: ${strat.credibility_rating} (Overfitting Score: ${strat.overfitting_risk_score}/100)`}
                        >
                          {strat.credibility_rating}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {strat.description}
                    </p>

                    {/* Compact Metrics Row */}
                    <div className="mt-3 grid grid-cols-4 gap-2 border-t border-stone-100 dark:border-stone-800/70 pt-3 text-[11px]">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Return (p.a.)</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{strat.audited_metrics.annualized_return_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Sharpe</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                          {strat.audited_metrics.sharpe_ratio}x
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Max DD</span>
                        <span className="font-mono font-bold text-rose-500 tabular-nums">
                          -{strat.audited_metrics.max_drawdown_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Win Rate</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                          {strat.audited_metrics.win_rate_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingStrategy(strat);
                          }}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Code className="h-3 w-3" />
                          Math &amp; Code
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeepDive(strat);
                          }}
                          className="text-xs text-stone-600 dark:text-stone-300 hover:text-amber-500 font-bold flex items-center gap-1"
                          title="View current positioning, stocks bought, timestamps, and chart"
                        >
                          <Eye className="h-3 w-3 text-amber-500" />
                          Deep Dive
                        </button>
                      </div>

                      {strat.is_approved_for_paper ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevokeApproval(strat.id);
                          }}
                          className="text-xs text-stone-400 hover:text-rose-500 font-medium transition"
                        >
                          Pause Paper Mode
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setApprovingStrategy(strat);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition"
                        >
                          Approve Strategy &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Independent Strategy Sandbox & Backtest Lab */}
        <div className="lg:col-span-7 space-y-6">
          {selectedStrategy ? (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xs space-y-6">
              {/* Sandbox Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Independent Sandbox Workbench</span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {selectedStrategy.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>Target: {selectedStrategy.target_universe}</span>
                    <span aria-hidden="true">&middot;</span>
                    <a
                      href={selectedStrategy.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 text-stone-400 hover:text-stone-300"
                    >
                      <ExternalLink className="h-3 w-3" /> Source Citation
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStrategy.is_approved_for_paper ? (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved for Paper
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        Max: ₹{selectedStrategy.deployment_config?.max_capital_allocation.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setApprovingStrategy(selectedStrategy)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 transition shadow-xs"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve for Paper Forward-Testing
                    </button>
                  )}
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 text-xs">
                <div>
                  <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">Time Horizon</label>
                  <div className="flex items-center gap-1">
                    {(['30D', '90D', '180D', '1Y'] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => {
                          setHorizon(h);
                          runBacktest(selectedStrategy.id, h, capital);
                        }}
                        className={`px-2 py-1 text-[11px] font-mono rounded font-medium ${
                          horizon === h
                            ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold'
                            : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">Simulated Capital</label>
                  <select
                    value={capital}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setCapital(c);
                      runBacktest(selectedStrategy.id, horizon, c);
                    }}
                    className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2 py-1 text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
                  >
                    <option value={25000}>₹25,000</option>
                    <option value={50000}>₹50,000</option>
                    <option value={100000}>₹1,00,000</option>
                    <option value={500000}>₹5,00,000</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">Slippage &amp; STT</label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={useSlippage}
                        onChange={(e) => setUseSlippage(e.target.checked)}
                        className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                      />
                      0.05% Slippage
                    </label>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => runBacktest(selectedStrategy.id, horizon, capital)}
                    disabled={isBacktesting}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-semibold py-1.5 transition"
                  >
                    <Play className={`h-3 w-3 ${isBacktesting ? 'animate-spin' : ''}`} />
                    {isBacktesting ? 'Simulating...' : 'Run Simulation'}
                  </button>
                </div>
              </div>

              {/* Backtest Results & Visual Equity Curve */}
              {backtestResult && (
                <div className="space-y-6">
                  {/* Performance Scorecards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-3">
                      <span className="text-[10px] text-stone-400 block uppercase">Net Profit / Loss</span>
                      <span className={`text-base font-mono font-extrabold tabular-nums ${
                        backtestResult.net_pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                      }`}>
                        {backtestResult.net_pnl >= 0 ? '+' : ''}₹{backtestResult.net_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        ({backtestResult.total_return_pct >= 0 ? '+' : ''}{backtestResult.total_return_pct}% in {backtestResult.time_horizon})
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-3">
                      <span className="text-[10px] text-stone-400 block uppercase">Sharpe &amp; Sortino</span>
                      <span className="text-base font-mono font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
                        {backtestResult.performance.sharpe_ratio}x
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        Sortino: {backtestResult.performance.sortino_ratio}x
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-3">
                      <span className="text-[10px] text-stone-400 block uppercase">Max Drawdown</span>
                      <span className="text-base font-mono font-extrabold text-rose-500 tabular-nums">
                        -{backtestResult.performance.max_drawdown_pct}%
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        Calmar: {backtestResult.performance.calmar_ratio}x
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-3">
                      <span className="text-[10px] text-stone-400 block uppercase">Win Rate &amp; Trades</span>
                      <span className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {backtestResult.performance.win_rate_pct}%
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        {backtestResult.performance.winning_trades}W / {backtestResult.performance.losing_trades}L (PF: {backtestResult.performance.profit_factor})
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison with AI BOT ADVANCE Baseline */}
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Side-by-Side Benchmark: Discovered Strategy vs AI BOT ADVANCE Baseline
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        Alpha: {backtestResult.baseline_comparison.alpha_generated_pct >= 0 ? '+' : ''}
                        {backtestResult.baseline_comparison.alpha_generated_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg bg-white/80 dark:bg-stone-900/80 p-2.5 border border-stone-200 dark:border-stone-800">
                        <div className="text-[10px] text-stone-400">Discovered Algorithm</div>
                        <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                          +{backtestResult.total_return_pct}% Return
                        </div>
                        <div className="text-[10px] text-stone-500">Sharpe: {backtestResult.performance.sharpe_ratio}x</div>
                      </div>

                      <div className="rounded-lg bg-white/80 dark:bg-stone-900/80 p-2.5 border border-stone-200 dark:border-stone-800">
                        <div className="text-[10px] text-stone-400">AI BOT ADVANCE Baseline</div>
                        <div className="font-mono font-bold text-stone-700 dark:text-stone-300">
                          +{backtestResult.baseline_comparison.baseline_return_pct}% Return
                        </div>
                        <div className="text-[10px] text-stone-500">Sharpe: {backtestResult.baseline_comparison.baseline_sharpe}x</div>
                      </div>

                      <div className="rounded-lg bg-white/80 dark:bg-stone-900/80 p-2.5 border border-stone-200 dark:border-stone-800">
                        <div className="text-[10px] text-stone-400">Market Robustness</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedStrategy.market_regime_suitability.bull === 'EXCELLENT' ? 'High All-Weather' : 'Regime Adaptive'}
                        </div>
                        <div className="text-[10px] text-stone-500">Overfitting: {selectedStrategy.overfitting_risk_score}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Equity Curve Chart */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          Equity Growth Curve (INR)
                        </span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-amber-500">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            {selectedStrategy.name.slice(0, 20)}...
                          </span>
                          <span className="flex items-center gap-1.5 text-stone-400">
                            <span className="h-2 w-2 rounded-full bg-stone-400" />
                            Baseline Bot
                          </span>
                          <span className="flex items-center gap-1.5 text-stone-500">
                            <span className="h-2 w-2 rounded-full bg-stone-600" />
                            NIFTY 50
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-stone-400 text-[11px]">
                        Final: ₹{backtestResult.final_equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* SVG Chart */}
                    <div className="h-44 w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 p-2 relative overflow-hidden">
                      {backtestResult.equity_curve.length > 1 ? (
                        <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="stratGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          <line x1="0" y1="35" x2="500" y2="35" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeDasharray="3 3" />
                          <line x1="0" y1="70" x2="500" y2="70" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeDasharray="3 3" />
                          <line x1="0" y1="105" x2="500" y2="105" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeDasharray="3 3" />

                          {/* Compute SVG Path Coordinates */}
                          {(() => {
                            const pts = backtestResult.equity_curve;
                            const allVals = pts.flatMap((p) => [
                              p.strategy_equity,
                              p.baseline_equity,
                              p.benchmark_nifty_equity,
                            ]);
                            const minVal = Math.min(...allVals) * 0.98;
                            const maxVal = Math.max(...allVals) * 1.02;
                            const range = maxVal - minVal || 1;

                            const getCoords = (key: 'strategy_equity' | 'baseline_equity' | 'benchmark_nifty_equity') => {
                              return pts
                                .map((p, idx) => {
                                  const x = (idx / (pts.length - 1)) * 500;
                                  const y = 140 - ((p[key] - minVal) / range) * 125 - 10;
                                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                                })
                                .join(' ');
                            };

                            const stratCoords = getCoords('strategy_equity');
                            const baseCoords = getCoords('baseline_equity');
                            const niftyCoords = getCoords('benchmark_nifty_equity');

                            return (
                              <>
                                {/* Benchmark Nifty Line */}
                                <polyline
                                  fill="none"
                                  stroke="#71717a"
                                  strokeWidth="1.2"
                                  strokeDasharray="2 2"
                                  points={niftyCoords}
                                />
                                {/* Baseline Bot Line */}
                                <polyline
                                  fill="none"
                                  stroke="#a1a1aa"
                                  strokeWidth="1.5"
                                  points={baseCoords}
                                />
                                {/* Discovered Strategy Area & Line */}
                                <polygon
                                  fill="url(#stratGradient)"
                                  points={`0,140 ${stratCoords} 500,140`}
                                />
                                <polyline
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                  points={stratCoords}
                                />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-stone-400">
                          Insufficient curve points
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trade Log Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                      <span>Simulated Trade Execution Log</span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        STT &amp; Taxes Deducted: ₹{backtestResult.performance.total_brokerage_and_taxes_inr.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-stone-100 dark:bg-stone-800 text-[10px] uppercase text-stone-500 font-mono">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Stock</th>
                            <th className="py-2 px-3">Action</th>
                            <th className="py-2 px-3">Entry &rarr; Exit</th>
                            <th className="py-2 px-3 text-right">Net P&amp;L</th>
                            <th className="py-2 px-3">Trigger Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                          {backtestResult.trade_log.map((t) => (
                            <tr key={t.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-800/40">
                              <td className="py-1.5 px-3 text-stone-400">{t.date}</td>
                              <td className="py-1.5 px-3 font-bold text-stone-900 dark:text-stone-100">
                                {t.ticker}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.action}</span>
                              </td>
                              <td className="py-1.5 px-3 text-stone-600 dark:text-stone-300 tabular-nums">
                                ₹{t.entry_price} &rarr; ₹{t.exit_price} ({t.shares} qty)
                              </td>
                              <td className={`py-1.5 px-3 text-right font-bold tabular-nums ${
                                t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                              }`}>
                                {t.pnl >= 0 ? '+' : ''}₹{t.pnl} ({t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%)
                              </td>
                              <td className="py-1.5 px-3 text-stone-500 text-[10px] font-sans truncate max-w-xs">
                                {t.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-12 text-center text-xs text-stone-400">
              Select a strategy from the leaderboard to run interactive sandbox simulations.
            </div>
          )}
        </div>
      </div>

      {/* 3. Human-in-the-Loop Approval Modal */}
      {approvingStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Approve for Paper Forward-Testing
                </h3>
              </div>
              <button
                onClick={() => setApprovingStrategy(null)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-stone-600 dark:text-stone-300">
                You are approving <span className="font-bold text-stone-900 dark:text-stone-100">{approvingStrategy.name}</span> to enter autonomous paper forward-testing.
              </p>
              <div className="rounded-xl bg-stone-50 dark:bg-stone-900 p-3 border border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                <div><span className="text-stone-400">Category:</span> {approvingStrategy.categoryLabel}</div>
                <div><span className="text-stone-400">Source:</span> {approvingStrategy.author_or_source}</div>
                <div><span className="text-stone-400">Backtested Return:</span> +{approvingStrategy.audited_metrics.annualized_return_pct}% p.a. (Sharpe: {approvingStrategy.audited_metrics.sharpe_ratio}x)</div>
              </div>
            </div>

            {/* Safety Parameters Form */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Maximum Capital Allocation (₹)
                </label>
                <input
                  type="number"
                  value={allocCapital}
                  onChange={(e) => setAllocCapital(Number(e.target.value))}
                  min={5000}
                  max={200000}
                  step={5000}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  The quantitative risk governor will never deploy more than this ceiling on this strategy.
                </span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Hard Invalidation Stop-Loss (%)
                </label>
                <input
                  type="number"
                  value={hardStopLoss}
                  onChange={(e) => setHardStopLoss(Number(e.target.value))}
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Instantly liquidates position if market drifts beyond this loss threshold.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto_exec"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="auto_exec" className="cursor-pointer text-stone-600 dark:text-stone-300">
                  Allow autonomous signal execution in paper portfolio
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800 pt-4">
              <button
                type="button"
                onClick={() => setApprovingStrategy(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isSubmittingApproval}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-xs disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmittingApproval ? 'Saving Deployment...' : 'Confirm & Deploy Strategy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Code & Mathematical Formula Inspection Modal */}
      {inspectingStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {inspectingStrategy.name}
                </h3>
                <p className="text-xs text-stone-400">{inspectingStrategy.author_or_source}</p>
              </div>
              <button
                onClick={() => setInspectingStrategy(null)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mathematical Formula */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase text-stone-500">Mathematical Specification</h4>
              <div className="rounded-xl bg-stone-900 text-amber-300 font-mono text-xs p-3.5 overflow-x-auto border border-stone-800">
                {inspectingStrategy.mathematical_formula}
              </div>
            </div>

            {/* Logic Rules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">Entry Trigger</span>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  {inspectingStrategy.logic_summary.entry_rule}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">Exit / Profit Rule</span>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  {inspectingStrategy.logic_summary.exit_rule}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">Risk Stop-Loss</span>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  {inspectingStrategy.logic_summary.stop_loss_rule}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">Position Sizing</span>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  {inspectingStrategy.logic_summary.position_sizing}
                </p>
              </div>
            </div>

            {/* Python Implementation Code */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase text-stone-500">Python Implementation</h4>
              <pre className="rounded-xl bg-stone-950 text-stone-200 font-mono text-xs p-3.5 overflow-x-auto border border-stone-800 max-h-60">
                <code>{inspectingStrategy.code_snippet}</code>
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingStrategy(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* 5. Dedicated Strategy Deep-Dive Drawer (Shows exact positioning, timestamps, scenarios & one-click TradingView chart) */}
      <StrategyDeepDiveDrawer
        isOpen={!!deepDiveStrategy}
        onClose={() => setDeepDiveStrategy(null)}
        strategy={deepDiveStrategy}
        ledger={deepDiveLedger}
        onResetLedger={handleResetLedger}
        onToggleApproval={async (strat) => {
          if (strat.is_approved_for_paper) {
            await handleRevokeApproval(strat.id);
          } else {
            setApprovingStrategy(strat);
          }
        }}
        onRunBacktest={(id) => {
          const s = strategies.find((item) => item.id === id);
          if (s) {
            setSelectedStrategy(s);
            setActiveMainView('SANDBOX_LAB');
            runBacktest(s.id, horizon, capital);
          }
        }}
      />
    </div>
  );
};
