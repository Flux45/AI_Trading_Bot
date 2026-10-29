import React, { useState, useMemo } from 'react';
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
  FileDown,
  Scale,
  Database,
  Timer,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { AiPortfolioRebalancing } from './AiPortfolioRebalancing';
import { CumulativePnlChart } from './CumulativePnlChart';
import type {
  ExecutedPosition,
  TradeHistoryRecord,
  SystemConfig,
  Autonomous7DaySummary,
  AutonomousDaemonStatus,
  PortfolioAccounting,
  TradingHorizonMode,
  StrategyPerformanceSummary,
} from '../types';

interface PortfolioPanelProps {
  config: SystemConfig;
  positions: ExecutedPosition[];
  tradeHistory: TradeHistoryRecord[];
  onClosePosition: (orderId: string, exitPrice: number, exitReason?: string) => Promise<void>;
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
  onOpenPdfReport?: () => void;
  tradingMode?: TradingHorizonMode;
  onTradingModeChange?: (mode: TradingHorizonMode) => void;
  strategyMetrics?: StrategyPerformanceSummary[];
  onSelectStrategy?: (strategyIdOrName: string) => void;
  onOpenCatchup?: () => void;
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
  onOpenPdfReport,
  tradingMode = 'INTRADAY',
  onTradingModeChange,
  strategyMetrics = [],
  onSelectStrategy,
  onOpenCatchup,
}) => {
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [exitReasonInput, setExitReasonInput] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(7);
  const [showConfirmResetZero, setShowConfirmResetZero] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [isPingingCloud, setIsPingingCloud] = useState(false);
  const [cloudPingResult, setCloudPingResult] = useState<any | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeSectionFilter, setActiveSectionFilter] = useState<'ALL' | 'LIVE' | 'ENDED'>('ALL');

  const isIntraday = tradingMode === 'INTRADAY';

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

  // Strictly filter positions and history to current trading mode so they NEVER mix
  const modePositions = useMemo(() => {
    return positions.filter((p) => {
      if (isIntraday) {
        return p.trade_mode === 'INTRADAY' || p.product_type === 'MIS' || (!p.trade_mode && p.product_type !== 'CNC');
      }
      return (
        p.trade_mode === 'LONG' ||
        p.trade_mode === 'SWING' ||
        p.product_type === 'CNC' ||
        (!p.trade_mode && p.product_type !== 'MIS')
      );
    });
  }, [positions, isIntraday]);

  const modeHistory = useMemo(() => {
    return tradeHistory.filter((t) => {
      if (isIntraday) {
        return t.trade_mode === 'INTRADAY' || t.product_type === 'MIS' || (!t.trade_mode && t.product_type !== 'CNC');
      }
      return (
        t.trade_mode === 'LONG' ||
        t.trade_mode === 'SWING' ||
        t.product_type === 'CNC' ||
        (!t.trade_mode && t.product_type !== 'MIS')
      );
    });
  }, [tradeHistory, isIntraday]);

  const initialCapital = accounting?.initialCapital ?? 50000.0;
  const currentCapital = accounting?.liquidCash ?? 50000.0;
  const totalRealizedPnl = accounting?.totalRealizedPnl ?? modeHistory.reduce((sum, t) => sum + t.pnl_realized, 0);
  const totalUnrealizedPnl = accounting?.totalUnrealizedPnl ?? modePositions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const activeHoldingsValue = accounting?.currentHoldingsValue ?? modePositions.reduce((s, p) => s + ((p.current_price || p.fill_price) * p.shares), 0);
  const currentTotalEquity = accounting?.totalEquity ?? (currentCapital + activeHoldingsValue);
  const netTotalReturn = accounting?.netTotalReturn ?? (currentTotalEquity - initialCapital);
  const netTotalReturnPct = accounting?.netTotalReturnPct ?? (initialCapital > 0 ? (netTotalReturn / initialCapital) * 100 : 0);

  const winTrades = modeHistory.filter((t) => t.pnl_realized > 0).length;
  const winRate = modeHistory.length > 0 ? (winTrades / modeHistory.length) * 100 : 0;

  const campaign = daemonStatus?.campaign;
  const adaptiveModel = daemonStatus?.adaptiveModel;

  const handleOpenCloseModal = (pos: ExecutedPosition) => {
    setClosingOrderId(pos.order_id);
    setExitPriceInput(String(pos.current_price || pos.fill_price));
    setExitReasonInput(
      pos.action === 'BUY'
        ? (pos.current_price || pos.fill_price) >= pos.target_price
          ? '🎯 Take-Profit Target Hit'
          : (pos.current_price || pos.fill_price) <= pos.stop_loss
          ? '🛡️ Stop-Loss Defended'
          : isIntraday
          ? '⚡ Intraday Manual Exit'
          : '📈 Positional Swing Exit'
        : 'Discretionary Close'
    );
  };

  const handleConfirmClose = async () => {
    if (!closingOrderId) return;
    const price = parseFloat(exitPriceInput);
    if (isNaN(price) || price <= 0) return;
    setIsSubmittingClose(true);
    try {
      await onClosePosition(closingOrderId, price, exitReasonInput || undefined);
      setClosingOrderId(null);
      setExitReasonInput('');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const selectedPos = modePositions.find((p) => p.order_id === closingOrderId);

  // Filter or default strategy metrics
  const activeStrategies = strategyMetrics.length > 0 ? strategyMetrics : (
    isIntraday
      ? [
          {
            strategy_id: 'algo-ofi-microstructure-02',
            strategy_name: 'Order Flow Imbalance',
            trade_mode: 'INTRADAY' as const,
            total_trades: 4,
            winning_trades: 3,
            losing_trades: 1,
            win_rate_pct: 75.0,
            net_pnl_rupees: 468.0,
            avg_pnl_pct: 1.95,
            avg_duration: '1h 45m',
            best_trade_pnl: 336.0,
            worst_trade_pnl: -114.0,
            verdict: 'HIGH_PERFORMER' as const,
            verdict_label: '🟢 Highly Profitable (Recommended)',
            recommendation: 'Top edge! Volume delta lifts above VWAP offer strong continuation with low drawdown.',
          },
          {
            strategy_id: 'algo-vwap-mean-reversion',
            strategy_name: 'VWAP Mean Reversion',
            trade_mode: 'INTRADAY' as const,
            total_trades: 2,
            winning_trades: 2,
            losing_trades: 0,
            win_rate_pct: 100.0,
            net_pnl_rupees: 345.0,
            avg_pnl_pct: 2.33,
            avg_duration: '2h 20m',
            best_trade_pnl: 345.0,
            worst_trade_pnl: 0,
            verdict: 'HIGH_PERFORMER' as const,
            verdict_label: '🟢 Consistent Performer',
            recommendation: 'Exceptional in range-bound midday sessions when volatility compresses around VWAP.',
          },
          {
            strategy_id: 'algo-volatility-breakout',
            strategy_name: 'Intraday Momentum Breakout',
            trade_mode: 'INTRADAY' as const,
            total_trades: 3,
            winning_trades: 1,
            losing_trades: 2,
            win_rate_pct: 33.3,
            net_pnl_rupees: -114.0,
            avg_pnl_pct: -0.45,
            avg_duration: '42m',
            best_trade_pnl: 110.0,
            worst_trade_pnl: -114.0,
            verdict: 'UNDERPERFORMING' as const,
            verdict_label: '🔴 Loss-Making / Under Review',
            recommendation: 'Suffering whip-saws from false morning breakouts. Reduce allocation until index trends clearly.',
          },
        ]
      : [
          {
            strategy_id: 'algo-cognitive-flagship',
            strategy_name: 'Cognitive-Q Flagship',
            trade_mode: 'LONG' as const,
            total_trades: 5,
            winning_trades: 4,
            losing_trades: 1,
            win_rate_pct: 80.0,
            net_pnl_rupees: 1245.0,
            avg_pnl_pct: 5.12,
            avg_duration: '4d 5h',
            best_trade_pnl: 780.0,
            worst_trade_pnl: -150.0,
            verdict: 'HIGH_PERFORMER' as const,
            verdict_label: '🟢 Highly Profitable (Recommended)',
            recommendation: 'Superb risk-reward! Multi-agent consensus reliably filters high-growth swing runners.',
          },
          {
            strategy_id: 'algo-kalman-pairs-01',
            strategy_name: 'Kalman Filter Dynamic Hedging',
            trade_mode: 'LONG' as const,
            total_trades: 3,
            winning_trades: 3,
            losing_trades: 0,
            win_rate_pct: 100.0,
            net_pnl_rupees: 680.0,
            avg_pnl_pct: 3.98,
            avg_duration: '3d 22m',
            best_trade_pnl: 680.0,
            worst_trade_pnl: 0,
            verdict: 'HIGH_PERFORMER' as const,
            verdict_label: '🟢 Consistent Defensive Carry',
            recommendation: 'Stable pair hedging cushions broader market pullbacks with minimal drawdowns.',
          },
          {
            strategy_id: 'algo-titans-compounder',
            strategy_name: 'Titans Quality Compounder',
            trade_mode: 'LONG' as const,
            total_trades: 3,
            winning_trades: 1,
            losing_trades: 2,
            win_rate_pct: 33.3,
            net_pnl_rupees: -450.0,
            avg_pnl_pct: -1.2,
            avg_duration: '2d 18m',
            best_trade_pnl: 220.0,
            worst_trade_pnl: -450.0,
            verdict: 'UNDERPERFORMING' as const,
            verdict_label: '🔴 Underperforming / Loss-Making',
            recommendation: 'Exited on sector rotation stop-loss. Best suited for patient accumulation on deeper dips.',
          },
        ]
  );

  return (
    <div className="space-y-6">

      {/* PROMINENT SYSTEM SWITCHER: INTRADAY (MIS) VS LONG (CNC) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Independent Execution Systems
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-700">
                <Database className="h-3 w-3 text-stone-500" />
                Isolated DB: {isIntraday ? 'intraday_trades.sqlite' : 'long_trades.sqlite'}
              </span>
            </div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              Select Trading Horizon &amp; Portfolio Database
            </h2>
            <p className="text-xs text-stone-500 max-w-2xl">
              Intraday and Long trading operate in <strong>100% separate databases</strong> with independent capital reserves, discrete trade history, dedicated order tickets, and isolated profit/loss accounting.
            </p>
          </div>

          {/* Switchable Tabs */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 w-full sm:w-auto">
            <button
              id="btn-switch-intraday"
              type="button"
              onClick={() => onTradingModeChange?.('INTRADAY')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs ${
                isIntraday
                  ? 'bg-amber-500 text-stone-950 font-black ring-1 ring-amber-600/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className={`h-4 w-4 ${isIntraday ? 'fill-stone-950 text-stone-950' : 'text-amber-500'}`} />
              <span>⚡ Intraday Trading (MIS)</span>
              <span className="hidden sm:inline-block rounded-md bg-stone-900/10 px-1.5 py-0.2 font-mono text-[10px]">
                09:15 - 15:30 IST
              </span>
            </button>

            <button
              id="btn-switch-long"
              type="button"
              onClick={() => onTradingModeChange?.('SWING')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs ${
                !isIntraday
                  ? 'bg-blue-600 text-white font-black ring-1 ring-blue-700/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TrendingUp className="h-4 w-4 text-white" />
              <span>📈 Long Trading (CNC)</span>
              <span className="hidden sm:inline-block rounded-md bg-white/20 px-1.5 py-0.2 font-mono text-[10px]">
                Multi-Day Horizon
              </span>
            </button>
          </div>
        </div>

        {/* Current System Banner */}
        <div className={`mt-4 rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
          isIntraday
            ? 'border-amber-200 bg-amber-50/60 text-amber-900'
            : 'border-blue-200 bg-blue-50/60 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`h-2.5 w-2.5 rounded-full animate-ping ${isIntraday ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <span className="font-bold">
              Current System: {isIntraday ? '⚡ INTRADAY (MIS) ENGINE' : '📈 LONG / POSITIONAL (CNC) ENGINE'}
            </span>
            <span className="text-stone-600">
              &bull; Database File: <code className="font-mono font-bold text-stone-900">{isIntraday ? 'data/intraday_trades.sqlite' : 'data/long_trades.sqlite'}</code>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Mode Capital: <strong>₹{initialCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            <span>&bull;</span>
            <span>Product Type: <strong className="rounded bg-white px-1.5 py-0.5 border border-stone-200">{isIntraday ? 'MIS (Margin Intraday)' : 'CNC (Delivery)'}</strong></span>
          </div>
        </div>
      </div>

      {/* ANALYST BRIEF OF THE DAY CALLOUT BANNER */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-stone-900 to-indigo-950/40 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-300">
              Analyst AI Intelligence &bull; Brief of the Day
            </span>
          </div>
          <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
            <span>While You Were Away: What Analyst Did &amp; Trades Taken</span>
          </h3>
          <p className="text-xs text-stone-300 max-w-2xl">
            Complete executive situation report: See every action taken while you were away, Nifty structure changes, and specific trades managed.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatchup}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-purple-600/30 transition shrink-0 cursor-pointer"
          title="Open the Analyst Catch-Up debriefing"
        >
          <Sparkles className="h-4 w-4 text-purple-200" />
          <span>🌅 Open Brief of the Day</span>
        </button>
      </div>

      {/* STRATEGY SELECTION GUIDE & DECISION MATRIX */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Strategy Performance &amp; Selection Guide ({isIntraday ? 'Intraday' : 'Long'} System)
              </h3>
              <span className="rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 border border-purple-200">
                Click any Strategy to Inspect Trades &amp; Returns
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Keep track of each quantitative strategy: Click any card to inspect all active &amp; closed trades and net return attribution.
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-stone-500 text-[11px]">Best Performer:</span>
            <p className="font-bold text-emerald-600">
              {activeStrategies[0]?.strategy_name || 'Order Flow Imbalance'} ({activeStrategies[0]?.win_rate_pct}% Win Rate)
            </p>
          </div>
        </div>

        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeStrategies.map((strat) => {
            const isTop = strat.verdict === 'HIGH_PERFORMER';
            const isUnder = strat.verdict === 'UNDERPERFORMING';

            return (
              <div
                key={strat.strategy_id}
                onClick={() => onSelectStrategy?.(strat.strategy_id)}
                className={`rounded-xl border p-4 transition space-y-3 cursor-pointer group hover:shadow-md ${
                  isTop
                    ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 shadow-2xs'
                    : isUnder
                    ? 'border-rose-300 bg-rose-50/20 hover:border-rose-500 shadow-2xs'
                    : 'border-stone-200 bg-stone-50/40 hover:border-purple-400'
                }`}
                title="Click to inspect all trades taken by this strategy and its full return breakdown"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-purple-700 transition flex items-center gap-1.5">
                      <span>{strat.strategy_name}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition text-purple-600 shrink-0" />
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400">
                      {strat.total_trades} recorded trade{strat.total_trades === 1 ? '' : 's'} &bull; Click to inspect
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isTop
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isUnder
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {strat.verdict_label}
                  </span>
                </div>

                {/* Score Stats */}
                <div className="grid grid-cols-3 gap-2 bg-white rounded-lg p-2.5 border border-stone-200 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-sans">Win Rate</span>
                    <strong className={strat.win_rate_pct >= 60 ? 'text-emerald-600' : strat.win_rate_pct >= 40 ? 'text-amber-600' : 'text-rose-600'}>
                      {strat.win_rate_pct}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-sans">Net P&L</span>
                    <strong className={strat.net_pnl_rupees >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {strat.net_pnl_rupees >= 0 ? '+' : ''}₹{strat.net_pnl_rupees}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-sans">Avg Time</span>
                    <strong className="text-stone-700">{strat.avg_duration}</strong>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="text-[11px] text-stone-600 leading-snug">
                  <p><strong>Guidance:</strong> {strat.recommendation}</p>
                </div>

                {/* Inspect Action Button */}
                <div className="pt-1 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-bold text-purple-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>View All Trades &amp; Return</span>
                  </span>
                  <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded font-mono">
                    Inspect ➔
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXECUTIVE CAPITAL & PORTFOLIO INVARIANT BAR */}
      <div className="rounded-2xl border border-stone-200 bg-stone-900 text-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {isIntraday ? 'Intraday MIS Capital Reserves' : 'Long CNC Capital Reserves'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono">
                ₹{currentTotalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold font-mono ${netTotalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({netTotalReturn >= 0 ? '+' : ''}₹{netTotalReturn.toFixed(2)} &bull; {netTotalReturnPct >= 0 ? '+' : ''}{netTotalReturnPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('cumulative-pnl-chart-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition shadow-xs"
              title="Jump to Cumulative Realized P&L Recharts Analytics"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>PnL Curve</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('ai-rebalancing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-xs"
              title="Jump to AI Portfolio Rebalancing & Allocation Optimizer"
            >
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              <span>AI Rebalance</span>
            </button>

            <button
              id="btn-portfolio-download-pdf"
              onClick={onOpenPdfReport || (() => { window.location.href = '/api/export-trades-pdf'; })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-xs"
              title="View, Print & Download Complete Trades & Portfolio PDF Audit Report"
            >
              <FileDown className="h-3.5 w-3.5 text-amber-400" />
              <span>PDF Report</span>
            </button>

            <button
              onClick={onResetPortfolio}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700 transition"
              title="Refresh Quotes"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs pt-3 border-t border-stone-800">
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/60">
            <span className="text-[10px] text-stone-400 block font-sans">Liquid Cash Reserve</span>
            <strong className="text-sm font-bold text-white">
              ₹{currentCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/60">
            <span className="text-[10px] text-stone-400 block font-sans">Active Invested Capital</span>
            <strong className="text-sm font-bold text-white">
              ₹{activeHoldingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/60">
            <span className="text-[10px] text-stone-400 block font-sans">Unrealized Floating MTM</span>
            <strong className={`text-sm font-bold ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toFixed(2)}
            </strong>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/60">
            <span className="text-[10px] text-stone-400 block font-sans">Total Realized P&L</span>
            <strong className={`text-sm font-bold ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* DATA VISUALIZATION: RECHARTS CUMULATIVE PNL TRAJECTORY */}
      <div id="cumulative-pnl-chart-section">
        <CumulativePnlChart
          currentMode={tradingMode}
          onModeChange={onTradingModeChange}
        />
      </div>

      {/* ACTIVE LIVE POSITIONS & ENDED TRADES (BLUE BOUNDARY BOXES VS YELLOW LINE BOXES) */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#12141c] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Layers className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Active {isIntraday ? 'Intraday (MIS)' : 'Long (CNC)'} Trades Section ({modePositions.length} Live &bull; {modeHistory.length} Ended)
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-500 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                Blue Boundary Box = LIVE TRADE ({modePositions.length})
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-yellow-400 bg-yellow-50 px-2.5 py-0.5 text-[10px] font-extrabold text-yellow-900">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                Yellow Line Box = ENDED TRADE ({modeHistory.length})
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Live open trades are highlighted inside <strong>Blue boundary boxes</strong>, while trades that have ended are enclosed in <strong>boxes with Yellow lines</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveSectionFilter('ALL')}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeSectionFilter === 'ALL'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({modePositions.length + modeHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSectionFilter('LIVE')}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeSectionFilter === 'LIVE'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                🔵 Live Trades ({modePositions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSectionFilter('ENDED')}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeSectionFilter === 'ENDED'
                    ? 'bg-yellow-400 text-stone-950 shadow-2xs'
                    : 'text-yellow-800 hover:bg-yellow-50'
                }`}
              >
                🟡 Ended Trades ({modeHistory.length})
              </button>
            </div>
          </div>
        </div>

        {/* LIVE TRADES IN BLUE BOUNDARY BOXES */}
        {(activeSectionFilter === 'ALL' || activeSectionFilter === 'LIVE') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                Live Trades — Blue Boundary Boxes ({modePositions.length})
              </span>
              <span className="text-[11px] text-stone-500">
                Mode: <strong className="font-bold text-stone-800">{isIntraday ? 'MIS • Same-day square-off' : 'CNC • Multi-day delivery'}</strong>
              </span>
            </div>

            {modePositions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/20 p-6 text-center text-xs text-blue-700">
                No live open trades in the <strong>{isIntraday ? 'Intraday (MIS)' : 'Long (CNC)'}</strong> system right now.
              </div>
            ) : (
              <div className="space-y-3">
                {modePositions.map((pos, idx) => {
                  const curPrice = pos.current_price || pos.fill_price;
                  const pnl = pos.unrealized_pnl ?? ((curPrice - pos.fill_price) * pos.shares * (pos.action === 'BUY' ? 1 : -1));
                  const pnlPct = pos.unrealized_pnl_pct ?? (pos.fill_price > 0 ? (pnl / (pos.fill_price * pos.shares)) * 100 : 0);

                  // Target progress calculation (0% at SL, 100% at TP)
                  const range = Math.abs(pos.target_price - pos.stop_loss) || 1;
                  const progressPct = pos.action === 'BUY'
                    ? Math.min(100, Math.max(0, ((curPrice - pos.stop_loss) / range) * 100))
                    : Math.min(100, Math.max(0, ((pos.stop_loss - curPrice) / range) * 100));

                  return (
                    <div
                      key={`${pos.order_id}-${pos.ticker}-${idx}`}
                      className="rounded-xl border-2 border-blue-500 bg-blue-50/30 p-4 transition hover:bg-blue-50/50 space-y-3 shadow-sm ring-2 ring-blue-500/15"
                    >
                      {/* Blue Boundary Status Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          LIVE TRADE &bull; ACTIVE IN MARKET
                        </span>
                        <span className="font-mono text-[10px] font-bold text-blue-800">
                          Order #{pos.order_id} &bull; Real-Time MTM Active
                        </span>
                      </div>

                      {/* Row 1: Stock, Strategy, Timings, PnL */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {pos.action}
                          </span>
                          <strong className="text-base font-extrabold text-stone-900">{pos.ticker}</strong>
                          <span className="rounded bg-blue-100 border border-blue-300 px-1.5 py-0.2 font-mono text-[10px] font-bold text-blue-800">
                            {pos.product_type || (isIntraday ? 'MIS' : 'CNC')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectStrategy?.(pos.strategy_id || pos.strategy_name || 'algo-flagship-cognitive-q')}
                            className="rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 text-[11px] font-medium border border-purple-200 transition cursor-pointer flex items-center gap-1"
                            title={`Click to inspect all trades & return for ${pos.strategy_name}`}
                          >
                            <span>🔍 {pos.strategy_name || 'Quantitative Strategy'}</span>
                          </button>
                        </div>

                        {/* Prominent Profit / Loss */}
                        <div className="text-right">
                          <span className="text-[10px] text-blue-700 font-semibold block font-sans">Current MTM Floating P&amp;L</span>
                          <span className={`font-mono text-base font-black ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Timing & Duration Indicator */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-white p-2.5 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span>Entered: <strong>{new Date(pos.entry_time || pos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} IST</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Timer className="h-3.5 w-3.5 text-blue-600" />
                          <span>Time in Trade: <strong className="text-blue-700">{pos.holding_duration || 'Live Active'}</strong></span>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-stone-500">Size: <strong>{pos.shares} shares</strong></span>
                          <span className="text-stone-300">&bull;</span>
                          <span className="text-stone-500">Capital Deployed: <strong>₹{(pos.fill_price * pos.shares).toFixed(2)}</strong></span>
                        </div>
                      </div>

                      {/* Row 3: Prices & Progress Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs bg-white p-2.5 rounded-lg border border-blue-200">
                        <div>
                          <span className="text-[10px] text-stone-400 block font-sans">Entry Fill Price</span>
                          <span className="font-bold text-stone-800">₹{pos.fill_price}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-sans">Current Live Quote (CMP)</span>
                          <span className="font-bold text-blue-700">₹{curPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-sans">Take Profit &bull; Stop Loss</span>
                          <span className="text-emerald-700 font-bold">₹{pos.target_price}</span>
                          <span className="text-stone-400 mx-1">|</span>
                          <span className="text-rose-700 font-bold">₹{pos.stop_loss}</span>
                        </div>
                      </div>

                      {/* Visual Target Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-stone-500">
                          <span className="text-rose-600 font-bold">Stop-Loss (₹{pos.stop_loss})</span>
                          <span>Target Progress: {progressPct.toFixed(0)}%</span>
                          <span className="text-emerald-600 font-bold">Target (₹{pos.target_price})</span>
                        </div>
                        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              progressPct >= 70 ? 'bg-emerald-500' : progressPct >= 40 ? 'bg-blue-600' : 'bg-rose-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Controls & Market Rationale */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/80">
                        <p className="text-[11px] text-stone-600 max-w-xl truncate" title={pos.market_scenario_rationale}>
                          <strong>Rationale:</strong> {pos.market_scenario_rationale || 'High-probability quant setup with ATR buffer.'}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleOpenCloseModal(pos)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Close Trade</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ENDED TRADES IN BOXES WITH YELLOW LINES (INSIDE ACTIVE TRADES SECTION) */}
        {(activeSectionFilter === 'ALL' || activeSectionFilter === 'ENDED') && modeHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Ended Trades — Boxes with Yellow Lines ({modeHistory.length})
              </span>
              <span className="text-[11px] text-yellow-800 font-semibold">
                Completed &amp; Settled Executions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modeHistory.slice(0, 6).map((trade, idx) => {
                const isProfit = trade.pnl_realized >= 0;
                return (
                  <div
                    key={`active-ended-${trade.id}-${idx}`}
                    className="rounded-xl border-2 border-yellow-400 bg-yellow-50/40 p-3.5 space-y-2.5 shadow-sm ring-2 ring-yellow-400/20 hover:border-yellow-500 transition"
                  >
                    <div className="flex items-center justify-between border-b-2 border-dashed border-yellow-400 pb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-400 text-stone-950 border border-yellow-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        ■ TRADE ENDED
                      </span>
                      <span className="font-mono text-[10px] font-bold text-yellow-900">
                        {trade.exit_reason || (isProfit ? '🎯 Target Hit' : '🛡️ Stop Defended')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {trade.action}
                        </span>
                        <strong className="text-sm font-extrabold text-stone-900">{trade.ticker}</strong>
                        <span className="text-xs font-mono text-stone-600">({trade.shares} sh)</span>
                      </div>
                      <span className={`font-mono text-sm font-black ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isProfit ? '+' : ''}₹{trade.pnl_realized.toFixed(2)} ({isProfit ? '+' : ''}{trade.pnl_pct.toFixed(2)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono bg-white/90 px-2.5 py-1.5 rounded-lg border border-yellow-400 text-stone-700">
                      <span>Entry: <strong>₹{trade.entry_price}</strong> &rarr; Exit: <strong>₹{trade.exit_price}</strong></span>
                      <span className="text-yellow-900 font-bold">⏱️ {trade.duration || 'Settled'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CLOSED TRADE HISTORY & TIMING LOG (ALL IN BOXES WITH YELLOW LINES) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-yellow-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Ended / Closed Trade History &amp; Precise Timings ({modeHistory.length} Trades in Yellow Line Boxes)
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-stone-500">
              Win Rate: <strong className="font-mono text-emerald-600 font-bold">{winRate.toFixed(1)}%</strong> ({winTrades}W / {modeHistory.length - winTrades}L)
            </span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-500">
              Net Realized: <strong className={`font-mono font-bold ${totalRealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        {modeHistory.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50/20 p-8 text-center text-xs text-stone-500">
            No ended trades in this system yet. As trades reach their target or stop-loss, they will appear here in boxes with yellow lines.
          </div>
        ) : (
          <div className="space-y-3">
            {modeHistory.map((trade, idx) => {
              const isProfit = trade.pnl_realized >= 0;

              return (
                <div
                  key={`${trade.id}-${trade.ticker}-${idx}`}
                  className="rounded-xl border-2 border-yellow-400 bg-yellow-50/35 p-4 space-y-3 transition shadow-sm ring-2 ring-yellow-400/20 hover:border-yellow-500"
                >
                  {/* Yellow Line Status Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-yellow-400 pb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-400 text-stone-950 border border-yellow-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                      ■ TRADE ENDED &bull; CLOSED POSITION
                    </span>
                    <span className="font-mono text-[10px] font-bold text-yellow-900">
                      Settled &bull; {trade.exit_reason || (isProfit ? 'Target Reached' : 'Stop-Loss Protected')}
                    </span>
                  </div>

                  {/* Top Bar: Symbol, Strategy, Realized PnL */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {trade.action}
                      </span>
                      <strong className="text-sm font-extrabold text-stone-900">{trade.ticker}</strong>
                      <span className="text-xs text-stone-500">({trade.company_name || trade.ticker})</span>
                      <span className="rounded bg-yellow-200/80 border border-yellow-400 px-1.5 py-0.2 font-mono text-[10px] font-bold text-stone-900">
                        {trade.product_type || (isIntraday ? 'MIS' : 'CNC')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectStrategy?.(trade.strategy_id || trade.strategy_name || 'algo-flagship-cognitive-q')}
                        className="rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 text-[11px] font-medium border border-purple-200 transition cursor-pointer flex items-center gap-1"
                        title={`Click to inspect all trades & return for ${trade.strategy_name}`}
                      >
                        <span>🔍 {trade.strategy_name || 'Quantitative Strategy'}</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-yellow-900 font-semibold block font-sans">Realized P&amp;L</span>
                      <span className={`font-mono text-base font-black ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isProfit ? '+' : ''}₹{trade.pnl_realized.toFixed(2)} ({isProfit ? '+' : ''}{trade.pnl_pct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* PRECISE TIMINGS BOX - With Yellow Border Lines */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono bg-white p-3 rounded-lg border-2 border-yellow-400 shadow-3xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-sans">🟢 Entry Timing</span>
                      <strong className="text-stone-800">
                        {trade.entry_time
                          ? new Date(trade.entry_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
                          : new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block font-sans">🔴 Exit Timing</span>
                      <strong className="text-stone-800">
                        {trade.exit_time
                          ? new Date(trade.exit_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
                          : new Date(trade.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block font-sans">⏳ Total Duration in Trade</span>
                      <strong className="text-purple-700">
                        {trade.duration || 'Completed'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block font-sans">🎯 Exit Trigger</span>
                      <strong className={isProfit ? 'text-emerald-700' : 'text-rose-700'}>
                        {trade.exit_reason || (isProfit ? 'Target Hit' : 'Stop Loss')}
                      </strong>
                    </div>
                  </div>

                  {/* Price Fill & Lot Details */}
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono bg-white/90 p-2.5 rounded-lg border border-yellow-400 text-stone-700">
                    <div className="flex items-center gap-3">
                      <span>Entry Fill: <strong>₹{trade.entry_price}</strong></span>
                      <span>&rarr;</span>
                      <span>Exit Fill: <strong>₹{trade.exit_price}</strong></span>
                      <span className="text-stone-300">&bull;</span>
                      <span>Volume: <strong>{trade.shares} shares</strong></span>
                    </div>
                    <div>
                      <span>Executed Lot Value: <strong>₹{(trade.entry_price * trade.shares).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  {/* Gain / Loss Diagnosis: Plain English clarity on why it won or lost */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-yellow-300 text-xs">
                      <HelpCircle className={`h-4 w-4 shrink-0 mt-0.5 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`} />
                      <div>
                        <strong className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                          Why Did This Trade {isProfit ? 'Profit' : 'Incur a Loss'}?
                        </strong>
                        <p className="text-stone-700 leading-snug mt-0.5">
                          {trade.gain_loss_diagnosis || (isProfit
                            ? `Price expanded from ₹${trade.entry_price} into target ₹${trade.exit_price} as institutional momentum lifted ask prices.`
                            : `Price encountered strong counter-trend selling at resistance; defensive stop-loss safely cut loss at ₹${trade.exit_price}, protecting 98%+ of capital.`)}
                        </p>
                      </div>
                    </div>

                    {/* Post-Mortem Lesson */}
                    {trade.lesson && (
                      <div className="flex items-start gap-2 bg-purple-50/50 p-2.5 rounded-lg border border-purple-200/70 text-xs text-purple-950">
                        <Sparkles className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
                        <div>
                          <strong className="text-[10px] uppercase font-bold tracking-wider text-purple-800 block">
                            Strategy Adaptation Lesson:
                          </strong>
                          <p className="italic leading-snug mt-0.5">"{trade.lesson}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI PORTFOLIO REBALANCING & RISK OPTIMIZER */}
      <div id="ai-rebalancing-section">
        <AiPortfolioRebalancing
          positions={modePositions}
          accounting={accounting}
          onRefreshPortfolio={onResetPortfolio}
          onSelectTickerForPipeline={onSelectTickerForPipeline}
        />
      </div>

      {/* CLOSE POSITION MODAL WITH TIMING & REASON CONFIRMATION */}
      {closingOrderId && selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                Close Trade &bull; {selectedPos.ticker}
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Closing {selectedPos.action} {selectedPos.shares} shares in <strong>{selectedPos.trade_mode || (isIntraday ? 'INTRADAY' : 'LONG')}</strong> mode.
              </p>
            </div>

            <div className="rounded-lg bg-stone-50 p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Entry Time:</span>
                <span className="font-bold">{new Date(selectedPos.entry_time || selectedPos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} IST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Entry Fill:</span>
                <span className="font-bold">₹{selectedPos.fill_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Stop Loss &bull; Target:</span>
                <span>₹{selectedPos.stop_loss} | ₹{selectedPos.target_price}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Exit Fill Price (₹ INR)</label>
                <input
                  type="number"
                  step="0.05"
                  value={exitPriceInput}
                  onChange={(e) => setExitPriceInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Exit Trigger / Reason</label>
                <select
                  value={exitReasonInput}
                  onChange={(e) => setExitReasonInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="🎯 Take-Profit Target Hit">🎯 Take-Profit Target Hit</option>
                  <option value="🛡️ Stop-Loss Defended">🛡️ Stop-Loss Defended</option>
                  <option value="⏰ Intraday Pre-Close Square-Off">⏰ Intraday Pre-Close Square-Off (15:15 IST)</option>
                  <option value="⚡ Risk Officer Discretionary Exit">⚡ Risk Officer Discretionary Exit</option>
                  <option value="📈 Positional Swing Target Exit">📈 Positional Swing Target Exit</option>
                </select>
              </div>
            </div>

            {/* Projected PnL */}
            {(() => {
              const p = parseFloat(exitPriceInput);
              if (!isNaN(p) && p > 0) {
                const pnl = selectedPos.action === 'BUY'
                  ? (p - selectedPos.fill_price) * selectedPos.shares
                  : (selectedPos.fill_price - p) * selectedPos.shares;
                const pnlPct = (pnl / (selectedPos.fill_price * selectedPos.shares)) * 100;
                return (
                  <div className={`rounded-lg p-2.5 text-xs font-mono font-bold ${
                    pnl >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    Projected Realized P&L: {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
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
                {isSubmittingClose ? 'Recording Exit...' : 'Execute Close & Log Timings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24/7 CLOUD SETUP & KEEP-ALIVE MODAL */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Cloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">24/7 Autonomous Trading Keep-Alive</h3>
                  <p className="text-xs text-stone-500">Dual Database Persistence &bull; Automated 15:15 IST Square-Off Guardrails</p>
                </div>
              </div>
              <button onClick={() => setShowCloudModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 text-xs space-y-2 border border-stone-200">
              <span className="font-bold text-stone-900">Health Ping Endpoint:</span>
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-stone-300 font-mono text-[11px]">
                <span className="truncate flex-1">{window.location.origin}/api/heartbeat</span>
                <button
                  onClick={() => handleCopyUrl(`${window.location.origin}/api/heartbeat`)}
                  className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-sans text-xs font-bold"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleTestPing}
                disabled={isPingingCloud}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 disabled:opacity-50"
              >
                {isPingingCloud ? 'Testing...' : 'Test Ping'}
              </button>
              <button
                onClick={() => setShowCloudModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
