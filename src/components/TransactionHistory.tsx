import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Activity,
} from 'lucide-react';
import type { TransactionRecord, ExecutedPosition, SystemConfig } from '../types';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
  openPositions?: ExecutedPosition[];
  onRefresh: () => Promise<void>;
  onClearLedger?: () => Promise<void>;
  onSelectTickerForPipeline?: (ticker: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  openPositions = [],
  onRefresh,
  onClearLedger,
  onSelectTickerForPipeline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ENTRIES' | 'EXITS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to resolve active trade details (from live openPositions prop or enriched txn)
  const getActivePositionData = (txn: TransactionRecord) => {
    let activePos: ExecutedPosition | undefined;
    if (openPositions && openPositions.length > 0) {
      activePos = openPositions.find((p) => p.order_id === txn.order_id);
      if (!activePos && (txn.type === 'ENTRY_BUY' || txn.type === 'ENTRY_SELL')) {
        activePos = openPositions.find((p) => p.ticker === txn.ticker);
      }
    }

    const isActive = txn.is_active || !!activePos;
    const currentPrice = activePos?.current_price ?? txn.current_price ?? txn.price;

    let currentPnl: number | undefined = activePos?.unrealized_pnl ?? txn.current_pnl;
    let currentPnlPct: number | undefined = activePos?.unrealized_pnl_pct ?? txn.current_pnl_pct;

    if (isActive && currentPnl === undefined) {
      currentPnl =
        txn.action === 'BUY'
          ? (currentPrice - txn.price) * txn.shares
          : (txn.price - currentPrice) * txn.shares;
      currentPnlPct = ((currentPnl) / (txn.price * txn.shares)) * 100;
    }

    return {
      isActive,
      currentPrice,
      currentPnl,
      currentPnlPct,
    };
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
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
        matchType = txn.type === 'EXIT_CLOSE' || txn.type === 'STOP_LOSS' || txn.type === 'TARGET_EXIT';
      }

      let matchStatus = true;
      const { isActive } = getActivePositionData(txn);
      if (statusFilter === 'ACTIVE') {
        matchStatus = isActive;
      } else if (statusFilter === 'CLOSED') {
        matchStatus = !isActive;
      }

      return matchSearch && matchAction && matchType && matchStatus;
    });
  }, [transactions, openPositions, searchTerm, actionFilter, typeFilter, statusFilter]);

  // Aggregate Metrics
  const totalCount = transactions.length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.total_value, 0);
  const buyVolume = transactions.filter((t) => t.action === 'BUY').reduce((sum, t) => sum + t.total_value, 0);
  const sellVolume = transactions.filter((t) => t.action === 'SELL').reduce((sum, t) => sum + t.total_value, 0);

  const closedTransactions = transactions.filter((t) => t.realized_pnl !== undefined);
  const totalRealizedPnl = closedTransactions.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  const winCount = closedTransactions.filter((t) => (t.realized_pnl || 0) > 0).length;
  const winRate = closedTransactions.length > 0 ? (winCount / closedTransactions.length) * 100 : 0;

  // Active trades aggregates
  const activeTransactions = transactions.filter((t) => getActivePositionData(t).isActive);
  const totalActivePnl = activeTransactions.reduce((sum, t) => sum + (getActivePositionData(t).currentPnl || 0), 0);

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
    if (transactions.length === 0) return;
    const headers = [
      'Transaction ID',
      'Order ID',
      'Timestamp',
      'Ticker',
      'Company Name',
      'Sector',
      'Action',
      'Type',
      'Shares',
      'Fill Price (INR)',
      'Total Value (INR)',
      'Current Price (INR)',
      'Current Profit/Loss (INR)',
      'Current Return %',
      'Is Active',
      'Stop Loss',
      'Target Price',
      'Rupee Risk',
      'Realized PnL (INR)',
      'Realized Return %',
      'Execution Mode',
      'Status',
      'Notes',
    ];

    const rows = transactions.map((t) => {
      const pos = getActivePositionData(t);
      return [
        t.id,
        t.order_id,
        t.timestamp,
        t.ticker,
        `"${t.company_name || t.ticker}"`,
        `"${t.sector || 'NSE'}"`,
        t.action,
        t.type,
        t.shares,
        t.price,
        t.total_value,
        pos.currentPrice.toFixed(2),
        pos.isActive && pos.currentPnl !== undefined ? pos.currentPnl.toFixed(2) : '',
        pos.isActive && pos.currentPnlPct !== undefined ? pos.currentPnlPct.toFixed(2) : '',
        pos.isActive ? 'YES' : 'NO',
        t.stop_loss || '',
        t.target_price || '',
        t.rupee_risk || '',
        t.realized_pnl ?? '',
        t.realized_pnl_pct ?? '',
        t.execution_mode,
        t.status,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nse_trading_bot_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="transaction-history-container" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">Transaction Audit Ledger</h2>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-700">
              {totalCount} Total Events
            </span>
            {activeTransactions.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                {activeTransactions.length} Active Trades
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Immutable chronological record of every paper-simulated and broker-routed transaction, live mark-to-market active trades profit/loss, execution slippage, risk stops, and realized gains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-transactions"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Turnover Volume</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">
            ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span>Buy: ₹{buyVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span>Sell: ₹{sellVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Active Trades Live Profit/Loss Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Active Trades P&L</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <p className={`mt-1 text-2xl font-extrabold ${totalActivePnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalActivePnl >= 0 ? '+' : ''}₹{totalActivePnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span>{activeTransactions.length} Active Position{activeTransactions.length === 1 ? '' : 's'}</span>
            <span className="font-semibold text-stone-600">Live MTM</span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Net Realized P&L</span>
          <p className={`mt-1 text-2xl font-extrabold ${totalRealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-stone-500">
            From {closedTransactions.length} closed round-trips
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Round-Trip Win Rate</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">{winRate.toFixed(1)}%</p>
          <span className="text-[11px] text-stone-500">
            {winCount} Profitable / {closedTransactions.length} Closed
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Execution Pipeline</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">0.05%</p>
          <span className="text-[11px] text-stone-500">
            Slippage model applied on fills
          </span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            id="input-search-transactions"
            type="text"
            placeholder="Search by Ticker, TXN ID, or Order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Filter (All, Active, Closed) */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition ${
              statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === 'ACTIVE' ? 'bg-white animate-ping' : 'bg-emerald-500'}`}></span>
            Active Trades ({activeTransactions.length})
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              statusFilter === 'CLOSED' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Closed
          </button>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Actions
          </button>
          <button
            onClick={() => setActionFilter('BUY')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'BUY' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setActionFilter('SELL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              actionFilter === 'SELL' ? 'bg-rose-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('ENTRIES')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'ENTRIES' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Entries
          </button>
          <button
            onClick={() => setTypeFilter('EXITS')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              typeFilter === 'EXITS' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Exits & Closes
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Txn ID / Time</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Type & Action</th>
                <th className="px-4 py-3 text-right">Shares</th>
                <th className="px-4 py-3 text-right">Fill Price</th>
                <th className="px-4 py-3 text-right">Total Value</th>
                <th className="px-4 py-3">Stops & Target</th>
                <th className="px-4 py-3 text-right">Current Profit / Loss</th>
                <th className="px-4 py-3 text-right">Realized P&L</th>
                <th className="px-4 py-3">Mode & Status</th>
                <th className="px-4 py-3">Notes / Reflection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-stone-400 font-sans">
                    No transactions matching your criteria. Execute trades via the pipeline to log real transactions here.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isBuy = txn.action === 'BUY';
                  const isEntry = txn.type === 'ENTRY_BUY' || txn.type === 'ENTRY_SELL';
                  const hasPnl = txn.realized_pnl !== undefined;
                  const posData = getActivePositionData(txn);

                  return (
                    <tr key={txn.id} className="hover:bg-stone-50/80 transition">
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectTickerForPipeline && onSelectTickerForPipeline(txn.ticker)}
                            className="font-bold text-stone-900 hover:text-amber-600 transition"
                            title="Analyze in 4-layer pipeline"
                          >
                            {txn.ticker}
                          </button>
                          <span className="rounded bg-stone-100 px-1 text-[9px] text-stone-500">.NS</span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[140px]">
                          {txn.company_name || txn.ticker}
                        </div>
                        {txn.sector && (
                          <span className="text-[9px] text-stone-400">{txn.sector}</span>
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

                      {/* NEW COLUMN: Current Profit / Loss (for Active Trades) */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {posData.isActive && posData.currentPnl !== undefined ? (
                          <div className="flex flex-col items-end">
                            <div className={`font-bold font-mono text-xs flex items-center gap-1.5 ${posData.currentPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${posData.currentPnl >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${posData.currentPnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              </span>
                              <span>
                                {posData.currentPnl >= 0 ? '+' : ''}₹{posData.currentPnl.toFixed(2)}
                              </span>
                            </div>
                            <div className={`text-[10px] font-semibold ${posData.currentPnlPct !== undefined && posData.currentPnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {posData.currentPnlPct !== undefined && posData.currentPnlPct >= 0 ? '+' : ''}{posData.currentPnlPct?.toFixed(2)}%
                            </div>
                            <span className="text-[9px] text-stone-400 font-sans">
                              CMP: ₹{posData.currentPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : hasPnl ? (
                          <span className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-500 font-sans">
                            Closed
                          </span>
                        ) : (
                          <span className="text-stone-300 font-sans text-[11px]">&mdash;</span>
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
                        ) : posData.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 font-sans">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active Trade
                          </span>
                        ) : (
                          <span className="text-stone-400 font-sans text-[11px]">&mdash;</span>
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
