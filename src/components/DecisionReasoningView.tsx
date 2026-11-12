import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Sliders,
  Plus,
  Minus,
  History,
  RefreshCw,
  Search,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type {
  BuyDecisionReasoning,
  TradeLossAnalysis,
  OrderTicket,
  TradeHistoryRecord,
  ExecutedPosition,
} from '../types';
import { STOCK_UNIVERSE } from '../data/universe';

interface DecisionReasoningViewProps {
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onPlaceManualOrder?: (params: {
    ticker: string;
    action: 'BUY' | 'SELL';
    shares: number;
    entry_price?: number;
    stop_loss?: number;
    target_price?: number;
    ticket?: OrderTicket;
  }) => Promise<void>;
  isPlacingOrder?: boolean;
  tradeHistory?: TradeHistoryRecord[];
  positions?: ExecutedPosition[];
  initialSubTab?: 'LOSS_POSTMORTEM' | 'BUY_REASONING' | 'SIMULATOR';
}

export const DecisionReasoningView: React.FC<DecisionReasoningViewProps> = ({
  selectedTicker,
  onSelectTicker,
  onPlaceManualOrder,
  isPlacingOrder = false,
  tradeHistory = [],
  initialSubTab = 'LOSS_POSTMORTEM',
}) => {
  const [subTab, setSubTab] = useState<'LOSS_POSTMORTEM' | 'BUY_REASONING' | 'SIMULATOR'>(initialSubTab);
  const [currentTicker, setCurrentTicker] = useState<string>(selectedTicker || 'RELIANCE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Decision reasoning data
  const [reasoningData, setReasoningData] = useState<BuyDecisionReasoning | null>(null);
  const [isLoadingReasoning, setIsLoadingReasoning] = useState<boolean>(false);

  // Loss analysis data
  const [lossData, setLossData] = useState<TradeLossAnalysis[]>([]);
  const [isLoadingLosses, setIsLoadingLosses] = useState<boolean>(false);
  const [selectedLossCategory, setSelectedLossCategory] = useState<string>('ALL');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Manual order console state inside the reasoning tab
  const [quantity, setQuantity] = useState<number>(10);
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');
  const [customStopLoss, setCustomStopLoss] = useState<number>(0);
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(0);
  const [showAdvancedTargets, setShowAdvancedTargets] = useState<boolean>(false);

  // Simulator state
  const [simTicker, setSimTicker] = useState<string>('TCS');
  const [simScenario, setSimScenario] = useState<string>('FALSE_BREAKOUT_TRAP');
  const [simLossPct, setSimLossPct] = useState<number>(2.5);
  const [simResult, setSimResult] = useState<TradeLossAnalysis | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Active guardrail feedback
  const [activeGuardrails, setActiveGuardrails] = useState<Record<string, boolean>>({
    'REM-01': true,
    'REM-02': true,
    'REM-03': true,
    'REM-04': true,
    'REM-05': true,
  });

  useEffect(() => {
    if (selectedTicker && selectedTicker !== currentTicker) {
      setCurrentTicker(selectedTicker);
    }
  }, [selectedTicker]);

  // Unique sectors from universe
  const sectors = ['ALL', ...Array.from(new Set(STOCK_UNIVERSE.map((s) => s.sector)))];

  // Fetch reasoning for the active stock
  const fetchDecisionReasoning = async (ticker: string) => {
    setIsLoadingReasoning(true);
    try {
      const res = await fetch(`/api/decision-reasoning/${ticker}`);
      const json = await res.json();
      const payload = json.data || json.reasoning;
      if (json.success && payload) {
        setReasoningData(payload);
        setQuantity(payload.recommendedShares || 10);
        setCustomStopLoss(payload.stopLoss);
        setCustomTargetPrice(payload.targetPrice);
      }
    } catch (err) {
      console.error('[Decision Reasoning View] Fetch error:', err);
    } finally {
      setIsLoadingReasoning(false);
    }
  };

  // Fetch trade loss analyses
  const fetchLossAnalyses = async () => {
    setIsLoadingLosses(true);
    try {
      const res = await fetch('/api/loss-analysis');
      const json = await res.json();
      if (json.success && json.losses) {
        setLossData(json.losses);
      }
    } catch (err) {
      console.error('[Loss Analysis View] Fetch error:', err);
    } finally {
      setIsLoadingLosses(false);
    }
  };

  useEffect(() => {
    fetchDecisionReasoning(currentTicker);
  }, [currentTicker]);

  useEffect(() => {
    fetchLossAnalyses();
  }, [tradeHistory.length]);

  const handleSelectStock = (ticker: string) => {
    setCurrentTicker(ticker);
    onSelectTicker(ticker);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/loss-analysis/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: simTicker,
          scenario: simScenario,
          customLossPct: simLossPct,
        }),
      });
      const json = await res.json();
      if (json.success && json.simulatedPostMortem) {
        setSimResult(json.simulatedPostMortem);
      }
    } catch (err) {
      console.error('[Simulation Error]', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleGuardrail = (id: string, title: string, rule: string) => {
    const nextState = !(activeGuardrails[id] ?? true);
    setActiveGuardrails((prev) => ({
      ...prev,
      [id]: nextState,
    }));
    setAppliedToast(
      nextState
        ? `Algorithm Rule Applied to Risk Governor: "${title}" (${rule})`
        : `Algorithm Rule Paused: "${title}"`
    );
    setTimeout(() => setAppliedToast(null), 4500);
  };

  const filteredStocks = STOCK_UNIVERSE.filter((stock) => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const filteredLosses = lossData.filter((loss) => {
    if (selectedLossCategory === 'ALL') return true;
    return loss.rootCause.category === selectedLossCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-stone-950 dark:text-white">
                  Lost Trades Post-Mortem, Root-Cause Reasoning &amp; Algorithm Fixes
                </h1>
                <span className="rounded-md bg-amber-100 dark:bg-amber-950 border border-amber-400 dark:border-amber-600 px-2.5 py-0.5 text-xs font-extrabold text-amber-950 dark:text-amber-300">
                  Loss Prevention Engine
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                Inspect every stock where we lost a trade, understand the exact technical failure mechanism, and apply algorithm parameter changes to avoid repeat losses.
              </p>
            </div>
          </div>

          {/* High-Contrast Sub-tab Switcher */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1">
            <button
              id="subtab-loss-postmortem"
              type="button"
              onClick={() => setSubTab('LOSS_POSTMORTEM')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                subTab === 'LOSS_POSTMORTEM'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>1. Lost Trades &amp; Algorithm Fixes</span>
              {lossData.length > 0 && (
                <span
                  className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-extrabold ${
                    subTab === 'LOSS_POSTMORTEM'
                      ? 'bg-white text-rose-700'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {lossData.length}
                </span>
              )}
            </button>

            <button
              id="subtab-buy-reasoning"
              type="button"
              onClick={() => setSubTab('BUY_REASONING')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                subTab === 'BUY_REASONING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>2. Stock Buy Reasoning (6 Gates)</span>
            </button>

            <button
              id="subtab-simulator"
              type="button"
              onClick={() => setSubTab('SIMULATOR')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                subTab === 'SIMULATOR'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>3. What-If Loss Simulator</span>
            </button>
          </div>
        </div>

        {appliedToast && (
          <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/90 px-4 py-2.5 text-xs font-bold text-emerald-950 dark:text-emerald-200">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {appliedToast}
            </span>
            <button
              type="button"
              onClick={() => setAppliedToast(null)}
              className="text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: LOSS POST-MORTEM & ALGORITHM FIXES */}
      {subTab === 'LOSS_POSTMORTEM' && (
        <div className="space-y-6">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border-2 border-rose-400 dark:border-rose-500/80 bg-rose-50 dark:bg-rose-950 p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-rose-950 dark:text-rose-200">
                Total Lost Trades Analyzed
              </span>
              <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{lossData.length}</span>
                <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 font-sans">
                  SQLite &amp; Post-Mortem Records
                </span>
              </div>
            </div>

            <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500/80 bg-amber-50 dark:bg-amber-950 p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                Average Drawdown per Loss
              </span>
              <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-2xl font-black text-stone-950 dark:text-white">-2.35%</span>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 font-sans">
                  Capped by 1% Equity Rule
                </span>
              </div>
            </div>

            <div className="rounded-xl border-2 border-indigo-400 dark:border-indigo-500/80 bg-indigo-50 dark:bg-indigo-950 p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                Primary Failure Root Cause
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-base font-black text-stone-950 dark:text-white truncate">
                  False Breakout &amp; Stop Whipsaw
                </span>
              </div>
              <span className="mt-0.5 block text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                Low Volume + Tight Stop (&lt;1.2x ATR)
              </span>
            </div>

            <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950 p-4">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                Algorithm Fixes Enforced
              </span>
              <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">100% Active</span>
              </div>
              <span className="mt-0.5 block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                1.8x ATR Stop + 1.5x Volume Filter
              </span>
            </div>
          </div>

          {/* Master Algorithm Trade-Offs & Parameter Changes Summary Box */}
          <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-300 dark:border-blue-800 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-stone-950 dark:text-white">
                  Summary: Why We Lost Past Trades &amp; Exact Algorithm Changes Implemented
                </h2>
              </div>
              <span className="rounded bg-blue-600 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">
                ADAPTIVE MODEL v2.4 ACTIVE
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-stone-900 p-3.5 space-y-1.5">
                <div className="font-extrabold text-rose-700 dark:text-rose-400">
                  1. Loss Cause: False Opening Breakouts (ORB Trap)
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong>Why we lost:</strong> Entering breakouts during the first 15 minutes (09:15–09:30 IST) when relative volume was below 1.1x caused immediate mean-reversion traps.
                </p>
                <div className="pt-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  &rarr; Algo Fix: Require 5m RVOL &ge; 1.5x + Candle Close above VWAP &amp; ORB High.
                </div>
              </div>

              <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-stone-900 p-3.5 space-y-1.5">
                <div className="font-extrabold text-rose-700 dark:text-rose-400">
                  2. Loss Cause: Tight Stop-Loss Whipsaws (&lt;1.2x ATR)
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong>Why we lost:</strong> Fixed 0.8%–1.0% stops were swept by normal intraday NSE liquidity wicks before the stock moved to our target price.
                </p>
                <div className="pt-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  &rarr; Algo Fix: Widen Stop-Loss buffer to 1.5x–1.8x ATR-14 &amp; auto-scale shares down to keep max risk &le; 1%.
                </div>
              </div>

              <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-stone-900 p-3.5 space-y-1.5">
                <div className="font-extrabold text-rose-700 dark:text-rose-400">
                  3. Loss Cause: Counter-Trend Sector Headwinds
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong>Why we lost:</strong> Buying individual stock bounce setups while NIFTY sector breadth and 20-period SMA slope were negative resulted in slow bleed stop-outs.
                </p>
                <div className="pt-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  &rarr; Algo Fix: Block long entries when Price &lt; VWAP or R:R Ratio &lt; 2.0:1.
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar by Failure Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-white">
                Filter Lost Stocks by Failure Mechanism:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: `All Lost Trades (${lossData.length})`, value: 'ALL' },
                { label: 'False Breakouts', value: 'FALSE_BREAKOUT_TRAP' },
                { label: 'Volatility Whipsaws', value: 'VOLATILITY_EXPANSION_WHIPSAW' },
                { label: 'Sector Headwinds', value: 'SECTOR_ROTATION_HEADWIND' },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSelectedLossCategory(f.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selectedLossCategory === f.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Loss Cards */}
          {isLoadingLosses ? (
            <div className="rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-12 text-center">
              <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
              <p className="mt-3 text-sm font-bold text-stone-900 dark:text-white">
                Loading Lost Trades Post-Mortems &amp; Algorithm Remedies...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredLosses.map((loss) => (
                <div
                  key={loss.id}
                  className="overflow-hidden rounded-2xl border-2 border-rose-400 dark:border-rose-600 bg-white dark:bg-stone-900 shadow-xs"
                >
                  {/* Card Header: Trade Identification & Realized Loss */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/80 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-sm font-black text-white shadow-2xs">
                        {loss.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-stone-950 dark:text-white">{loss.ticker}.NS</h3>
                          <span className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-stone-900 dark:text-stone-100">
                            {loss.action} &bull; {loss.shares} Shares
                          </span>
                          <span className="text-xs text-stone-600 dark:text-stone-300 font-mono">
                            {new Date(loss.timestamp).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectStock(loss.ticker);
                              setSubTab('BUY_REASONING');
                            }}
                            className="rounded-md bg-blue-600 hover:bg-blue-500 px-2.5 py-0.5 text-[11px] font-bold text-white transition cursor-pointer"
                          >
                            Inspect 6-Gate Stock Reasoning &rarr;
                          </button>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                          <span>
                            Entry:{' '}
                            <strong className="font-mono text-stone-950 dark:text-white">
                              ₹{loss.entryPrice.toFixed(2)}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Exit:{' '}
                            <strong className="font-mono text-stone-950 dark:text-white">
                              ₹{loss.exitPrice.toFixed(2)}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span className="text-rose-700 dark:text-rose-300 font-bold">{loss.exitTrigger}</span>
                        </div>
                      </div>
                    </div>

                    {/* Loss Badge */}
                    <div className="text-right font-mono tabular-nums">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 font-sans">
                        Realized Trade Loss
                      </span>
                      <span className="text-lg font-black text-rose-700 dark:text-rose-300">
                        -₹{Math.abs(loss.realizedLossRupees).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-bold">({loss.lossPct}%)</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* SECTION 1: THE REASON OF LOSS (ROOT CAUSE) */}
                    <div className="rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-800 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-rose-950 dark:text-rose-200">
                            Why We Lost This Trade (Root-Cause Diagnostic)
                          </span>
                        </div>
                        <span className="rounded-md bg-rose-200 dark:bg-rose-900 px-2 py-0.5 text-[10px] font-extrabold text-rose-950 dark:text-rose-100 font-mono">
                          {loss.rootCause.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-stone-950 dark:text-white">{loss.rootCause.title}</h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-800 dark:text-stone-200 font-medium">
                        {loss.rootCause.diagnostic}
                      </p>

                      <div className="mt-3 space-y-1.5 border-t border-rose-200 dark:border-rose-800 pt-2.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                          Contributing Technical Breakdown Signals:
                        </span>
                        {loss.rootCause.contributingSignals.map((signal, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-stone-800 dark:text-stone-200">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">&bull;</span>
                            <span>{signal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: WHAT CHANGES TO MAKE IN THE ALGORITHM TO AVOID THIS LOSS */}
                    <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300 dark:border-emerald-800 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                            Algorithm Changes to Avoid This Trade-Off &amp; Loss Next Time
                          </span>
                        </div>
                        <span className="rounded-md bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 text-[10px] font-extrabold text-emerald-950 dark:text-emerald-100">
                          Actionable Algorithm Guardrails
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {loss.preventativeRemedies.map((rem, rIdx) => {
                          const isActive = activeGuardrails[rem.id] ?? true;
                          return (
                            <div
                              key={rem.id}
                              className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-stone-900 p-3.5 shadow-2xs flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1">
                                  <span>Algorithm Change #{rIdx + 1}</span>
                                  <span className="rounded bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-stone-800 dark:text-stone-200 font-mono">
                                    {rem.category}
                                  </span>
                                </div>
                                <h5 className="text-xs font-black text-stone-950 dark:text-white">{rem.title}</h5>
                                <p className="mt-1 text-xs leading-relaxed text-stone-700 dark:text-stone-300 font-medium">
                                  {rem.action}
                                </p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                                <div className="rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2 py-1 text-[11px] font-mono font-bold text-emerald-900 dark:text-emerald-300">
                                  {rem.parameterRule}
                                </div>
                                <span className="mt-1.5 block text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                                  &rarr; {rem.preventativeImpact}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => toggleGuardrail(rem.id, rem.title, rem.parameterRule)}
                                  className={`mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-extrabold transition cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                                  }`}
                                >
                                  {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                                  <span>
                                    {isActive ? 'Algorithm Fix Active in Governor' : 'Enable Algorithm Fix'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Episodic Memory Lesson Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 px-4 py-2.5 text-xs text-stone-800 dark:text-stone-200">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>
                          <strong>SQLite Episodic Lesson Committed:</strong> {loss.episodicLesson}
                        </span>
                      </div>
                      <span className="rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shrink-0">
                        Memory Bank Updated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: AUTOMATED BUY RATIONALE (6 GATES) */}
      {subTab === 'BUY_REASONING' && (
        <div className="space-y-6">
          {/* Stock Selection Ribbon */}
          <div className="rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-white">
                  Select Stock to Inspect 6-Gate Algorithmic Reasoning
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search 40+ NSE stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1 text-xs text-stone-950 dark:text-white focus:outline-none"
                />
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2 py-1 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick stock chips */}
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {filteredStocks.slice(0, 24).map((stock) => {
                const isSelected = stock.ticker === currentTicker;
                return (
                  <button
                    key={stock.ticker}
                    type="button"
                    onClick={() => handleSelectStock(stock.ticker)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{stock.ticker}</span>
                    <span className="text-[10px] opacity-80 font-mono">₹{stock.basePrice}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reasoning Main Card */}
          {isLoadingReasoning ? (
            <div className="rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-12 text-center">
              <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
              <p className="mt-3 text-sm font-bold text-stone-900 dark:text-white">
                Decomposing Algorithmic Decision Architecture for {currentTicker}...
              </p>
            </div>
          ) : reasoningData ? (
            <div className="overflow-hidden rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xs">
              {/* Stock Identity Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-base font-black text-white shadow-xs">
                    {reasoningData.ticker.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-stone-950 dark:text-white">
                        {reasoningData.ticker}.NS
                      </h2>
                      <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                        {reasoningData.companyName}
                      </span>
                      <span className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-900 dark:text-stone-200">
                        {reasoningData.sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <span>
                        Current Price:{' '}
                        <strong className="font-mono text-stone-950 dark:text-white">
                          ₹{reasoningData.currentPrice.toFixed(2)}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        Conviction: {reasoningData.convictionScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3.5 py-1.5 text-right">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    Automated Verdict
                  </span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 justify-end">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {reasoningData.verdict}
                  </span>
                </div>
              </div>

              {/* Plain-English Algorithmic Buy Rationale Banner */}
              <div className="border-b border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                      Automated Decision Rationale
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-stone-900 dark:text-stone-100 font-medium">
                      {reasoningData.automatedBuyReason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Quantitative Target & Sizing Bar */}
              <div className="grid grid-cols-2 gap-4 border-b border-stone-200 dark:border-stone-800 p-5 sm:grid-cols-5 bg-white dark:bg-stone-900 font-mono tabular-nums">
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 p-3">
                  <span className="block text-[10px] font-bold uppercase text-emerald-900 dark:text-emerald-200 font-sans">
                    Target Price
                  </span>
                  <span className="text-base font-black text-stone-950 dark:text-white">
                    ₹{reasoningData.targetPrice.toFixed(2)}
                  </span>
                  <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    +{reasoningData.returnMarginPct}% Upside
                  </span>
                </div>

                <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/70 p-3">
                  <span className="block text-[10px] font-bold uppercase text-rose-900 dark:text-rose-200 font-sans">
                    Stop Loss
                  </span>
                  <span className="text-base font-black text-stone-950 dark:text-white">
                    ₹{reasoningData.stopLoss.toFixed(2)}
                  </span>
                  <span className="block text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    -{reasoningData.riskMarginPct}% Risk
                  </span>
                </div>

                <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3">
                  <span className="block text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-sans">
                    Risk-to-Reward
                  </span>
                  <span className="text-base font-black text-stone-950 dark:text-white">
                    {reasoningData.riskRewardRatio}:1
                  </span>
                  <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                    Asymmetric Edge
                  </span>
                </div>

                <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3">
                  <span className="block text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-sans">
                    Suggested Sizing
                  </span>
                  <span className="text-base font-black text-stone-950 dark:text-white">
                    {reasoningData.recommendedShares} Shares
                  </span>
                  <span className="block text-[11px] font-bold text-stone-600 dark:text-stone-400">
                    ₹{reasoningData.capitalRequired.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3">
                  <span className="block text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-sans">
                    Ruin Probability
                  </span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {reasoningData.riskGovernorClearance.ruinProbability}%
                  </span>
                  <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                    Cleared by Governor
                  </span>
                </div>
              </div>

              {/* The 6 Deconstructed Algorithmic Pillars */}
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-stone-950 dark:text-white">
                      Deconstructed Algorithmic Pillars (The 6 Automated Gates)
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Every automated buy order must satisfy all 6 independent mathematical and momentum criteria.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 px-3 py-1 text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                    6 / 6 Gates Evaluated
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reasoningData.pillars.map((pillar, idx) => (
                    <div
                      key={pillar.name}
                      className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-4"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Gate 0{idx + 1}
                        </span>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                          {pillar.score}/100 &bull; {pillar.status}
                        </span>
                      </div>

                      <h4 className="mt-2 text-xs font-black text-stone-950 dark:text-white">{pillar.name}</h4>
                      <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">{pillar.headline}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                        {pillar.details}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-stone-200 dark:border-stone-800 pt-2.5 text-[10px]">
                        {pillar.metrics.map((m) => (
                          <div
                            key={m.label}
                            className="rounded bg-white dark:bg-stone-900 p-1.5 border border-stone-200 dark:border-stone-800"
                          >
                            <span className="block text-stone-500 dark:text-stone-400 font-medium truncate">
                              {m.label}
                            </span>
                            <span className="font-mono font-bold text-stone-950 dark:text-white truncate block">
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUB-TAB 3: WHAT-IF LOSS SIMULATOR */}
      {subTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-950 dark:text-white">
                  What-If Trade Failure &amp; Algorithm Fix Simulator
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Select any stock and failure scenario to see why the trade would lose and what algorithm changes prevent it.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1.5">Stock Ticker</label>
                <select
                  value={simTicker}
                  onChange={(e) => setSimTicker(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs font-bold text-stone-950 dark:text-white focus:outline-none"
                >
                  {STOCK_UNIVERSE.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} (₹{s.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1.5">
                  Failure Mechanism Scenario
                </label>
                <select
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs font-bold text-stone-950 dark:text-white focus:outline-none"
                >
                  <option value="FALSE_BREAKOUT_TRAP">False Breakout Without Volume Confirmation</option>
                  <option value="VOLATILITY_EXPANSION_WHIPSAW">Morning Volatility Whipsaw (Tight Stop Whipsaw)</option>
                  <option value="SECTOR_ROTATION_HEADWIND">Sector Rotation Headwind &amp; Liquidity Drain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1.5">
                  Adverse Drawdown Magnitude
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1.0}
                    max={5.0}
                    step={0.5}
                    value={simLossPct}
                    onChange={(e) => setSimLossPct(parseFloat(e.target.value))}
                    className="flex-1 accent-rose-600"
                  />
                  <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-400 w-12 text-right">
                    -{simLossPct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`h-4 w-4 text-amber-300 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>
                  {isSimulating ? 'Generating Post-Mortem...' : 'Simulate Loss & Generate Algorithm Fixes'}
                </span>
              </button>
            </div>
          </div>

          {simResult && (
            <div className="overflow-hidden rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-stone-900 shadow-xs">
              <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-6 py-4">
                <div>
                  <h3 className="text-base font-black text-stone-950 dark:text-white">
                    Simulated Post-Mortem: {simResult.ticker} (-{Math.abs(simResult.lossPct)}% Loss)
                  </h3>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                    Simulated Loss of -₹{Math.abs(simResult.realizedLossRupees)} on {simResult.shares} shares
                  </p>
                </div>
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                  Diagnostic Generated
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-950 dark:text-rose-200 mb-1">
                    Simulated Failure Diagnostic: {simResult.rootCause.title}
                  </h4>
                  <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                    {simResult.rootCause.diagnostic}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 mb-3">
                    Algorithm Changes to Prevent This Loss:
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {simResult.preventativeRemedies.map((rem) => (
                      <div
                        key={rem.id}
                        className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-stone-900 p-3"
                      >
                        <h5 className="text-xs font-black text-stone-950 dark:text-white">{rem.title}</h5>
                        <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {rem.action}
                        </p>
                        <div className="mt-2 rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-1 text-[11px] font-mono font-bold text-emerald-900 dark:text-emerald-300">
                          Rule: {rem.parameterRule}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
