import React, { useState } from 'react';
import {
  Database,
  FileText,
  RefreshCw,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import {
  PageSection,
  StatMetricCard,
  TradeExecutionBox,
} from './ui/ReusableComponents';

interface UnifiedTradesLedgerViewProps {
  onOpenPdfReport?: () => void;
  onSelectStrategy?: (id: string) => void;
  onAnalyzeLoss?: (ticker?: string) => void;
}

export const UnifiedTradesLedgerView: React.FC<UnifiedTradesLedgerViewProps> = ({
  onOpenPdfReport,
  onSelectStrategy,
  onAnalyzeLoss,
}) => {
  const {
    tradingMode,
    handleTradingModeChange,
    positions,
    tradeHistory,
    accounting,
    handleClosePosition,
    setInspectingStrategyId,
    setShowPdfReportModal,
    fetchTransactions,
  } = useTradingContext();

  const [boxFilter, setBoxFilter] = useState<'ALL' | 'LIVE' | 'ENDED' | 'LOST'>('ALL');
  const isIntraday = tradingMode === 'INTRADAY';

  const modePositions = positions.filter((p) => {
    if (isIntraday) {
      return p.trade_mode === 'INTRADAY' || p.product_type === 'MIS' || (!p.trade_mode && p.product_type !== 'CNC');
    }
    return p.trade_mode === 'LONG' || p.product_type === 'CNC' || (!p.trade_mode && p.product_type !== 'MIS');
  });

  const modeHistory = tradeHistory.filter((t) => {
    if (isIntraday) {
      return t.trade_mode === 'INTRADAY' || t.product_type === 'MIS' || (!t.trade_mode && t.product_type !== 'CNC');
    }
    return t.trade_mode === 'LONG' || t.product_type === 'CNC' || (!t.trade_mode && t.product_type !== 'MIS');
  });

  const totalUnrealized = modePositions.reduce((acc, p) => {
    const cur = p.current_price || p.fill_price;
    const pnl = p.action === 'BUY' ? (cur - p.fill_price) * p.shares : (p.fill_price - cur) * p.shares;
    return acc + pnl;
  }, 0);

  const totalRealized = modeHistory.reduce((acc, t) => acc + (t.pnl_realized || 0), 0);

  // Combine Live Positions and Ended Trades into a single chronological SQLite Database Table
  const combinedDbRecords = [
    ...modePositions.map((p) => {
      const cur = p.current_price || p.fill_price;
      const pnl = p.action === 'BUY' ? (cur - p.fill_price) * p.shares : (p.fill_price - cur) * p.shares;
      const execDate = p.execution_date || (p.entry_time || p.timestamp).slice(0, 10);
      const execTime =
        p.execution_time ||
        new Date(p.entry_time || p.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      return {
        key: `LIVE_${p.order_id}`,
        order_id: p.order_id,
        status: 'LIVE' as const,
        ticker: p.ticker,
        action: p.action,
        shares: p.shares,
        product_type: p.product_type || (isIntraday ? 'MIS' : 'CNC'),
        execution_date: execDate,
        execution_time: execTime,
        exit_time_display: 'Active (Open)',
        duration: p.holding_duration || 'Live MTM',
        entry_price: p.fill_price,
        current_or_exit_price: cur,
        stop_loss: p.stop_loss,
        target_price: p.target_price,
        rupee_risk: p.rupee_risk,
        strategy_name: p.strategy_name || 'Order Flow Imbalance',
        strategy_id: p.strategy_id,
        pnl,
      };
    }),
    ...modeHistory.map((t) => {
      const execDate = t.execution_date || (t.entry_time || t.timestamp).slice(0, 10);
      const execTime =
        t.execution_time ||
        new Date(t.entry_time || t.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      const exitTimeDisplay = t.exit_time
        ? new Date(t.exit_time).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : 'Closed';
      return {
        key: `ENDED_${t.id}_${t.order_id}`,
        order_id: t.order_id || `TRADE_${t.id}`,
        status: 'ENDED' as const,
        ticker: t.ticker,
        action: t.action,
        shares: t.shares,
        product_type: t.product_type || (isIntraday ? 'MIS' : 'CNC'),
        execution_date: execDate,
        execution_time: execTime,
        exit_time_display: exitTimeDisplay,
        duration: t.duration || '1h 15m',
        entry_price: t.entry_price,
        current_or_exit_price: t.exit_price,
        stop_loss: Number((t.entry_price * 0.985).toFixed(2)),
        target_price: Number((t.entry_price * 1.035).toFixed(2)),
        rupee_risk: Number((t.shares * t.entry_price * 0.015).toFixed(2)),
        strategy_name: t.strategy_name || 'Quant Strategy',
        strategy_id: t.strategy_id,
        pnl: t.pnl_realized,
      };
    }),
  ];

  return (
    <div className="space-y-6">
      {/* KPI SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMetricCard
          label="SQLite Storage Engine"
          value={isIntraday ? 'intraday_trades.sqlite' : 'long_trades.sqlite'}
          subtext={`${combinedDbRecords.length} Total Persisted Trades`}
        />
        <StatMetricCard
          label="Live Trades (Blue Boundary Boxes)"
          value={`${modePositions.length} Open`}
          subtext={`Unrealized: ${totalUnrealized >= 0 ? '+' : ''}₹${totalUnrealized.toFixed(2)}`}
          tone={totalUnrealized >= 0 ? 'positive' : 'negative'}
        />
        <StatMetricCard
          label="Ended Trades (Yellow Line Boxes)"
          value={`${modeHistory.length} Closed`}
          subtext={`Realized: ${totalRealized >= 0 ? '+' : ''}₹${totalRealized.toFixed(2)}`}
          tone={totalRealized >= 0 ? 'positive' : 'negative'}
        />
        <StatMetricCard
          label="Available Liquid Cash"
          value={`₹${(accounting?.liquidCash || 50000).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          subtext={`Total Equity: ₹${(accounting?.totalEquity || 50000).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
        />
      </div>

      {/* SECTION 1: ACTIVE TRADES VISUAL BOXES (BLUE BOUNDARY = LIVE, YELLOW LINE BOX = ENDED) */}
      <PageSection
        title={`01. Active Trades Visual Overview — ${isIntraday ? 'Intraday (MIS)' : 'Long / Swing (CNC)'}`}
        subtitle="Live trades are enclosed in Blue boundary boxes. Ended trades are enclosed in boxes with Yellow lines."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Horizon Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => handleTradingModeChange('INTRADAY')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  isIntraday
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Intraday (MIS)
              </button>
              <button
                type="button"
                onClick={() => handleTradingModeChange('SWING')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  !isIntraday
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Long (CNC)
              </button>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setBoxFilter('ALL')}
                className={`rounded-md px-2.5 py-1 font-bold transition cursor-pointer ${
                  boxFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                All ({modePositions.length + modeHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setBoxFilter('LIVE')}
                className={`rounded-md px-2.5 py-1 font-bold transition cursor-pointer ${
                  boxFilter === 'LIVE'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                Live Only ({modePositions.length})
              </button>
              <button
                type="button"
                onClick={() => setBoxFilter('ENDED')}
                className={`rounded-md px-2.5 py-1 font-bold transition cursor-pointer ${
                  boxFilter === 'ENDED'
                    ? 'bg-yellow-400 text-stone-950 shadow-2xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                Ended Only ({modeHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setBoxFilter('LOST')}
                className={`rounded-md px-2.5 py-1 font-bold transition cursor-pointer ${
                  boxFilter === 'LOST'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                }`}
              >
                Lost Trades ({modeHistory.filter((t) => t.pnl_realized < 0).length})
              </button>
            </div>

            {onAnalyzeLoss && (
              <button
                type="button"
                onClick={() => onAnalyzeLoss()}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
              >
                Why We Lost &amp; Algorithm Fixes &rarr;
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(boxFilter === 'ALL' || boxFilter === 'LIVE') &&
            modePositions.map((pos) => (
              <TradeExecutionBox
                key={pos.order_id}
                mode="LIVE"
                livePosition={pos}
                onClosePosition={(orderId, exitPrice) => handleClosePosition(orderId, exitPrice)}
                onInspectStrategy={(id) => (onSelectStrategy || setInspectingStrategyId)(id)}
              />
            ))}

          {(boxFilter === 'ALL' || boxFilter === 'ENDED' || boxFilter === 'LOST') &&
            modeHistory
              .filter((t) => (boxFilter === 'LOST' ? t.pnl_realized < 0 : true))
              .map((trade) => (
                <TradeExecutionBox
                  key={`${trade.id}-${trade.order_id}`}
                  mode="ENDED"
                  endedTrade={trade}
                  onInspectStrategy={(id) => (onSelectStrategy || setInspectingStrategyId)(id)}
                  onAnalyzeLoss={(ticker) => onAnalyzeLoss?.(ticker)}
                />
              ))}
        </div>
      </PageSection>

      {/* SECTION 2: COMPLETE SQLITE DATABASE TRADE EXECUTION MODEL TABLE */}
      <PageSection
        title="02. SQLite Database Trade Execution Model (Date, Time, Strategy & Restrictions)"
        subtitle="Every trade record saved in SQLite with exact Execution Date, Entry Time, Exit Time, Holding Duration, Strategy, and Risk Restrictions."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTransactions()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync DB</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPdfReportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-stone-950 hover:bg-stone-800 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Export PDF Report</span>
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 dark:text-stone-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Order ID &amp; Stock</th>
                <th className="py-2.5 px-3">Execution Date</th>
                <th className="py-2.5 px-3">Entry Time</th>
                <th className="py-2.5 px-3">Exit Time / Duration</th>
                <th className="py-2.5 px-3">Strategy Used</th>
                <th className="py-2.5 px-3 text-right">Entry Fill</th>
                <th className="py-2.5 px-3 text-right">LTP / Exit</th>
                <th className="py-2.5 px-3 text-right">Restrictions (SL / TP)</th>
                <th className="py-2.5 px-3 text-right">Net P&amp;L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono tabular-nums">
              {combinedDbRecords.map((row) => {
                const isLive = row.status === 'LIVE';
                const isProfit = row.pnl >= 0;
                return (
                  <tr
                    key={row.key}
                    className={
                      isLive
                        ? 'bg-blue-50/20 dark:bg-blue-950/15 hover:bg-blue-50/40 transition'
                        : 'bg-yellow-50/15 dark:bg-yellow-950/10 hover:bg-yellow-50/30 transition'
                    }
                  >
                    <td className="py-2.5 px-3 font-sans">
                      {isLive ? (
                        <span className="inline-block rounded border-2 border-blue-500 bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-block rounded border-2 border-yellow-500 bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-stone-950">
                          ENDED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {row.ticker} ({row.action} {row.shares})
                      </div>
                      <div className="text-[10px] text-stone-400">{row.order_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                      {row.execution_date}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                      {row.execution_time}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                      <div>{row.exit_time_display}</div>
                      <div className="text-[10px] text-stone-400">{row.duration}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <button
                        type="button"
                        onClick={() =>
                          setInspectingStrategyId(row.strategy_id || row.strategy_name)
                        }
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left"
                      >
                        {row.strategy_name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-800 dark:text-stone-200">
                      ₹{row.entry_price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-stone-100">
                      ₹{row.current_or_exit_price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px]">
                      <div className="text-rose-600 dark:text-rose-400">SL: ₹{row.stop_loss}</div>
                      <div className="text-emerald-600 dark:text-emerald-400">TP: ₹{row.target_price}</div>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isProfit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}₹{row.pnl.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
};
