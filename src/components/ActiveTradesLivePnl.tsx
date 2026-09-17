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
} from 'lucide-react';
import type { ExecutedPosition } from '../types';

interface ActiveTradesLivePnlProps {
  positions: ExecutedPosition[];
  onClosePosition?: (orderId: string, exitPrice: number) => Promise<void>;
  onViewPortfolio?: () => void;
  compact?: boolean;
  onOpenAlertSettings?: () => void;
  alertThresholds?: { profitPct: number; lossPct: number };
}

export const ActiveTradesLivePnl: React.FC<ActiveTradesLivePnlProps> = ({
  positions,
  onClosePosition,
  onViewPortfolio,
  compact = false,
  onOpenAlertSettings,
  alertThresholds,
}) => {
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

  // Compact Strip view (for top of dashboard or news recommendations)
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

  // Full detailed visual card view
  return (
    <div id="active-trades-full-panel" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shadow-xs">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                Active Trades & Live P&L ({positions.length})
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Mark-to-Market
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Real-time quantitative profit & loss monitoring with mathematical slippage and stop-loss boundaries.
            </p>
          </div>
        </div>

        {/* Global Unrealized P&L Headline & Alert Settings */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {onOpenAlertSettings && (
            <button
              onClick={onOpenAlertSettings}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-2xs"
              title="Configure live profit & loss alert thresholds"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              <span>
                Alerts: {alertThresholds ? `>+${alertThresholds.profitPct}% / <${alertThresholds.lossPct}%` : 'Thresholds'}
              </span>
            </button>
          )}

          <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Unrealized P&L
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xl font-black ${
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
                className={`rounded px-1.5 py-0.5 font-mono text-xs font-bold ${
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
        </div>
      </div>

      {/* Individual Position Cards */}
      <div className="mt-4 grid grid-cols-1 gap-3.5">
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
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs hover:border-stone-300 transition"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Ticker & Status */}
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-black tracking-wider uppercase ${
                      pos.action === 'BUY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {pos.action}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-stone-900">{pos.ticker}</h4>
                      <span className="font-mono text-xs font-semibold text-stone-500">
                        {pos.shares} Shares
                      </span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-600">
                        {pos.order_id}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                      <span>
                        Fill:{' '}
                        <strong className="font-mono text-stone-700">
                          ₹{pos.fill_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Current:{' '}
                        <strong className="font-mono text-stone-900 font-bold">
                          ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Capital:{' '}
                        <strong className="font-mono text-stone-700">
                          ₹{(pos.fill_price * pos.shares).toLocaleString('en-IN', {
                            maximumFractionDigits: 0,
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Boundaries (Stop Loss & Target) */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase text-rose-500">Stop Loss</span>
                    <p className="font-mono font-bold text-rose-700">₹{pos.stop_loss}</p>
                  </div>

                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-500">Target</span>
                    <p className="font-mono font-bold text-emerald-700">₹{pos.target_price}</p>
                  </div>
                </div>

                {/* Right: Current Profit or Loss Badge & Action */}
                <div className="flex items-center justify-between lg:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                      Current Profit / Loss
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`font-mono text-lg font-black ${
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
                        className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ${
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
                      onClick={() => handleOpenClose(pos)}
                      className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-xs whitespace-nowrap"
                    >
                      Close Trade
                    </button>
                  )}
                </div>
              </div>

              {/* Target Progression Progress Bar */}
              <div className="mt-3 border-t border-stone-100 pt-2.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                  <span>
                    Progression to Target: <strong>{targetProgress.toFixed(1)}%</strong>
                  </span>
                  <span>
                    Risk: ₹{pos.rupee_risk.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
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

      {/* Close Position Modal */}
      {closingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
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
                  Expected P&L at this price:{' '}
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
                onClick={() => setClosingOrderId(null)}
                disabled={isSubmitting}
                className="rounded-lg border border-stone-200 px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
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
