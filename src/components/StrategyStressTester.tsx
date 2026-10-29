import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sliders,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Zap,
  BrainCircuit,
  Scale,
  BarChart3,
  Layers,
  Info,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Check,
  ChevronRight,
  Percent,
} from 'lucide-react';
import type { TradingHorizonMode } from '../types';

export interface CrashScenario {
  id: string;
  name: string;
  historicalPeriod: string;
  benchmarkDropPct: number;
  durationDays: number;
  vixPeak: number;
  gapSeverityPct: number;
  slippageBeyondStopPct: number;
  description: string;
  tag: string;
  sectorShocks: Record<string, number>;
}

export const PRESET_CRASH_SCENARIOS: CrashScenario[] = [
  {
    id: 'CRASH_2008_GFC',
    name: '2008 Global Financial Crisis (Lehman Shock)',
    historicalPeriod: 'Jan 2008 – Oct 2008',
    benchmarkDropPct: 56.5,
    durationDays: 180,
    vixPeak: 85.0,
    gapSeverityPct: 5.5,
    slippageBeyondStopPct: 4.8,
    tag: 'SYSTEMIC LIQUIDITY MELTDOWN',
    description: 'Catastrophic subprime banking insolvency, global credit freeze, aggressive mutual fund redemption cascades, and deep multi-month gap downs.',
    sectorShocks: {
      Financials: 1.35,
      Metals: 1.45,
      Energy: 1.25,
      Auto: 1.15,
      IT: 0.85,
      Pharma: 0.55,
      FMCG: 0.45,
      Default: 1.0,
    },
  },
  {
    id: 'CRASH_2020_COVID',
    name: '2020 COVID-19 Flash Crash (Circuit Halts)',
    historicalPeriod: 'Feb 2020 – Mar 2020',
    benchmarkDropPct: 38.4,
    durationDays: 32,
    vixPeak: 83.6,
    gapSeverityPct: 7.2,
    slippageBeyondStopPct: 3.8,
    tag: 'BLACK SWAN CIRCUIT HALT',
    description: 'Sudden pandemic lockdowns hitting consecutive opening lower circuits, historic India VIX spike to 83.6, and rapid institutional margin liquidation.',
    sectorShocks: {
      Financials: 1.30,
      Auto: 1.25,
      Energy: 1.20,
      Metals: 1.15,
      IT: 0.65,
      FMCG: 0.45,
      Pharma: -0.25, // Counter-cyclical outperformance
      Default: 1.0,
    },
  },
  {
    id: 'CRASH_2000_DOTCOM',
    name: '2000 Dot-Com Bubble Collapse & Tech Rout',
    historicalPeriod: 'Mar 2000 – Sep 2001',
    benchmarkDropPct: 52.0,
    durationDays: 365,
    vixPeak: 45.0,
    gapSeverityPct: 3.5,
    slippageBeyondStopPct: 2.5,
    tag: 'VALUATION DE-RATING',
    description: 'Extreme valuation multiple collapse in software, technology, and telecom speculative growth names, rotating into cash-flow defensives.',
    sectorShocks: {
      IT: 1.65,
      Telecom: 1.50,
      Financials: 0.85,
      Auto: 0.75,
      Energy: 0.65,
      Pharma: 0.40,
      FMCG: 0.35,
      Default: 1.0,
    },
  },
  {
    id: 'CRASH_2010_FLASH',
    name: '2010 Algorithmic Flash Crash (Liquidity Vacuum)',
    historicalPeriod: 'May 6, 2010 (Intraday Cascade)',
    benchmarkDropPct: 9.8,
    durationDays: 1,
    vixPeak: 48.0,
    gapSeverityPct: 4.5,
    slippageBeyondStopPct: 6.5,
    tag: 'ALGORITHMIC STOP RUN',
    description: 'High-frequency quote cancellation cascades, market depth completely evaporating, and widespread stop-loss slippage over 5-7x standard spreads.',
    sectorShocks: {
      Financials: 1.25,
      Metals: 1.30,
      Auto: 1.10,
      Energy: 1.10,
      IT: 1.05,
      Pharma: 0.80,
      FMCG: 0.70,
      Default: 1.0,
    },
  },
  {
    id: 'CRASH_2024_BLACK_MONEY',
    name: '2024 Black Monday (Yen Carry Trade Liquidation)',
    historicalPeriod: 'Aug 5, 2024',
    benchmarkDropPct: 6.5,
    durationDays: 3,
    vixPeak: 65.0,
    gapSeverityPct: 3.2,
    slippageBeyondStopPct: 2.2,
    tag: 'MACRO CURRENCY LIQUIDATION',
    description: 'Global cross-currency arbitrage unwind triggering sharp Nikkei (-12.4%) single-day drawdown, international margin squeeze, and morning gap downs.',
    sectorShocks: {
      Financials: 1.20,
      IT: 1.25,
      Metals: 1.15,
      Auto: 1.05,
      Energy: 0.90,
      Pharma: 0.60,
      FMCG: 0.50,
      Default: 1.0,
    },
  },
  {
    id: 'CRASH_ENERGY_STAGFLATION',
    name: 'Geopolitical Energy Shock & Stagflation (1973/2022)',
    historicalPeriod: 'Energy Supply Disruption',
    benchmarkDropPct: 24.5,
    durationDays: 90,
    vixPeak: 38.0,
    gapSeverityPct: 2.8,
    slippageBeyondStopPct: 1.9,
    tag: 'SUPPLY SHOCK & INFLATION',
    description: 'Brent crude surges +80%, imported raw-material costs surge, and aggressive central bank interest rate hikes compress corporate equity multiples.',
    sectorShocks: {
      Auto: 1.40,
      Metals: 1.20,
      Financials: 1.15,
      IT: 0.95,
      FMCG: 0.85,
      Pharma: 0.60,
      Energy: -0.40, // Upstream energy benefits
      Default: 1.0,
    },
  },
  {
    id: 'CUSTOM',
    name: 'Parametric Custom Crash Sandbox',
    historicalPeriod: 'User Configured Stress Matrix',
    benchmarkDropPct: 30.0,
    durationDays: 15,
    vixPeak: 60.0,
    gapSeverityPct: 5.0,
    slippageBeyondStopPct: 3.5,
    tag: 'CUSTOM STRESS MATRIX',
    description: 'Tailor bespoke drawdown severity, volatility spikes, stop-loss slippage penalties, and sector shock coefficients to stress test edge limits.',
    sectorShocks: {
      Financials: 1.20,
      IT: 1.10,
      Energy: 1.00,
      Metals: 1.25,
      Auto: 1.15,
      Pharma: 0.60,
      FMCG: 0.50,
      Default: 1.0,
    },
  },
];

