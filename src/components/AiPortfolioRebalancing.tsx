import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  Scale,
  Brain,
  Zap,
  Check,
  Info,
  DollarSign,
  Briefcase,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { ExecutedPosition, PortfolioAccounting } from '../types';

export type RiskProfileType = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE_GROWTH';

export interface SectorTargetInput {
  sector: string;
  targetPct: number;
}

export interface RebalanceAction {
  id: string;
  order_id?: string;
  ticker: string;
  company_name: string;
  sector: string;
  action: 'TRIM' | 'CLOSE' | 'EXPAND' | 'HOLD' | 'NEW_ENTRY';
  currentShares: number;
  suggestedShares: number;
  sharesDelta: number;
  currentPrice: number;
  estimatedCashImpactRupees: number;
  currentWeightPct: number;
  suggestedWeightPct: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
  suggestedStopLoss?: number;
  suggestedTargetPrice?: number;
}

export interface SectorDriftAnalysis {
  sector: string;
  currentValueRupees: number;
  currentWeightPct: number;
  targetWeightPct: number;
  driftPct: number;
  status: 'OVERWEIGHT' | 'UNDERWEIGHT' | 'ALIGNED';
}

export interface RebalancingReport {
  timestamp: string;
  riskProfile: RiskProfileType;
  healthScore: number;
  overallAssessment: string;
  riskHighlights: string[];
  totalEquity: number;
  currentLiquidCash: number;
  investedCapital: number;
  sectorDrift: SectorDriftAnalysis[];
  suggestedActions: RebalanceAction[];
  projectedMetrics: {
    projectedLiquidCash: number;
    projectedCashRatioPct: number;
    projectedHealthScore: number;
    netCashFreedRupees: number;
  };
}

interface AiPortfolioRebalancingProps {
  positions: ExecutedPosition[];
  accounting?: PortfolioAccounting | null;
  onRefreshPortfolio?: () => Promise<void>;
  onSelectTickerForPipeline?: (ticker: string) => void;
}

const DEFAULT_TARGETS: Record<RiskProfileType, SectorTargetInput[]> = {
  CONSERVATIVE: [
    { sector: 'Banking & Finance', targetPct: 15 },
    { sector: 'Energy & Oil', targetPct: 20 },
    { sector: 'FMCG', targetPct: 20 },
    { sector: 'Pharma & Healthcare', targetPct: 20 },
    { sector: 'IT & Tech', targetPct: 15 },
    { sector: 'Automobile', targetPct: 10 },
  ],
  BALANCED: [
    { sector: 'Banking & Finance', targetPct: 20 },
    { sector: 'IT & Tech', targetPct: 20 },
    { sector: 'Energy & Oil', targetPct: 15 },
    { sector: 'Automobile', targetPct: 15 },
    { sector: 'Pharma & Healthcare', targetPct: 15 },
    { sector: 'Infrastructure & Capital Goods', targetPct: 15 },
  ],
  AGGRESSIVE_GROWTH: [
    { sector: 'Banking & Finance', targetPct: 25 },
    { sector: 'IT & Tech', targetPct: 25 },
    { sector: 'Infrastructure & Capital Goods', targetPct: 20 },
    { sector: 'Automobile', targetPct: 15 },
    { sector: 'Telecom', targetPct: 15 },
  ],
};

