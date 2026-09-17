import React, { useState, useMemo } from 'react';
import {
  Flame,
  LayoutGrid,
  Layers,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  X,
  Target,
  Clock,
  Sparkles,
  BarChart3,
  Percent,
} from 'lucide-react';
import type { ScannedStock, RiskLevel } from '../types';
import { SECTORS } from '../data/universe';

export type VolatilityFilterType = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
export type HeatmapViewMode = 'SECTOR_CLUSTERS' | 'DENSE_GRID' | 'DISTRIBUTION';

interface VolatilityHeatmapProps {
  scannedStocks: ScannedStock[];
  isScanning: boolean;
  onRefreshScan: () => void;
  onSelectStockForPipeline: (ticker: string) => void;
  onAddCustomTicker?: (ticker: string, sector?: string) => Promise<void>;
}

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  scannedStocks,
  isScanning,
  onRefreshScan,
  onSelectStockForPipeline,
}) => {
  const [volatilityFilter, setVolatilityFilter] = useState<VolatilityFilterType>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('SECTOR_CLUSTERS');
  const [selectedStock, setSelectedStock] = useState<ScannedStock | null>(null);
  const [sortBy, setSortBy] = useState<'volatility_desc' | 'volatility_asc' | 'return_desc' | 'momentum_desc'>('volatility_desc');

  // Categorize stock volatility tier
  const getStockVolatilityTier = (stock: ScannedStock): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (stock.atr_pct <= 2.2) return 'LOW';
    if (stock.atr_pct > 3.2) return 'HIGH';
    return 'MEDIUM';
  };

  // Color mapping based on ATR%
  const getTileColorClasses = (atrPct: number) => {
    if (atrPct <= 1.8) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80',
        border: 'border-emerald-200 hover:border-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'text-emerald-900',
        subtext: 'text-emerald-700',
        meter: 'bg-emerald-500',
      };
    } else if (atrPct <= 2.2) {
      return {
        bg: 'bg-teal-50 hover:bg-teal-100/80',
        border: 'border-teal-200 hover:border-teal-400',
        badge: 'bg-teal-100 text-teal-800 border-teal-200',
        text: 'text-teal-900',
        subtext: 'text-teal-700',
        meter: 'bg-teal-500',
      };
    } else if (atrPct <= 2.7) {
      return {
        bg: 'bg-amber-50 hover:bg-amber-100/80',
        border: 'border-amber-200 hover:border-amber-400',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        text: 'text-amber-900',
        subtext: 'text-amber-700',
        meter: 'bg-amber-500',
      };
    } else if (atrPct <= 3.2) {
      return {
        bg: 'bg-orange-50 hover:bg-orange-100/80',
        border: 'border-orange-200 hover:border-orange-400',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'text-orange-900',
        subtext: 'text-orange-700',
        meter: 'bg-orange-500',
      };
    } else if (atrPct <= 3.8) {
      return {
        bg: 'bg-rose-50 hover:bg-rose-100/80',
        border: 'border-rose-200 hover:border-rose-400',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        text: 'text-rose-900',
        subtext: 'text-rose-700',
        meter: 'bg-rose-500',
      };
    } else {
      return {
        bg: 'bg-purple-50 hover:bg-purple-100/80',
        border: 'border-purple-300 hover:border-purple-500',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        text: 'text-purple-900',
        subtext: 'text-purple-700',
        meter: 'bg-purple-600',
      };
    }
  };

  // High-level statistics
  const universeStats = useMemo(() => {
    if (scannedStocks.length === 0) {
      return {
        total: 0,
        avgAtrPct: 0,
        lowCount: 0,
        medCount: 0,
        highCount: 0,
        lowestVolStock: null as ScannedStock | null,
        highestVolStock: null as ScannedStock | null,
      };
    }

    let sumAtr = 0;
    let low = 0;
    let med = 0;
    let high = 0;
    let minStock = scannedStocks[0];
    let maxStock = scannedStocks[0];

    scannedStocks.forEach((s) => {
      sumAtr += s.atr_pct;
      const tier = getStockVolatilityTier(s);
      if (tier === 'LOW') low++;
      else if (tier === 'HIGH') high++;
      else med++;

      if (s.atr_pct < minStock.atr_pct) minStock = s;
      if (s.atr_pct > maxStock.atr_pct) maxStock = s;
    });

    return {
      total: scannedStocks.length,
      avgAtrPct: Number((sumAtr / scannedStocks.length).toFixed(2)),
      lowCount: low,
      medCount: med,
      highCount: high,
      lowestVolStock: minStock,
      highestVolStock: maxStock,
    };
  }, [scannedStocks]);

  // Distribution bins
  const distributionBins = useMemo(() => {
    const bins = [
      { label: '< 1.8%', min: 0, max: 1.8, count: 0, color: 'bg-emerald-500' },
      { label: '1.8 - 2.2%', min: 1.8, max: 2.2, count: 0, color: 'bg-teal-500' },
      { label: '2.2 - 2.7%', min: 2.2, max: 2.7, count: 0, color: 'bg-amber-500' },
      { label: '2.7 - 3.2%', min: 2.7, max: 3.2, count: 0, color: 'bg-orange-500' },
      { label: '3.2 - 3.8%', min: 3.2, max: 3.8, count: 0, color: 'bg-rose-500' },
      { label: '> 3.8%', min: 3.8, max: 999, count: 0, color: 'bg-purple-600' },
    ];

    scannedStocks.forEach((s) => {
      const b = bins.find((bin) => s.atr_pct >= bin.min && s.atr_pct < bin.max);
      if (b) b.count++;
    });

    return bins;
  }, [scannedStocks]);

  // Filtered and sorted stocks
  const filteredStocks = useMemo(() => {
    let result = [...scannedStocks];

    // 1. Volatility View Toggle (LOW, MEDIUM, HIGH, or ALL)
    if (volatilityFilter !== 'ALL') {
      result = result.filter((s) => getStockVolatilityTier(s) === volatilityFilter);
    }

    // 2. Sector Filter
    if (selectedSector !== 'All Sectors') {
      result = result.filter((s) => s.sector === selectedSector);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'volatility_desc') return b.atr_pct - a.atr_pct;
      if (sortBy === 'volatility_asc') return a.atr_pct - b.atr_pct;
      if (sortBy === 'return_desc') return b.return_margin_pct - a.return_margin_pct;
      if (sortBy === 'momentum_desc') return b.pct_return_20d - a.pct_return_20d;
      return 0;
    });

    return result;
  }, [scannedStocks, volatilityFilter, selectedSector, searchQuery, sortBy]);

  // Group stocks by sector for Cluster View
  const sectorClusters = useMemo(() => {
    const map: Record<string, ScannedStock[]> = {};
    filteredStocks.forEach((stock) => {
      if (!map[stock.sector]) map[stock.sector] = [];
      map[stock.sector].push(stock);
    });

    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filteredStocks]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
                <Flame className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-extrabold tracking-tight text-stone-900">
                Universe Volatility Heatmap
              </h2>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-stone-700">
                14-Day ATR Range
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Visual ATR volatility spectrum across all {universeStats.total} stocks in the NSE universe. Filter by Low, Medium, or High volatility regimes to optimize position sizing and risk margins.
            </p>
          </div>

          {/* Quick Action & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-stone-500 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Refresh Volatility'}
            </button>
          </div>
        </div>

        {/* Top Volatility Stats KPI Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Avg Universe Volatility
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl font-bold text-stone-900">{universeStats.avgAtrPct}%</span>
              <span className="text-[11px] text-stone-500 font-sans">ATR / Price</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              Regime: <strong className="text-stone-700">{universeStats.avgAtrPct <= 2.2 ? 'Low Risk' : universeStats.avgAtrPct <= 3.2 ? 'Balanced' : 'Elevated'}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Low Volatility Tier
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl font-bold text-emerald-800">{universeStats.lowCount}</span>
              <span className="text-[11px] text-emerald-600 font-sans">Stocks (&le;2.2%)</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700">
              Defensive / Low drawdown
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Medium Volatility Tier
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl font-bold text-amber-800">{universeStats.medCount}</span>
              <span className="text-[11px] text-amber-600 font-sans">Stocks (2.2-3.2%)</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-700">
              Balanced swing momentum
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              High Volatility Tier
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl font-bold text-rose-800">{universeStats.highCount}</span>
              <span className="text-[11px] text-rose-600 font-sans">Stocks (&gt;3.2%)</span>
            </div>
            <div className="mt-1 text-[11px] text-rose-700">
              High-beta / Breakout movers
            </div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-stone-100 bg-stone-50/80 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Universe Volatility Range
            </div>
            <div className="mt-1 text-[11px] text-stone-700 space-y-1">
              <div className="flex justify-between">
                <span>Lowest:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {universeStats.lowestVolStock?.ticker} ({universeStats.lowestVolStock?.atr_pct}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Highest:</span>
                <span className="font-mono font-bold text-rose-700">
                  {universeStats.highestVolStock?.ticker} ({universeStats.highestVolStock?.atr_pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Volatility Distribution Histogram Bar */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-1.5">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-stone-400" />
              Universe Volatility Distribution Spectrum:
            </span>
            <span>{universeStats.total} stocks analyzed</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-stone-100">
            {distributionBins.map((bin, i) => {
              const pct = universeStats.total > 0 ? (bin.count / universeStats.total) * 100 : 0;
              return (
                <div
                  key={i}
                  style={{ width: `${pct}%` }}
                  className={`${bin.color} transition-all duration-300 relative group`}
                  title={`${bin.label}: ${bin.count} stocks (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500 font-mono">
            {distributionBins.map((bin, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${bin.color}`} />
                <span>{bin.label}: <strong>{bin.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Filter & Toggle Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* PRIMARY REQUIREMENT: Toggle between Low, Medium, and High Volatility Views */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-700 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-stone-500" />
              Volatility View:
            </span>
            <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs">
              <button
                id="btn-volatility-view-all"
                onClick={() => setVolatilityFilter('ALL')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  volatilityFilter === 'ALL'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Volatility
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                  {universeStats.total}
                </span>
              </button>

              <button
                id="btn-volatility-view-low"
                onClick={() => setVolatilityFilter('LOW')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  volatilityFilter === 'LOW'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Low Volatility
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  volatilityFilter === 'LOW' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {universeStats.lowCount}
                </span>
              </button>

              <button
                id="btn-volatility-view-medium"
                onClick={() => setVolatilityFilter('MEDIUM')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  volatilityFilter === 'MEDIUM'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Medium Volatility
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  volatilityFilter === 'MEDIUM' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'
                }`}>
                  {universeStats.medCount}
                </span>
              </button>

              <button
                id="btn-volatility-view-high"
                onClick={() => setVolatilityFilter('HIGH')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  volatilityFilter === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                High Volatility
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  volatilityFilter === 'HIGH' ? 'bg-white/20' : 'bg-rose-100 text-rose-800'
                }`}>
                  {universeStats.highCount}
                </span>
              </button>
            </div>
          </div>

          {/* View Mode Toggle (Sector Clusters vs Dense Grid) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Layout:</span>
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('SECTOR_CLUSTERS')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                  viewMode === 'SECTOR_CLUSTERS'
                    ? 'bg-white font-bold text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Layers className="h-3 w-3" />
                Sector Bento
              </button>
              <button
                onClick={() => setViewMode('DENSE_GRID')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                  viewMode === 'DENSE_GRID'
                    ? 'bg-white font-bold text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Dense Heat Grid
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Search, Sector Selector & Sort */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-stone-100">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find stock in heatmap (e.g. GROWW, RELIANCE, TCS)..."
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Sector Dropdown */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-stone-700 focus:border-stone-400 focus:outline-none"
            >
              <option value="All Sectors">All Sectors ({scannedStocks.length})</option>
              {SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-stone-700 focus:border-stone-400 focus:outline-none"
            >
              <option value="volatility_desc">Highest Volatility First</option>
              <option value="volatility_asc">Lowest Volatility First</option>
              <option value="return_desc">Highest Return Margin</option>
              <option value="momentum_desc">Best 20d Momentum</option>
            </select>

            <span className="text-[11px] text-stone-400 font-mono">
              Showing {filteredStocks.length} of {universeStats.total}
            </span>
          </div>
        </div>

        {/* Heatmap Chromatic Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-stone-500 border-t border-stone-100">
          <span className="font-semibold text-stone-700 flex items-center gap-1">
            <Percent className="h-3 w-3 text-stone-400" />
            ATR Volatility Legend:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-200 border border-emerald-300" />
              <span>&le;1.8% (Ultra Steady)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-teal-200 border border-teal-300" />
              <span>1.8 - 2.2% (Low Vol)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-200 border border-amber-300" />
              <span>2.2 - 2.7% (Moderate)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-orange-200 border border-orange-300" />
              <span>2.7 - 3.2% (Active)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-200 border border-rose-300" />
              <span>3.2 - 3.8% (High Beta)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-purple-200 border border-purple-300" />
              <span>&gt;3.8% (Explosive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP VIEW 1: SECTOR CLUSTERS (TREEMAP / BENTO STYLE) */}
      {viewMode === 'SECTOR_CLUSTERS' && (
        <div className="space-y-6">
          {sectorClusters.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500">
              No stocks match the current volatility ({volatilityFilter}) and sector filter.
            </div>
          ) : (
            sectorClusters.map(([sectorName, stocks]) => {
              const sectorAvgAtr = (
                stocks.reduce((acc, s) => acc + s.atr_pct, 0) / stocks.length
              ).toFixed(2);

              return (
                <div
                  key={sectorName}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">{sectorName}</h3>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-stone-600">
                        {stocks.length} Stocks
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 font-mono">
                      Sector Avg ATR: <strong className="text-stone-800">{sectorAvgAtr}%</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {stocks.map((stock) => {
                      const colors = getTileColorClasses(stock.atr_pct);
                      const isSelected = selectedStock?.ticker === stock.ticker;

                      return (
                        <button
                          key={stock.ticker}
                          onClick={() => setSelectedStock(stock)}
                          className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition duration-150 relative group ${colors.bg} ${colors.border} ${
                            isSelected ? 'ring-2 ring-stone-900 ring-offset-1 shadow-md' : 'shadow-2xs'
                          }`}
                        >
                          {/* Top row: Symbol & Volatility Badge */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="truncate">
                              <span className="font-mono text-xs font-extrabold text-stone-900">
                                {stock.ticker}
                              </span>
                              <div className="truncate text-[10px] text-stone-500">
                                {stock.name.replace(/Ltd|Limited|\(.*\)/g, '').trim()}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded px-1.5 py-0.2 font-mono text-[9px] font-bold border ${colors.badge}`}>
                              {stock.atr_pct}%
                            </span>
                          </div>

                          {/* Middle: Price & Momentum */}
                          <div className="my-2 flex items-baseline justify-between font-mono">
                            <span className="text-xs font-semibold text-stone-800">
                              ₹{stock.current_price.toFixed(1)}
                            </span>
                            <span
                              className={`flex items-center text-[10px] font-bold ${
                                stock.pct_return_20d >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {stock.pct_return_20d >= 0 ? (
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              ) : (
                                <ArrowDownRight className="h-2.5 w-2.5" />
                              )}
                              {Math.abs(stock.pct_return_20d).toFixed(1)}%
                            </span>
                          </div>

                          {/* Bottom: ATR in ₹ and Return Target */}
                          <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[9px] text-stone-600 font-mono">
                            <span>ATR ₹{stock.atr_14.toFixed(1)}</span>
                            <span className="font-bold text-stone-900">
                              +{stock.return_margin_pct}% Exp
                            </span>
                          </div>

                          {/* Hover Action Prompt */}
                          <div className="absolute inset-0 rounded-xl bg-stone-900/90 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-center items-center text-center">
                            <span className="font-mono text-xs font-bold text-amber-400">
                              {stock.ticker}
                            </span>
                            <span className="text-[10px] text-stone-200 mt-0.5">
                              ATR: {stock.atr_pct}% (₹{stock.atr_14})
                            </span>
                            <span className="mt-1.5 rounded bg-white px-2 py-0.5 text-[9px] font-bold text-stone-900">
                              Inspect Volatility &rarr;
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* HEATMAP VIEW 2: CONTINUOUS DENSE HEAT GRID */}
      {viewMode === 'DENSE_GRID' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Dense Market Heat Grid ({filteredStocks.length} Stocks)
              </h3>
              <span className="text-xs text-stone-500">
                Ordered by {sortBy.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-stone-500">
              Click any tile for technical volatility breakdown
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filteredStocks.map((stock) => {
              const colors = getTileColorClasses(stock.atr_pct);
              const isSelected = selectedStock?.ticker === stock.ticker;

              return (
                <button
                  key={stock.ticker}
                  onClick={() => setSelectedStock(stock)}
                  className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition duration-150 relative group ${colors.bg} ${colors.border} ${
                    isSelected ? 'ring-2 ring-stone-900 ring-offset-1 shadow-md' : 'shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {stock.ticker}
                    </span>
                    <span className={`rounded px-1 font-mono text-[9px] font-bold border ${colors.badge}`}>
                      {stock.atr_pct}%
                    </span>
                  </div>

                  <div className="my-1.5 font-mono">
                    <div className="text-xs font-semibold text-stone-800">
                      ₹{stock.current_price.toFixed(1)}
                    </div>
                    <div
                      className={`flex items-center text-[10px] font-bold ${
                        stock.pct_return_20d >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {stock.pct_return_20d >= 0 ? '+' : ''}
                      {stock.pct_return_20d.toFixed(1)}% 20d
                    </div>
                  </div>

                  <div className="text-[9px] text-stone-500 truncate">
                    {stock.sector}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED STOCK VOLATILITY INSPECTION DRAWER / MODAL */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xl font-extrabold text-stone-900">
                    {selectedStock.ticker}
                  </h3>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 font-medium">
                    {selectedStock.sector}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      getStockVolatilityTier(selectedStock) === 'LOW'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : getStockVolatilityTier(selectedStock) === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {getStockVolatilityTier(selectedStock)} VOLATILITY
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{selectedStock.name}</p>
              </div>

              <button
                onClick={() => setSelectedStock(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Volatility & Quantitative Diagnostics */}
            <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Current Price
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-stone-900">
                  ₹{selectedStock.current_price.toFixed(2)}
                </div>
                <div className={`mt-0.5 text-[11px] font-semibold ${
                  selectedStock.pct_return_20d >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {selectedStock.pct_return_20d >= 0 ? '+' : ''}{selectedStock.pct_return_20d}% 20d
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  14-Day ATR
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-orange-600">
                  {selectedStock.atr_pct}%
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500 font-mono">
                  ₹{selectedStock.atr_14.toFixed(2)} daily span
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Return Margin
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-emerald-600">
                  +{selectedStock.return_margin_pct}%
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500">
                  Target: ₹{selectedStock.target_price.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Risk Buffer
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-rose-600">
                  -{selectedStock.risk_margin_pct}%
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500">
                  Stop: ₹{selectedStock.stop_loss.toFixed(1)}
                </div>
              </div>
            </div>

            {/* In-depth Quantitative Volatility Evaluation */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs">
              <div className="flex items-center justify-between font-semibold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Deterministic Risk Governor Math:
                </span>
                <span className="font-mono text-stone-600">
                  R:R Asymmetry: <strong>{selectedStock.risk_reward_ratio}:1</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-stone-600">
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>20-Day SMA Benchmark:</span>
                  <span className="font-mono font-bold text-stone-800">
                    ₹{selectedStock.sma_20.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>Trend Position:</span>
                  <span className={`font-bold ${
                    selectedStock.current_price >= selectedStock.sma_20 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedStock.current_price >= selectedStock.sma_20 ? 'Above 20d SMA' : 'Below 20d SMA'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>Estimated Time to Target:</span>
                  <span className="font-mono font-bold text-stone-800">
                    {selectedStock.approx_time_label || `${selectedStock.approx_days_to_target} Days`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>Risk Allocation Cap:</span>
                  <span className="font-mono font-bold text-stone-800">
                    ₹{selectedStock.rupee_risk?.toFixed(0) || '1,000'} (1% Max)
                  </span>
                </div>
              </div>

              <div className="mt-2 text-stone-600 italic">
                &ldquo;{selectedStock.rationale}&rdquo;
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedStock(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const ticker = selectedStock.ticker;
                  setSelectedStock(null);
                  onSelectStockForPipeline(ticker);
                }}
                className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-stone-800"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                Analyze {selectedStock.ticker} in 5-Agent Pipeline &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volatility Methodology Footer Guide */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-xs text-stone-600">
        <div className="flex items-center gap-2 font-bold text-stone-800 mb-1">
          <Info className="h-4 w-4 text-stone-500" />
          How Quantitative Volatility Heatmaps Drive Position Sizing
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          The engine computes normalized volatility as <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800 font-mono">(14-day ATR / Current Price) &times; 100</code>. In algorithmic position sizing, volatility is inversely proportional to share allocation: high-volatility names receive smaller share quantities with wider structural stop cushions, whereas low-volatility compounders allow tighter mathematical stops and larger position sizing without exceeding the 1% capital risk constraint.
        </p>
      </div>
    </div>
  );
};
