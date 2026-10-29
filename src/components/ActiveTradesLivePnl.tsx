import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  XCircle,
  ExternalLink,
  Target,
  ShieldAlert,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Bell,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Database,
} from 'lucide-react';
import type { ExecutedPosition, TradeHistoryRecord } from '../types';

interface ActiveTradesLivePnlProps {
  positions: ExecutedPosition[];
  tradeHistory?: TradeHistoryRecord[];
  onClosePosition?: (orderId: string, exitPrice: number) => Promise<void>;
  onViewPortfolio?: () => void;
  onViewTransactions?: () => void;
  compact?: boolean;
  onOpenAlertSettings?: () => void;
  alertThresholds?: { profitPct: number; lossPct: number };
  defaultExpanded?: boolean;
  onSelectStrategy?: (strategyIdOrName: string) => void;
}

export const ActiveTradesLivePnl: React.FC<ActiveTradesLivePnlProps> = ({
  positions,
  tradeHistory = [],
  onClosePosition,
  onViewPortfolio,
  onViewTransactions,
  compact = false,
  onOpenAlertSettings,
  alertThresholds,
  defaultExpanded = true,
  onSelectStrategy,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [tradeViewFilter, setTradeViewFilter] = useState<'ALL' | 'LIVE' | 'ENDED'>('ALL');
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute aggregate stats across all active trades
  const totalInvested = positions.reduce((sum, p) => sum + p.fill_price * p.shares, 0);
  const totalCurrentValue = positions.reduce(
    (sum, p) => sum + (p.current_price || p.fill_price) * p.shares,
    0
  );
  const totalUnrealizedPnl = totalCurrentValue - totalInvested;
  const totalUnrealizedPnlPct = totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0;

  const handleOpenClose = (pos: ExecutedPosition) => {
    setClosingOrderId(pos.order_id);
    setExitPriceInput(String(pos.current_price || pos.fill_price));
  };

  const handleConfirmClose = async () => {
    if (!closingOrderId || !onClosePosition) return;
    const price = parseFloat(exitPriceInput);
    if (isNaN(price) || price <= 0) return;

    setIsSubmitting(true);
    try {
      await onClosePosition(closingOrderId, price);
      setClosingOrderId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (positions.length === 0 && tradeHistory.length === 0) {
    return null;
  }

  // Compact Strip view (used optionally)
  if (compact) {
    return (
      <div
        id="active-trades-compact-bar"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-blue-500 bg-blue-50/20 p-3.5 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                Active Trades ({positions.length} Live &bull; {tradeHistory.length} Ended)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE IN BLUE BOX
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-stone-950 border border-yellow-500">
                ENDED IN YELLOW BOX
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Capital in active market: ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Aggregate Live P&L */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
              Current Profit / Loss
            </span>
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`font-mono text-base font-black ${
                  totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹
                {totalUnrealizedPnl.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                  totalUnrealizedPnl >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}
                {totalUnrealizedPnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {onOpenAlertSettings && (
            <button
              onClick={onOpenAlertSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition shadow-xs"
              title="Configure live profit & loss alert thresholds"
            >
              <Bell className="h-3.5 w-3.5 text-amber-500" />
              <span>
                Alerts: {alertThresholds ? `>+${alertThresholds.profitPct}% / <${alertThresholds.lossPct}%` : 'Thresholds'}
              </span>
            </button>
          )}

          {onViewPortfolio && (
            <button
              onClick={onViewPortfolio}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-xs"
            >
              Manage Positions
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Dropdown Format across all pages
  return (
    <div
      id="active-trades-dropdown-panel"
      className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#12141c] shadow-xs transition-all duration-200 overflow-hidden"
    >
      {/* Sleek Collapsible Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3.5 px-4 py-3 bg-stone-50/60 dark:bg-stone-900/50 hover:bg-stone-50/90 dark:hover:bg-stone-900/80 transition cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Indicator & Count & Quick Ticker Tags */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                Active Trades &amp; Ended Trades Monitor
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                {positions.length} LIVE (Blue Box)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/50 px-2 py-0.5 text-[10px] font-extrabold text-yellow-800 dark:text-yellow-300">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                {tradeHistory.length} ENDED (Yellow Line Box)
              </span>

              {/* Quick ticker preview pills */}
              <div className="hidden md:flex items-center gap-1.5 ml-1">
                {positions.map((pos) => {
                  const currPrice = pos.current_price || pos.fill_price;
                  const diff = pos.action === 'BUY' ? currPrice - pos.fill_price : pos.fill_price - currPrice;
                  const pct = (diff / pos.fill_price) * 100;
                  const isPosProfit = diff >= 0;
                  return (
                    <span
                      key={pos.order_id}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold border-2 border-blue-500 bg-blue-50/90 text-blue-900"
                      title="Live Active Trade (Blue Boundary Box)"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>{pos.ticker}</span>
                      <span className={isPosProfit ? 'text-emerald-700' : 'text-rose-700'}>
                        {isPosProfit ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
              Live Exposure: <span className="font-mono font-medium text-stone-700 dark:text-stone-200">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className="mx-1.5 text-stone-300">&bull;</span>
              Current Value: <span className="font-mono font-medium text-stone-700 dark:text-stone-200">₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </p>
          </div>
        </div>

        {/* Right: Aggregate Live MTM P&L and Dropdown Toggle Button */}
        <div className="flex items-center gap-3">
          {/* Total Unrealized P&L Display */}
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block leading-tight">
              Live Unrealized P&amp;L
            </span>
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`font-mono text-sm sm:text-base font-black ${
                  totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹
                {totalUnrealizedPnl.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`rounded px-1.5 py-0.2 font-mono text-[10px] sm:text-[11px] font-bold ${
                  totalUnrealizedPnl >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}
                {totalUnrealizedPnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Quick Alert Config */}
          {onOpenAlertSettings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAlertSettings();
              }}
              className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition shadow-2xs"
              title="Configure live profit & loss alert thresholds"
            >
              <Bell className="h-3 w-3 text-amber-500" />
              <span>Alerts</span>
            </button>
          )}

          {/* Dropdown Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              isExpanded
                ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
            }`}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide Trades' : `Show Trades (${positions.length} Live / ${tradeHistory.length} Ended)`}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-stone-300" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
            )}
          </button>
        </div>
      </div>

      {/* DROPDOWN EXPANDED DRAWER CONTENT */}
      {isExpanded && (
        <div className="border-t border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 bg-white dark:bg-[#12141c] space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Legend & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 px-2.5 py-1 text-[11px] font-extrabold text-blue-800 dark:text-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span>Blue Boundary Box = LIVE TRADE ({positions.length})</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-yellow-400 bg-yellow-50/90 dark:bg-yellow-950/40 px-2.5 py-1 text-[11px] font-extrabold text-yellow-900 dark:text-yellow-200">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Yellow Line Box = ENDED TRADE ({tradeHistory.length})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTradeViewFilter('ALL')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    tradeViewFilter === 'ALL'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  All ({positions.length + tradeHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTradeViewFilter('LIVE')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    tradeViewFilter === 'LIVE'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50'
                  }`}
                >
                  🔵 Live ({positions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTradeViewFilter('ENDED')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    tradeViewFilter === 'ENDED'
                      ? 'bg-yellow-400 text-stone-950 shadow-2xs'
                      : 'text-yellow-800 dark:text-yellow-400 hover:bg-yellow-50'
                  }`}
                >
                  🟡 Ended ({tradeHistory.length})
                </button>
              </div>

              {onViewPortfolio && (
                <button
                  type="button"
                  onClick={onViewPortfolio}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                  title="Open Paper Portfolio tab with full details"
                >
                  <span>Paper Portfolio</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}

              {onViewTransactions && (
                <button
                  type="button"
                  onClick={onViewTransactions}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-2xs"
                  title="Open Transaction History tab with active trades ledger"
                >
                  <span>Transaction History</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* LIVE TRADES IN BLUE BOUNDARY BOXES */}
          {(tradeViewFilter === 'ALL' || tradeViewFilter === 'LIVE') && positions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  Live Active Trades — Blue Boundary Boxes ({positions.length})
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {positions.map((pos) => {
                  const currentPrice = pos.current_price || pos.fill_price;
                  const pnl =
                    pos.action === 'BUY'
                      ? (currentPrice - pos.fill_price) * pos.shares
                      : (pos.fill_price - currentPrice) * pos.shares;
                  const pnlPct = (pnl / (pos.fill_price * pos.shares)) * 100;
                  const isProfit = pnl >= 0;

                  // Target progression calculation
                  const targetDistance = Math.abs(pos.target_price - pos.fill_price) || 1;
                  const currentGain = currentPrice - pos.fill_price;
                  const targetProgress = Math.max(0, Math.min(100, (currentGain / targetDistance) * 100));

                  return (
                    <div
                      key={pos.order_id}
                      className="rounded-xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/25 p-3.5 shadow-sm ring-2 ring-blue-500/15 hover:border-blue-600 transition"
                    >
                      {/* Blue Live Trade Banner */}
                      <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800/70 pb-2 mb-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          LIVE TRADE &bull; ACTIVE IN MARKET
                        </span>
                        <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          Order #{pos.order_id} &bull; Real-Time MTM
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: Ticker & Status */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-black tracking-wider uppercase shrink-0 ${
                              pos.action === 'BUY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {pos.action}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-stone-900 dark:text-white">{pos.ticker}</h4>
                              <span className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-300">
                                {pos.shares} Shares
                              </span>
                              {pos.strategy_name && (
                                <button
                                  type="button"
                                  onClick={() => onSelectStrategy?.(pos.strategy_id || pos.strategy_name)}
                                  className="rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title={`Click to inspect all trades & return for ${pos.strategy_name}`}
                                >
                                  <span>🔍 Strategy: {pos.strategy_name}</span>
                                </button>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-600 dark:text-stone-300">
                              <span>
                                Fill: <strong className="font-mono text-stone-800 dark:text-white">₹{pos.fill_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Live CMP: <strong className="font-mono text-blue-700 dark:text-blue-300 font-bold">₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Capital: <strong className="font-mono text-stone-800 dark:text-white">₹{(pos.fill_price * pos.shares).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                              </span>
                              <span>&bull;</span>
                              <span className="text-blue-800 dark:text-blue-300 font-semibold">
                                🕒 {new Date(pos.entry_time || pos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} IST
                              </span>
                              {pos.holding_duration && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-mono font-bold text-stone-700 dark:text-stone-200">
                                    ⏱️ {pos.holding_duration}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center: Boundaries (Stop Loss & Target) */}
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase text-rose-500 block">Stop Loss</span>
                            <p className="font-mono font-bold text-rose-700">₹{pos.stop_loss}</p>
                          </div>

                          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase text-emerald-500 block">Target</span>
                            <p className="font-mono font-bold text-emerald-700">₹{pos.target_price}</p>
                          </div>
                        </div>

                        {/* Right: Current Profit or Loss Badge & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block">
                              Live Floating MTM
                            </span>
                            <div className="flex items-center justify-end gap-1.5">
                              <span
                                className={`font-mono text-sm sm:text-base font-black ${
                                  isProfit ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {isProfit ? '+' : ''}₹
                                {pnl.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                                  isProfit
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isProfit ? '+' : ''}
                                {pnlPct.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {onClosePosition && (
                            <button
                              type="button"
                              onClick={() => handleOpenClose(pos)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
                            >
                              Close Trade
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Target Progression Progress Bar */}
                      <div className="mt-2.5 border-t border-blue-200/80 dark:border-blue-800/60 pt-2">
                        <div className="flex items-center justify-between text-[10px] text-stone-600 dark:text-stone-400 mb-1">
                          <span>
                            Progression to Target: <strong className="font-mono">{targetProgress.toFixed(1)}%</strong>
                          </span>
                          <span>
                            Rupee Risk: <strong className="font-mono text-rose-600">₹{pos.rupee_risk.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/50">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isProfit ? 'bg-blue-600' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(4, targetProgress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ENDED TRADES IN BOXES WITH YELLOW LINES */}
          {(tradeViewFilter === 'ALL' || tradeViewFilter === 'ENDED') && tradeHistory.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Ended Trades — Yellow Line Boxes ({tradeHistory.length})
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {tradeHistory.slice(0, 6).map((trade, idx) => {
                  const isProfit = trade.pnl_realized >= 0;
                  return (
                    <div
                      key={`${trade.id}-${idx}`}
                      className="rounded-xl border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50/40 dark:bg-yellow-950/20 p-3.5 shadow-sm ring-2 ring-yellow-400/20 hover:border-yellow-500 transition"
                    >
                      {/* Yellow Line Header Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-yellow-400 dark:border-yellow-500/70 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-400 text-stone-950 border border-yellow-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            <span>■ TRADE ENDED</span>
                          </span>
                          <span className="text-[11px] font-bold text-yellow-900 dark:text-yellow-300">
                            {trade.exit_reason || (isProfit ? '🎯 Target Hit' : '🛡️ Stop Loss Executed')}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-yellow-800 dark:text-yellow-300">
                          Duration: {trade.duration || 'Completed'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-black tracking-wider uppercase shrink-0 ${
                              trade.action === 'BUY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {trade.action}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-stone-900 dark:text-white">{trade.ticker}</h4>
                              <span className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-300">
                                {trade.shares} Shares
                              </span>
                              {trade.strategy_name && (
                                <button
                                  type="button"
                                  onClick={() => onSelectStrategy?.(trade.strategy_id || trade.strategy_name)}
                                  className="rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 px-2 py-0.5 text-[10px] font-bold transition cursor-pointer"
                                >
                                  🔍 Strategy: {trade.strategy_name}
                                </button>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-stone-600 dark:text-stone-300">
                              <span>
                                Entry Price: <strong className="font-mono text-stone-900 dark:text-white">₹{trade.entry_price.toFixed(2)}</strong>
                              </span>
                              <span>&rarr;</span>
                              <span>
                                Exit Price: <strong className="font-mono text-stone-900 dark:text-white">₹{trade.exit_price.toFixed(2)}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Exited: <strong className="font-mono text-yellow-900 dark:text-yellow-300">
                                  {new Date(trade.exit_time || trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} IST
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-yellow-800 dark:text-yellow-400 block">
                            Settled Realized P&amp;L
                          </span>
                          <div className="flex items-center justify-end gap-1.5">
                            <span
                              className={`font-mono text-sm sm:text-base font-black ${
                                isProfit ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isProfit ? '+' : ''}₹{trade.pnl_realized.toFixed(2)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                                isProfit
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isProfit ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom collapse button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 transition"
            >
              <span>Collapse Dropdown</span>
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Close Position Modal */}
      {closingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="text-base font-extrabold text-stone-900">Close Active Trade</h4>
            <p className="mt-1 text-xs text-stone-500">
              Executing exit fill and reflecting trade post-mortem in episodic memory database.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700">Exit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={exitPriceInput}
                  onChange={(e) => setExitPriceInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                <span>
                  Expected P&amp;L at this price:{' '}
                  <strong className="text-stone-900">
                    {(() => {
                      const pos = positions.find((p) => p.order_id === closingOrderId);
                      if (!pos) return '₹0.00';
                      const p = parseFloat(exitPriceInput) || pos.current_price || pos.fill_price;
                      const diff =
                        pos.action === 'BUY'
                          ? (p - pos.fill_price) * pos.shares
                          : (pos.fill_price - p) * pos.shares;
                      return `${diff >= 0 ? '+' : ''}₹${diff.toFixed(2)}`;
                    })()}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setClosingOrderId(null)}
                disabled={isSubmitting}
                className="rounded-lg border border-stone-200 px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isSubmitting}
                className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Closing...' : 'Confirm Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