interface StrategyStressTesterProps {
  tradingMode?: TradingHorizonMode;
  onNavigateToTab?: (tab: string) => void;
}

export const StrategyStressTester: React.FC<StrategyStressTesterProps> = ({
  tradingMode = 'INTRADAY',
  onNavigateToTab,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('CRASH_2020_COVID');
  const [positionScope, setPositionScope] = useState<'ALL' | 'INTRADAY' | 'LONG'>('ALL');
  const [useSampleIfZero, setUseSampleIfZero] = useState<boolean>(true);

  // Tactical Hedging & Defense simulation toggles
  const [respectStops, setRespectStops] = useState<boolean>(true);
  const [simulatePutHedge, setSimulatePutHedge] = useState<boolean>(false);
  const [simulateCashRaise, setSimulateCashRaise] = useState<boolean>(false);
  const [simulateTightStops, setSimulateTightStops] = useState<boolean>(false);

  // Custom Parametric Sliders
  const [customShockPct, setCustomShockPct] = useState<number>(30);
  const [customVix, setCustomVix] = useState<number>(55);
  const [customSlippage, setCustomSlippage] = useState<number>(3.5);
  const [customGapDown, setCustomGapDown] = useState<number>(4.5);

  // Live positions fetched from server
  const [livePositions, setLivePositions] = useState<any[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [stressData, setStressData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live active positions from backend
  const fetchActivePositions = async () => {
    setIsLoadingPositions(true);
    try {
      const [resIntra, resLong] = await Promise.all([
        fetch('/api/positions?mode=intraday'),
        fetch('/api/positions?mode=long'),
      ]);
      const intraJson = resIntra.ok ? await resIntra.json() : { openPositions: [] };
      const longJson = resLong.ok ? await resLong.json() : { openPositions: [] };

      const intraList = intraJson.openPositions || [];
      const longList = longJson.openPositions || [];

      // Combine positions with clean tags
      const combined = [
        ...intraList.map((p: any) => ({ ...p, trade_mode: 'INTRADAY', product_type: 'MIS' })),
        ...longList.map((p: any) => ({ ...p, trade_mode: 'LONG', product_type: 'CNC' })),
      ];

      setLivePositions(combined);
    } catch (err: any) {
      console.warn('Failed to load active positions:', err);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  useEffect(() => {
    fetchActivePositions();
  }, []);

  // Filter positions based on user scope
  const scopedPositions = useMemo(() => {
    if (positionScope === 'INTRADAY') {
      return livePositions.filter((p) => p.trade_mode === 'INTRADAY' || p.product_type === 'MIS');
    }
    if (positionScope === 'LONG') {
      return livePositions.filter((p) => p.trade_mode === 'LONG' || p.product_type === 'CNC');
    }
    return livePositions;
  }, [livePositions, positionScope]);

  // Execute stress test simulation via backend engine
  const executeSimulation = async () => {
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      const payload: any = {
        scenarioId: selectedScenarioId,
        positionsInput: scopedPositions.length > 0 || !useSampleIfZero ? scopedPositions : undefined,
        simulationToggles: {
          respectStopsWithSlippage: respectStops,
          simulatePutHedge,
          simulateCashRaise,
          simulateTightStops,
        },
      };

      if (selectedScenarioId === 'CUSTOM') {
        payload.customParams = {
          marketShockPct: customShockPct,
          vixSpike: customVix,
          slippagePct: customSlippage,
          gapDownPct: customGapDown,
        };
      }

      const res = await fetch('/api/analyst/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to calculate stress test`);
      }

      const data = await res.json();
      if (data.success && data.stressTest) {
        setStressData(data.stressTest);
      } else {
        throw new Error(data.error || 'Invalid response from stress-test engine');
      }
    } catch (err: any) {
      console.error('Stress test execution error:', err);
      setErrorMessage(err.message || 'Execution error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Re-run simulation when scenario, scope, or defense toggles change
  useEffect(() => {
    if (!isLoadingPositions) {
      executeSimulation();
    }
  }, [
    selectedScenarioId,
    scopedPositions.length,
    useSampleIfZero,
    respectStops,
    simulatePutHedge,
    simulateCashRaise,
    simulateTightStops,
    customShockPct,
    customVix,
    customSlippage,
    customGapDown,
    isLoadingPositions,
  ]);

  const activeScenario = useMemo(() => {
    return PRESET_CRASH_SCENARIOS.find((s) => s.id === selectedScenarioId) || PRESET_CRASH_SCENARIOS[0];
  }, [selectedScenarioId]);

  const summary = stressData?.summary;
  const positionsResult = stressData?.positionResults || [];
  const sectorDrawdowns = stressData?.sectorDrawdowns || [];
  const strategyDrawdowns = stressData?.strategyDrawdowns || [];
  const hedgingEval = stressData?.hedgingEvaluation;
  const verdict = stressData?.analystVerdict;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-purple-950 border border-purple-500/50 px-4 py-3 text-sm text-purple-100 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-stone-900 via-[#1e1017] to-[#120a14] p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-inner">
                <Flame className="h-6 w-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    STRATEGY STRESS-TESTER
                  </h2>
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-red-300 font-mono">
                    Crash Simulation Engine
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  ANALYST CAPITAL RESILIENCE &amp; DRAWDOWN AUDIT
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Simulates extreme historical market crashes (2008 Lehman collapse, 2020 COVID circuit halt cascades, 2000 Dot-Com collapse, 2010 Algorithmic flash crash) against your{' '}
              <strong className="text-white underline decoration-red-500 underline-offset-2">
                active live positions and multi-agent strategies
              </strong>
              . Calculates portfolio drawdown, stop-loss slippage breaches, gap-down penalties, and margin liquidation vulnerability.
            </p>

            <div className="flex items-center gap-2.5 pt-1 text-[11px] text-stone-400 flex-wrap">
              <span className="flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 font-mono">
                <Activity className="h-3 w-3 text-red-400" />
                Active Positions Under Stress: {positionsResult.length}
              </span>
              <span className="flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 font-mono">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Slippage &amp; Gap Execution Model: Active
              </span>
              <span className="flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 font-mono">
                <BrainCircuit className="h-3 w-3 text-purple-400" />
                Auditor: Analyst Learning Agent
              </span>
            </div>
          </div>

          {/* Quick Refresh & Position Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchActivePositions();
                executeSimulation();
                showToast('Refreshed active positions and re-simulated stress test.');
              }}
              disabled={isSimulating || isLoadingPositions}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-red-600/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating || isLoadingPositions ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating Crash...' : 'Re-run Stress Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE IF ANY */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>Error running stress simulation: {errorMessage}</span>
        </div>
      )}

      {/* CRASH SCENARIO SELECTOR CARDS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Select Historical Crash or Custom Stress Scenario
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Choose a historical shock event to apply real-world index drawdown, volatility spikes, and sector divergence.
            </p>
          </div>

          {/* Position Scope Filter */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900/80 p-1 rounded-xl border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
            <button
              onClick={() => setPositionScope('ALL')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                positionScope === 'ALL'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              All Positions ({livePositions.length})
            </button>
            <button
              onClick={() => setPositionScope('INTRADAY')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                positionScope === 'INTRADAY'
                  ? 'bg-purple-600 text-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Intraday (MIS)
            </button>
            <button
              onClick={() => setPositionScope('LONG')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                positionScope === 'LONG'
                  ? 'bg-blue-600 text-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Long (CNC)
            </button>
          </div>
        </div>

        {/* SCENARIO CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {PRESET_CRASH_SCENARIOS.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-red-500 bg-red-500/10 dark:bg-red-950/30 shadow-md ring-1 ring-red-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/40 hover:border-stone-400 dark:hover:border-stone-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-red-600 dark:text-red-400 font-bold mb-1">
                    <span>{sc.tag}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                    {sc.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                    {sc.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="font-extrabold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                    <TrendingDown className="h-3 w-3" />
                    -{sc.benchmarkDropPct}% Shock
                  </span>
                  <span className="text-stone-500">VIX Peak {sc.vixPeak}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOM SCENARIO SLIDERS (IF CUSTOM SELECTED) */}
      {selectedScenarioId === 'CUSTOM' && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-500" />
              Configure Custom Parametric Stress Parameters
            </h4>
            <span className="text-[11px] font-mono text-stone-500">Dynamic Instant Recalculation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Crash severity */}
            <div className="space-y-1.5 bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700 dark:text-stone-300">Market Shock Drop:</span>
                <span className="font-mono text-red-500 font-bold">-{customShockPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="65"
                step="1"
                value={customShockPct}
                onChange={(e) => setCustomShockPct(Number(e.target.value))}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>-5% (Correction)</span>
                <span>-65% (Catastrophe)</span>
              </div>
            </div>

            {/* India VIX spike */}
            <div className="space-y-1.5 bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700 dark:text-stone-300">India VIX Peak:</span>
                <span className="font-mono text-orange-500 font-bold">{customVix}</span>
              </div>
              <input
                type="range"
                min="18"
                max="90"
                step="1"
                value={customVix}
                onChange={(e) => setCustomVix(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>18 (Normal)</span>
                <span>90 (Panic)</span>
              </div>
            </div>

            {/* Stop slippage */}
            <div className="space-y-1.5 bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700 dark:text-stone-300">Stop-Loss Slippage:</span>
                <span className="font-mono text-amber-500 font-bold">{customSlippage}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                value={customSlippage}
                onChange={(e) => setCustomSlippage(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>0.5% (Clean)</span>
                <span>12% (Vacuum)</span>
              </div>
            </div>

            {/* Gap down opening */}
            <div className="space-y-1.5 bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700 dark:text-stone-300">Overnight Gap Severity:</span>
                <span className="font-mono text-purple-500 font-bold">{customGapDown}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={customGapDown}
                onChange={(e) => setCustomGapDown(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>0% (Continuous)</span>
                <span>10% (Circuit Gap)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP KPI OVERVIEW METRICS CARDS */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Simulated Total Drawdown */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 dark:bg-red-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Potential Stress Drawdown</span>
              <Flame className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400 font-mono">
                ₹{Math.abs(summary.simulatedTotalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                ({summary.simulatedDrawdownPct}%)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Net portfolio shock under {activeScenario.name}
            </p>
          </div>

          {/* Capital Remaining vs Invested */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Capital Preserved</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                ₹{summary.capitalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-stone-500 font-mono">
                / ₹{summary.totalInvestedCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {summary.totalInvestedCapital > 0
                ? `${((summary.capitalRemaining / summary.totalInvestedCapital) * 100).toFixed(1)}% Capital Intact`
                : '100% Capital Intact'}
            </p>
          </div>

          {/* Survival Grade & Margin Call Status */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Survival Grade &amp; Margin</span>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                {summary.survivalGrade}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  summary.marginCallStatus === 'SAFE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : summary.marginCallStatus === 'WARNING_MARGIN_SQUEEZE'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {summary.marginCallStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Estimated Recovery: {summary.recoveryEstimate}
            </p>
          </div>

          {/* 1-Day Parametric VaR (99%) */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Value at Risk (99% 1-Day)</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-mono">
                ₹{summary.var99_1DayRupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Expected Shortfall (CVaR): ₹{summary.expectedShortfallRupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* TACTICAL DEFENSE & HEDGING EXPERIMENTATION ROW */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Tactical Defense &amp; Hedging Simulation Controls
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Toggle defensive hedging actions in real-time to observe how active portfolio drawdowns are attenuated.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Toggle 1: Respect Stop Loss with Slippage */}
          <div
            onClick={() => setRespectStops(!respectStops)}
            className={`cursor-pointer rounded-xl p-3 border transition flex items-start gap-3 ${
              respectStops
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                : 'border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100'
            }`}
          >
            <input
              type="checkbox"
              checked={respectStops}
              onChange={() => {}}
              className="mt-0.5 accent-emerald-600 rounded"
            />
            <div className="text-xs space-y-0.5">
              <strong className="block font-bold">
                {respectStops ? 'Stop-Losses Active (With Slippage)' : 'No Stops (Unmitigated Crash)'}
              </strong>
              <span className="text-[11px] text-stone-600 dark:text-stone-400 block">
                {respectStops
                  ? 'Exits at stop with gap & slippage penalty.'
                  : 'Worst-case full market bottom crash.'}
              </span>
            </div>
          </div>

          {/* Toggle 2: Simulate 5% OTM Put Option Hedge */}
          <div
            onClick={() => {
              setSimulatePutHedge(!simulatePutHedge);
              showToast(
                !simulatePutHedge
                  ? 'Applied 5% OTM Nifty Index Put Hedge: Offsetting 58% of simulated drawdown!'
                  : 'Removed Put Option hedge.'
              );
            }}
            className={`cursor-pointer rounded-xl p-3 border transition flex items-start gap-3 ${
              simulatePutHedge
                ? 'border-purple-500/50 bg-purple-500/10 text-purple-950 dark:text-purple-100 ring-1 ring-purple-500/40'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatePutHedge}
              onChange={() => {}}
              className="mt-0.5 accent-purple-600 rounded"
            />
            <div className="text-xs space-y-0.5">
              <strong className="block font-bold text-stone-900 dark:text-white">
                Simulate Nifty 5% OTM Put Hedge
              </strong>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold">
                {simulatePutHedge ? `+₹${hedgingEval?.withPutHedgePnlOffset || 0} P&L Offset Active` : 'Cushions ~58% of crash drawdown'}
              </span>
            </div>
          </div>

          {/* Toggle 3: Proactive 50% Cash Raise on High Beta */}
          <div
            onClick={() => {
              setSimulateCashRaise(!simulateCashRaise);
              showToast(
                !simulateCashRaise
                  ? 'Simulated Proactive 50% Cash Raise: Preserved capital before panic sets in!'
                  : 'Disabled Cash Raise simulation.'
              );
            }}
            className={`cursor-pointer rounded-xl p-3 border transition flex items-start gap-3 ${
              simulateCashRaise
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/40'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40'
            }`}
          >
            <input
              type="checkbox"
              checked={simulateCashRaise}
              onChange={() => {}}
              className="mt-0.5 accent-blue-600 rounded"
            />
            <div className="text-xs space-y-0.5">
              <strong className="block font-bold text-stone-900 dark:text-white">
                Simulate 50% Cash Raise
              </strong>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-semibold">
                {simulateCashRaise ? `+₹${hedgingEval?.withCashRaisePnlOffset || 0} Preserved` : 'Liquidates high beta on VIX breach'}
              </span>
            </div>
          </div>

          {/* Toggle 4: Tighten ATR Trailing Stops */}
          <div
            onClick={() => {
              setSimulateTightStops(!simulateTightStops);
              showToast(
                !simulateTightStops
                  ? 'Simulated Tightened Stops (1.5 ATR): Capping loss envelope.'
                  : 'Restored standard ATR stop multipliers.'
              );
            }}
            className={`cursor-pointer rounded-xl p-3 border transition flex items-start gap-3 ${
              simulateTightStops
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/40'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40'
            }`}
          >
            <input
              type="checkbox"
              checked={simulateTightStops}
              onChange={() => {}}
              className="mt-0.5 accent-amber-600 rounded"
            />
            <div className="text-xs space-y-0.5">
              <strong className="block font-bold text-stone-900 dark:text-white">
                Tighten Stops to 1.5 ATR
              </strong>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold">
                {simulateTightStops ? `+₹${hedgingEval?.withTightStopPnlOffset || 0} Loss Avoided` : 'Limits trailing drawdown corridor'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* POSITION STRESS-TEST IMPACT TABLE */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Active Positions Stress Impact Ledger
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Detailed simulated crash prices, stop slippage triggers, and individual loss contributions under {activeScenario.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
            <span className="text-stone-500">
              Positions Tested: <strong className="text-stone-900 dark:text-white">{positionsResult.length}</strong>
            </span>
          </div>
        </div>

        {positionsResult.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No active positions found in selected scope. Switch scope or toggle sample portfolio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-2.5 px-3">Ticker / Sector</th>
                  <th className="py-2.5 px-3">Mode / Action</th>
                  <th className="py-2.5 px-3 text-right">Shares</th>
                  <th className="py-2.5 px-3 text-right">Entry / Current</th>
                  <th className="py-2.5 px-3 text-right">Stop Loss</th>
                  <th className="py-2.5 px-3 text-right">Simulated Price</th>
                  <th className="py-2.5 px-3">Stop Outcome</th>
                  <th className="py-2.5 px-3 text-right">Simulated P&amp;L</th>
                  <th className="py-2.5 px-3 text-right">DD Contrib %</th>
                  <th className="py-2.5 px-3 text-center">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {positionsResult.map((pos: any, idx: number) => {
                  const isLoss = pos.simulatedPnlRupees < 0;
                  return (
                    <tr
                      key={pos.order_id || idx}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition"
                    >
                      {/* Ticker & Sector */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900 dark:text-white font-mono flex items-center gap-1.5">
                          <span>{pos.ticker}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">{pos.sector}</span>
                      </td>

                      {/* Mode & Action */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                              pos.trade_mode === 'INTRADAY'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {pos.trade_mode}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                              pos.action === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            }`}
                          >
                            {pos.action}
                          </span>
                        </div>
                      </td>

                      {/* Shares */}
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700 dark:text-stone-300">
                        {pos.shares}
                      </td>

                      {/* Entry & Current */}
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 dark:text-stone-400">
                        <div>₹{pos.entryPrice}</div>
                        <div className="text-[10px] text-stone-400">₹{pos.currentPrice}</div>
                      </td>

                      {/* Stop Loss */}
                      <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                        ₹{pos.stopLoss}
                      </td>

                      {/* Simulated Exit Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                        ₹{pos.exitPriceUsed}
                        <span className="block text-[10px] text-red-500 font-normal">
                          -{pos.simulatedDropPct}%
                        </span>
                      </td>

                      {/* Stop Outcome */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold font-mono ${
                            pos.stopExecutionOutcome === 'STOP_BREACHED_WITH_SLIPPAGE'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : pos.stopExecutionOutcome === 'STOP_HELD'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : pos.stopExecutionOutcome === 'SHORT_PROFIT'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {pos.stopExecutionOutcome === 'STOP_BREACHED_WITH_SLIPPAGE'
                            ? 'Stop Slipped & Filled'
                            : pos.stopExecutionOutcome === 'STOP_HELD'
                            ? 'Stop Preserved'
                            : pos.stopExecutionOutcome === 'SHORT_PROFIT'
                            ? 'Hedge Profit'
                            : 'Unmitigated Bottom'}
                        </span>
                      </td>

                      {/* Simulated PnL */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className={`font-bold ${isLoss ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isLoss ? '-' : '+'}₹{Math.abs(pos.simulatedPnlRupees).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {pos.simulatedPnlPct}%
                        </div>
                      </td>

                      {/* Drawdown Contribution */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-700 dark:text-stone-300">
                        {pos.drawdownContributionPct}%
                      </td>

                      {/* Risk Tier */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase font-mono ${
                            pos.riskTier === 'EXTREME'
                              ? 'bg-red-600 text-white'
                              : pos.riskTier === 'HIGH'
                              ? 'bg-orange-500 text-white'
                              : pos.riskTier === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {pos.riskTier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STRATEGY & SECTOR STRESS RESILIENCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Strategy Stress Resilience (Cognitive-Q Flagship highlighted) */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-purple-500" />
              Strategy Resilience &amp; Multi-Agent Behavior Under Crash
            </h3>
            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">
              Cognitive-Q Engine
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            How each quant strategy withstands severe historical liquidity vacuums and tail-risk volatility.
          </p>

          <div className="space-y-3 pt-1">
            {strategyDrawdowns.map((strat: any, sIdx: number) => {
              const isCognitiveQ = strat.strategyName.includes('Cognitive-Q');
              return (
                <div
                  key={sIdx}
                  className={`rounded-xl p-3 border space-y-1.5 transition ${
                    isCognitiveQ
                      ? 'border-purple-500/40 bg-purple-500/5 dark:bg-purple-950/20'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      {isCognitiveQ && <Sparkles className="h-3.5 w-3.5 text-purple-500" />}
                      {strat.strategyName}
                    </span>
                    <span className="rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] px-2 py-0.5 font-bold">
                      Grade: {strat.resilienceGrade}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 font-mono">
                    <span>Invested: ₹{strat.invested.toLocaleString('en-IN')}</span>
                    <span className="text-red-500 font-bold">
                      Loss: -₹{strat.simulatedLoss.toLocaleString('en-IN')} ({strat.drawdownPct}%)
                    </span>
                  </div>

                  {/* Multi-agent defense summary for Cognitive-Q */}
                  {isCognitiveQ && (
                    <div className="pt-1 text-[11px] text-purple-700 dark:text-purple-300 bg-purple-500/10 rounded-lg p-2 leading-relaxed">
                      <strong>5-Stage Multi-Agent Defense:</strong> Trend Agent halts bullish initiations on 50 EMA breach; Liquidity Agent detects ask wall imbalance; Risk Sizing Sentinel tightens trailing stops to preserve capital.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Drawdown Waterfall */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              Sector Drawdown Attribution Waterfall
            </h3>
            <span className="text-xs font-mono text-stone-400">Loss Contribution</span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Sector-by-sector capital depletion breakdown based on historical beta and liquidity characteristics.
          </p>

          <div className="space-y-3 pt-1">
            {sectorDrawdowns.map((sec: any, idx: number) => {
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{sec.sector}</span>
                    <span className="text-red-500 font-semibold">
                      -₹{sec.simulatedLoss.toLocaleString('en-IN')} ({sec.drawdownPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, sec.drawdownPct * 1.5)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono text-right">
                    Capital Allocated: ₹{sec.invested.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ANALYST AI CRASH SURVIVAL AUDIT & DIRECTIVES */}
      {verdict && (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-stone-900 via-[#181326] to-[#120a17] p-5 sm:p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-purple-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {verdict.title || 'Analyst Crash Survival Audit'}
              </h3>
            </div>
            <span className="rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] px-2.5 py-0.5 border border-purple-500/40">
              {verdict.generatedVia === 'GEMINI_3_8_FLASH' ? 'Gemini 3.8 Flash' : 'Deterministic Quant Audit'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {verdict.narrative}
          </p>

          {/* Identified Vulnerabilities */}
          {verdict.vulnerabilitiesIdentified && verdict.vulnerabilitiesIdentified.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Vulnerability Attack Points Detected:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {verdict.vulnerabilitiesIdentified.map((vuln: string, vIdx: number) => (
                  <div
                    key={vIdx}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed"
                  >
                    {vuln}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Directives */}
          {verdict.actionableDirectives && verdict.actionableDirectives.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Analyst Defense Directives for Real-World Safety:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {verdict.actionableDirectives.map((dir: string, dIdx: number) => (
                  <div
                    key={dIdx}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 leading-relaxed"
                  >
                    {dir}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
