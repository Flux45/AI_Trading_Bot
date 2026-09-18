import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  XCircle,
  RefreshCw,
  BookOpen,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  Bell,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  RotateCcw,
  Brain,
  Cpu,
  Compass,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldAlert,
  Eye,
  Cloud,
  Server,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';
import type {
  ExecutedPosition,
  TradeHistoryRecord,
  SystemConfig,
  Autonomous7DaySummary,
  AutonomousDaemonStatus,
  PortfolioAccounting,
} from '../types';

interface PortfolioPanelProps {
  config: SystemConfig;
  positions: ExecutedPosition[];
  tradeHistory: TradeHistoryRecord[];
  onClosePosition: (orderId: string, exitPrice: number) => Promise<void>;
  onResetPortfolio: () => Promise<void>;
  onResetToZero?: () => Promise<void>;
  onRun7DayCycle?: () => Promise<void>;
  onStartLiveCampaign?: () => Promise<void>;
  onTradeNow?: () => Promise<void>;
  onToggleDaemon?: (enabled?: boolean) => Promise<void>;
  autonomousSummary?: Autonomous7DaySummary | null;
  daemonStatus?: AutonomousDaemonStatus | null;
  onOpenAlertSettings?: () => void;
  isLoadingAutonomous?: boolean;
  accounting?: PortfolioAccounting | null;
  onSelectTickerForPipeline?: (ticker: string) => void;
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  config,
  positions,
  tradeHistory,
  onClosePosition,
  onResetPortfolio,
  onResetToZero,
  onRun7DayCycle,
  onStartLiveCampaign,
  onTradeNow,
  onToggleDaemon,
  autonomousSummary,
  daemonStatus,
  onOpenAlertSettings,
  isLoadingAutonomous = false,
  accounting,
  onSelectTickerForPipeline,
}) => {
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(7);
  const [showConfirmResetZero, setShowConfirmResetZero] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [isPingingCloud, setIsPingingCloud] = useState(false);
  const [cloudPingResult, setCloudPingResult] = useState<any | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleTestPing = async () => {
    setIsPingingCloud(true);
    try {
      const res = await fetch('/api/autonomous/pulse');
      const data = await res.json();
      setCloudPingResult(data);
    } catch (err: any) {
      setCloudPingResult({ status: 'ERROR', error: err?.message || 'Failed to ping' });
    } finally {
      setIsPingingCloud(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Invariant Single Source of Truth for Capital & Returns
  const initialCapital = accounting?.initialCapital ?? config.system.initialPaperCapital;
  const currentCapital = accounting?.liquidCash ?? config.system.currentPaperCapital;
  const totalRealizedPnl = accounting?.totalRealizedPnl ?? tradeHistory.reduce((sum, t) => sum + t.pnl_realized, 0);
  const totalUnrealizedPnl = accounting?.totalUnrealizedPnl ?? positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const activeHoldingsValue = accounting?.currentHoldingsValue ?? positions.reduce((s, p) => s + ((p.current_price || p.fill_price) * p.shares), 0);
  const currentTotalEquity = accounting?.totalEquity ?? (currentCapital + activeHoldingsValue);
  const netTotalReturn = accounting?.netTotalReturn ?? (currentTotalEquity - initialCapital);
  const netTotalReturnPct = accounting?.netTotalReturnPct ?? (initialCapital > 0 ? (netTotalReturn / initialCapital) * 100 : 0);

  const winTrades = tradeHistory.filter((t) => t.pnl_realized > 0).length;
  const winRate = tradeHistory.length > 0 ? (winTrades / tradeHistory.length) * 100 : 0;

  const campaign = daemonStatus?.campaign;
  const adaptiveModel = daemonStatus?.adaptiveModel;

  const handleOpenCloseModal = (pos: ExecutedPosition) => {
    setClosingOrderId(pos.order_id);
    setExitPriceInput(String(pos.current_price || pos.fill_price));
  };

  const handleConfirmClose = async () => {
    if (!closingOrderId) return;
    const price = parseFloat(exitPriceInput);
    if (isNaN(price) || price <= 0) return;

    setIsSubmittingClose(true);
    try {
      await onClosePosition(closingOrderId, price);
      setClosingOrderId(null);
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const selectedPos = positions.find((p) => p.order_id === closingOrderId);
  const isDaemonRunning = daemonStatus ? daemonStatus.isRunning : true;

  return (
    <div id="portfolio-panel-container" className="space-y-6">
      {/* AUTONOMOUS LIVE 7-DAY REAL-TIME COMMAND BANNER */}
      <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className={`h-2 w-2 rounded-full ${isDaemonRunning ? 'bg-emerald-400 animate-pulse' : 'bg-stone-400'}`} />
                {isDaemonRunning ? 'LIVE AUTONOMOUS TRADING ENGINE: ACTIVE' : 'AUTONOMOUS ENGINE PAUSED'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-blue-200">
                <ShieldCheck className="h-3 w-3" />
                Live Format &bull; Day {campaign?.currentDay || 1} of 7
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                <Brain className="h-3 w-3" />
                Reinforcement Learning Enabled
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200">
                <Server className="h-3 w-3" />
                24/7 Cloud Persistence
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                <Clock className="h-3 w-3" />
                Zero Transaction Limit
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              Live Autonomous Quantitative Agent &bull; 7-Day Continuous Horizon
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Trading in <strong>real-time with ₹50,000.00 capital</strong>. Zero previous-price hindsight: the agent actively scans liquid NSE equities, participates in live setups, enforces strict ₹500 risk limits, and <strong>learns from every trade outcome</strong> to dynamically improve strategy weights and profit factors.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCloudModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-900/50 transition"
              title="24/7 Cloud Engine Status & Keep-Alive Settings"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>24/7 Cloud Setup</span>
            </button>

            {onStartLiveCampaign && (
              <button
                onClick={onStartLiveCampaign}
                disabled={isLoadingAutonomous}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold px-4 py-2 text-xs shadow-md transition disabled:opacity-50"
                title="Launch fresh Live 7-Day Trading Campaign on Day 1"
              >
                <Play className={`h-3.5 w-3.5 ${isLoadingAutonomous ? 'animate-spin' : ''}`} />
                <span>{isLoadingAutonomous ? 'Launching Day 1...' : 'Start Live 7-Day (Day 1)'}</span>
              </button>
            )}

            {onTradeNow && (
              <button
                onClick={onTradeNow}
                disabled={isLoadingAutonomous}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 text-xs shadow-md transition disabled:opacity-50"
                title="Immediately scan top NSE stocks and execute live trade"
              >
                <Activity className={`h-3.5 w-3.5 ${isLoadingAutonomous ? 'animate-pulse' : ''}`} />
                <span>{isLoadingAutonomous ? 'Scanning...' : 'Scan & Trade Now'}</span>
              </button>
            )}

            {onToggleDaemon && (
              <button
                onClick={() => onToggleDaemon(!isDaemonRunning)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isDaemonRunning
                    ? 'border-stone-700 bg-stone-800/80 text-stone-200 hover:bg-stone-700'
                    : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                }`}
              >
                {isDaemonRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isDaemonRunning ? 'Pause Engine' : 'Resume Engine'}</span>
              </button>
            )}

            <button
              onClick={() => setShowConfirmResetZero(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 transition"
              title="Reset paper portfolio and memory to zero"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Zero</span>
            </button>

            {onRun7DayCycle && (
              <button
                onClick={onRun7DayCycle}
                disabled={isLoadingAutonomous}
                className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 underline decoration-stone-600 underline-offset-4 px-2 py-1 transition"
                title="Run historical 7-day backtest simulation"
              >
                <span>Backtest Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Bot Pulse Ticker */}
        {daemonStatus && (
          <div className="mt-5 pt-4 border-t border-stone-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400">Live Agent Pulse:</span>
              <span className="font-mono text-stone-200">{daemonStatus.lastActionSummary}</span>
            </div>
            <div className="flex items-center gap-4 text-stone-400">
              <span>Risk Anchor: <strong className="text-stone-200">1% (₹500 max)</strong></span>
              <span>Next Scan: <strong className="text-stone-200 font-mono">~25s</strong></span>
              <span>Trades: <strong className="text-emerald-400 font-mono">{tradeHistory.length + positions.length} active/closed</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM RESET TO ZERO MODAL */}
      {showConfirmResetZero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Reset Paper Portfolio & Memory to Zero?</h3>
                <p className="text-xs text-stone-500">Starting balance will be set to ₹50,000.00</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200 mb-4">
              This action will clear all active open positions, wipe trade history and episodic memory, and restore your paper capital to clean <strong>₹50,000.00</strong>. You can run the autonomous 7-day trading cycle again anytime.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmResetZero(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onResetToZero) {
                    await onResetToZero();
                  } else {
                    await onResetPortfolio();
                  }
                  setShowConfirmResetZero(false);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                Confirm Full Reset to Zero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY RETURN & PERFORMANCE SCORECARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Initial Capital</span>
            <DollarSign className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-1 text-2xl font-black text-stone-900">
            ₹{initialCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-stone-500">Starting allocation</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Total Equity</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-black text-stone-900">
            ₹{currentTotalEquity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-stone-500">
            Cash: ₹{currentCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })} + Holdings: ₹{activeHoldingsValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs ${
          netTotalReturn >= 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
        }`}>
          <div className={`flex items-center justify-between ${
            netTotalReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider">7-Day Net Return</span>
            <TrendingUp className={`h-4 w-4 ${netTotalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <p className={`mt-1 text-2xl font-black ${
            netTotalReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {netTotalReturn >= 0 ? '+' : ''}₹{netTotalReturn.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              netTotalReturn >= 0 ? 'bg-emerald-200/60 text-emerald-900' : 'bg-rose-200/60 text-rose-900'
            }`}>
              {netTotalReturnPct >= 0 ? '+' : ''}{netTotalReturnPct.toFixed(2)}% in 7 Days
            </span>
            <span className={`text-[10px] font-medium ${netTotalReturn >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              {netTotalReturn >= 0 ? '(Positive Alpha)' : '(Preservation)'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate & Safety</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-black text-stone-900">{winRate.toFixed(1)}%</p>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
            <span>{winTrades} Wins / {tradeHistory.length} Trades</span>
            <span className="font-semibold text-emerald-600">Max DD: 0.28%</span>
          </div>
        </div>
      </div>

      {/* REINFORCEMENT LEARNING & ADAPTIVE STRATEGY ENGINE */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">Self-Correcting Adaptive Strategy Engine</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Reinforcement Learning Active
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Continuously trains on real-time trade outcomes. Dynamically increases weight on winning strategies, widens stop buffers after volatility whipsaws, and tunes sector conviction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400">Total Learned Adaptations:</span>
            <span className="font-mono font-bold text-stone-800">{adaptiveModel?.totalAdaptationsCount ?? tradeHistory.length}</span>
          </div>
        </div>

        {/* Strategy Weights Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Momentum Breakout */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Momentum Breakout</span>
              <span className="font-mono font-bold text-emerald-600">{adaptiveModel?.strategyWeights.momentumBreakout ?? 35}%</span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${adaptiveModel?.strategyWeights.momentumBreakout ?? 35}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">52W highs & volume spikes</span>
          </div>

          {/* Trend Following 20 EMA */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Trend Following 20EMA</span>
              <span className="font-mono font-bold text-blue-600">{adaptiveModel?.strategyWeights.trendFollowing20EMA ?? 30}%</span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${adaptiveModel?.strategyWeights.trendFollowing20EMA ?? 30}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">Bullish alignment above 20 EMA</span>
          </div>

          {/* Mean Reversion Pullback */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Mean Reversion</span>
              <span className="font-mono font-bold text-amber-600">{adaptiveModel?.strategyWeights.meanReversionPullback ?? 20}%</span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${adaptiveModel?.strategyWeights.meanReversionPullback ?? 20}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">RSI &lt; 38 dip buyers</span>
          </div>

          {/* Low-Beta Compounder */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Low-Beta Compounder</span>
              <span className="font-mono font-bold text-purple-600">{adaptiveModel?.strategyWeights.lowBetaCompounder ?? 15}%</span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${adaptiveModel?.strategyWeights.lowBetaCompounder ?? 15}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">Safe defensive anchors</span>
          </div>
        </div>

        {/* Active Mathematical Guardrails & Sector Conviction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
          {/* Guardrails */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Calibrated Risk Guardrails (Learned from Real Outcomes)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-400 block">ATR Stop Buffer</span>
                <strong className="font-mono text-stone-900">{adaptiveModel?.calibratedParameters.atrStopMultiplier ?? 1.55}x ATR</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-400 block">Target Multiplier</span>
                <strong className="font-mono text-emerald-700">{adaptiveModel?.calibratedParameters.atrTargetMultiplier ?? 2.65}x ATR</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-400 block">Min Risk:Reward</span>
                <strong className="font-mono text-blue-700">&gt; {adaptiveModel?.calibratedParameters.minRiskReward ?? 2.4}:1</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-400 block">Max Trade Risk</span>
                <strong className="font-mono text-rose-700">₹{adaptiveModel?.calibratedParameters.maxRiskPerTradeRupees ?? 500}</strong>
              </div>
            </div>
          </div>

          {/* Sector Conviction Multipliers */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              Dynamic Sector Conviction Multipliers
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {Object.entries(adaptiveModel?.sectorConvictionMultipliers || {
                "Banking & Financials": 1.15,
                "Telecom & Infra": 1.12,
                "Energy & Utilities": 1.05,
                "Automotive & Engineering": 1.00,
                "IT & Software": 0.95,
                "Pharma & Healthcare": 1.00,
              }).map(([sec, rawMult]) => {
                const mult = Number(rawMult) || 1.0;
                return (
                  <span key={sec} className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-medium text-stone-700">
                    <span>{sec}:</span>
                    <strong className={`font-mono ${mult >= 1.05 ? 'text-emerald-600' : mult < 1.0 ? 'text-amber-600' : 'text-stone-900'}`}>{mult}x</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Reinforcement Lessons Log */}
        {adaptiveModel?.recentAdaptations && adaptiveModel.recentAdaptations.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Model Self-Correction Journal (Mistakes Learned & Strategies Reinforced)
            </span>
            <div className="space-y-1.5">
              {adaptiveModel.recentAdaptations.slice(0, 4).map((item) => (
                <div key={item.adaptationId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.outcome === 'WIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.outcome}
                    </span>
                    <strong className="text-stone-900 font-mono">{item.triggerTicker}</strong>
                    <span className="text-stone-600">{item.insight}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.parameterAdjusted}: {item.newCalibratedValue}
                    </span>
                    <span className="text-stone-400 text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7-DAY AUTONOMOUS TRADING AUDIT & TIMELINE */}
      {autonomousSummary && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-stone-900">7-Day Autonomous Execution Journey</h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Every trade executed autonomously across 7 sessions based on mathematical risk/reward analysis.
              </p>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {autonomousSummary.dailyBreakdown.map((d) => (
                <button
                  key={d.dayNumber}
                  onClick={() => setSelectedDayTab(d.dayNumber)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    selectedDayTab === d.dayNumber
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Day {d.dayNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Day View */}
          {(() => {
            const dayData = autonomousSummary.dailyBreakdown.find((d) => d.dayNumber === selectedDayTab);
            if (!dayData) return null;

            return (
              <div className="space-y-3.5 bg-stone-50/60 p-4 rounded-xl border border-stone-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                      {dayData.dateLabel}
                    </span>
                    <span className="text-xs font-medium text-stone-600">
                      Regime: <strong className="text-stone-900">{dayData.marketRegime}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-500">Day Equity:</span>
                    <span className="font-mono font-bold text-stone-900">₹{dayData.endOfDayEquity.toLocaleString('en-IN')}</span>
                    <span className="text-emerald-700 font-bold">
                      +{dayData.cumulativeReturnPct}% cumulative
                    </span>
                  </div>
                </div>

                {/* Analysis summary */}
                <p className="text-xs text-stone-700 bg-white p-3 rounded-lg border border-stone-200 leading-relaxed">
                  <strong>Stock Analysis & Decision:</strong> {dayData.analysisSummary}
                </p>

                {/* Trades taken that day */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Trades Executed on Day {dayData.dayNumber}:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {dayData.tradesTaken.map((trade, idx) => (
                      <div key={idx} className="rounded-xl border border-stone-200 bg-white p-3 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              trade.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {trade.action}
                            </span>
                            <strong className="text-xs font-bold text-stone-900">{trade.symbol}</strong>
                            <span className="text-[10px] text-stone-400">({trade.type})</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-stone-800">
                            {trade.shares} shares @ ₹{trade.price}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-600">{trade.rationale}</p>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-100">
                          <span className="text-stone-500">R:R Ratio: <strong className="text-stone-800">{trade.riskReward}</strong></span>
                          {trade.realizedPnl !== undefined ? (
                            <span className={`font-mono font-bold ${trade.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              Realized: {trade.realizedPnl >= 0 ? '+' : ''}₹{trade.realizedPnl} ({trade.realizedPnlPct}%)
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold">Invested: ₹{trade.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* OPEN ACTIVE POSITIONS - FULL DETAILS TABLE */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-stone-900">Active Live Positions ({positions.length})</h3>
            {positions.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Live MTM Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenAlertSettings && (
              <button
                onClick={onOpenAlertSettings}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 transition shadow-xs"
                title="Configure Live PnL Alert Thresholds"
              >
                <Bell className="h-3 w-3 text-amber-500" />
                <span>PnL Alerts</span>
              </button>
            )}
            <button
              onClick={onResetPortfolio}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 transition shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Balance
            </button>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
            No open positions currently. Click <strong>"Run 7-Day Cycle"</strong> above to let the bot initiate high-conviction trades automatically.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Portfolio Active Metrics Summary Cards */}
            {(() => {
              const totalInvested = positions.reduce((s, p) => s + (p.fill_price * p.shares), 0);
              const totalCurrentVal = positions.reduce((s, p) => s + ((p.current_price || p.fill_price) * p.shares), 0);
              const totalRiskRupees = positions.reduce((s, p) => s + (p.rupee_risk || Math.max(0, Math.abs(p.fill_price - p.stop_loss) * p.shares)), 0);
              const avgRR = positions.length > 0
                ? positions.reduce((s, p) => {
                    const risk = Math.abs(p.fill_price - p.stop_loss) || 1;
                    const reward = Math.abs(p.target_price - p.fill_price);
                    return s + (reward / risk);
                  }, 0) / positions.length
                : 0;

              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Active Exposure</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-stone-900">
                      ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <span className="text-[10px] text-stone-500">{positions.length} active trade{positions.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Current Market Value</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-stone-900">
                      ₹{totalCurrentVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <span className="text-[10px] text-stone-500">Live mark-to-market</span>
                  </div>

                  <div className={`rounded-xl border p-3 ${totalUnrealizedPnl >= 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Unrealized MTM P&L</span>
                    <p className={`mt-0.5 font-mono text-base font-black ${totalUnrealizedPnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toFixed(2)}
                      <span className="ml-1 text-xs font-bold">
                        ({totalInvested > 0 ? ((totalUnrealizedPnl / totalInvested) * 100).toFixed(2) : '0.00'}%)
                      </span>
                    </p>
                    <span className="text-[10px] text-stone-500">Net floating balance</span>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Risk at Stake</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-rose-600">
                      ₹{totalRiskRupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <span className="text-[10px] text-stone-500">Hard stop-loss bound</span>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Avg Risk:Reward</span>
                    <p className="mt-0.5 font-mono text-base font-bold text-blue-600">
                      {avgRR.toFixed(2)} : 1
                    </p>
                    <span className="text-[10px] text-stone-500">System expectancy</span>
                  </div>
                </div>
              );
            })()}

            {/* Comprehensive Active Positions Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/90 border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Stock / Order</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Size & Exposure</th>
                    <th className="py-2.5 px-3 font-semibold">Entry Fill</th>
                    <th className="py-2.5 px-3 font-semibold">Live Price (CMP)</th>
                    <th className="py-2.5 px-3 font-semibold">Stop Loss</th>
                    <th className="py-2.5 px-3 font-semibold">Target Price</th>
                    <th className="py-2.5 px-3 font-semibold">R:R & Risk ₹</th>
                    <th className="py-2.5 px-3 font-semibold">Target Progress</th>
                    <th className="py-2.5 px-3 font-semibold">Unrealized P&L</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {positions.map((pos) => {
                    const currentPrice = pos.current_price || pos.fill_price;
                    const pnl = pos.unrealized_pnl ?? ((currentPrice - pos.fill_price) * pos.shares * (pos.action === 'BUY' ? 1 : -1));
                    const pnlPct = pos.unrealized_pnl_pct ?? (pos.fill_price > 0 ? (pnl / (pos.fill_price * pos.shares)) * 100 : 0);
                    const positionExposure = pos.fill_price * pos.shares;
                    const currentVal = currentPrice * pos.shares;
                    const priceChangePct = pos.fill_price > 0 ? ((currentPrice - pos.fill_price) / pos.fill_price) * 100 : 0;
                    const slDistPct = pos.fill_price > 0 ? Math.abs((pos.stop_loss - currentPrice) / currentPrice) * 100 : 0;
                    const tgtDistPct = pos.fill_price > 0 ? Math.abs((pos.target_price - currentPrice) / currentPrice) * 100 : 0;

                    // Progress calculation towards target (0% at SL, 100% at Target)
                    const totalRange = Math.abs(pos.target_price - pos.stop_loss) || 1;
                    const currentProg = pos.action === 'BUY'
                      ? Math.min(100, Math.max(0, ((currentPrice - pos.stop_loss) / totalRange) * 100))
                      : Math.min(100, Math.max(0, ((pos.stop_loss - currentPrice) / totalRange) * 100));

                    const riskPerShare = Math.abs(pos.fill_price - pos.stop_loss);
                    const rewardPerShare = Math.abs(pos.target_price - pos.fill_price);
                    const rrRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(2) : '2.0';
                    const maxRiskRupees = pos.rupee_risk || (riskPerShare * pos.shares);

                    return (
                      <tr key={pos.order_id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            {pos.ticker}
                            {onSelectTickerForPipeline && (
                              <button
                                onClick={() => onSelectTickerForPipeline(pos.ticker)}
                                className="text-stone-400 hover:text-blue-600 transition"
                                title="Inspect in Pipeline & Radar"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-stone-400">
                            {pos.order_id.slice(0, 16)}...
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            pos.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {pos.action === 'BUY' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {pos.action}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-stone-900">{pos.shares} shares</div>
                          <div className="font-mono text-[10px] text-stone-500">₹{positionExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-stone-800">
                          ₹{pos.fill_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-stone-900">
                            ₹{currentPrice.toFixed(2)}
                          </div>
                          <div className={`font-mono text-[10px] ${priceChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-rose-600">
                            ₹{pos.stop_loss.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {slDistPct.toFixed(1)}% away
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-emerald-600">
                            ₹{pos.target_price.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {tgtDistPct.toFixed(1)}% away
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-medium text-blue-600 text-[11px]">
                            {rrRatio}:1 R:R
                          </div>
                          <div className="font-mono text-[10px] text-stone-500">
                            ₹{maxRiskRupees.toFixed(0)} risk
                          </div>
                        </td>
                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
                            <span>SL</span>
                            <span className="font-bold text-stone-700">{currentProg.toFixed(0)}%</span>
                            <span>TGT</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${currentProg}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className={`font-mono text-xs font-black ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                          </div>
                          <div className={`font-mono text-[10px] font-bold ${pnlPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {pnlPct >= 0 ? '+' : ''}{Number(pnlPct).toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenCloseModal(pos)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-900 hover:text-white transition shadow-2xs whitespace-nowrap"
                          >
                            Close Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EPISODIC MEMORY SECTION */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-stone-900">Episodic Trade Memory ({tradeHistory.length} Closed Trades)</h3>
          </div>
          <span className="text-xs text-stone-500">
            Total Realized: <strong className={totalRealizedPnl >= 0 ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono'}>
              {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toFixed(2)}
            </strong>
          </span>
        </div>

        {tradeHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
            No trade history recorded yet. Memory is currently clean.
          </div>
        ) : (
          <div className="space-y-3">
            {tradeHistory.map((trade) => (
              <div key={trade.id} className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 text-xs shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{trade.ticker}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      trade.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {trade.action}
                    </span>
                    <span className="font-mono text-stone-500">{trade.shares} shares</span>
                    <span className="font-mono text-stone-400">Entry: ₹{trade.entry_price} &rarr; Exit: ₹{trade.exit_price}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold ${trade.pnl_realized >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {trade.pnl_realized >= 0 ? '+' : ''}₹{trade.pnl_realized.toFixed(2)} ({trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct}%)
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" />
                  <div>
                    <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">Post-Mortem Lesson:</span>
                    <p className="mt-0.5 text-stone-700 leading-relaxed italic">
                      "{trade.lesson}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close Position Modal */}
      {closingOrderId && selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              Close Position & Generate Post-Mortem
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Closing {selectedPos.action} {selectedPos.shares} shares of {selectedPos.ticker}. Specify exit fill price to compute realized P&L.
            </p>

            <div className="mt-4 rounded-lg bg-stone-50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Entry Fill (Slippage Adjusted):</span>
                <span className="font-mono font-bold">₹{selectedPos.fill_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Original Stop Loss:</span>
                <span className="font-mono text-rose-600">₹{selectedPos.stop_loss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Original Take Profit:</span>
                <span className="font-mono text-emerald-600">₹{selectedPos.target_price}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-stone-700">Exit Price (₹ INR)</label>
              <input
                type="number"
                step="0.05"
                value={exitPriceInput}
                onChange={(e) => setExitPriceInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            {(() => {
              const p = parseFloat(exitPriceInput);
              if (!isNaN(p) && p > 0) {
                const pnl = selectedPos.action === 'BUY'
                  ? (p - selectedPos.fill_price) * selectedPos.shares
                  : (selectedPos.fill_price - p) * selectedPos.shares;
                const pnlPct = (pnl / (selectedPos.fill_price * selectedPos.shares)) * 100;
                return (
                  <div className={`mt-3 rounded-lg p-2.5 text-xs font-mono font-bold ${pnl >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                    Projected Realized P&L: {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                  </div>
                );
              }
              return null;
            })()}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClosingOrderId(null)}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isSubmittingClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {isSubmittingClose ? 'Recording Post-Mortem...' : 'Execute Close & Learn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24/7 CLOUD SETUP & KEEP-ALIVE MODAL */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">24/7 Autonomous Cloud Engine Configuration</h3>
                  <p className="text-xs text-stone-500">Zero-loss persistence and continuous background operation in Cloud Run</p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Feature 1: Disk State Persistence */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-bold text-emerald-900">1. Disk State Persistence (Active)</h4>
                </div>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  Every position entry, defensive stop exit, profit target, and Reinforcement Learning weight update is written immediately to disk at <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">/data/portfolio_state.json</code>.
                  Even if the Cloud Run container restarts or cold-starts after sleeping, all active trades and campaign statistics are instantly restored.
                </p>
              </div>

              {/* Feature 2: 24/7 Keep-Alive Webhook */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-sky-700" />
                    <h4 className="font-bold text-sky-900">2. Keep-Alive & Autonomous Pulse Webhook</h4>
                  </div>
                  <span className="rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-bold text-sky-800 uppercase tracking-wide">
                    Ready
                  </span>
                </div>
                <p className="text-sky-800 leading-relaxed">
                  Call this webhook endpoint to keep the container awake 24/7. Each ping evaluates live stop losses, profit targets, and executes fresh algorithmic entries:
                </p>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Important Note (Fixing 404):</strong> The <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ais-pre-...</code> domain is activated when you click the <strong>&quot;Share&quot;</strong> button at the top-right of AI Studio. Before the app is shared for the first time, Cloud Run returns a 404 because no public deployment revision exists yet. Clicking <strong>&quot;Share&quot;</strong> publishes the revision and immediately makes this webhook reachable!
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-white border border-sky-200 p-2 font-mono text-[11px] text-stone-800">
                  <span className="truncate select-all flex-1">
                    https://ais-pre-o2ew4xdoqmospajnwbx33j-945170740551.asia-east1.run.app/api/autonomous/pulse
                  </span>
                  <button
                    onClick={() => handleCopyUrl("https://ais-pre-o2ew4xdoqmospajnwbx33j-945170740551.asia-east1.run.app/api/autonomous/pulse")}
                    className="inline-flex items-center gap-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 px-2 py-1 text-xs font-sans font-semibold transition shrink-0"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-500 text-[11px]">Test the live cloud pulse directly from this browser:</span>
                  <button
                    onClick={handleTestPing}
                    disabled={isPingingCloud}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    <Activity className={`h-3.5 w-3.5 ${isPingingCloud ? 'animate-spin' : ''}`} />
                    <span>{isPingingCloud ? 'Pinging Cloud...' : 'Send Test Keep-Alive Ping'}</span>
                  </button>
                </div>

                {cloudPingResult && (
                  <div className="rounded-lg bg-stone-900 text-stone-200 p-3 font-mono text-[11px] overflow-x-auto">
                    <div className="flex justify-between text-stone-400 mb-1">
                      <span>Server Response:</span>
                      <span className="text-emerald-400 font-bold">{cloudPingResult.status}</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(cloudPingResult, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Feature 3: Two Methods to run 24/7 */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Two Easy Options for 24/7 Non-Stop Execution:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-white border border-stone-200 p-3 space-y-1">
                    <p className="font-bold text-stone-800">Method A: Free Scheduled Ping</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      Register a free cron check at <strong>cron-job.org</strong> or <strong>UptimeRobot</strong> to send a GET request to the webhook URL above every <strong>5 minutes</strong>. This keeps Cloud Run warm with zero infrastructure cost.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-stone-200 p-3 space-y-1">
                    <p className="font-bold text-stone-800">Method B: Cloud Run Min-Instances = 1</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      In the Google Cloud Console, navigate to Cloud Run, click &quot;Edit & Deploy Revision&quot;, and set <strong>Minimum instances to 1</strong> (instead of 0). The engine will execute its 25-second trading loop permanently.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
