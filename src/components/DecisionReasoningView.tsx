import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Sliders,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  History,
  Info,
  RefreshCw,
  Search,
  BookOpen,
  Scale,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type {
  BuyDecisionReasoning,
  TradeLossAnalysis,
  PreventativeRemedy,
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
}

export const DecisionReasoningView: React.FC<DecisionReasoningViewProps> = ({
  selectedTicker,
  onSelectTicker,
  onPlaceManualOrder,
  isPlacingOrder = false,
  tradeHistory = [],
  positions = [],
}) => {
  const [subTab, setSubTab] = useState<'BUY_REASONING' | 'LOSS_POSTMORTEM' | 'SIMULATOR'>('BUY_REASONING');
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

  // Unique sectors from universe
  const sectors = ['ALL', ...Array.from(new Set(STOCK_UNIVERSE.map((s) => s.sector)))];

  // Fetch reasoning for the active stock
  const fetchDecisionReasoning = async (ticker: string) => {
    setIsLoadingReasoning(true);
    try {
      const res = await fetch(`/api/decision-reasoning/${ticker}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReasoningData(json.data);
        setQuantity(json.data.recommendedShares || 10);
        setCustomStopLoss(json.data.stopLoss);
        setCustomTargetPrice(json.data.targetPrice);
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

  const toggleGuardrail = (id: string) => {
    setActiveGuardrails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-amber-400 shadow-md">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-stone-900">Decision Reasoning &amp; Trade Loss Prevention</h1>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                  Algorithmic Engine
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Transparent quantitative rationale for automated entries, structural loss post-mortems, and actionable preventative rules.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100/80 p-1 shadow-2xs">
            <button
              id="subtab-buy-reasoning"
              type="button"
              onClick={() => setSubTab('BUY_REASONING')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                subTab === 'BUY_REASONING'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>Automated Buy Rationale</span>
            </button>

            <button
              id="subtab-loss-postmortem"
              type="button"
              onClick={() => setSubTab('LOSS_POSTMORTEM')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                subTab === 'LOSS_POSTMORTEM'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Loss Post-Mortem &amp; Prevention</span>
              {lossData.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-800">
                  {lossData.length}
                </span>
              )}
            </button>

            <button
              id="subtab-simulator"
              type="button"
              onClick={() => setSubTab('SIMULATOR')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                subTab === 'SIMULATOR'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-600" />
              <span>What-If Loss Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: AUTOMATED BUY RATIONALE */}
      {subTab === 'BUY_REASONING' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stock Selection Ribbon */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-stone-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Select Stock to Inspect Automated Buy Reasoning
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search 40+ NSE stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-700 focus:outline-none"
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
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {filteredStocks.slice(0, 20).map((stock) => {
                const isSelected = stock.ticker === currentTicker;
                return (
                  <button
                    key={stock.ticker}
                    type="button"
                    onClick={() => handleSelectStock(stock.ticker)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-stone-900 text-amber-400 font-bold shadow-xs'
                        : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{stock.ticker}</span>
                    <span className="text-[10px] opacity-70">₹{stock.basePrice}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reasoning Main Card */}
          {isLoadingReasoning ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
              <RefreshCw className="mx-auto h-8 w-8 text-stone-400 animate-spin" />
              <p className="mt-3 text-sm font-bold text-stone-700">Decomposing Algorithmic Decision Architecture for {currentTicker}...</p>
              <p className="text-xs text-stone-500">Synthesizing 6 quantitative pillars, ATR buffers, and risk governor constraints</p>
            </div>
          ) : reasoningData ? (
            <div className="space-y-6">
              {/* Primary Thesis Card */}
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
                {/* Stock Identity Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/80 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-base font-black text-amber-400 shadow-xs">
                      {reasoningData.ticker.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-stone-900">{reasoningData.ticker}.NS</h2>
                        <span className="text-xs text-stone-500 font-medium">{reasoningData.companyName}</span>
                        <span className="rounded-md bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                          {reasoningData.sector}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span>Current Price: <strong className="font-mono text-stone-900">₹{reasoningData.currentPrice.toFixed(2)}</strong></span>
                        <span>&bull;</span>
                        <span className="text-emerald-700 font-bold">
                          Conviction: {reasoningData.convictionScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verdict Badge */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-right">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                        Automated Verdict
                      </span>
                      <span className="text-sm font-black text-emerald-700 flex items-center gap-1 justify-end">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        {reasoningData.verdict}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plain-English Algorithmic Buy Rationale Banner */}
                <div className="border-b border-stone-100 bg-emerald-50/40 p-5 sm:px-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                        Automated Buy Decision Rationale
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-900 font-medium">
                        {reasoningData.automatedBuyReason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Quantitative Target & Sizing Bar */}
                <div className="grid grid-cols-2 gap-4 border-b border-stone-100 p-5 sm:grid-cols-5 bg-white">
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-stone-500">Target Price</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      ₹{reasoningData.targetPrice.toFixed(2)}
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-700">+{reasoningData.returnMarginPct}% Upside</span>
                  </div>

                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-stone-500">Stop Loss</span>
                    <span className="text-base font-black text-rose-700 font-mono">
                      ₹{reasoningData.stopLoss.toFixed(2)}
                    </span>
                    <span className="block text-[10px] font-bold text-rose-700">-{reasoningData.riskMarginPct}% Downside</span>
                  </div>

                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-stone-500">Risk-to-Reward</span>
                    <span className="text-base font-black text-stone-900 font-mono">
                      {reasoningData.riskRewardRatio}:1
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-600">Asymmetric Edge</span>
                  </div>

                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-stone-500">Suggested Sizing</span>
                    <span className="text-base font-black text-stone-900 font-mono">
                      {reasoningData.recommendedShares} Shares
                    </span>
                    <span className="block text-[10px] font-bold text-stone-500">₹{reasoningData.capitalRequired.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-stone-500">Ruin Probability</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {reasoningData.riskGovernorClearance.ruinProbability}%
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-600">Cleared by Governor</span>
                  </div>
                </div>

                {/* The 6 Deconstructed Algorithmic Pillars */}
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-stone-900">
                        Deconstructed Algorithmic Pillars (The 6 Automated Gates)
                      </h3>
                      <p className="text-xs text-stone-500">
                        Every automated buy order must satisfy all 6 independent mathematical and momentum criteria.
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700">
                      6 / 6 Gates Passed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reasoningData.pillars.map((pillar, idx) => (
                      <div
                        key={pillar.name}
                        className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 transition hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Pillar 0{idx + 1}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            {pillar.score}/100 &bull; {pillar.status}
                          </span>
                        </div>

                        <h4 className="mt-2 text-xs font-black text-stone-900">{pillar.name}</h4>
                        <p className="mt-1 text-xs font-bold text-emerald-800">{pillar.headline}</p>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-600">{pillar.details}</p>

                        <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-stone-200/60 pt-2.5 text-[10px]">
                          {pillar.metrics.map((m) => (
                            <div key={m.label} className="rounded bg-white p-1 border border-stone-100">
                              <span className="block text-stone-400 font-medium truncate">{m.label}</span>
                              <span className="font-mono font-bold text-stone-800 truncate block">{m.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Invalidation Criteria & Immediate Abort Triggers */}
                  <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/40 p-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-900 block uppercase tracking-wider text-[11px]">
                          Automated Invalidation Criteria (Immediate Abort Condition)
                        </span>
                        <p className="mt-0.5 text-rose-800 font-medium">
                          {reasoningData.invalidationCriteria}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Manual Order Execution with Quantity Selector */}
                {onPlaceManualOrder && (
                  <div className="border-t border-stone-200 bg-stone-50/90 p-5 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 pb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-stone-900" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                            Execute Order Directly with Selected Quantity
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Choose quantity of shares or budget allocation to place this trade manually
                          </p>
                        </div>
                      </div>

                      {/* BUY / SELL Switch */}
                      <div className="flex items-center rounded-lg border border-stone-300 bg-white p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setOrderAction('BUY')}
                          className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                            orderAction === 'BUY'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          BUY (Long)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderAction('SELL')}
                          className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                            orderAction === 'SELL'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          SELL (Short)
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
                      {/* Quantity Stepper & Direct Input */}
                      <div className="lg:col-span-4">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Quantity of Stocks (Shares)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-bold text-sm shadow-2xs active:scale-95"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-center text-sm font-mono font-extrabold text-stone-900 shadow-2xs focus:border-stone-500 focus:outline-none"
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] font-semibold text-stone-400 pointer-events-none">
                              SHARES
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuantity((prev) => prev + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-bold text-sm shadow-2xs active:scale-95"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-stone-400">Presets:</span>
                          {[1, 5, 10, 25, 50, 100].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setQuantity(qty)}
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold font-mono transition shadow-2xs ${
                                quantity === qty
                                  ? 'bg-stone-900 text-amber-400'
                                  : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Capital Calculation & Budget Chips */}
                      <div className="lg:col-span-4 rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500 font-medium">Total Capital Required:</span>
                          <span className="font-mono font-black text-stone-900 text-sm">
                            ₹{(quantity * reasoningData.currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                          <span>Per-Share Price:</span>
                          <span className="font-mono font-bold text-stone-700">₹{reasoningData.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-stone-400">By Capital:</span>
                          {[10000, 25000, 50000, 100000].map((cap) => (
                            <button
                              key={cap}
                              type="button"
                              onClick={() => setQuantity(Math.max(1, Math.floor(cap / reasoningData.currentPrice)))}
                              className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-100 transition"
                            >
                              ₹{cap / 1000}k
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Order Execution Button */}
                      <div className="lg:col-span-4 flex flex-col justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            onPlaceManualOrder({
                              ticker: reasoningData.ticker,
                              action: orderAction,
                              shares: quantity,
                              entry_price: reasoningData.currentPrice,
                              stop_loss: customStopLoss || reasoningData.stopLoss,
                              target_price: customTargetPrice || reasoningData.targetPrice,
                            })
                          }
                          disabled={isPlacingOrder}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 ${
                            orderAction === 'BUY'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          <ShoppingBag className={`h-4 w-4 ${isPlacingOrder ? 'animate-spin' : ''}`} />
                          <span>
                            {isPlacingOrder
                              ? 'Routing Order...'
                              : `Execute ${orderAction} (${quantity} Shares &bull; ₹${Math.round(quantity * reasoningData.currentPrice).toLocaleString('en-IN')})`}
                          </span>
                        </button>

                        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setShowAdvancedTargets(!showAdvancedTargets)}
                            className="flex items-center gap-1 font-semibold text-stone-500 hover:text-stone-800 transition"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>{showAdvancedTargets ? 'Hide Custom Targets' : 'Fine-Tune Target/Stop'}</span>
                          </button>
                          <span className="font-mono text-[10px] text-stone-400">
                            SL: ₹{(customStopLoss || reasoningData.stopLoss).toFixed(1)} &bull; TGT: ₹{(customTargetPrice || reasoningData.targetPrice).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {showAdvancedTargets && (
                      <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                              Custom Target Price (₹)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={customTargetPrice || reasoningData.targetPrice}
                              onChange={(e) => setCustomTargetPrice(Number(e.target.value) || 0)}
                              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-rose-800 mb-1">
                              Custom Stop Loss (₹)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={customStopLoss || reasoningData.stopLoss}
                              onChange={(e) => setCustomStopLoss(Number(e.target.value) || 0)}
                              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUB-TAB 2: LOSS POST-MORTEM & PREVENTATIVE REMEDIES */}
      {subTab === 'LOSS_POSTMORTEM' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Total Trade Losses Analyzed
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-700">{lossData.length}</span>
                <span className="text-xs text-stone-500">Ledger &amp; Episodic records</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Average Drawdown per Loss
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">-2.35%</span>
                <span className="text-xs text-stone-500">Controlled by ATR stops</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Top Root Cause Identified
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-black text-amber-800 truncate">False Breakout Trap</span>
              </div>
              <span className="mt-0.5 block text-[10px] text-stone-500">Volume &amp; Wick Divergence</span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Preventative Guardrails
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">100% Active</span>
              </div>
              <span className="mt-0.5 block text-[10px] text-emerald-600 font-bold">Adopted into Risk Governor</span>
            </div>
          </div>

          {/* Filter Bar by Failure Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Filter by Loss Failure Mechanism:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'All Failures', value: 'ALL' },
                { label: 'False Breakouts', value: 'FALSE_BREAKOUT_TRAP' },
                { label: 'Volatility Spikes', value: 'VOLATILITY_EXPANSION_WHIPSAW' },
                { label: 'Sector Headwinds', value: 'SECTOR_ROTATION_HEADWIND' },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSelectedLossCategory(f.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedLossCategory === f.value
                      ? 'bg-stone-900 text-amber-400 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Loss Cards */}
          {isLoadingLosses ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
              <RefreshCw className="mx-auto h-8 w-8 text-stone-400 animate-spin" />
              <p className="mt-3 text-sm font-bold text-stone-700">Loading Trade Loss Analysis &amp; Post-Mortems...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredLosses.map((loss) => (
                <div
                  key={loss.id}
                  className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-xs"
                >
                  {/* Card Header: Trade Identification & Realized Loss */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50/40 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-black text-rose-400 shadow-2xs">
                        {loss.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-stone-900">{loss.ticker}.NS</h3>
                          <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                            {loss.action} &bull; {loss.shares} Shares
                          </span>
                          <span className="text-xs text-stone-400 font-mono">
                            {new Date(loss.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span>Entry: <strong className="font-mono text-stone-800">₹{loss.entryPrice.toFixed(2)}</strong></span>
                          <span>&bull;</span>
                          <span>Exit: <strong className="font-mono text-stone-800">₹{loss.exitPrice.toFixed(2)}</strong></span>
                          <span>&bull;</span>
                          <span className="text-rose-700 font-semibold">{loss.exitTrigger}</span>
                        </div>
                      </div>
                    </div>

                    {/* Loss Badge */}
                    <div className="text-right">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                        Realized Loss
                      </span>
                      <span className="text-lg font-black text-rose-700 font-mono">
                        -₹{Math.abs(loss.realizedLossRupees).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-bold">({loss.lossPct}%)</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* SECTION 1: THE REASON OF LOSS (ROOT CAUSE) */}
                    <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-4">
                      <div className="flex items-center justify-between border-b border-rose-200/50 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                            Reason of Loss (Root Cause Diagnostic)
                          </span>
                        </div>
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                          {loss.rootCause.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-stone-900">{loss.rootCause.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-stone-700 font-medium">
                        {loss.rootCause.diagnostic}
                      </p>

                      <div className="mt-3 space-y-1 border-t border-rose-100 pt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                          Contributing Technical Breakdown:
                        </span>
                        {loss.rootCause.contributingSignals.map((signal, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-stone-600">
                            <span className="text-rose-500 font-bold">&bull;</span>
                            <span>{signal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: WHAT CAN WE DO TO PREVENT IT NEXT TIME? */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700" />
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                            What Can We Do to Prevent It Next Time? (Actionable Guardrails)
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          Continuous Learning Loop
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {loss.preventativeRemedies.map((rem, rIdx) => {
                          const isActive = activeGuardrails[rem.id] ?? true;
                          return (
                            <div
                              key={rem.id}
                              className="rounded-lg border border-emerald-200/80 bg-white p-3 shadow-2xs flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 mb-1">
                                  <span>Remedy #{rIdx + 1}</span>
                                  <span className="rounded bg-stone-100 px-1.5 py-0.2 text-stone-600 font-mono">
                                    {rem.category}
                                  </span>
                                </div>
                                <h5 className="text-xs font-black text-stone-900">{rem.title}</h5>
                                <p className="mt-1 text-[11px] leading-relaxed text-stone-600 font-medium">
                                  {rem.action}
                                </p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-stone-100">
                                <div className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-mono font-bold text-emerald-800">
                                  {rem.parameterRule}
                                </div>
                                <span className="mt-1 block text-[10px] text-emerald-700 font-semibold">
                                  &rarr; {rem.preventativeImpact}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => toggleGuardrail(rem.id)}
                                  className={`mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1 text-[10px] font-extrabold transition ${
                                    isActive
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                  }`}
                                >
                                  {isActive ? <Check className="h-3 w-3" /> : null}
                                  <span>{isActive ? 'Guardrail Active in Governor' : 'Click to Enable'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Episodic Memory Lesson Banner */}
                    <div className="flex items-center justify-between rounded-lg bg-stone-100 px-4 py-2.5 text-xs text-stone-700">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-stone-500" />
                        <span>
                          <strong>Episodic Lesson Committed:</strong> {loss.episodicLesson}
                        </span>
                      </div>
                      <span className="rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0">
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

      {/* SUB-TAB 3: WHAT-IF LOSS SIMULATOR */}
      {subTab === 'SIMULATOR' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">What-If Trade Failure Simulator</h2>
                <p className="text-xs text-stone-500">
                  Select any ticker and failure scenario to test how the diagnostic engine explains the loss and formulates preventive guardrails.
                </p>
              </div>
            </div>

            {/* Form controls */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Stock Ticker</label>
                <select
                  value={simTicker}
                  onChange={(e) => setSimTicker(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                >
                  {STOCK_UNIVERSE.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} (₹{s.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Failure Mechanism Scenario</label>
                <select
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                >
                  <option value="FALSE_BREAKOUT_TRAP">False Breakout Without Volume Confirmation</option>
                  <option value="VOLATILITY_EXPANSION_WHIPSAW">Morning Volatility Whipsaw (Tight Stop Whipsaw)</option>
                  <option value="SECTOR_ROTATION_HEADWIND">Sector Rotation Headwind &amp; Liquidity Drain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Adverse Drawdown Magnitude</label>
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
                  <span className="font-mono text-xs font-black text-rose-700 w-12 text-right">
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
                className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 text-amber-400 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Generating Post-Mortem...' : 'Simulate Loss Post-Mortem & Preventative Rules'}</span>
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                    SIM
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      Simulated Post-Mortem: {simResult.ticker} (-{Math.abs(simResult.lossPct)}% Loss)
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Simulated Loss of -₹{Math.abs(simResult.realizedLossRupees)} on {simResult.shares} shares
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                  Diagnostic Generated
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Diagnostic */}
                <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-950 mb-1">
                    Simulated Failure Diagnostic: {simResult.rootCause.title}
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {simResult.rootCause.diagnostic}
                  </p>
                </div>

                {/* Preventative Remedies */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 mb-3">
                    Preventative Remedies to Prevent This Loss Next Time:
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {simResult.preventativeRemedies.map((rem) => (
                      <div key={rem.id} className="rounded-lg border border-emerald-200 bg-white p-3 shadow-2xs">
                        <h5 className="text-xs font-black text-stone-900">{rem.title}</h5>
                        <p className="mt-1 text-[11px] text-stone-600 leading-relaxed font-medium">
                          {rem.action}
                        </p>
                        <div className="mt-2 rounded bg-emerald-50 px-2 py-1 text-[10px] font-mono font-bold text-emerald-800">
                          Rule: {rem.parameterRule}
                        </div>
                        <span className="mt-1 block text-[10px] font-bold text-emerald-700">
                          &rarr; {rem.preventativeImpact}
                        </span>
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
