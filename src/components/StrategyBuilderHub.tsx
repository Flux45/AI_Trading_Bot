import React, { useState } from 'react';
import {
  Plus,
  Play,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Database,
  ArrowRight,
  Clock,
  Calendar,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import {
  PageSection,
  StatMetricCard,
  RestrictionRuleCard,
  StrategyCard,
  UnifiedStrategyItem,
} from './ui/ReusableComponents';

export const StrategyBuilderHub: React.FC = () => {
  const {
    tradingMode,
    handleTradingModeChange,
    allStrategies,
    createCustomStrategy,
    executeTradeWithStrategy,
    setInspectingStrategyId,
    isPlacingOrder,
    positions,
    tradeHistory,
    accounting,
    setActiveTab,
    watchlist,
  } = useTradingContext();

  const [modeFilter, setModeFilter] = useState<'ALL' | 'INTRADAY' | 'LONG'>('ALL');
  const [showBuilderForm, setShowBuilderForm] = useState<boolean>(false);

  // Selected strategy for immediate 1-click trade execution
  const [selectedStrategy, setSelectedStrategy] = useState<UnifiedStrategyItem>(allStrategies[0]);
  const [tradeTicker, setTradeTicker] = useState<string>('RELIANCE');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeShares, setTradeShares] = useState<number>(6);

  // Custom Strategy Builder Form State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Custom Momentum');
  const [customHorizon, setCustomHorizon] = useState<'INTRADAY' | 'LONG'>(
    tradingMode === 'SWING' ? 'LONG' : 'INTRADAY'
  );
  const [customStopLossPct, setCustomStopLossPct] = useState<number>(1.5);
  const [customTargetPct, setCustomTargetPct] = useState<number>(3.75);
  const [customMaxRisk, setCustomMaxRisk] = useState<number>(500);
  const [customEntryRules, setCustomEntryRules] = useState<string>(
    'Price breaks above 15-min Opening Range High with >1.5x average volume above VWAP'
  );
  const [customExitRules, setCustomExitRules] = useState<string>(
    'Exit at +3.75% target or -1.5% hard stop-loss (auto square-off at 15:15 IST)'
  );

  const computedRR =
    customStopLossPct > 0 ? Number((customTargetPct / customStopLossPct).toFixed(2)) : 2.5;

  const filteredStrategies = allStrategies.filter((s) => {
    if (modeFilter === 'ALL') return true;
    return s.horizon === modeFilter;
  });

  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const created = await createCustomStrategy({
      name: customName.trim(),
      category: customCategory,
      horizon: customHorizon,
      stopLossPct: customStopLossPct,
      targetPct: customTargetPct,
      maxRiskRupees: customMaxRisk,
      entryRules: customEntryRules,
      exitRules: customExitRules,
    });
    if (created) {
      setSelectedStrategy(created);
      setCustomName('');
      setShowBuilderForm(false);
    }
  };

  const handleQuickExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return;
    const ok = await executeTradeWithStrategy({
      strategy: selectedStrategy,
      ticker: tradeTicker,
      action: tradeAction,
      shares: tradeShares,
    });
    if (ok) {
      // Switch horizon if needed so user sees the trade in that mode
      const targetHorizonMode = selectedStrategy.horizon === 'LONG' ? 'SWING' : 'INTRADAY';
      if (targetHorizonMode !== tradingMode) {
        handleTradingModeChange(targetHorizonMode);
      }
    }
  };

  const nowIstDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const nowIstTime =
    new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' IST';

  return (
    <div className="space-y-6">
      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMetricCard
          label="Total Account Equity"
          value={`₹${(accounting?.totalEquity || 50000).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          subtext={`Liquid Cash: ₹${(accounting?.liquidCash || 50000).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
        />
        <StatMetricCard
          label="Max Loss Restriction / Trade"
          value="₹500.00"
          subtext="Hard 1% Risk Cap Enforced"
          tone="info"
        />
        <StatMetricCard
          label="Active Open Trades (Blue Box)"
          value={`${positions.length} Live`}
          subtext="Click 'Trades & DB Ledger' to manage"
          tone="positive"
        />
        <StatMetricCard
          label="Closed Trades (Yellow Box)"
          value={`${tradeHistory.length} Ended`}
          subtext="Saved in SQLite with Date & Time"
        />
      </div>

      {/* SECTION 1: PLATFORM RISK RESTRICTIONS */}
      <PageSection
        title="01. Platform Trading Restrictions & Safety Guardrails"
        subtitle="Every online or custom strategy must obey these 4 mathematical risk rules before any order is saved to the SQLite database."
        action={
          <button
            type="button"
            onClick={() => setActiveTab('trades_db')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 transition whitespace-nowrap"
          >
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span>Open Active Trades &amp; SQLite Ledger ({positions.length} Live)</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <RestrictionRuleCard
            title="Max Loss Per Trade"
            limitValue="≤ ₹500 (1%)"
            implication="Automatically reduces share quantity if stop-loss distance would risk more than ₹500 on a single trade."
          />
          <RestrictionRuleCard
            title="Reward-to-Risk Ratio"
            limitValue="≥ 2.5 : 1"
            implication="Requires upside target to be at least 2.5x the stop-loss distance so a 40% win rate remains profitable."
          />
          <RestrictionRuleCard
            title="Sector Concentration"
            limitValue="Max 2 / Sector"
            implication="Blocks opening a 3rd concurrent trade in the same NSE sector (e.g., IT or Banking) to avoid correlated drawdowns."
          />
          <RestrictionRuleCard
            title="Horizon Settlement"
            limitValue={tradingMode === 'INTRADAY' ? '15:15 IST MIS' : 'Multi-Day CNC'}
            implication={
              tradingMode === 'INTRADAY'
                ? 'Same-day MIS positions auto square-off at 15:15 IST to prevent overnight gap risk.'
                : 'Delivery CNC swing trades hold across days with a 2.0x ATR trailing stop.'
            }
          />
        </div>
      </PageSection>

      {/* SECTION 2: INSTANT STRATEGY EXECUTION BAR (CONNECTED TO SQLITE DB MODEL) */}
      <PageSection
        id="strategy-execution-console"
        title="02. Execute Trade with Selected Strategy (SQLite Date & Time Persistence)"
        subtitle="Select any strategy below, verify its restrictions and implications, and execute directly into the SQLite database."
      >
        <form
          onSubmit={handleQuickExecute}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-stone-50 dark:bg-stone-950/70 rounded-xl p-4 border border-stone-200 dark:border-stone-800"
        >
          {/* Selected Strategy Info */}
          <div className="lg:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block">
              Active Strategy &amp; Enforced Bounds
            </label>
            <select
              value={selectedStrategy?.id || ''}
              onChange={(e) => {
                const found = allStrategies.find((s) => s.id === e.target.value);
                if (found) setSelectedStrategy(found);
              }}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100"
            >
              {allStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.horizon} · SL -{s.stopLossPct}% / TP +{s.targetPct}%)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              Implication: {selectedStrategy?.implications}
            </p>
          </div>

          {/* Stock Ticker */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block">
              NSE Stock Ticker
            </label>
            <select
              value={tradeTicker}
              onChange={(e) => setTradeTicker(e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100"
            >
              {watchlist.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-stone-400 block font-mono">
              Mode: {selectedStrategy?.horizon === 'LONG' ? 'LONG (CNC)' : 'INTRADAY (MIS)'}
            </span>
          </div>

          {/* Direction & Shares */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                Side
              </label>
              <select
                value={tradeAction}
                onChange={(e) => setTradeAction(e.target.value as 'BUY' | 'SELL')}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                Shares
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={tradeShares}
                onChange={(e) => setTradeShares(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100 tabular-nums"
              />
            </div>
          </div>

          {/* SQLite Timestamp Preview */}
          <div className="lg:col-span-2 space-y-1 font-mono text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
            <span className="font-sans text-xs font-semibold text-stone-600 dark:text-stone-400 block">
              SQLite DB Stamp
            </span>
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1.5">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span>{nowIstDate}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>{nowIstTime}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white transition whitespace-nowrap cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isPlacingOrder ? 'Saving to DB...' : 'Execute & Save Trade'}</span>
            </button>
          </div>
        </form>
      </PageSection>

      {/* SECTION 3: BROWSE ONLINE STRATEGIES OR MAKE YOUR OWN STRATEGY */}
      <PageSection
        title="03. Online Quant Strategies & Custom Strategy Builder"
        subtitle="Understand how each strategy works, review its capital implications, or build your own custom rule set."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setModeFilter('ALL')}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  modeFilter === 'ALL'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                All ({allStrategies.length})
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('INTRADAY')}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  modeFilter === 'INTRADAY'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Intraday MIS
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('LONG')}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  modeFilter === 'LONG'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Long CNC
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBuilderForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-stone-950 hover:bg-stone-800 transition whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showBuilderForm ? 'Close Strategy Builder' : 'Make Your Own Strategy'}</span>
            </button>
          </div>
        }
      >
        {/* COLLAPSIBLE CUSTOM STRATEGY BUILDER */}
        {showBuilderForm && (
          <form
            onSubmit={handleCreateStrategy}
            className="mb-6 rounded-xl border-2 border-stone-900 dark:border-amber-500/60 bg-stone-50/80 dark:bg-stone-950 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Create Your Own Quantitative Strategy
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Define your entry/exit logic and risk restrictions. Saved directly to the SQLite <code>custom_strategies</code> table.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Computed R:R = {computedRR} : 1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Morning ORB + VWAP Breakout"
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Strategy Category
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Trading Horizon
                </label>
                <select
                  value={customHorizon}
                  onChange={(e) => setCustomHorizon(e.target.value as 'INTRADAY' | 'LONG')}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 font-bold text-stone-900 dark:text-stone-100"
                >
                  <option value="INTRADAY">Intraday (MIS — Same Day 15:15 Square-Off)</option>
                  <option value="LONG">Long / Swing (CNC — Multi-Day Delivery)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="font-sans font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Stop-Loss Restriction (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="10"
                  value={customStopLossPct}
                  onChange={(e) => setCustomStopLossPct(Number(e.target.value) || 1.5)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 tabular-nums"
                />
              </div>

              <div>
                <label className="font-sans font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Target Profit (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="30"
                  value={customTargetPct}
                  onChange={(e) => setCustomTargetPct(Number(e.target.value) || 3.75)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 tabular-nums"
                />
              </div>

              <div>
                <label className="font-sans font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Max Rupee Risk Per Trade (₹)
                </label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  max="2000"
                  value={customMaxRisk}
                  onChange={(e) => setCustomMaxRisk(Number(e.target.value) || 500)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Entry Condition Rules
                </label>
                <input
                  type="text"
                  value={customEntryRules}
                  onChange={(e) => setCustomEntryRules(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Exit &amp; Stop Defense Rules
                </label>
                <input
                  type="text"
                  value={customExitRules}
                  onChange={(e) => setCustomExitRules(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Live Plain-English Implication Preview */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-stone-700 dark:text-stone-300">
              <strong>Strategy Implication Preview:</strong> Every trade executed with this strategy will cap maximum loss at{' '}
              <strong className="font-mono">₹{customMaxRisk}</strong> ({customStopLossPct}% stop-loss) while targeting{' '}
              <strong className="font-mono">+{customTargetPct}%</strong> upside (<strong className="font-mono">{computedRR}:1</strong> reward-to-risk). Breakeven win rate required is only{' '}
              <strong className="font-mono">{Math.round((1 / (1 + computedRR)) * 100)}%</strong>.
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBuilderForm(false)}
                className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-stone-900 dark:bg-amber-500 px-5 py-2 text-xs font-bold text-white dark:text-stone-950 hover:bg-stone-800 transition"
              >
                Save Strategy to SQLite Database
              </button>
            </div>
          </form>
        )}

        {/* STRATEGY CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStrategies.map((strat) => (
            <StrategyCard
              key={strat.id}
              strategy={strat}
              isSelected={selectedStrategy?.id === strat.id}
              onSelectForTrade={(s) => {
                setSelectedStrategy(s);
                const el = document.getElementById('strategy-execution-console');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onInspectTrades={(id) => setInspectingStrategyId(id)}
            />
          ))}
        </div>
      </PageSection>
    </div>
  );
};
