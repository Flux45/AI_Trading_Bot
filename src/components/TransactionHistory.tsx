import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Database,
  Zap,
} from 'lucide-react';
import type { TransactionRecord, ExecutedPosition, TradingHorizonMode } from '../types';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
  openPositions?: ExecutedPosition[];
  onRefresh: () => Promise<void>;
  onClearLedger?: () => Promise<void>;
  onSelectTickerForPipeline?: (ticker: string) => void;
  onClosePosition?: (orderId: string, exitPrice: number, exitReason?: string) => Promise<void>;
  onOpenPdfReport?: () => void;
  tradingMode?: TradingHorizonMode;
  onTradingModeChange?: (mode: TradingHorizonMode) => void;
  onSelectStrategy?: (strategyIdOrName: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  openPositions = [],
  onRefresh,
  onSelectTickerForPipeline,
  onClosePosition,
  onOpenPdfReport,
  tradingMode = 'INTRADAY',
  onTradingModeChange,
  onSelectStrategy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ENTRIES' | 'EXITS'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isIntraday = tradingMode === 'INTRADAY';

  // 100% Isolated active positions for the current horizon mode
  const modePositions = useMemo(() => {
    return (openPositions || []).filter((p) => {
      if (isIntraday) {
        return (
          p.trade_mode === 'INTRADAY' ||
          p.product_type === 'MIS' ||
          (!p.trade_mode && p.product_type !== 'CNC')
        );
      }
      return (
        p.trade_mode === 'LONG' ||
        p.trade_mode === 'SWING' ||
        p.product_type === 'CNC' ||
        (!p.trade_mode && p.product_type !== 'MIS')
      );
    });
  }, [openPositions, isIntraday]);

  // 100% Isolated transactions for the current horizon mode
  const modeTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (isIntraday) {
        return (
          txn.trade_mode === 'INTRADAY' ||
          txn.product_type === 'MIS' ||
          (!txn.trade_mode && txn.product_type !== 'CNC')
        );
      }
      return (
        txn.trade_mode === 'LONG' ||
        txn.trade_mode === 'SWING' ||
        txn.product_type === 'CNC' ||
        (!txn.trade_mode && txn.product_type !== 'MIS')
      );
    });
  }, [transactions, isIntraday]);

  // Filtered transactions for search & selection
  const filteredTransactions = useMemo(() => {
    return modeTransactions.filter((txn) => {
      const matchSearch =
        txn.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (txn.company_name && txn.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchAction = actionFilter === 'ALL' || txn.action === actionFilter;

      let matchType = true;
      if (typeFilter === 'ENTRIES') {
        matchType = txn.type === 'ENTRY_BUY' || txn.type === 'ENTRY_SELL';
      } else if (typeFilter === 'EXITS') {
        matchType =
          txn.type === 'EXIT_CLOSE' ||
          txn.type === 'STOP_LOSS' ||
          txn.type === 'TARGET_EXIT';
      }

      return matchSearch && matchAction && matchType;
    });
  }, [modeTransactions, searchTerm, actionFilter, typeFilter]);

  // Aggregate Metrics strictly scoped to current mode
  const totalCount = modeTransactions.length;
  const totalVolume = modeTransactions.reduce((sum, t) => sum + t.total_value, 0);
  const buyVolume = modeTransactions.filter((t) => t.action === 'BUY').reduce((sum, t) => sum + t.total_value, 0);
  const sellVolume = modeTransactions.filter((t) => t.action === 'SELL').reduce((sum, t) => sum + t.total_value, 0);

  const closedTransactions = modeTransactions.filter((t) => t.realized_pnl !== undefined);
  const totalRealizedPnl = closedTransactions.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  const winCount = closedTransactions.filter((t) => (t.realized_pnl || 0) > 0).length;
  const winRate = closedTransactions.length > 0 ? (winCount / closedTransactions.length) * 100 : 0;
  const entriesCount = modeTransactions.filter((t) => t.type === 'ENTRY_BUY' || t.type === 'ENTRY_SELL').length;
  const exitsCount = closedTransactions.length;

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (modeTransactions.length === 0) return;
    const headers = [
      'Transaction ID',
      'Order ID',
      'Timestamp',
      'Ticker',
      'Company Name',
      'Product Type',
      'Action',
      'Type',
      'Shares',
      'Fill Price (INR)',
      'Total Value (INR)',
      'Stop Loss',
      'Target Price',
      'Realized PnL (INR)',
      'Realized Return %',
      'Execution Mode',
      'Status',
      'Strategy',
      'Notes',
    ];

    const rows = modeTransactions.map((t) => [
      t.id,
      t.order_id,
      t.timestamp,
      t.ticker,
      `"${t.company_name || t.ticker}"`,
      t.product_type || (isIntraday ? 'MIS' : 'CNC'),
      t.action,
      t.type,
      t.shares,
      t.price,
      t.total_value,
      t.stop_loss || '',
      t.target_price || '',
      t.realized_pnl ?? '',
      t.realized_pnl_pct ?? '',
      t.execution_mode,
      t.status,
      `"${t.strategy_name || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `nse_${isIntraday ? 'intraday' : 'long'}_transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="transaction-history-container" className="space-y-6">
      {/* SYSTEM SWITCHABLE TABS BANNER */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Audit Horizon
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-700">
              <Database className="h-3 w-3 text-stone-500" />
              Isolated DB: {isIntraday ? 'intraday_trades.sqlite' : 'long_trades.sqlite'}
            </span>
          </div>
          <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
            {isIntraday ? '⚡ Intraday Transaction Audit Ledger (MIS)' : '📈 Long Trading Transaction Audit Ledger (CNC)'}
          </h2>
          <p className="text-xs text-stone-500">
            {isIntraday
              ? 'Immutable log of same-day Intraday MIS orders, entries, stop hits, and 15:15 square-offs.'
              : 'Immutable log of multi-day Delivery CNC accumulation, rotational rebalances, and swing targets.'}
          </p>
        </div>

        <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onTradingModeChange?.('INTRADAY')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs ${
              isIntraday
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${isIntraday ? 'fill-stone-950 text-stone-950' : 'text-amber-500'}`} />
            <span>⚡ Intraday Ledger (MIS)</span>
          </button>
          <button
            type="button"
            onClick={() => onTradingModeChange?.('SWING')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs ${
              !isIntraday
                ? 'bg-blue-600 text-white font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-white" />
            <span>📈 Long Ledger (CNC)</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS ROW - STREAMLINED & NON-REPETITIVE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-sans">
            Turnover Volume
          </span>
          <p className="mt-1 font-mono text-xl font-black text-stone-900">
            ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span>Buy: ₹{buyVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span>Sell: ₹{sellVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-sans">
            Net Realized P&amp;L
          </span>
          <p className={`mt-1 font-mono text-xl font-black ${totalRealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-stone-500 block mt-1">
            From {closedTransactions.length} closed round-trips
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-sans">
            Round-Trip Win Rate
          </span>
          <p className="mt-1 font-mono text-xl font-black text-purple-700">
            {winRate.toFixed(1)}%
          </p>
          <span className="text-[10px] text-stone-500 block mt-1">
            {winCount} Profitable / {closedTransactions.length} Closed
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-sans">
            Executed Orders
          </span>
          <p className="mt-1 font-mono text-xl font-black text-stone-900">
            {totalCount} Orders
          </p>
          <span className="text-[10px] text-stone-500 block mt-1">
            {entriesCount} Entries &bull; {exitsCount} Exits
          </span>
        </div>
      </div>

      {/* ACTIVE TRADES SECTION: LIVE TRADES (BLUE BOUNDARY BOXES) & ENDED TRADES (YELLOW LINE BOXES) */}
      {(modePositions.length > 0 || closedTransactions.length > 0) && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <h3 className="text-sm font-black text-stone-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                <span>Active Trades — {isIntraday ? 'Intraday (MIS)' : 'Long (CNC)'} Status Overview</span>
                <span className="rounded-md border-2 border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-black px-2 py-0.5">
                  🔵 {modePositions.length} LIVE (Blue Box)
                </span>
                <span className="rounded-md border-2 border-yellow-400 bg-yellow-400/15 text-yellow-800 dark:text-yellow-300 font-mono text-[10px] font-black px-2 py-0.5">
                  🟡 {closedTransactions.length} ENDED (Yellow Line Box)
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                Blue Boundary = LIVE TRADE
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-yellow-400 bg-yellow-50 px-2 py-0.5 text-yellow-900">
                <span className="h-0.5 w-3 bg-yellow-500" />
                Yellow Line Box = ENDED TRADE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* LIVE TRADES IN BLUE BOUNDARY BOXES */}
            {modePositions.map((pos) => {
              const currentPrice = pos.current_price || pos.fill_price;
              const invested = pos.fill_price * pos.shares;
              const pnl = pos.action === 'BUY'
                ? (currentPrice - pos.fill_price) * pos.shares
                : (pos.fill_price - currentPrice) * pos.shares;
              const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <div
                  key={pos.order_id}
                  className="rounded-xl border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 p-3.5 shadow-sm ring-2 ring-blue-500/15 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between border-b-2 border-blue-300 dark:border-blue-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        LIVE TRADE
                      </span>
                      <span className="font-mono text-xs font-black text-stone-900 dark:text-white">
                        {pos.ticker}
                      </span>
                      <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                        {pos.product_type || (isIntraday ? 'MIS' : 'CNC')}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-xs font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isProfit ? '+' : ''}₹{pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white/80 dark:bg-stone-900/70 rounded-lg p-2 border border-blue-200 dark:border-blue-900">
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Shares</span>
                      <strong className="text-stone-900 dark:text-white">{pos.shares} ({pos.action})</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Entry</span>
                      <strong className="text-stone-700 dark:text-stone-300">₹{pos.fill_price.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-blue-600 block font-sans uppercase font-bold">Live LTP</span>
                      <strong className="text-blue-700 dark:text-blue-300">₹{currentPrice.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => onSelectStrategy?.(pos.strategy_id || pos.strategy_name || 'algo-flagship-cognitive-q')}
                      className="inline-flex items-center gap-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold px-2 py-0.5 border border-purple-200 transition truncate max-w-[180px]"
                    >
                      🔍 {pos.strategy_name || 'Quantitative Strategy'}
                    </button>
                    <div className="flex items-center gap-2 font-mono text-stone-500">
                      <span>SL: ₹{pos.stop_loss}</span>
                      <span>TP: ₹{pos.target_price}</span>
                      {onClosePosition && (
                        <button
                          type="button"
                          onClick={() => onClosePosition(pos.order_id, currentPrice, 'Manual Discretionary Exit')}
                          className="rounded bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 text-[9px] font-bold transition"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ENDED TRADES IN BOXES WITH YELLOW LINES */}
            {closedTransactions.slice(0, 6).map((txn, idx) => {
              const pnl = txn.realized_pnl || 0;
              const pnlPct = txn.realized_pnl_pct || 0;
              const isProfit = pnl >= 0;

              return (
                <div
                  key={`${txn.id}-ended-${idx}`}
                  className="rounded-xl border-2 border-yellow-400 bg-yellow-50/40 dark:bg-yellow-950/20 p-3.5 shadow-sm ring-2 ring-yellow-400/20 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between border-b-2 border-dashed border-yellow-400 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-yellow-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-stone-950 border border-yellow-500">
                        ENDED TRADE
                      </span>
                      <span className="font-mono text-xs font-black text-stone-900 dark:text-white">
                        {txn.ticker}
                      </span>
                      <span className="rounded bg-yellow-200/80 text-yellow-950 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                        {txn.product_type || (isIntraday ? 'MIS' : 'CNC')}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-xs font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isProfit ? '+' : ''}₹{pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white/85 dark:bg-stone-900/70 rounded-lg p-2 border-y-2 border-yellow-300 dark:border-yellow-700/60">
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Shares</span>
                      <strong className="text-stone-900 dark:text-white">{txn.shares} ({txn.action})</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-yellow-700 block font-sans uppercase font-bold">Exit Fill</span>
                      <strong className="text-stone-900 dark:text-white">₹{txn.price.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-sans uppercase">Turn Value</span>
                      <strong className="text-stone-700 dark:text-stone-300">₹{txn.total_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-yellow-400 text-[10px]">
                    {txn.strategy_name ? (
                      <button
                        type="button"
                        onClick={() => onSelectStrategy?.(txn.strategy_id || txn.strategy_name)}
                        className="inline-flex items-center gap-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold px-2 py-0.5 border border-purple-200 transition truncate max-w-[180px]"
                      >
                        🔍 {txn.strategy_name}
                      </button>
                    ) : (
                      <span className="text-stone-500 font-mono">{txn.type.replace('_', ' ')}</span>
                    )}
                    <span className="font-mono text-yellow-900 dark:text-yellow-300 font-semibold">
                      Closed &bull; {new Date(txn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            id="input-search-transactions"
            type="text"
            placeholder={`Search ${isIntraday ? 'Intraday' : 'Long'} by Ticker, TXN ID, or Order...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-hidden font-sans"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActionFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Actions
          </button>
          <button
            type="button"
            onClick={() => setActionFilter('BUY')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'BUY' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setActionFilter('SELL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'SELL' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('ENTRIES')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'ENTRIES' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Entries
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('EXITS')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'EXITS' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Exits
          </button>
        </div>

        {/* Actions: Refresh & Exports */}
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-transactions"
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-export-pdf"
            type="button"
            onClick={onOpenPdfReport || (() => { window.location.href = '/api/export-trades-pdf'; })}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-xs"
            title="Official PDF Audit Report"
          >
            <Download className="h-3.5 w-3.5 text-stone-950" />
            <span>PDF Report</span>
          </button>

          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-xs"
            title="Export CSV spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* TRANSACTIONS TABLE - CLEAR, DETAILED, NO REPETITION */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Txn ID / Time</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Type &amp; Action</th>
                <th className="px-4 py-3 text-right">Shares</th>
                <th className="px-4 py-3 text-right">Fill Price</th>
                <th className="px-4 py-3 text-right">Total Value</th>
                <th className="px-4 py-3">Stops &amp; Target</th>
                <th className="px-4 py-3 text-right">Realized P&amp;L</th>
                <th className="px-4 py-3">Mode &amp; Status</th>
                <th className="px-4 py-3">Strategy Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-stone-400 font-sans">
                    No transactions matching your criteria in the <strong>{isIntraday ? 'Intraday (MIS)' : 'Long (CNC)'}</strong> system.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn, idx) => {
                  const isBuy = txn.action === 'BUY';
                  const isEntry = txn.type === 'ENTRY_BUY' || txn.type === 'ENTRY_SELL';
                  const hasPnl = txn.realized_pnl !== undefined;
                  const prodBadge = txn.product_type || (isIntraday ? 'MIS' : 'CNC');

                  return (
                    <tr key={`${txn.id}-${txn.order_id}-${idx}`} className="hover:bg-stone-50/80 transition">
                      {/* Txn ID & Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{txn.id}</div>
                        <div className="text-[10px] text-stone-400 font-sans">
                          {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}{' '}
                          &bull; {new Date(txn.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                        <span className="text-[9px] text-stone-400">Order: {txn.order_id}</span>
                      </td>

                      {/* Instrument */}
                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTickerForPipeline?.(txn.ticker)}
                            className="font-bold text-stone-900 hover:text-amber-600 transition"
                            title="Analyze in 4-layer pipeline"
                          >
                            {txn.ticker}
                          </button>
                          <span className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                            prodBadge === 'CNC' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {prodBadge}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[140px]">
                          {txn.company_name || txn.ticker}
                        </div>
                        {txn.strategy_name && (
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={() => onSelectStrategy?.(txn.strategy_id || txn.strategy_name)}
                              className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-[9px] font-sans font-semibold px-1.5 py-0.2 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                              title={`Click to inspect all trades & return for ${txn.strategy_name}`}
                            >
                              🔍 {txn.strategy_name}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Action & Type */}
                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isBuy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isBuy ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownLeft className="h-3 w-3" />
                            )}
                            {txn.action}
                          </span>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              isEntry
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {txn.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Shares */}
                      <td className="px-4 py-3 text-right font-bold text-stone-900 whitespace-nowrap">
                        {txn.shares}
                      </td>

                      {/* Fill Price */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-stone-900">₹{txn.price.toFixed(2)}</div>
                        <span className="text-[9px] text-stone-400 font-sans">0.05% slippage applied</span>
                      </td>

                      {/* Total Value */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-stone-900">
                        ₹{txn.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Stops & Target */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                        {txn.target_price && txn.stop_loss ? (
                          <div>
                            <div className="text-emerald-700">TGT: ₹{txn.target_price.toFixed(2)}</div>
                            <div className="text-rose-700">STP: ₹{txn.stop_loss.toFixed(2)}</div>
                            {txn.rupee_risk && (
                              <div className="text-[9px] text-stone-400">Risk: ₹{txn.rupee_risk}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 font-sans">&mdash;</span>
                        )}
                      </td>

                      {/* Realized PnL */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                        {hasPnl ? (
                          <div>
                            <div className={txn.realized_pnl! >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {txn.realized_pnl! >= 0 ? '+' : ''}₹{txn.realized_pnl!.toFixed(2)}
                            </div>
                            <div className={`text-[10px] ${txn.realized_pnl_pct! >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {txn.realized_pnl_pct! >= 0 ? '+' : ''}{txn.realized_pnl_pct!.toFixed(2)}%
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-500 font-sans">
                            Position Opened
                          </span>
                        )}
                      </td>

                      {/* Mode & Status */}
                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600 w-fit">
                            <ShieldCheck className="h-2.5 w-2.5 text-stone-500" />
                            {txn.execution_mode}
                          </span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200 w-fit">
                            {txn.status}
                          </span>
                        </div>
                      </td>

                      {/* Notes / Rationale */}
                      <td className="px-4 py-3 font-sans text-xs text-stone-600 max-w-[260px]">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">
                          {txn.notes || 'Automated execution through quantitative risk pipeline.'}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
