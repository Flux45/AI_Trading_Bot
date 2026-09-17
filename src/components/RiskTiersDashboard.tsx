import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  Clock,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import type { ScannedStock, RiskLevel, StockUniverseItem } from '../types';
import { SECTORS } from '../data/universe';

interface RiskTiersDashboardProps {
  scannedStocks: ScannedStock[];
  isScanning: boolean;
  onRefreshScan: () => Promise<void>;
  onSelectStockForPipeline: (ticker: string) => void;
  onAddCustomTicker?: (ticker: string, sector?: string) => Promise<void>;
}

type SelectedTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPARISON';

export const RiskTiersDashboard: React.FC<RiskTiersDashboardProps> = ({
  scannedStocks,
  isScanning,
  onRefreshScan,
  onSelectStockForPipeline,
  onAddCustomTicker,
}) => {
  const [activeTier, setActiveTier] = useState<SelectedTier>('LOW');
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customTickerInput, setCustomTickerInput] = useState<string>('');
  const [customSectorInput, setCustomSectorInput] = useState<string>('Banking & Finance');
  const [isAddingTicker, setIsAddingTicker] = useState<boolean>(false);
  const [tickerAddFeedback, setTickerAddFeedback] = useState<string | null>(null);

  // Filter stocks by tier, sector, and search term
  const filterByTierAndSector = (tier: 'LOW' | 'MEDIUM' | 'HIGH') => {
    return scannedStocks
      .filter((s) => {
        // Map risk tier
        const matchesTier =
          tier === 'LOW'
            ? s.risk_level === 'LOW'
            : tier === 'MEDIUM'
            ? s.risk_level === 'MEDIUM' || s.risk_level === 'BALANCED'
            : s.risk_level === 'HIGH' || s.risk_level === 'ELEVATED';

        // Sector match
        const matchesSector =
          selectedSector === 'All Sectors' || s.sector.toLowerCase() === selectedSector.toLowerCase();

        // Search match
        const matchesSearch =
          !searchQuery ||
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sector.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTier && matchesSector && matchesSearch;
      })
      .sort((a, b) => {
        // Best return first, with tie-break on risk-reward and opportunity score
        if (b.return_margin_pct !== a.return_margin_pct) {
          return b.return_margin_pct - a.return_margin_pct;
        }
        return b.risk_reward_ratio - a.risk_reward_ratio;
      });
  };

  const lowRiskStocks = useMemo(() => filterByTierAndSector('LOW'), [scannedStocks, selectedSector, searchQuery]);
  const mediumRiskStocks = useMemo(() => filterByTierAndSector('MEDIUM'), [scannedStocks, selectedSector, searchQuery]);
  const highRiskStocks = useMemo(() => filterByTierAndSector('HIGH'), [scannedStocks, selectedSector, searchQuery]);

  // Active list based on selected tier
  const activeStockList = useMemo(() => {
    if (activeTier === 'LOW') return lowRiskStocks;
    if (activeTier === 'MEDIUM') return mediumRiskStocks;
    if (activeTier === 'HIGH') return highRiskStocks;
    return [];
  }, [activeTier, lowRiskStocks, mediumRiskStocks, highRiskStocks]);

  // Tier Metrics Computation
  const getTierStats = (list: ScannedStock[]) => {
    if (list.length === 0) {
      return {
        count: 0,
        maxReturn: '0.0',
        avgReturn: '0.0',
        avgDays: '0',
        avgRR: '0.0',
        avgAtrPct: '0.0',
      };
    }
    const count = list.length;
    const maxReturn = Math.max(...list.map((s) => s.return_margin_pct)).toFixed(1);
    const avgReturn = (list.reduce((sum, s) => sum + s.return_margin_pct, 0) / count).toFixed(1);
    const avgDays = Math.round(list.reduce((sum, s) => sum + (s.approx_days_to_target || 7), 0) / count);
    const avgRR = (list.reduce((sum, s) => sum + s.risk_reward_ratio, 0) / count).toFixed(1);
    const avgAtrPct = (list.reduce((sum, s) => sum + s.atr_pct, 0) / count).toFixed(2);
    return { count, maxReturn, avgReturn, avgDays, avgRR, avgAtrPct };
  };

  const lowStats = useMemo(() => getTierStats(lowRiskStocks), [lowRiskStocks]);
  const mediumStats = useMemo(() => getTierStats(mediumRiskStocks), [mediumRiskStocks]);
  const highStats = useMemo(() => getTierStats(highRiskStocks), [highRiskStocks]);

  const activeStats = activeTier === 'LOW' ? lowStats : activeTier === 'MEDIUM' ? mediumStats : highStats;

  // Global search matches across all tiers and sectors
  const globalSearchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return scannedStocks.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [scannedStocks, searchQuery]);

  // Sector breakdown count for the active tier
  const sectorCountsForActiveTier = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStockList.forEach((s) => {
      counts[s.sector] = (counts[s.sector] || 0) + 1;
    });
    return counts;
  }, [activeStockList]);

  // Handle adding any custom NSE ticker
  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTickerInput.trim()) return;
    setIsAddingTicker(true);
    setTickerAddFeedback(null);
    try {
      if (onAddCustomTicker) {
        await onAddCustomTicker(customTickerInput.toUpperCase().trim(), customSectorInput);
      } else {
        const res = await fetch('/api/universe/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: customTickerInput.toUpperCase().trim(),
            sector: customSectorInput,
          }),
        });
        if (res.ok) {
          await onRefreshScan();
        }
      }
      setTickerAddFeedback(`Added ${customTickerInput.toUpperCase()} to universe and refreshed scanner!`);
      setCustomTickerInput('');
      setTimeout(() => setTickerAddFeedback(null), 4000);
    } catch (err: any) {
      setTickerAddFeedback(`Failed to add: ${err?.message || 'Check symbol'}`);
    } finally {
      setIsAddingTicker(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-400 shadow-xs">
                <Target className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                Best Returns by Risk Tier
              </h2>
              <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-600">
                NSE Multi-Sector Universe ({scannedStocks.length} Stocks)
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Ranked algorithmic selection of stocks offering maximum return margin relative to Volatility (ATR), 20-Day Trend Momentum, and Invalidation Risk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="risk-tiers-refresh-btn"
              onClick={onRefreshScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-stone-500 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning Universe...' : 'Refresh All'}
            </button>
          </div>
        </div>

        {/* Tier Selector Navigation Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Tab 1: Low Risk */}
          <button
            id="tier-tab-low-risk"
            onClick={() => setActiveTier('LOW')}
            className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
              activeTier === 'LOW'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-900">Low Risk</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {lowStats.count} Stocks
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-stone-500">Top Return:</span>
              <span className="font-mono text-sm font-black text-emerald-700">+{lowStats.maxReturn}%</span>
            </div>
            <p className="mt-1 text-[10px] text-stone-500 line-clamp-1">
              ATR ≤ 2.2% &bull; SMA20 support &bull; Tight SL
            </p>
          </button>

          {/* Tab 2: Medium Risk */}
          <button
            id="tier-tab-medium-risk"
            onClick={() => setActiveTier('MEDIUM')}
            className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
              activeTier === 'MEDIUM'
                ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
                : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-900">Medium Risk</span>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {mediumStats.count} Stocks
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-stone-500">Top Return:</span>
              <span className="font-mono text-sm font-black text-amber-700">+{mediumStats.maxReturn}%</span>
            </div>
            <p className="mt-1 text-[10px] text-stone-500 line-clamp-1">
              ATR 2.2%–3.2% &bull; Balanced trend momentum
            </p>
          </button>

          {/* Tab 3: High Risk */}
          <button
            id="tier-tab-high-risk"
            onClick={() => setActiveTier('HIGH')}
            className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
              activeTier === 'HIGH'
                ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-2 ring-rose-500/20'
                : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-900">High Risk</span>
              </div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                {highStats.count} Stocks
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-stone-500">Top Return:</span>
              <span className="font-mono text-sm font-black text-rose-700">+{highStats.maxReturn}%</span>
            </div>
            <p className="mt-1 text-[10px] text-stone-500 line-clamp-1">
              High-Beta movers &bull; Wide profit targets
            </p>
          </button>

          {/* Tab 4: Side-by-Side Comparison */}
          <button
            id="tier-tab-comparison"
            onClick={() => setActiveTier('COMPARISON')}
            className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
              activeTier === 'COMPARISON'
                ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className={`h-3.5 w-3.5 ${activeTier === 'COMPARISON' ? 'text-amber-400' : 'text-stone-700'}`} />
                <span className={`text-xs font-bold ${activeTier === 'COMPARISON' ? 'text-white' : 'text-stone-900'}`}>
                  Comparison Matrix
                </span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTier === 'COMPARISON' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'}`}>
                3 Tiers
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-[11px] ${activeTier === 'COMPARISON' ? 'text-stone-400' : 'text-stone-500'}`}>Side-by-side:</span>
              <span className={`font-mono text-xs font-bold ${activeTier === 'COMPARISON' ? 'text-amber-400' : 'text-stone-700'}`}>
                Low vs Med vs High
              </span>
            </div>
            <p className={`mt-1 text-[10px] line-clamp-1 ${activeTier === 'COMPARISON' ? 'text-stone-400' : 'text-stone-500'}`}>
              Compare top picks across risk curves
            </p>
          </button>
        </div>
      </div>

      {/* Filter Bar: Sector Categorization & Search & Custom Ticker Input */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Sector Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Sector:
            </span>
            <select
              id="risk-tier-sector-select"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 transition focus:border-stone-900 focus:bg-white focus:outline-hidden"
            >
              {SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            {/* Quick Sector Tags */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto text-[11px]">
              {['Banking & Finance', 'Information Technology', 'Automobile', 'Energy, Oil & Gas', 'Pharma & Healthcare'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSector(selectedSector === s ? 'All Sectors' : s)}
                  className={`rounded-md px-2 py-0.5 transition ${
                    selectedSector === s
                      ? 'bg-stone-900 font-bold text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {s.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Custom Ticker Form */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400" />
              <input
                id="risk-tier-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock or sector..."
                className="w-48 rounded-lg border border-stone-300 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Inline Add Any NSE Ticker */}
            <form onSubmit={handleAddCustom} className="flex items-center gap-1">
              <input
                id="add-custom-ticker-input"
                type="text"
                value={customTickerInput}
                onChange={(e) => setCustomTickerInput(e.target.value.toUpperCase())}
                placeholder="+ Add NSE Symbol"
                className="w-32 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isAddingTicker || !customTickerInput.trim()}
                title="Add any stock into the universe and scan"
                className="rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-900 disabled:opacity-40"
              >
                {isAddingTicker ? '...' : <PlusCircle className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>
        </div>

        {tickerAddFeedback && (
          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
            {tickerAddFeedback}
          </div>
        )}

        {/* Dynamic Search Feedback & Cross-Tier Router */}
        {searchQuery.trim() && (
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
            {globalSearchMatches.length > 0 && activeStockList.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-amber-900">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Found <strong>{globalSearchMatches[0].ticker}</strong> ({globalSearchMatches[0].name}) in the <strong>{globalSearchMatches[0].risk_level} Risk Tier</strong> under sector <em>{globalSearchMatches[0].sector}</em>.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const tier = globalSearchMatches[0].risk_level;
                      if (tier === 'LOW') setActiveTier('LOW');
                      else if (tier === 'HIGH' || tier === 'ELEVATED') setActiveTier('HIGH');
                      else setActiveTier('MEDIUM');
                      setSelectedSector('All Sectors');
                    }}
                    className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white shadow-2xs hover:bg-amber-700"
                  >
                    Switch to {globalSearchMatches[0].risk_level} Risk Tier
                  </button>
                </div>
              </div>
            ) : globalSearchMatches.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-stone-700">
                <div className="flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>
                    No stock matching <strong>&quot;{searchQuery.toUpperCase()}&quot;</strong> currently in the universe.
                  </span>
                </div>
                {onAddCustomTicker && (
                  <button
                    onClick={async () => {
                      const clean = searchQuery.trim().toUpperCase();
                      setIsAddingTicker(true);
                      try {
                        await onAddCustomTicker(clean);
                        setTickerAddFeedback(`Added ${clean} to universe & ran scan!`);
                        setTimeout(() => setTickerAddFeedback(null), 4000);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsAddingTicker(false);
                      }
                    }}
                    disabled={isAddingTicker}
                    className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1 font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-amber-400" />
                    {isAddingTicker ? 'Adding & Scanning...' : `+ Add & Scan ${searchQuery.toUpperCase()} Now`}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Showing {activeStockList.length} matching stock(s) in {activeTier} Risk Tier
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-stone-500 hover:text-stone-900 underline text-[11px]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW A: Single Risk Tier Detailed Breakdown */}
      {activeTier !== 'COMPARISON' && (
        <div className="space-y-6">
          {/* Key KPI Strip for the active tier */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Top Return Margin</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-stone-900">
                +{activeStats.maxReturn}%
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Avg: <span className="font-semibold text-stone-700">+{activeStats.avgReturn}%</span> across {activeStats.count} stocks
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Approx. Time to Target</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-stone-900">
                ~{activeStats.avgDays}d
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                ~{(activeStats.avgDays / 5).toFixed(1)} trading weeks avg swing
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Mean Risk:Reward</span>
                <ShieldCheck className="h-4 w-4 text-stone-700" />
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-stone-900">
                {activeStats.avgRR}:1
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Target upside vs Invalidation stop
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Mean Volatility (ATR)</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-stone-900">
                {activeStats.avgAtrPct}%
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {activeTier === 'LOW' ? 'Sub-2.2% defensive range' : activeTier === 'MEDIUM' ? 'Balanced 2.2%–3.2% range' : 'High-Beta > 3.2% momentum'}
              </p>
            </div>
          </div>

          {/* Top 3 Spotlight Cards for the Selected Risk Tier */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Top 3 Highest Return Opportunities &bull; {activeTier} Risk Tier
              </h3>
              <span className="text-[11px] text-stone-400">
                Ranked by expected return margin % & favorable asymmetry
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeStockList.slice(0, 3).map((stock, idx) => {
                const rankLabels = ['#1 Top Return Pick', '#2 Runner Up', '#3 Prime Alternative'];
                return (
                  <div
                    key={stock.ticker}
                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-stone-400 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {rankLabels[idx]}
                        </span>
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {stock.sector}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <h4 className="font-mono text-base font-black text-stone-900">{stock.ticker}</h4>
                          <p className="text-xs text-stone-500 line-clamp-1">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-stone-900">
                            ₹{stock.current_price.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                          </div>
                          <span className={`text-[10px] font-bold ${stock.recent_trend === 'BULLISH' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {stock.recent_trend} ({stock.pct_return_20d > 0 ? '+' : ''}{stock.pct_return_20d}%)
                          </span>
                        </div>
                      </div>

                      {/* Main Metric Spotlight Box */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-2.5">
                        <div>
                          <div className="text-[10px] font-semibold text-stone-400 uppercase">Return Margin</div>
                          <div className="font-mono text-lg font-black text-emerald-700">
                            +{stock.return_margin_pct}%
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Target: ₹{stock.target_price.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold text-stone-400 uppercase">Approx. Horizon</div>
                          <div className="font-mono text-xs font-bold text-stone-800 mt-1">
                            {stock.approx_time_label || `~${stock.approx_days_to_target || 7} Days`}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            SL: ₹{stock.stop_loss.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
                        <span>Risk:Reward: <strong className="font-mono text-stone-900">{stock.risk_reward_ratio}:1</strong></span>
                        <span>ATR Vol: <strong className="font-mono text-stone-900">{stock.atr_pct}%</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectStockForPipeline(stock.ticker)}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-stone-800"
                    >
                      Analyze in 5-Agent Pipeline
                      <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Ranked Table for Selected Risk Tier */}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
            <div className="border-b border-stone-200 bg-stone-50/75 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    All {activeTier} Risk Stocks &bull; Ranked by Expected Return Margin
                  </h3>
                  <p className="text-xs text-stone-500">
                    Showing {activeStockList.length} categorized stocks matching sector '{selectedSector}'
                  </p>
                </div>

                <span className="text-xs text-stone-500">
                  Click any stock row or action to run live multi-agent hypothesis
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
                <thead className="bg-stone-100 text-stone-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Rank</th>
                    <th className="px-4 py-2.5 font-semibold">Ticker & Company</th>
                    <th className="px-4 py-2.5 font-semibold">Sector</th>
                    <th className="px-4 py-2.5 font-semibold text-right">CMP (₹)</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Return Margin</th>
                    <th className="px-4 py-2.5 font-semibold">Approx. Time to Target</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Invalidation SL</th>
                    <th className="px-4 py-2.5 font-semibold text-right">R:R Ratio</th>
                    <th className="px-4 py-2.5 font-semibold text-right">ATR Vol</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Governor</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {activeStockList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-xs text-stone-500 font-sans">
                        {searchQuery.trim() ? (
                          <div className="max-w-md mx-auto space-y-2.5">
                            <div className="text-sm font-bold text-stone-800">
                              No results in {activeTier} Risk tier for &quot;{searchQuery}&quot;
                            </div>
                            {globalSearchMatches.length > 0 ? (
                              <div>
                                <p className="text-stone-500 mb-2">
                                  Found <strong>{globalSearchMatches[0].ticker}</strong> in the {globalSearchMatches[0].risk_level} Risk tier!
                                </p>
                                <button
                                  onClick={() => {
                                    const tier = globalSearchMatches[0].risk_level;
                                    if (tier === 'LOW') setActiveTier('LOW');
                                    else if (tier === 'HIGH' || tier === 'ELEVATED') setActiveTier('HIGH');
                                    else setActiveTier('MEDIUM');
                                    setSelectedSector('All Sectors');
                                  }}
                                  className="rounded-lg bg-stone-900 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-stone-800"
                                >
                                  Switch to {globalSearchMatches[0].risk_level} Risk Tier
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-stone-500 mb-2">
                                  &quot;{searchQuery.toUpperCase()}&quot; is not yet in your universe.
                                </p>
                                {onAddCustomTicker && (
                                  <button
                                    onClick={async () => {
                                      const clean = searchQuery.trim().toUpperCase();
                                      setIsAddingTicker(true);
                                      try {
                                        await onAddCustomTicker(clean);
                                        setTickerAddFeedback(`Added ${clean} to universe & ran scan!`);
                                        setTimeout(() => setTickerAddFeedback(null), 4000);
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setIsAddingTicker(false);
                                      }
                                    }}
                                    disabled={isAddingTicker}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    {isAddingTicker ? 'Adding...' : `+ Add & Scan ${searchQuery.toUpperCase()} Now`}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>No stocks found for the selected sector filter in this risk tier. Try selecting &apos;All Sectors&apos; or refreshing.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    activeStockList.map((stock, idx) => (
                      <tr
                        key={stock.ticker}
                        className="transition hover:bg-stone-50/80 cursor-pointer"
                        onClick={() => onSelectStockForPipeline(stock.ticker)}
                      >
                        <td className="px-4 py-3 font-mono text-stone-400 font-semibold">
                          #{idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-stone-900">{stock.ticker}</div>
                          <div className="text-[11px] text-stone-500 line-clamp-1">{stock.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-700">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-900">
                          ₹{stock.current_price.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm font-black text-emerald-700">
                            +{stock.return_margin_pct}%
                          </span>
                          <div className="text-[10px] text-stone-400">Target ₹{stock.target_price}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            {stock.approx_time_label || `~${stock.approx_days_to_target || 7} Days`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">
                          ₹{stock.stop_loss}
                          <div className="text-[10px] text-rose-500">-{stock.risk_margin_pct}%</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-900">
                          {stock.risk_reward_ratio}:1
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">
                          {stock.atr_pct}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            stock.ticket_status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {stock.ticket_status === 'APPROVED' ? 'Approved' : 'Filtered'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectStockForPipeline(stock.ticker)}
                            className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-stone-800"
                          >
                            Analyze
                            <ChevronRight className="h-3 w-3 text-amber-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Comparison Matrix Across All 3 Tiers */}
      {activeTier === 'COMPARISON' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Low Risk Column */}
            <div className="flex flex-col rounded-xl border border-emerald-300 bg-white shadow-xs">
              <div className="border-b border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-emerald-950">Low Risk Tier</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {lowStats.count} Stocks
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-800">
                  Defensive volatility (ATR &le; 2.2%), high capital safety & 20d trend support.
                </p>
                <div className="mt-3 flex items-center justify-between font-mono text-xs font-bold text-emerald-900">
                  <span>Top: +{lowStats.maxReturn}%</span>
                  <span>Avg: +{lowStats.avgReturn}%</span>
                  <span>Horizon: ~{lowStats.avgDays}d</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100 p-2 space-y-1">
                {lowRiskStocks.slice(0, 5).map((s, idx) => (
                  <div
                    key={s.ticker}
                    onClick={() => onSelectStockForPipeline(s.ticker)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50/40 cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-stone-900 text-xs">#{idx + 1} {s.ticker}</span>
                        <span className="rounded bg-stone-100 px-1 py-0.2 text-[9px] text-stone-600">{s.sector.split(' ')[0]}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">₹{s.current_price} &bull; SL ₹{s.stop_loss}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-black text-emerald-700">+{s.return_margin_pct}%</div>
                      <div className="text-[10px] text-stone-400">~{s.approx_days_to_target || 7}d</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Risk Column */}
            <div className="flex flex-col rounded-xl border border-amber-300 bg-white shadow-xs">
              <div className="border-b border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-amber-950">Medium Risk Tier</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {mediumStats.count} Stocks
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-800">
                  Balanced volatility (ATR 2.2%–3.2%), healthy swing upside & standard stop buffers.
                </p>
                <div className="mt-3 flex items-center justify-between font-mono text-xs font-bold text-amber-900">
                  <span>Top: +{mediumStats.maxReturn}%</span>
                  <span>Avg: +{mediumStats.avgReturn}%</span>
                  <span>Horizon: ~{mediumStats.avgDays}d</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100 p-2 space-y-1">
                {mediumRiskStocks.slice(0, 5).map((s, idx) => (
                  <div
                    key={s.ticker}
                    onClick={() => onSelectStockForPipeline(s.ticker)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/40 cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-stone-900 text-xs">#{idx + 1} {s.ticker}</span>
                        <span className="rounded bg-stone-100 px-1 py-0.2 text-[9px] text-stone-600">{s.sector.split(' ')[0]}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">₹{s.current_price} &bull; SL ₹{s.stop_loss}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-black text-amber-700">+{s.return_margin_pct}%</div>
                      <div className="text-[10px] text-stone-400">~{s.approx_days_to_target || 7}d</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High Risk Column */}
            <div className="flex flex-col rounded-xl border border-rose-300 bg-white shadow-xs">
              <div className="border-b border-rose-100 bg-rose-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <h3 className="font-bold text-rose-950">High Risk Tier</h3>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                    {highStats.count} Stocks
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-800">
                  Elevated volatility (ATR &gt; 3.2%), high-beta breakout momentum & maximum target width.
                </p>
                <div className="mt-3 flex items-center justify-between font-mono text-xs font-bold text-rose-900">
                  <span>Top: +{highStats.maxReturn}%</span>
                  <span>Avg: +{highStats.avgReturn}%</span>
                  <span>Horizon: ~{highStats.avgDays}d</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100 p-2 space-y-1">
                {highRiskStocks.slice(0, 5).map((s, idx) => (
                  <div
                    key={s.ticker}
                    onClick={() => onSelectStockForPipeline(s.ticker)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-rose-50/40 cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-stone-900 text-xs">#{idx + 1} {s.ticker}</span>
                        <span className="rounded bg-stone-100 px-1 py-0.2 text-[9px] text-stone-600">{s.sector.split(' ')[0]}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">₹{s.current_price} &bull; SL ₹{s.stop_loss}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-black text-rose-700">+{s.return_margin_pct}%</div>
                      <div className="text-[10px] text-stone-400">~{s.approx_days_to_target || 7}d</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
