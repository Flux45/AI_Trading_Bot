import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Clock,
  Layers,
  Sparkles,
  BarChart3,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Calendar,
  DollarSign,
  Percent,
  RefreshCw,
  Flame,
} from 'lucide-react';
import type { StrategyDetailedPerformance, StrategyTradeItem } from '../../server/services/strategyTrackerService';

interface StrategyInspectorModalProps {
  strategyId: string | null;
  onClose: () => void;
  onAdoptParameters?: (strategy: any) => void;
  onOpenStressTester?: (strategyId: string) => void;
}

export const StrategyInspectorModal: React.FC<StrategyInspectorModalProps> = ({
  strategyId,
  onClose,
  onAdoptParameters,
  onOpenStressTester,
}) => {
  const [strategyData, setStrategyData] = useState<StrategyDetailedPerformance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'ALL' | 'OPEN' | 'WINS' | 'LOSSES'>('ALL');
  const [adoptedToast, setAdoptedToast] = useState<boolean>(false);

  useEffect(() => {
    if (!strategyId) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/strategy-tracker/${encodeURIComponent(strategyId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch strategy drilldown');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success && data.strategy) {
          setStrategyData(data.strategy);
        }
      })
      .catch((err) => {
        console.error('Error loading strategy drilldown:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [strategyId]);

  if (!strategyId) return null;

  const returns = strategyData?.returns;
  const isNetProfit = (returns?.totalNetPnlRupees || 0) >= 0;

  // Filter trades based on active tab
  const displayedTrades = (strategyData?.allTrades || []).filter((trade) => {
    if (filterType === 'OPEN') return trade.status === 'OPEN';
    if (filterType === 'WINS') return trade.status === 'CLOSED_PROFIT';
    if (filterType === 'LOSSES') return trade.status === 'CLOSED_LOSS';
    return true;
  });

  const handleAdopt = () => {
    if (onAdoptParameters && strategyData) {
      onAdoptParameters(strategyData);
      setAdoptedToast(true);
      setTimeout(() => setAdoptedToast(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col text-stone-900 dark:text-stone-100">
        {/* HEADER BAR */}
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-[#12141c]/95 px-5 py-4 backdrop-blur-sm">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 border border-purple-500/30">
                {strategyData?.categoryLabel || 'Quantitative Engine'}
              </span>

              {strategyData?.rolloutStatus === 'CONFIDENT_REAL_MONEY_ROLLOUT' && (
                <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Live Rollout Cleared
                </span>
              )}
              {strategyData?.rolloutStatus === 'PAPER_INCUBATION_ONLY' && (
                <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Paper Incubation Mode
                </span>
              )}
              {strategyData?.rolloutStatus === 'REVISE_OR_HALT' && (
                <span className="rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Under Review
                </span>
              )}

              <span className="text-[11px] font-mono text-stone-400">
                ID: {strategyData?.strategyId || strategyId}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500 shrink-0" />
              <span>{strategyData?.strategyName || 'Strategy Performance Ledger'}</span>
            </h2>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {strategyData?.description || 'Itemized audit ledger tracking all active positions and closed trades executed under this methodology.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Close Strategy Inspector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
            <p className="text-xs font-mono text-stone-400">Aggregating strategy trades and return metrics...</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6">
            {/* TOAST */}
            {adoptedToast && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Analyst parameters successfully adopted into system risk governor!</span>
              </div>
            )}

            {/* TOP FINANCIAL RETURN CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Net Return */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-4">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>Strategy Total Return</span>
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
                    {isNetProfit ? '+' : ''}₹{returns?.totalNetPnlRupees?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    ({returns?.totalReturnPct || 0}%)
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                  <span>Realized: ₹{returns?.realizedPnlRupees || 0}</span>
                  <span>Unrealized: ₹{returns?.unrealizedPnlRupees || 0}</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-4">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>Win Rate &amp; Trades</span>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white">
                    {returns?.winRatePct || 0}%
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    ({returns?.winningTradesCount || 0}W / {returns?.losingTradesCount || 0}L)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Total Trades: {returns?.totalTradesCount || 0} ({returns?.openTradesCount || 0} Open)
                </p>
              </div>

              {/* Profit Factor & Expectancy */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-4">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>Profit Factor</span>
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                    {returns?.profitFactor?.toFixed(2) || '1.00'}x
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    (Sharpe: {returns?.sharpeRatio || '1.5'})
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Gross: +₹{returns?.grossProfitRupees || 0} / -₹{returns?.grossLossRupees || 0}
                </p>
              </div>

              {/* Capital Allocated */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-4">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>Capital Allocated</span>
                  <Layers className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white">
                    ₹{returns?.totalCapitalAllocated?.toLocaleString('en-IN') || '25,000'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Avg Duration: {returns?.avgDurationFormatted || 'Intraday'}
                </p>
              </div>
            </div>

            {/* STRATEGY METHODOLOGY & ANALYST PARAMETERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Rules Box */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 p-4 space-y-2.5">
                <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-purple-500" />
                  Strategy Execution Logic
                </h4>

                <div className="space-y-1.5 text-stone-700 dark:text-stone-300">
                  <div>
                    <strong className="text-emerald-600 dark:text-emerald-400 block font-semibold">Entry Trigger:</strong>
                    <span>{strategyData?.logicSummary.entryRule}</span>
                  </div>
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400 block font-semibold">Exit Rule:</strong>
                    <span>{strategyData?.logicSummary.exitRule}</span>
                  </div>
                  <div>
                    <strong className="text-rose-600 dark:text-rose-400 block font-semibold">Stop Loss Defense:</strong>
                    <span>{strategyData?.logicSummary.stopLossRule}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Parameters Box */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-purple-500" />
                      Analyst Calibrated Parameters
                    </h4>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {strategyData?.recommendedParameters.capitalAllocationPct}% Capital Allocation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-700 dark:text-stone-300">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px]">ATR Multiplier:</span>
                      <strong>{strategyData?.recommendedParameters.recommendedAtrMultiplier}x</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Risk / Trade:</span>
                      <strong>{strategyData?.recommendedParameters.suggestedRiskPct}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Time Window:</span>
                      <strong>{strategyData?.recommendedParameters.preferredTimeWindow}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Stop Method:</span>
                      <strong>{strategyData?.recommendedParameters.stopLossMethod}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAdopt}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 text-xs shadow-md transition"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Adopt Analyst Parameters</span>
                  </button>

                  {onOpenStressTester && (
                    <button
                      onClick={() => onOpenStressTester(strategyData?.strategyId || strategyId)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold py-2 px-3 text-xs transition"
                      title="Simulate historical crashes against this strategy"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>Stress-Test</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TRADES LIST HEADER & FILTER TABS */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex flex-wrap items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>All Trades Executed by this Strategy ({strategyData?.allTrades.length || 0})</span>
                    <span className="inline-flex items-center gap-1 rounded-md border-2 border-blue-500 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                      🔵 Blue Box = LIVE
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border-2 border-yellow-400 bg-yellow-50 px-2 py-0.5 text-[10px] font-black text-yellow-900">
                      🟡 Yellow Line Box = ENDED
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Live open holdings (Blue boundary boxes) and ended executions (Yellow line boxes) mapped strictly to {strategyData?.strategyName}.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 self-start sm:self-auto bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      filterType === 'ALL'
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    All ({strategyData?.allTrades.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterType('OPEN')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      filterType === 'OPEN'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Live ({strategyData?.openPositions.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterType('WINS')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      filterType === 'WINS'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Wins ({strategyData?.returns.winningTradesCount || 0})
                  </button>
                  <button
                    onClick={() => setFilterType('LOSSES')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      filterType === 'LOSSES'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Losses ({strategyData?.returns.losingTradesCount || 0})
                  </button>
                </div>
              </div>

              {/* TRADES LIST IN BLUE BOUNDARY BOXES (LIVE) & YELLOW LINE BOXES (ENDED) */}
              {displayedTrades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center text-xs text-stone-500">
                  No trades found in selected filter for this strategy.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedTrades.map((trade, idx) => {
                    const isOpen = trade.status === 'OPEN';
                    const pnl = isOpen ? (trade.unrealized_pnl || 0) : (trade.pnl_realized || 0);
                    const isProfit = pnl >= 0;

                    return (
                      <div
                        key={trade.id || idx}
                        className={`rounded-xl p-3.5 transition ${
                          isOpen
                            ? 'border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/15 shadow-xs'
                            : 'border-2 border-yellow-400 bg-yellow-50/35 dark:bg-yellow-950/20 ring-2 ring-yellow-400/20 shadow-xs'
                        }`}
                      >
                        <div
                          className={`flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 ${
                            isOpen
                              ? 'border-b-2 border-blue-300 dark:border-blue-800'
                              : 'border-b-2 border-dashed border-yellow-400'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {isOpen ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                LIVE TRADE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-stone-950 border border-yellow-500">
                                ENDED TRADE
                              </span>
                            )}
                            <span className="font-mono text-sm font-black text-stone-900 dark:text-white">
                              {trade.ticker}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                                trade.action === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              }`}
                            >
                              {trade.action} &bull; {trade.shares} sh
                            </span>
                            <span className="rounded bg-stone-200/70 dark:bg-stone-800 px-1.5 py-0.5 text-[9px] font-mono font-bold text-stone-700 dark:text-stone-300">
                              {trade.trade_mode} ({trade.product_type})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <div className="text-right">
                              <span
                                className={`text-sm font-black ${
                                  isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN')} ({isProfit ? '+' : ''}{trade.pnl_pct}%)
                              </span>
                            </div>
                            {isOpen ? (
                              <span className="rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold px-2 py-0.5 border border-blue-500/30">
                                ACTIVE OPEN
                              </span>
                            ) : isProfit ? (
                              <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                                TARGET HIT
                              </span>
                            ) : (
                              <span className="rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold px-2 py-0.5 border border-rose-500/30">
                                STOP DEFENDED
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-stone-400 block font-sans">Entry Price</span>
                            <strong className="text-stone-800 dark:text-stone-200">₹{trade.entry_price}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block font-sans">
                              {isOpen ? 'Live Market Price' : 'Exit Price'}
                            </span>
                            <strong className={isOpen ? 'text-blue-700 dark:text-blue-300' : 'text-stone-900 dark:text-white'}>
                              ₹{isOpen ? trade.current_price : trade.exit_price}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block font-sans">Duration</span>
                            <strong className="text-stone-700 dark:text-stone-300">{trade.duration || 'Intraday'}</strong>
                          </div>
                          <div className="col-span-2 sm:col-span-1 font-sans">
                            <span className="text-[10px] text-stone-400 block">Execution Note</span>
                            <span className="text-[11px] text-stone-700 dark:text-stone-300 line-clamp-1">
                              {trade.lesson || trade.exit_reason || trade.diagnosis || 'Automated bounds'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 px-5 py-3.5 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">
              Mathematical Expectancy: <strong className="text-stone-900 dark:text-white">{returns?.expectancyLabel || 'Positive (+EV)'}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
