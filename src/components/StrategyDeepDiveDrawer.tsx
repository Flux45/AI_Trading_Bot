import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Target,
  Clock,
  Layers,
  BarChart2,
  Code,
  Sliders,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Lock,
} from 'lucide-react';
import type { DiscoveredAlgoStrategy, StrategyLedger, StrategyActiveHolding } from '../types';
import { InteractiveTradingViewModal } from './InteractiveTradingViewModal';

interface StrategyDeepDiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: DiscoveredAlgoStrategy | null;
  ledger: StrategyLedger | null;
  onResetLedger?: (strategyId: string) => Promise<void>;
  onToggleApproval?: (strategy: DiscoveredAlgoStrategy) => void;
  onRunBacktest?: (strategyId: string) => void;
}

export const StrategyDeepDiveDrawer: React.FC<StrategyDeepDiveDrawerProps> = ({
  isOpen,
  onClose,
  strategy,
  ledger,
  onResetLedger,
  onToggleApproval,
  onRunBacktest,
}) => {
  const [activeTab, setActiveTab] = useState<'HOLDINGS' | 'TRADES' | 'LOGIC_MATH' | 'CODE' | 'CONFIG'>('HOLDINGS');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [selectedStockForChart, setSelectedStockForChart] = useState<StrategyActiveHolding | null>(null);

  if (!isOpen || !strategy) return null;

  const holdings = ledger?.active_holdings || [];
  const closedTrades = ledger?.closed_trades || [];

  const initialCap = ledger?.initial_capital || strategy.deployment_config?.max_capital_allocation || 25000;
  const totalEquity = ledger?.total_equity || initialCap;
  const liquidCash = ledger?.liquid_cash ?? initialCap;
  const netReturn = ledger?.net_return_rupees ?? 0;
  const netReturnPct = ledger?.net_return_pct ?? 0;
  const isProfitable = netReturn >= 0;

  const handleReset = async () => {
    if (!onResetLedger || isResetting) return;
    setIsResetting(true);
    try {
      await onResetLedger(strategy.id);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs">
      {/* Sliding Drawer Container */}
      <div className="relative h-full w-full max-w-4xl bg-white dark:bg-[#11141c] text-stone-900 dark:text-white shadow-2xl flex flex-col border-l border-stone-200 dark:border-stone-800 animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#161a24] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  {strategy.name}
                </h2>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {strategy.categoryLabel}
                </span>
                {strategy.id === 'algo-flagship-cognitive-q' && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold text-indigo-400 border border-indigo-500/30">
                    FLAGSHIP BENCHMARK
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Source: {strategy.author_or_source}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRunBacktest && (
              <button
                onClick={() => onRunBacktest(strategy.id)}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 transition"
              >
                <BarChart2 className="h-3.5 w-3.5 text-amber-500" />
                Backtest Lab
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition"
              title="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Isolated ₹25,000 Portfolio Ribbon */}
        <div className="border-b border-stone-200 dark:border-stone-800 bg-amber-50/40 dark:bg-amber-500/5 px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Isolated Virtual Ledger (₹{initialCap.toLocaleString('en-IN')} Capital Envelope)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  24/7 Live Forward-Testing
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="text-2xl font-black font-mono text-stone-900 dark:text-white">
                  ₹{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-bold font-mono ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isProfitable ? '+' : ''}₹{netReturn.toFixed(2)} ({isProfitable ? '+' : ''}{netReturnPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-stone-400 block font-sans">Liquid Cash</span>
                <span className="font-bold text-stone-700 dark:text-stone-200">
                  ₹{liquidCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-sans">Win Rate</span>
                <span className="font-bold text-emerald-500">
                  {ledger?.win_rate_pct ?? strategy.audited_metrics.win_rate_pct}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-sans">Sharpe Ratio</span>
                <span className="font-bold text-amber-500">
                  {ledger?.sharpe_ratio ?? strategy.audited_metrics.sharpe_ratio}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-sans">Profit Factor</span>
                <span className="font-bold text-stone-700 dark:text-stone-200">
                  {ledger?.profit_factor ?? strategy.audited_metrics.profit_factor}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 block font-sans">Max Drawdown</span>
                <span className="font-bold text-stone-700 dark:text-stone-200">
                  {ledger?.max_drawdown_pct ?? strategy.audited_metrics.max_drawdown_pct}%
                </span>
              </div>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-[11px] font-sans font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                title="Reset this isolated sub-ledger to ₹25,000"
              >
                <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                Reset Capital
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141822] px-6 text-xs">
          <button
            onClick={() => setActiveTab('HOLDINGS')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 font-semibold transition ${
              activeTab === 'HOLDINGS'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Active Holdings &amp; Positions ({holdings.length})
          </button>

          <button
            onClick={() => setActiveTab('TRADES')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 font-semibold transition ${
              activeTab === 'TRADES'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Closed Forward-Trades ({closedTrades.length})
          </button>

          <button
            onClick={() => setActiveTab('LOGIC_MATH')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 font-semibold transition ${
              activeTab === 'LOGIC_MATH'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mathematical Rules &amp; Edge
          </button>

          <button
            onClick={() => setActiveTab('CODE')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 font-semibold transition ${
              activeTab === 'CODE'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            Algorithm Code
          </button>

          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 font-semibold transition ${
              activeTab === 'CONFIG'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Deployment &amp; Risk Limits
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#0f121a]">
          {/* TAB 1: ACTIVE HOLDINGS */}
          {activeTab === 'HOLDINGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Current Active Positioning
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Live positions monitored 24/7 with real-time mark-to-market valuations and ATR dynamic stops.
                  </p>
                </div>
              </div>

              {holdings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-800 p-8 text-center text-xs text-stone-500">
                  No active open positions in this isolated sub-ledger currently. The background sentinel scans the universe every 25 seconds for eligible setups.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141824]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#191e2c] text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      <tr>
                        <th className="py-3 px-4">Instrument</th>
                        <th className="py-3 px-4 text-right">Shares</th>
                        <th className="py-3 px-4 text-right">Entry Fill Price</th>
                        <th className="py-3 px-4 text-right">Live CMP</th>
                        <th className="py-3 px-4 text-right">Unrealized P&amp;L</th>
                        <th className="py-3 px-4 text-right">Stop Loss (Red)</th>
                        <th className="py-3 px-4 text-right">Target (Blue)</th>
                        <th className="py-3 px-4 text-right">R:R Ratio</th>
                        <th className="py-3 px-4 text-center">Chart Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                      {holdings.map((h, idx) => {
                        const isWin = h.unrealized_pnl >= 0;
                        return (
                          <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                            <td className="py-3.5 px-4 font-sans">
                              <div className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                                {h.ticker}
                              </div>
                              <div className="text-[10px] text-stone-500">{h.company_name}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-white">
                              {h.shares}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{h.entry_fill_price.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-white">
                              ₹{h.current_price.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`font-black ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isWin ? '+' : ''}₹{h.unrealized_pnl.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-stone-400">
                                ({isWin ? '+' : ''}{h.unrealized_pnl_pct.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-rose-500 font-semibold">
                              ₹{h.stop_loss.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-sky-500 font-semibold">
                              ₹{h.target_price.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-amber-500 font-bold">
                              {h.risk_reward_ratio}:1
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setSelectedStockForChart(h)}
                                className="inline-flex items-center gap-1 rounded-md bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 px-2.5 py-1 text-[11px] font-sans font-bold hover:bg-stone-800 dark:hover:bg-amber-400 transition shadow-xs"
                                title="Visualize entry, stop loss, and target lines on interactive chart"
                              >
                                <Eye className="h-3 w-3" />
                                Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Market Scenario Rationale Notes for Holdings */}
              {holdings.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Live Trade Rationales &amp; Scenarios
                  </h4>
                  {holdings.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141822] p-3 text-xs flex items-start gap-2.5"
                    >
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-white mr-1.5">{h.ticker}:</span>
                        <span className="text-stone-600 dark:text-stone-300">{h.market_scenario_rationale}</span>
                        <span className="block mt-1 font-mono text-[10px] text-stone-400">
                          Execution Fill: {new Date(h.execution_timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST • Capital: ₹{h.capital_allocated.toFixed(0)} • Max Risk: ₹{h.rupee_risk.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOSED TRADES */}
          {activeTab === 'TRADES' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Forward-Tested Closed Trade Log
              </h3>
              {closedTrades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-800 p-8 text-center text-xs text-stone-500">
                  No closed trades recorded yet for this strategy. As the 24/7 pulse executes and exits trades, outcomes will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141824]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#191e2c] text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3 text-right">Shares</th>
                        <th className="py-2.5 px-3 text-right">Entry</th>
                        <th className="py-2.5 px-3 text-right">Exit</th>
                        <th className="py-2.5 px-3 text-right">Realized P&amp;L</th>
                        <th className="py-2.5 px-3">Lesson &amp; Attribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                      {closedTrades.map((t, idx) => {
                        const isWin = t.pnl_realized >= 0;
                        return (
                          <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                            <td className="py-2.5 px-3 text-[11px] text-stone-500 whitespace-nowrap">
                              {new Date(t.timestamp).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 font-bold font-sans text-stone-900 dark:text-white">
                              {t.ticker}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold font-sans ${
                                t.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {t.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">{t.shares}</td>
                            <td className="py-2.5 px-3 text-right">₹{t.entry_price.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">₹{t.exit_price.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-black ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isWin ? '+' : ''}₹{t.pnl_realized.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-stone-400">
                                ({isWin ? '+' : ''}{t.pnl_pct.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-[11px] text-stone-600 dark:text-stone-300">
                              {t.lesson}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MATHEMATICAL RULES & EDGE */}
          {activeTab === 'LOGIC_MATH' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141822] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Mathematical Formula (LaTeX Specification)
                </span>
                <div className="mt-1 rounded-lg bg-white dark:bg-stone-900 p-3 font-mono text-sm text-amber-600 dark:text-amber-300 border border-stone-200 dark:border-stone-800 overflow-x-auto">
                  {strategy.mathematical_formula}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141822] p-4 text-xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Economic &amp; Structural Rationale
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans text-sm">
                  {strategy.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                      Entry Rule:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs font-sans">
                      {strategy.logic_summary.entry_rule}
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
                    <span className="font-bold text-sky-600 dark:text-sky-400 block mb-1">
                      Exit Rule:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs font-sans">
                      {strategy.logic_summary.exit_rule}
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                      Stop-Loss Guard:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs font-sans">
                      {strategy.logic_summary.stop_loss_rule}
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
                    <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                      Position Sizing:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs font-sans">
                      {strategy.logic_summary.position_sizing}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALGORITHM CODE */}
          {activeTab === 'CODE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  Target Universe: <span className="text-amber-400 font-mono">{strategy.target_universe}</span>
                </span>
                <span className="text-xs font-mono text-stone-400">
                  Overfitting Score: <span className="font-bold text-emerald-400">{strategy.overfitting_risk_score}/100 (Low Risk)</span>
                </span>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-950 p-4 font-mono text-xs text-stone-200 overflow-x-auto shadow-inner leading-relaxed">
                <pre>{strategy.code_snippet}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: DEPLOYMENT CONFIG */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-5 max-w-xl">
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141822] p-4 text-xs space-y-3">
                <h4 className="font-bold text-stone-900 dark:text-white">
                  Independent Capital Allocation &amp; Safety Controls
                </h4>
                <p className="text-stone-500 dark:text-stone-400">
                  Each strategy operates on an independent, isolated ledger with zero cross-contamination. Losing trades here do not impact the core balance of other strategies.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Virtual Capital Allocation (INR)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`₹${initialCap.toLocaleString('en-IN')}`}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-2 font-mono text-xs text-stone-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-stone-400">
                      Standardized to ₹25,000 for pure benchmark comparison.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Hard Invalidation Stop Loss Buffer (%)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${strategy.deployment_config?.hard_stop_loss_pct || 1.5}%`}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-2 font-mono text-xs text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Continuous 24/7 Evaluator Sentinel
                    </label>
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Running continuously with 25-second live market quote polling and SQLite WAL durability.</span>
                    </div>
                  </div>
                </div>
              </div>

              {onToggleApproval && strategy.id !== 'algo-flagship-cognitive-q' && (
                <div className="pt-2">
                  <button
                    onClick={() => onToggleApproval(strategy)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                      strategy.is_approved_for_paper
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {strategy.is_approved_for_paper ? 'Pause 24/7 Forward Testing' : 'Activate 24/7 Forward Testing'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#161a24] px-6 py-3.5 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Isolated Multi-Tenancy Architecture: Strict Pre-Trade Risk Governor</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 dark:bg-stone-800 px-4 py-1.5 font-semibold text-white hover:bg-stone-800 dark:hover:bg-stone-700 transition"
          >
            Close Breakdown
          </button>
        </div>
      </div>

      {/* Embedded Interactive Chart Modal when stock clicked */}
      {selectedStockForChart && (
        <InteractiveTradingViewModal
          isOpen={!!selectedStockForChart}
          onClose={() => setSelectedStockForChart(null)}
          ticker={selectedStockForChart.ticker}
          companyName={selectedStockForChart.company_name}
          entryPrice={selectedStockForChart.entry_fill_price}
          currentPrice={selectedStockForChart.current_price}
          stopLoss={selectedStockForChart.stop_loss}
          targetPrice={selectedStockForChart.target_price}
          shares={selectedStockForChart.shares}
          strategyName={strategy.name}
          marketScenario={selectedStockForChart.market_scenario_rationale}
          executionTimestamp={selectedStockForChart.execution_timestamp}
        />
      )}
    </div>
  );
};
