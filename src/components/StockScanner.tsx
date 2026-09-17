import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  TrendingUp,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Download,
  AlertTriangle,
  Award,
  Clock,
  Target,
  PlusCircle,
  Eye,
  HelpCircle,
} from 'lucide-react';
import type { ScannedStock, RiskLevel } from '../types';
import { SECTORS } from '../data/universe';
import { calculateTimeHorizon } from '../utils/quantMetrics';

interface StockScannerProps {
  scannedStocks: ScannedStock[];
  isScanning: boolean;
  onRunScan: (options?: { sector?: string; lowRiskOnly?: boolean }) => Promise<void>;
  onSelectStockForPipeline: (ticker: string) => void;
  onAddCustomTicker?: (ticker: string, sector?: string) => Promise<void>;
}

export const StockScanner: React.FC<StockScannerProps> = ({
  scannedStocks,
  isScanning,
  onRunScan,
  onSelectStockForPipeline,
  onAddCustomTicker,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');
  const [onlyGoodOpportunities, setOnlyGoodOpportunities] = useState(true);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'return' | 'time' | 'risk_reward' | 'lowest_volatility'>('score');
  const [minReturnMargin, setMinReturnMargin] = useState<number>(3.5);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [addFeedback, setAddFeedback] = useState<string | null>(null);

  // Raw search matches (ignoring good opportunities, risk level, and sector toggles)
  const searchRawMatches = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return scannedStocks.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [scannedStocks, searchTerm]);

  // Handle adding custom ticker directly from search box
  const handleAddSearchTermTicker = async (targetTicker?: string) => {
    const raw = targetTicker || searchTerm;
    if (!raw.trim()) return;
    const clean = raw.trim().toUpperCase();
    setIsAddingCustom(true);
    setAddFeedback(null);
    try {
      if (onAddCustomTicker) {
        await onAddCustomTicker(clean);
      } else {
        await fetch('/api/universe/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: clean }),
        });
        await onRunScan();
      }
      setAddFeedback(`Successfully added and evaluated ${clean} in universe!`);
      setTimeout(() => setAddFeedback(null), 4000);
    } catch (err) {
      console.error('Error adding ticker:', err);
      setAddFeedback(`Failed to add ticker ${clean}. Check symbol.`);
    } finally {
      setIsAddingCustom(false);
    }
  };

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    return scannedStocks
      .filter((stock) => {
        // Search filter
        const matchesSearch =
          stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Sector filter
        const matchesSector =
          selectedSector === 'All Sectors' || stock.sector.toLowerCase() === selectedSector.toLowerCase();

        // Good Opportunity toggle
        const matchesGoodOpp = !onlyGoodOpportunities || stock.is_good_opportunity;

        // Risk Level filter
        const matchesRisk =
          riskFilter === 'ALL' ||
          (riskFilter === 'LOW' && stock.risk_level === 'LOW') ||
          (riskFilter === 'MEDIUM' && (stock.risk_level === 'MEDIUM' || stock.risk_level === 'BALANCED')) ||
          (riskFilter === 'HIGH' && (stock.risk_level === 'HIGH' || stock.risk_level === 'ELEVATED'));

        // Minimum Return Margin
        const matchesMinReturn = stock.return_margin_pct >= minReturnMargin;

        return matchesSearch && matchesSector && matchesGoodOpp && matchesRisk && matchesMinReturn;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.opportunity_score - a.opportunity_score;
        if (sortBy === 'return') return b.return_margin_pct - a.return_margin_pct;
        if (sortBy === 'time') return (a.approx_days_to_target || 8) - (b.approx_days_to_target || 8);
        if (sortBy === 'risk_reward') return b.risk_reward_ratio - a.risk_reward_ratio;
        if (sortBy === 'lowest_volatility') return a.atr_pct - b.atr_pct;
        return 0;
      });
  }, [scannedStocks, searchTerm, selectedSector, onlyGoodOpportunities, riskFilter, sortBy, minReturnMargin]);

  // Statistics
  const totalScanned = scannedStocks.length;
  const goodOpportunitiesCount = scannedStocks.filter((s) => s.is_good_opportunity).length;
  const lowRiskCount = scannedStocks.filter((s) => s.risk_level === 'LOW').length;
  const avgReturnMargin = scannedStocks.length > 0
    ? (scannedStocks.reduce((sum, s) => sum + s.return_margin_pct, 0) / scannedStocks.length).toFixed(1)
    : '0.0';
  const avgApproxDays = scannedStocks.length > 0
    ? Math.round(
        scannedStocks.reduce((sum, s) => {
          const days =
            s.approx_days_to_target ||
            calculateTimeHorizon(
              s.current_price,
              s.target_price,
              s.stop_loss,
              s.atr_14,
              s.pct_return_20d
            ).approxDays;
          return sum + days;
        }, 0) / scannedStocks.length
      )
    : 7;

  // Export CSV
  const handleExportCSV = () => {
    if (scannedStocks.length === 0) return;
    const headers = [
      'Ticker',
      'Name',
      'Sector',
      'Current Price',
      'ATR(14)',
      'ATR % (Volatility Risk)',
      'SMA(20)',
      '20d Momentum %',
      'Bias',
      'Target Price',
      'Stop Loss',
      'Return Margin %',
      'Approx Days to Target',
      'Approx Time Horizon',
      'Risk Margin %',
      'Risk:Reward Ratio',
      'Risk Level',
      'Opportunity Score',
      'Is Good Opportunity',
      'Risk Governor Status',
    ];
    const rows = filteredStocks.map((s) => {
      const hzn = calculateTimeHorizon(
        s.current_price,
        s.target_price,
        s.stop_loss,
        s.atr_14,
        s.pct_return_20d
      );
      return [
        s.ticker,
        `"${s.name}"`,
        `"${s.sector}"`,
        s.current_price,
        s.atr_14,
        s.atr_pct,
        s.sma_20,
        s.pct_return_20d,
        s.bias,
        s.target_price,
        s.stop_loss,
        s.return_margin_pct,
        s.approx_days_to_target || hzn.approxDays,
        `"${s.approx_time_label || hzn.approxTimeLabel}"`,
        s.risk_margin_pct,
        s.risk_reward_ratio,
        s.risk_level,
        s.opportunity_score,
        s.is_good_opportunity ? 'YES' : 'NO',
        s.ticket_status,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nse_universe_scanner_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="stock-scanner-view" className="space-y-6">
      {/* Top Banner & Scan Controls */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-lg font-bold text-stone-900">
                NSE Universe Scanner
              </h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                40 Liquid Stocks
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Scans 40 liquid NSE equities using ATR volatility normalized risk, 20-day momentum, and mathematical stop/target ratios to pinpoint high return margin &amp; low risk opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-full-scan"
              onClick={() => onRunScan()}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning 40 Equities...' : 'Scan All 40 Stocks Now'}
            </button>

            <button
              id="btn-export-scanner-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
              title="Download Scan CSV"
            >
              <Download className="h-3.5 w-3.5 text-stone-500" />
              CSV
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Universe Analyzed</span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-stone-900">{totalScanned}</span>
              <span className="text-xs text-stone-500">of 40 Stocks</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Good Return + Low Risk</span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-700">{goodOpportunitiesCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Qualified candidates</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Low Volatility Stocks</span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-stone-900">{lowRiskCount}</span>
              <span className="text-xs text-stone-500">ATR &le; 2.2% of price</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-600" />
                Mean Return &amp; Approx Time
              </span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-amber-900">
                ~{avgApproxDays}d Horizon
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-700">+{avgReturnMargin}%</span>
              <span className="text-xs font-bold text-stone-800">in ~{avgApproxDays} trading days</span>
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              ~{(avgApproxDays / 5).toFixed(1)} calendar wks average target drift
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Criteria Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            id="input-scanner-search"
            type="text"
            placeholder="Search stock by ticker or name (e.g. GROWW, RELIANCE, TCS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Prime Opportunity Toggle */}
        <button
          id="btn-toggle-good-opportunities"
          onClick={() => setOnlyGoodOpportunities(!onlyGoodOpportunities)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            onlyGoodOpportunities
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Award className="h-3.5 w-3.5 text-amber-300" />
          Good Return &amp; Low Risk Only ({goodOpportunitiesCount})
        </button>

        {/* Sector Select */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-stone-500">Sector:</span>
          <select
            id="select-scanner-sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none"
          >
            {SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              riskFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Risks
          </button>
          <button
            onClick={() => setRiskFilter('LOW')}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              riskFilter === 'LOW' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Low Risk
          </button>
          <button
            onClick={() => setRiskFilter('MEDIUM')}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              riskFilter === 'MEDIUM' ? 'bg-amber-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setRiskFilter('HIGH')}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              riskFilter === 'HIGH' ? 'bg-rose-600 text-white shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            High Risk
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-stone-500">Sort:</span>
          <select
            id="select-scanner-sort"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none"
          >
            <option value="score">Opportunity Score</option>
            <option value="return">Highest Return Margin %</option>
            <option value="time">Fastest Time to Target (~Days)</option>
            <option value="risk_reward">Highest R:R Ratio</option>
            <option value="lowest_volatility">Lowest Volatility (ATR %)</option>
          </select>
        </div>
      </div>

      {/* Search Diagnostics / Feedback Banner */}
      {searchTerm.trim() && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 shadow-2xs">
          {searchRawMatches.length > 0 && filteredStocks.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Found <strong>{searchRawMatches.length}</strong> matching stock(s) ({searchRawMatches.map(s => s.ticker).join(', ')}), but they are currently hidden by active filters (e.g., &quot;Good Return &amp; Low Risk Only&quot; or Sector: {selectedSector}).
                </span>
              </div>
              <button
                onClick={() => {
                  setOnlyGoodOpportunities(false);
                  setSelectedSector('All Sectors');
                  setRiskFilter('ALL');
                }}
                className="rounded-lg bg-amber-600 px-2.5 py-1 font-bold text-white transition hover:bg-amber-700 shadow-2xs"
              >
                Show All Matches for &quot;{searchTerm}&quot;
              </button>
            </div>
          ) : searchRawMatches.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-stone-400 shrink-0" />
                <span>
                  Stock <strong>&quot;{searchTerm.toUpperCase()}&quot;</strong> is not in the scanned list. Would you like to add it into the NSE universe and scan now?
                </span>
              </div>
              <button
                onClick={() => handleAddSearchTermTicker()}
                disabled={isAddingCustom}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1 font-bold text-white transition hover:bg-stone-800 shadow-2xs disabled:opacity-50"
              >
                <PlusCircle className="h-3.5 w-3.5 text-amber-400" />
                {isAddingCustom ? 'Adding & Scanning...' : `Add & Scan ${searchTerm.toUpperCase()} Now`}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Showing {filteredStocks.length} matching stock(s) for &quot;{searchTerm}&quot;
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-stone-500 hover:text-stone-900 underline text-[11px]"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {addFeedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          {addFeedback}
        </div>
      )}

      {/* Featured Spotlight: Top Good Return & Low Risk Candidates */}
      {filteredStocks.filter((s) => s.is_good_opportunity).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Award className="h-3 w-3" />
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                Prime Identified Opportunities (Good Return Margin &amp; Low Risk)
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Filtered for high upside asymmetry, sub-2.2% ATR volatility, and Risk Governor clearance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStocks
              .filter((s) => s.is_good_opportunity)
              .slice(0, 6)
              .map((stock) => (
                <div
                  key={stock.ticker}
                  className="group relative rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-base">
                          {stock.ticker}
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                          SCORE {stock.opportunity_score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate max-w-[170px]">
                        {stock.name}
                      </p>
                      <span className="text-[9px] text-stone-400 font-medium">
                        {stock.sector}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-extrabold text-stone-900">
                        ₹{stock.current_price.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>+{stock.pct_return_20d}% 20d</span>
                      </div>
                    </div>
                  </div>

                  {/* Return Margin vs Risk Metric */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-lg border border-stone-200 bg-white p-2 text-center font-mono">
                    <div>
                      <span className="block text-[8px] font-sans font-bold uppercase text-stone-400">Return</span>
                      <span className="text-xs font-extrabold text-emerald-700">+{stock.return_margin_pct}%</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-sans font-bold uppercase text-amber-700">Approx Time</span>
                      <span className="text-xs font-extrabold text-stone-900" title={stock.approx_time_label || ''}>
                        ~{stock.approx_days_to_target || calculateTimeHorizon(stock.current_price, stock.target_price, stock.stop_loss, stock.atr_14, stock.pct_return_20d).approxDays}d
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-sans font-bold uppercase text-stone-400">ATR Vol</span>
                      <span className="text-xs font-extrabold text-stone-700">{stock.atr_pct}%</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-sans font-bold uppercase text-stone-400">R:R Ratio</span>
                      <span className="text-xs font-extrabold text-amber-700">{stock.risk_reward_ratio}:1</span>
                    </div>
                  </div>

                  {/* Qualifying Reasons */}
                  <div className="mt-3 space-y-1">
                    {stock.qualifying_reasons.slice(0, 3).map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-stone-600">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="text-[10px] text-stone-500">
                      Tgt: <span className="font-mono font-bold text-emerald-700">₹{stock.target_price}</span> | Horizon: <span className="font-mono font-semibold text-amber-800">~{stock.approx_days_to_target || 7}d</span>
                    </div>
                    <button
                      id={`btn-analyze-${stock.ticker.toLowerCase()}`}
                      onClick={() => onSelectStockForPipeline(stock.ticker)}
                      className="flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-stone-800 transition"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="h-3 w-3 text-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Stock Scanner Results Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Scanned Stock Universe Results ({filteredStocks.length} Stocks)
            </h3>
          </div>
          <span className="text-[11px] text-stone-500">
            Click any ticker or &quot;Run Pipeline&quot; to test with Gemini Committee &amp; Mathematical Risk Engine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Ticker / Asset</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">ATR(14) Volatility</th>
                <th className="px-4 py-3 text-right">20d Return / Trend</th>
                <th className="px-4 py-3 text-right">Target &amp; Return Margin</th>
                <th className="px-4 py-3 text-right">Approx. Time to Gain</th>
                <th className="px-4 py-3 text-right">Stop Loss &amp; Risk</th>
                <th className="px-4 py-3 text-center">R:R Ratio</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-4 py-3 text-center">Opp. Score</th>
                <th className="px-4 py-3 text-center">Pipeline Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-stone-500 font-sans">
                    {searchTerm.trim() ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="text-sm font-semibold text-stone-800">
                          No active results for &quot;{searchTerm}&quot;
                        </div>
                        {searchRawMatches.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-stone-500">
                              This stock exists in the universe, but was filtered out by your current settings (e.g., &quot;Good Return &amp; Low Risk Only&quot; or Sector: {selectedSector}).
                            </p>
                            <button
                              onClick={() => {
                                setOnlyGoodOpportunities(false);
                                setSelectedSector('All Sectors');
                                setRiskFilter('ALL');
                              }}
                              className="rounded-lg bg-stone-900 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-stone-800"
                            >
                              Show &quot;{searchTerm}&quot; (Relax Filters)
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-stone-500">
                              &quot;{searchTerm.toUpperCase()}&quot; is not yet in the scanned universe. Add it with one click to fetch metrics and risk evaluations immediately.
                            </p>
                            <button
                              onClick={() => handleAddSearchTermTicker()}
                              disabled={isAddingCustom}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              {isAddingCustom ? 'Adding & Scanning...' : `+ Add & Scan ${searchTerm.toUpperCase()} on NSE`}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>No stocks matching current filters. Click &quot;Scan Universe Now&quot; or adjust your filters above.</span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isGood = stock.is_good_opportunity;
                  const isLowRisk = stock.risk_level === 'LOW';
                  const hzn = calculateTimeHorizon(
                    stock.current_price,
                    stock.target_price,
                    stock.stop_loss,
                    stock.atr_14,
                    stock.pct_return_20d
                  );

                  return (
                    <tr
                      key={stock.ticker}
                      className={`hover:bg-stone-50/80 transition ${
                        isGood ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Ticker & Name */}
                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectStockForPipeline(stock.ticker)}
                            className="font-bold text-stone-900 hover:text-amber-600 transition"
                          >
                            {stock.ticker}
                          </button>
                          {isGood && (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                              PRIME
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[150px]">
                          {stock.name}
                        </div>
                        <span className="text-[9px] text-stone-400">{stock.sector}</span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right font-bold text-stone-900 whitespace-nowrap">
                        ₹{stock.current_price.toFixed(2)}
                      </td>

                      {/* ATR Volatility */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-stone-800">₹{stock.atr_14.toFixed(2)}</div>
                        <span
                          className={`text-[10px] font-bold ${
                            stock.atr_pct <= 2.2 ? 'text-emerald-700' : stock.atr_pct > 3.0 ? 'text-rose-600' : 'text-stone-500'
                          }`}
                        >
                          {stock.atr_pct}% of price
                        </span>
                      </td>

                      {/* 20d Momentum */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className={`font-bold ${
                            stock.pct_return_20d >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {stock.pct_return_20d >= 0 ? '+' : ''}{stock.pct_return_20d}%
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans">
                          SMA: ₹{stock.sma_20.toFixed(1)}
                        </span>
                      </td>

                      {/* Target & Return Margin */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-700">
                          +{stock.return_margin_pct}%
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Tgt: ₹{stock.target_price.toFixed(2)}
                        </span>
                      </td>

                      {/* Approx Time to Gain */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 font-bold text-amber-900">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>~{stock.approx_days_to_target || hzn.approxDays} Days</span>
                        </div>
                        <span className="text-[10px] text-stone-500" title={stock.approx_time_label || hzn.approxTimeLabel}>
                          {stock.approx_time_label || hzn.calendarWeeks}
                        </span>
                      </td>

                      {/* Stop Loss & Risk Margin */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-rose-600">
                          -{stock.risk_margin_pct}%
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Stp: ₹{stock.stop_loss.toFixed(2)}
                        </span>
                      </td>

                      {/* Risk-Reward Ratio */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            stock.risk_reward_ratio >= 2.0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {stock.risk_reward_ratio}:1
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-3 text-center whitespace-nowrap font-sans">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            stock.risk_level === 'LOW'
                              ? 'bg-emerald-100 text-emerald-800'
                              : stock.risk_level === 'BALANCED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {stock.risk_level}
                        </span>
                      </td>

                      {/* Opportunity Score */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-stone-900 text-xs">
                            {stock.opportunity_score}
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-stone-100 overflow-hidden mt-0.5">
                            <div
                              className={`h-full ${
                                stock.opportunity_score >= 75
                                  ? 'bg-emerald-500'
                                  : stock.opportunity_score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-stone-400'
                              }`}
                              style={{ width: `${stock.opportunity_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center whitespace-nowrap font-sans">
                        <button
                          onClick={() => onSelectStockForPipeline(stock.ticker)}
                          className="rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-stone-800 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Run Pipeline</span>
                          <ArrowRight className="h-3 w-3 text-amber-400" />
                        </button>
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
