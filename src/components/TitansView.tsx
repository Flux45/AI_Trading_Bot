import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Layers,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Target,
  Clock,
  ExternalLink,
  RotateCcw,
  Sparkles,
  BarChart2,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight,
  Eye,
  RefreshCw,
  Sliders,
  DollarSign,
  Compass,
} from 'lucide-react';
import type { TitanMaster, StrategyActiveHolding } from '../types';
import { InteractiveTradingViewModal } from './InteractiveTradingViewModal';

interface TitansViewProps {
  onSelectTickerForPipeline?: (ticker: string) => void;
}

export const TitansView: React.FC<TitansViewProps> = ({ onSelectTickerForPipeline }) => {
  const [titans, setTitans] = useState<TitanMaster[]>([]);
  const [selectedTitanId, setSelectedTitanId] = useState<string>('titan-warren-buffett');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BIBLIOGRAPHY' | 'MATHEMATICS' | 'SIGNALS' | 'LEDGER'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [selectedStockForChart, setSelectedStockForChart] = useState<StrategyActiveHolding | null>(null);

  useEffect(() => {
    fetchTitans();
  }, []);

  const fetchTitans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/titans');
      if (res.ok) {
        const data = await res.json();
        if (data.titans && data.titans.length > 0) {
          setTitans(data.titans);
          if (!selectedTitanId) {
            setSelectedTitanId(data.titans[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Titans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLedger = async (titanId: string) => {
    try {
      const res = await fetch(`/api/titans/${titanId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: 25000 }),
      });
      if (res.ok) {
        const data = await res.json();
        setTitans((prev) => prev.map((t) => (t.id === titanId ? data.titan : t)));
      }
    } catch (err) {
      console.error('Failed to reset Titan ledger:', err);
    }
  };

  const handleForceEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/titans/evaluate-live', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.titans) {
          setTitans(data.titans);
        }
      }
    } catch (err) {
      console.error('Failed to evaluate Titans live:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const selectedTitan = titans.find((t) => t.id === selectedTitanId) || titans[0];

  return (
    <div className="space-y-6">
      {/* 1. Executive Hero Banner */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Award className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                Hall of Titans: Master Strategies
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-3xl leading-relaxed">
              We have studied the complete published works, books, annual shareholder letters (1965–2026), whitepapers, and operational blogs of the world's greatest investors and traders. Their principles are not passive text—we have codified their exact mathematical formulas and risk rules to run on the Indian NSE equity universe with independent ₹25,000 sub-ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleForceEvaluate}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-xs disabled:opacity-60"
            >
              <Activity className={`h-4 w-4 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating Markets...' : 'Mark-to-Market Live'}</span>
            </button>
            <button
              onClick={fetchTitans}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              title="Refresh Titans data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Titans Selector Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {titans.map((titan) => {
          const isSelected = selectedTitan?.id === titan.id;
          const ledger = titan.sub_ledger;
          const isWin = (ledger?.net_return_rupees ?? 0) >= 0;

          return (
            <div
              key={titan.id}
              onClick={() => setSelectedTitanId(titan.id)}
              className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/20 dark:bg-amber-500/5 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                    {titan.avatar_initials}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    ₹25k
                  </span>
                </div>
                <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 line-clamp-1">
                  {titan.name}
                </h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                  {titan.title.split('•')[0]}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-stone-400 text-[10px]">Return</span>
                <span className={`font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {isWin ? '+' : ''}{ledger?.net_return_pct?.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Titan Deep Dossier */}
      {selectedTitan && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] overflow-hidden shadow-xs">
          {/* Titan Dossier Header */}
          <div className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151922] p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 text-xl font-black shadow-md">
                  {selectedTitan.avatar_initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-stone-900 dark:text-white">
                      {selectedTitan.name}
                    </h3>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {selectedTitan.firm_or_era}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {selectedTitan.title}
                  </p>
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Audited Track Record: {selectedTitan.cagr_or_track_record}
                  </div>
                </div>
              </div>

              {/* Sub-Ledger Summary Pill */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 px-4 py-2 text-right">
                  <div className="text-[10px] text-stone-400">Isolated Paper Capital</div>
                  <div className="text-sm font-mono font-bold text-stone-900 dark:text-white">
                    ₹{selectedTitan.sub_ledger.total_equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${selectedTitan.sub_ledger.net_return_rupees >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {selectedTitan.sub_ledger.net_return_rupees >= 0 ? '+' : ''}₹{selectedTitan.sub_ledger.net_return_rupees} ({selectedTitan.sub_ledger.net_return_pct >= 0 ? '+' : ''}{selectedTitan.sub_ledger.net_return_pct}%)
                  </div>
                </div>

                <button
                  onClick={() => handleResetLedger(selectedTitan.id)}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Reset ₹25,000 sub-ledger"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Iconic Quote Callout */}
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 italic flex items-center gap-2">
              <span className="text-amber-500 font-serif text-lg font-bold">“</span>
              <span>{selectedTitan.key_quote}</span>
              <span className="text-amber-500 font-serif text-lg font-bold">”</span>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-200 dark:border-stone-800/80 pt-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Philosophy &amp; Method
              </button>
              <button
                onClick={() => setActiveTab('BIBLIOGRAPHY')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'BIBLIOGRAPHY'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Complete Books &amp; Shareholder Letters ({selectedTitan.bibliography.length})
              </button>
              <button
                onClick={() => setActiveTab('MATHEMATICS')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'MATHEMATICS'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Mathematical Formulas &amp; Rules
              </button>
              <button
                onClick={() => setActiveTab('SIGNALS')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'SIGNALS'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Live Indian NSE Screener ({selectedTitan.live_signals.length})
              </button>
              <button
                onClick={() => setActiveTab('LEDGER')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'LEDGER'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                ₹25k Sub-Ledger &amp; Positions ({selectedTitan.sub_ledger.active_holdings.length})
              </button>
            </div>
          </div>

          {/* Dossier Content Area */}
          <div className="p-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                    Core Operational Philosophy
                  </h4>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                    {selectedTitan.core_philosophy}
                  </p>
                </div>

                {/* Key Articles & Letters Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Featured Papers, Articles &amp; Speeches
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedTitan.articles_and_letters.map((art, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4 space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {art.publication_or_source} &bull; {art.date_or_edition}
                          </div>
                          <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-1">
                            {art.title}
                          </h5>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                            {art.summary_takeaway}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target NSE Universe */}
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-4">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Screened Indian Equity Universe
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTitan.target_universe.split(',').map((t) => (
                      <span
                        key={t.trim()}
                        className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs font-mono font-bold text-stone-800 dark:text-stone-200"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BIBLIOGRAPHY */}
            {activeTab === 'BIBLIOGRAPHY' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Complete Bibliography &amp; Primary Sources
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Every published book, co-authored manual, annual letter series, and academic paper driving this Titan's strategy.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTitan.bibliography.map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 p-4 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                            {b.role}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">{b.year}</span>
                        </div>
                        <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-2">
                          {b.title}
                        </h5>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                          {b.significance}
                        </p>
                      </div>

                      {b.url && (
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Read / Source Reference</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MATHEMATICAL SPECIFICATION */}
            {activeTab === 'MATHEMATICS' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Mathematical Formula / Valuation Specification
                  </h4>
                  <div className="rounded-xl bg-stone-900 text-amber-300 font-mono text-xs p-4 overflow-x-auto border border-stone-800 shadow-inner">
                    {selectedTitan.mathematical_strategy.formula_or_model}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4 space-y-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      Quantitative Screening Rules
                    </span>
                    <ul className="space-y-1.5 text-stone-600 dark:text-stone-400">
                      {selectedTitan.mathematical_strategy.screening_criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3.5">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                        Entry Trigger Rule
                      </span>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                        {selectedTitan.mathematical_strategy.entry_trigger}
                      </p>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3.5">
                      <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                        Stop-Loss &amp; Risk Governor
                      </span>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                        {selectedTitan.mathematical_strategy.stop_loss_discipline}
                      </p>
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3.5">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                        Position Sizing Formula
                      </span>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                        {selectedTitan.mathematical_strategy.position_sizing_rule}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LIVE INDIAN NSE SIGNALS */}
            {activeTab === 'SIGNALS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Real-Time Indian Equity Screening Matrix
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Stocks currently passing this Master's criteria with live NSE quotes and entry boundaries.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTitan.live_signals.map((sig) => (
                    <div
                      key={sig.ticker}
                      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-stone-900 dark:text-stone-100">
                              {sig.ticker}
                            </span>
                            <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 text-[10px] text-stone-500">
                              NSE
                            </span>
                            <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                              {sig.signal.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">{sig.company_name}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Conviction</span>
                          <span className="font-mono font-bold text-amber-500 text-sm">
                            {sig.conviction_score}%
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-[#151922] p-3 border border-stone-200 dark:border-stone-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Primary Criterion:</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">{sig.primary_metric}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-stone-500">CMP:</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">₹{sig.current_price}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-rose-500 font-semibold">Stop Loss:</span>
                          <span className="text-rose-500 font-bold">₹{sig.stop_loss}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-sky-500 font-semibold">Target Price:</span>
                          <span className="text-sky-500 font-bold">₹{sig.target_price}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {sig.catalyst_or_rationale}
                      </p>

                      {onSelectTickerForPipeline && (
                        <button
                          onClick={() => onSelectTickerForPipeline(sig.ticker)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 text-white text-xs font-bold py-2 hover:bg-stone-800 dark:hover:bg-stone-700 transition"
                        >
                          <Compass className="h-3.5 w-3.5 text-amber-400" />
                          <span>Run 5-Stage Cognitive Pipeline on {sig.ticker}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SUB-LEDGER & POSITIONS */}
            {activeTab === 'LEDGER' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Isolated ₹25,000 Portfolio Sub-Ledger
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Live positions managed 24/7 autonomously by {selectedTitan.name}'s exact rules with real-time mark-to-market.
                    </p>
                  </div>
                </div>

                {/* Sizing Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                    <span className="text-[10px] text-stone-400 block">Initial Allocation</span>
                    <span className="text-sm font-mono font-bold text-stone-900 dark:text-stone-100">₹25,000</span>
                  </div>
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                    <span className="text-[10px] text-stone-400 block">Liquid Cash Reserve</span>
                    <span className="text-sm font-mono font-bold text-stone-900 dark:text-stone-100">
                      ₹{selectedTitan.sub_ledger.liquid_cash.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                    <span className="text-[10px] text-stone-400 block">Invested in Market</span>
                    <span className="text-sm font-mono font-bold text-amber-500">
                      ₹{selectedTitan.sub_ledger.invested_capital.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-3">
                    <span className="text-[10px] text-stone-400 block">Total Net ROI</span>
                    <span className={`text-sm font-mono font-bold ${selectedTitan.sub_ledger.net_return_rupees >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {selectedTitan.sub_ledger.net_return_rupees >= 0 ? '+' : ''}₹{selectedTitan.sub_ledger.net_return_rupees} ({selectedTitan.sub_ledger.net_return_pct}%)
                    </span>
                  </div>
                </div>

                {/* Active Holdings Table */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Current Active Holdings ({selectedTitan.sub_ledger.active_holdings.length})
                  </h5>

                  {selectedTitan.sub_ledger.active_holdings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center text-xs text-stone-400">
                      No open positions currently in this sub-ledger. Capital is safely held in liquid cash.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                          <tr>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3 text-right">Shares</th>
                            <th className="py-2.5 px-3 text-right">Fill Price</th>
                            <th className="py-2.5 px-3 text-right">CMP</th>
                            <th className="py-2.5 px-3 text-right">Unrealized P&amp;L</th>
                            <th className="py-2.5 px-3 text-right">Stop Loss</th>
                            <th className="py-2.5 px-3 text-right">Target</th>
                            <th className="py-2.5 px-3 text-right">Execution Time</th>
                            <th className="py-2.5 px-3 text-center">Chart</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                          {selectedTitan.sub_ledger.active_holdings.map((h, i) => (
                            <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-900/40">
                              <td className="py-3 px-3 font-sans">
                                <div className="font-bold text-stone-900 dark:text-stone-100">{h.ticker}</div>
                                <div className="text-[10px] text-stone-500">{h.company_name}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-stone-900 dark:text-stone-100">
                                {h.shares}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{h.entry_fill_price.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-stone-900 dark:text-stone-100">
                                ₹{h.current_price.toFixed(2)}
                              </td>
                              <td className={`py-3 px-3 text-right font-bold ${h.unrealized_pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                {h.unrealized_pnl >= 0 ? '+' : ''}₹{h.unrealized_pnl.toFixed(2)} ({h.unrealized_pnl_pct}%)
                              </td>
                              <td className="py-3 px-3 text-right text-rose-500 font-semibold">
                                ₹{h.stop_loss.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right text-sky-500 font-semibold">
                                ₹{h.target_price.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right text-[10px] text-stone-400 font-sans">
                                {new Date(h.execution_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(h.execution_timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => setSelectedStockForChart(h)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-bold transition shadow-xs"
                                  title="View interactive chart with stop loss & target lines"
                                >
                                  <Eye className="h-3 w-3" />
                                  Chart
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Closed Trade History */}
                {selectedTitan.sub_ledger.closed_trades.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Closed Trade History
                    </h5>
                    <div className="space-y-2">
                      {selectedTitan.sub_ledger.closed_trades.map((tr) => (
                        <div
                          key={tr.id}
                          className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 dark:text-stone-100">{tr.ticker}</span>
                              <span className="text-[10px] font-mono text-stone-400">
                                ₹{tr.entry_price} &rarr; ₹{tr.exit_price} ({tr.shares} shs)
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">{tr.lesson}</p>
                          </div>
                          <div className={`text-right font-mono font-bold ${tr.pnl_realized >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tr.pnl_realized >= 0 ? '+' : ''}₹{tr.pnl_realized} (+{tr.pnl_pct}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Interactive Chart Modal When Stock Clicked */}
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
          strategyName={selectedTitan.name}
          marketScenario={selectedStockForChart.market_scenario_rationale}
          executionTimestamp={selectedStockForChart.execution_timestamp}
        />
      )}
    </div>
  );
};
