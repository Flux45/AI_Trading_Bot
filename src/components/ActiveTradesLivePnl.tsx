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
} from 'lucide-react';
import type { ExecutedPosition } from '../types';

interface ActiveTradesLivePnlProps {
  positions: ExecutedPosition[];
  onClosePosition?: (orderId: string, exitPrice: number) => Promise<void>;
  onViewPortfolio?: () => void;
  onViewTransactions?: () => void;
  compact?: boolean;
  onOpenAlertSettings?: () => void;
  alertThresholds?: { profitPct: number; lossPct: number };
  defaultExpanded?: boolean;
}

export const ActiveTradesLivePnl: React.FC<ActiveTradesLivePnlProps> = ({
  positions,
  onClosePosition,
  onViewPortfolio,
  onViewTransactions,
  compact = false,
  onOpenAlertSettings,
  alertThresholds,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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

  if (positions.length === 0) {
    return null;
  }

  // Compact Strip view (used optionally)
  if (compact) {
    return (
      <div
        id="active-trades-compact-bar"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                Active Trades ({positions.length})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live MTM
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
      className="rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-200 overflow-hidden"
    >
      {/* Sleek Collapsible Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3.5 px-4 py-3 bg-stone-50/60 hover:bg-stone-50/90 transition cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Indicator & Count & Quick Ticker Tags */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700 shadow-2xs">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-stone-900">
                Active Trades &amp; Live P&amp;L
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {positions.length} Open Position{positions.length === 1 ? '' : 's'}
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
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold border ${
                        isPosProfit
                          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60'
                          : 'bg-rose-50/80 text-rose-700 border-rose-200/60'
                      }`}
                    >
                      <span>{pos.ticker}</span>
                      <span>{isPosProfit ? '+' : ''}{pct.toFixed(1)}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Exposure: <span className="font-mono font-medium text-stone-700">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className="mx-1.5 text-stone-300">&bull;</span>
              Current Value: <span className="font-mono font-medium text-stone-700">₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
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
            <span>{isExpanded ? 'Hide Details' : `View Details (${positions.length})`}</span>
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
        <div className="border-t border-stone-200/80 p-4 sm:p-5 bg-white space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Quick Navigation Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Quick inspection:</span>
              <span className="font-mono text-stone-700 font-semibold">{positions.length} active positions in algorithmic execution</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onViewPortfolio && (
                <button
                  type="button"
                  onClick={onViewPortfolio}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                  title="Open Paper Portfolio tab with full details"
                >
                  <span>Full Details in Paper Portfolio</span>
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
                  <span>Full Details in Transaction History</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Individual Position Cards in Dropdown */}
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
                  className="rounded-xl border border-stone-200 bg-stone-50/40 p-3.5 shadow-2xs hover:border-stone-300 transition"
                >
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
                          <h4 className="text-sm font-extrabold text-stone-900">{pos.ticker}</h4>
                          <span className="font-mono text-xs font-semibold text-stone-600">
                            {pos.shares} Shares
                          </span>
                          <span className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-[10px] text-stone-600">
                            {pos.order_id}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                          <span>
                            Fill: <strong className="font-mono text-stone-700">₹{pos.fill_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            CMP: <strong className="font-mono text-stone-900 font-bold">₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Capital: <strong className="font-mono text-stone-700">₹{(pos.fill_price * pos.shares).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                          </span>
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
                        <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block">
                          Current MTM
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
                          className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-2xs whitespace-nowrap"
                        >
                          Close Trade
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Target Progression Progress Bar */}
                  <div className="mt-2.5 border-t border-stone-200/60 pt-2">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                      <span>
                        Progression to Target: <strong className="font-mono">{targetProgress.toFixed(1)}%</strong>
                      </span>
                      <span>
                        Rupee Risk: <strong className="font-mono text-rose-600">₹{pos.rupee_risk.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isProfit ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, targetProgress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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