export const AiPortfolioRebalancing: React.FC<AiPortfolioRebalancingProps> = ({
  positions,
  accounting,
  onRefreshPortfolio,
  onSelectTickerForPipeline,
}) => {
  const [riskProfile, setRiskProfile] = useState<RiskProfileType>('BALANCED');
  const [sectorTargets, setSectorTargets] = useState<SectorTargetInput[]>(DEFAULT_TARGETS.BALANCED);
  const [report, setReport] = useState<RebalancingReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [applyingActionId, setApplyingActionId] = useState<string | null>(null);
  const [appliedActionIds, setAppliedActionIds] = useState<Set<string>>(new Set());
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [showTargetsEditor, setShowTargetsEditor] = useState<boolean>(false);

  // When risk profile changes, reset targets to preset defaults
  const handleProfileChange = (newProfile: RiskProfileType) => {
    setRiskProfile(newProfile);
    setSectorTargets(DEFAULT_TARGETS[newProfile]);
  };

  // Run AI Rebalancing
  const handleRunRebalancing = async () => {
    setIsLoading(true);
    setActionSuccessMessage(null);
    try {
      const res = await fetch('/api/portfolio/ai-rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskProfile,
          sectorTargets,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
        }
      }
    } catch (err) {
      console.error('Failed to run AI Rebalancing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleRunRebalancing();
  }, [riskProfile]);

  // Adjust individual sector target
  const handleTargetChange = (sector: string, newPct: number) => {
    const clamped = Math.max(0, Math.min(60, newPct));
    setSectorTargets((prev) =>
      prev.map((t) => (t.sector === sector ? { ...t, targetPct: clamped } : t))
    );
  };

  // Reset to default targets
  const handleResetTargets = () => {
    setSectorTargets(DEFAULT_TARGETS[riskProfile]);
  };

  // Execute a specific rebalance action
  const handleApplyAction = async (action: RebalanceAction) => {
    setApplyingActionId(action.id);
    setActionSuccessMessage(null);
    try {
      const actionType = action.action === 'NEW_ENTRY' ? 'NEW_ENTRY' : action.action === 'CLOSE' ? 'CLOSE' : 'TRIM';
      const res = await fetch('/api/portfolio/apply-rebalance-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          order_id: action.order_id,
          ticker: action.ticker,
          shares: Math.abs(action.sharesDelta),
          currentPrice: action.currentPrice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedActionIds((prev) => new Set([...prev, action.id]));
        setActionSuccessMessage(data.message || `Successfully executed ${action.action} on ${action.ticker}.`);
        if (onRefreshPortfolio) {
          await onRefreshPortfolio();
        }
        // Re-run rebalancing report to reflect changes
        setTimeout(() => {
          handleRunRebalancing();
        }, 800);
      }
    } catch (err: any) {
      console.error('Failed to apply rebalance action:', err);
    } finally {
      setApplyingActionId(null);
    }
  };

  const totalTargetPct = sectorTargets.reduce((sum, t) => sum + t.targetPct, 0);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                AI Portfolio Rebalancing &amp; Risk Optimizer
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  Gemini + Drift Engine
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Dynamically aligns active holdings with your defined risk profile, caps sector concentration, and releases capital from overweight assets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTargetsEditor(!showTargetsEditor)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              showTargetsEditor
                ? 'border-stone-800 bg-stone-900 text-white'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showTargetsEditor ? 'Hide Sector Targets' : 'Customize Targets'}</span>
          </button>

          <button
            id="btn-run-ai-rebalance"
            onClick={handleRunRebalancing}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 transition shadow-xs disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Optimizing Portfolio...' : 'Analyze & Rebalance'}</span>
          </button>
        </div>
      </div>

      {/* RISK PROFILE SELECTION TABS */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
          Step 1: Select Your Risk Profile Mandate
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Conservative */}
          <button
            type="button"
            onClick={() => handleProfileChange('CONSERVATIVE')}
            className={`text-left p-3.5 rounded-xl border transition relative ${
              riskProfile === 'CONSERVATIVE'
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Conservative Preservation
              </span>
              {riskProfile === 'CONSERVATIVE' && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
            </div>
            <p className="mt-1 text-[11px] text-stone-500 leading-snug">
              Max 20% sector exposure &bull; 35%+ cash reserve &bull; Defends against market drawdowns with low-beta compounders.
            </p>
          </button>

          {/* Balanced */}
          <button
            type="button"
            onClick={() => handleProfileChange('BALANCED')}
            className={`text-left p-3.5 rounded-xl border transition relative ${
              riskProfile === 'BALANCED'
                ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-amber-600" />
                Balanced All-Weather
              </span>
              {riskProfile === 'BALANCED' && (
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <p className="mt-1 text-[11px] text-stone-500 leading-snug">
              20% sector cap &bull; 20% liquid cash &bull; Equalized multi-sector alpha across IT, Banking, Energy &amp; Infra.
            </p>
          </button>

          {/* Aggressive */}
          <button
            type="button"
            onClick={() => handleProfileChange('AGGRESSIVE_GROWTH')}
            className={`text-left p-3.5 rounded-xl border transition relative ${
              riskProfile === 'AGGRESSIVE_GROWTH'
                ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Aggressive Growth
              </span>
              {riskProfile === 'AGGRESSIVE_GROWTH' && (
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <p className="mt-1 text-[11px] text-stone-500 leading-snug">
              Up to 35% sector exposure &bull; 10% cash &bull; Concentrates capital into high-beta momentum &amp; swing runners.
            </p>
          </button>

        </div>
      </div>

      {/* SECTOR TARGETS CUSTOMIZER (Collapsible) */}
      {showTargetsEditor && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-stone-700" />
                Customize Target Sector Exposure %
              </h4>
              <p className="text-[11px] text-stone-500">
                Adjust allocation targets. Current total sum: <strong>{totalTargetPct}%</strong>
              </p>
            </div>
            <button
              onClick={handleResetTargets}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {sectorTargets.map((item) => (
              <div key={item.sector} className="rounded-lg bg-white p-2.5 border border-stone-200 space-y-1">
                <span className="text-[11px] font-medium text-stone-700 block truncate" title={item.sector}>
                  {item.sector}
                </span>
                <div className="flex items-center justify-between gap-1">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={item.targetPct}
                    onChange={(e) => handleTargetChange(item.sector, parseInt(e.target.value) || 0)}
                    className="w-14 rounded border border-stone-300 px-2 py-1 font-mono text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="font-mono text-xs text-stone-400">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICATION FEEDBACK */}
      {actionSuccessMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI ANALYSIS RESULTS REPORT */}
      {report && (
        <div className="space-y-6">
          
          {/* TOP METRICS & HEALTH DIAL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Health Score Card */}
            <div className="rounded-xl border border-stone-200 bg-stone-900 text-white p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Portfolio Alignment Score
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${
                  report.healthScore >= 80 ? 'text-emerald-400' : report.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {report.healthScore}
                </span>
                <span className="text-stone-400 text-xs font-mono">/ 100</span>
                <span className="text-[10px] text-emerald-400 font-semibold ml-auto">
                  &rarr; Projected: {report.projectedMetrics.projectedHealthScore}/100
                </span>
              </div>
              <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    report.healthScore >= 80 ? 'bg-emerald-500' : report.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${report.healthScore}%` }}
                />
              </div>
            </div>

            {/* Total Equity */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Equity</span>
              <p className="mt-1 text-xl font-extrabold font-mono text-stone-900">
                ₹{report.totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-stone-500">Live Mark-to-Market Base</span>
            </div>

            {/* Liquid Cash Buffer */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Liquid Cash Reserve</span>
              <p className="mt-1 text-xl font-extrabold font-mono text-stone-900">
                ₹{report.currentLiquidCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-stone-500">
                {((report.currentLiquidCash / report.totalEquity) * 100).toFixed(1)}% of portfolio
              </span>
            </div>

            {/* Net Cash Impact */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Net Rebalance Impact</span>
              <p className={`mt-1 text-xl font-extrabold font-mono ${
                report.projectedMetrics.netCashFreedRupees >= 0 ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                {report.projectedMetrics.netCashFreedRupees >= 0 ? '+' : ''}₹{report.projectedMetrics.netCashFreedRupees.toFixed(2)}
              </p>
              <span className="text-[11px] text-stone-500">
                {report.projectedMetrics.netCashFreedRupees >= 0 ? 'Cash freed for reallocation' : 'Capital deployed'}
              </span>
            </div>

          </div>

          {/* AI EXECUTIVE NARRATIVE */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Gemini AI Quantitative Risk Assessment</span>
            </div>
            <p className="text-stone-800 leading-relaxed font-sans">
              {report.overallAssessment}
            </p>
            {report.riskHighlights.length > 0 && (
              <div className="pt-2 border-t border-amber-200/60 space-y-1">
                {report.riskHighlights.map((hl, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-950 font-medium">
                    <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTOR DRIFT VISUALIZER */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-stone-500" />
              Sector Exposure Drift vs Target Mandate
            </h4>

            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[11px] text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Sector</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Current Value (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Current Weight</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Target Weight</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Drift Delta</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white font-mono text-[11px]">
                  {report.sectorDrift.map((sd) => {
                    const isOver = sd.status === 'OVERWEIGHT';
                    const isUnder = sd.status === 'UNDERWEIGHT';
                    return (
                      <tr key={sd.sector} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-3 font-sans font-bold text-stone-900">{sd.sector}</td>
                        <td className="py-2.5 px-3 text-right">₹{sd.currentValueRupees.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-stone-800">{sd.currentWeightPct}%</td>
                        <td className="py-2.5 px-3 text-right text-stone-500">{sd.targetWeightPct}%</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          isOver ? 'text-rose-600' : isUnder ? 'text-sky-600' : 'text-emerald-600'
                        }`}>
                          {sd.driftPct > 0 ? '+' : ''}{sd.driftPct}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOver
                              ? 'bg-rose-100 text-rose-800'
                              : isUnder
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {sd.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SUGGESTED REBALANCING ADJUSTMENTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Suggested Position Adjustments ({report.suggestedActions.length} Actions)
              </h4>
              <span className="text-[11px] text-stone-500">
                Click <strong>"Execute"</strong> to apply adjustments directly to your live portfolio
              </span>
            </div>

            {report.suggestedActions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
                Portfolio is currently in optimal alignment. No immediate position trimming or adjustments required.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.suggestedActions.map((action) => {
                  const isTrim = action.action === 'TRIM';
                  const isClose = action.action === 'CLOSE';
                  const isNew = action.action === 'NEW_ENTRY';
                  const isHold = action.action === 'HOLD';
                  const isApplied = appliedActionIds.has(action.id);
                  const isApplying = applyingActionId === action.id;

                  return (
                    <div
                      key={action.id}
                      className={`rounded-xl border p-4 transition space-y-3 ${
                        isApplied
                          ? 'border-emerald-300 bg-emerald-50/30 opacity-75'
                          : isTrim || isClose
                          ? 'border-amber-200 bg-white hover:border-amber-300 shadow-xs'
                          : isNew
                          ? 'border-blue-200 bg-white hover:border-blue-300 shadow-xs'
                          : 'border-stone-200 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900">{action.ticker}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTrim
                                ? 'bg-amber-100 text-amber-800'
                                : isClose
                                ? 'bg-rose-100 text-rose-800'
                                : isNew
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {action.action}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {action.sector}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{action.company_name}</p>
                        </div>

                        <div className="text-right font-mono">
                          <span className={`text-xs font-bold ${
                            action.estimatedCashImpactRupees > 0
                              ? 'text-emerald-700'
                              : action.estimatedCashImpactRupees < 0
                              ? 'text-blue-700'
                              : 'text-stone-500'
                          }`}>
                            {action.estimatedCashImpactRupees > 0 ? '+' : ''}
                            ₹{Math.abs(action.estimatedCashImpactRupees).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {action.estimatedCashImpactRupees > 0 ? 'Cash Freed' : action.estimatedCashImpactRupees < 0 ? 'Est. Outflow' : 'Neutral'}
                          </span>
                        </div>
                      </div>

                      {/* Shares & Weight Delta */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50/80 rounded-lg p-2.5 font-mono">
                        <div>
                          <span className="text-[10px] text-stone-400 block font-sans">Shares Adjustment</span>
                          <span className="font-bold text-stone-800">
                            {action.currentShares} &rarr; {action.suggestedShares}
                          </span>
                          {action.sharesDelta !== 0 && (
                            <span className={`ml-1 text-[10px] ${action.sharesDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({action.sharesDelta > 0 ? '+' : ''}{action.sharesDelta})
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-400 block font-sans">Weight Drift</span>
                          <span className="font-bold text-stone-800">
                            {action.currentWeightPct}% &rarr; {action.suggestedWeightPct}%
                          </span>
                        </div>
                      </div>

                      {/* Rationale */}
                      <p className="text-[11px] text-stone-600 leading-snug font-sans">
                        {action.rationale}
                      </p>

                      {/* Action Button */}
                      {!isHold && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-stone-400 font-mono">
                            Urgency: <strong className={action.urgency === 'HIGH' ? 'text-rose-600' : 'text-stone-700'}>{action.urgency}</strong>
                          </span>

                          <button
                            onClick={() => handleApplyAction(action)}
                            disabled={isApplied || isApplying}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
                              isApplied
                                ? 'bg-emerald-100 text-emerald-800'
                                : isTrim || isClose
                                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Applied</span>
                              </>
                            ) : (
                              <>
                                <Play className={`h-3 w-3 ${isApplying ? 'animate-spin' : ''}`} />
                                <span>{isApplying ? 'Executing...' : `Execute ${action.action}`}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
