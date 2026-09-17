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
} from 'lucide-react';
import type { ExecutedPosition, TradeHistoryRecord, SystemConfig } from '../types';

interface PortfolioPanelProps {
  config: SystemConfig;
  positions: ExecutedPosition[];
  tradeHistory: TradeHistoryRecord[];
  onClosePosition: (orderId: string, exitPrice: number) => Promise<void>;
  onResetPortfolio: () => Promise<void>;
  onOpenAlertSettings?: () => void;
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  config,
  positions,
  tradeHistory,
  onClosePosition,
  onResetPortfolio,
  onOpenAlertSettings,
}) => {
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const initialCapital = config.system.initialPaperCapital;
  const currentCapital = config.system.currentPaperCapital;
  const totalRealizedPnl = tradeHistory.reduce((sum, t) => sum + t.pnl_realized, 0);
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const winTrades = tradeHistory.filter((t) => t.pnl_realized > 0).length;
  const winRate = tradeHistory.length > 0 ? (winTrades / tradeHistory.length) * 100 : 0;

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

  return (
    <div id="portfolio-panel-container" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Active Paper Equity</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">
            ₹{currentCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-stone-500">Initial: ₹{initialCapital.toLocaleString('en-IN')}</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Realized P&L</span>
          <p className={`mt-1 text-2xl font-extrabold ${totalRealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-stone-500">
            {((totalRealizedPnl / initialCapital) * 100).toFixed(2)}% net paper return
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Open Positions</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">{positions.length}</p>
          <span className="text-[11px] text-stone-500">
            Unrealized: ₹{totalUnrealizedPnl.toFixed(2)}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Episodic Win Rate</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">{winRate.toFixed(1)}%</p>
          <span className="text-[11px] text-stone-500">{winTrades} wins / {tradeHistory.length} trades</span>
        </div>
      </div>

      {/* Open Positions Section */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-stone-900">Active Paper Positions ({positions.length})</h3>
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
          <div className="rounded-lg border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500">
            No open positions currently. Execute a heartbeat pipeline on the watchlist to trigger paper fills.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Trades P&L Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50/80 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live MTM
                </span>
                <span className="text-stone-600">
                  Total Active Exposure: <strong className="font-mono text-stone-900">₹{positions.reduce((s, p) => s + (p.fill_price * p.shares), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-medium">Net Current Profit/Loss:</span>
                <span className={`font-mono text-sm font-black ${totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Ticker</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Shares</th>
                    <th className="pb-2">Fill Price (0.05% Slippage)</th>
                    <th className="pb-2">Current Live Price</th>
                    <th className="pb-2">Stop Loss</th>
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Current Profit / Loss</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {positions.map((pos) => {
                    const currentPrice = pos.current_price || pos.fill_price;
                    const pnl = pos.action === 'BUY'
                      ? (currentPrice - pos.fill_price) * pos.shares
                      : (pos.fill_price - currentPrice) * pos.shares;
                    const pnlPct = (pnl / (pos.fill_price * pos.shares)) * 100;
                    const isProfit = pnl >= 0;

                    return (
                      <tr key={pos.order_id} className="hover:bg-stone-50/60 transition">
                        <td className="py-2.5 font-mono font-semibold text-stone-700">{pos.order_id}</td>
                        <td className="py-2.5 font-bold text-stone-900">{pos.ticker}</td>
                        <td className="py-2.5">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${pos.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {pos.action}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{pos.shares}</td>
                        <td className="py-2.5 font-mono font-medium">₹{pos.fill_price}</td>
                        <td className="py-2.5 font-mono font-bold text-stone-900">
                          ₹{currentPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 font-mono text-rose-600">₹{pos.stop_loss}</td>
                        <td className="py-2.5 font-mono text-emerald-600">₹{pos.target_price}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                            </span>
                            <span className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleOpenCloseModal(pos)}
                            className="rounded-md bg-stone-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-stone-800 transition shadow-xs"
                          >
                            Close & Reflect
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

      {/* Episodic Trade Memory & Historical Post-Mortems */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-stone-900">Episodic Trade Memory Database</h3>
          </div>
          <span className="text-xs text-stone-500">
            Stores post-mortems in SQLite &rarr; injected into future Gemini debates
          </span>
        </div>

        <div className="space-y-2.5">
          {tradeHistory.map((trade) => (
            <div
              key={trade.id}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs transition hover:bg-stone-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">{trade.ticker}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${trade.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
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

              {/* Episodic Lesson */}
              <div className="mt-2 flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" />
                <div>
                  <span className="text-[11px] font-semibold text-purple-900">Post-Mortem Lesson:</span>
                  <p className="mt-0.5 text-stone-700 leading-relaxed italic">
                    "{trade.lesson}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Close Position Modal */}
      {closingOrderId && selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              Close Position & Generate Post-Mortem
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Closing {selectedPos.action} {selectedPos.shares} shares of {selectedPos.ticker}. Specify exit fill price to compute realized P&L and trigger Gemini episodic reflection.
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

            {/* Quick PnL Preview */}
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
    </div>
  );
};
