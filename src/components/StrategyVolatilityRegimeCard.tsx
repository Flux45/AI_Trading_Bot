import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { PageSection } from './ui/ReusableComponents';

export interface VolatilityRegimeChartPoint {
  regime: string;
  vixRange: string;
  orbVwapPnl: number;
  orbVwapWinRate: number;
  atrPullbackPnl: number;
  atrPullbackWinRate: number;
  rsMomentumPnl: number;
  rsMomentumWinRate: number;
  vwapReversionPnl: number;
  vwapReversionWinRate: number;
}

export interface FailingStrategyDiagnosticItem {
  strategyId: string;
  strategyName: string;
  failingRegime: string;
  winRateInFailingRegime: number;
  netPnlInFailingRegime: number;
  failureRootCause: string;
  recommendedGuardrail: string;
  bestAlternativeStrategy: string;
}

export interface VolatilityRegimeAnalysisData {
  currentMarketRegime: string;
  regimesChartData: VolatilityRegimeChartPoint[];
  failingStrategiesDiagnostics: FailingStrategyDiagnosticItem[];
}

interface StrategyVolatilityRegimeCardProps {
  data: VolatilityRegimeAnalysisData;
  onSelectStrategy?: (strategyIdOrName: string) => void;
}

export const StrategyVolatilityRegimeCard: React.FC<StrategyVolatilityRegimeCardProps> = ({
  data,
  onSelectStrategy,
}) => {
  const [metricMode, setMetricMode] = useState<'pnl' | 'winRate'>('pnl');

  return (
    <PageSection
      title="Strategy Performance & Failure Mapping Across Market Volatility Regimes"
      subtitle={`Current Session Regime: ${data.currentMarketRegime} • Identifies which strategies fail under specific ATR & India VIX conditions`}
      badge="VOLATILITY REGIME MATRIX"
      actions={
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-1">
          <button
            type="button"
            onClick={() => setMetricMode('pnl')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              metricMode === 'pnl'
                ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Net P&amp;L (₹) by Regime
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('winRate')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              metricMode === 'winRate'
                ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Win Rate (%) by Regime
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Interactive Recharts Multi-Strategy Volatility Regime BarChart */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span>
                {metricMode === 'pnl'
                  ? 'Strategy Net P&L (₹) Across 4 ATR / VIX Regimes (Bars below ₹0 indicate regime failure)'
                  : 'Strategy Win Rate (%) Across 4 ATR / VIX Regimes (Bars below 50% indicate negative expectancy)'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
              Active Regime: <strong className="text-amber-600 dark:text-amber-400">{data.currentMarketRegime}</strong>
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.regimesChartData}
                margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#57534e" opacity={0.22} />
                <XAxis
                  dataKey="regime"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={{ stroke: '#78716c', opacity: 0.4 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={{ stroke: '#78716c', opacity: 0.4 }}
                  tickFormatter={(val) => (metricMode === 'pnl' ? `₹${val}` : `${val}%`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderColor: '#44403c',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#f5f5f4',
                  }}
                  formatter={(value: any, name: any) => [
                    metricMode === 'pnl'
                      ? `${Number(value) >= 0 ? '+' : ''}₹${Number(value).toLocaleString('en-IN')}`
                      : `${value}% Win Rate`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {metricMode === 'pnl' ? (
                  <ReferenceLine
                    y={0}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: '₹0 Breakeven Threshold',
                      position: 'insideTopRight',
                      fill: '#ef4444',
                      fontSize: 10,
                    }}
                  />
                ) : (
                  <ReferenceLine
                    y={50}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: '50% Win Threshold',
                      position: 'insideTopRight',
                      fill: '#f59e0b',
                      fontSize: 10,
                    }}
                  />
                )}

                <Bar
                  dataKey={metricMode === 'pnl' ? 'orbVwapPnl' : 'orbVwapWinRate'}
                  name="Intraday ORB + VWAP Momentum"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={metricMode === 'pnl' ? 'atrPullbackPnl' : 'atrPullbackWinRate'}
                  name="ATR Volatility Pullback (1.8x Stop)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={metricMode === 'pnl' ? 'rsMomentumPnl' : 'rsMomentumWinRate'}
                  name="Relative Strength Sector Leader"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={metricMode === 'pnl' ? 'vwapReversionPnl' : 'vwapReversionWinRate'}
                  name="VWAP Institutional Mean-Reversion"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failing Strategy Diagnostics & Regime Guardrails */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Where Strategies Fail &amp; Automated Regime Guardrails
              </h4>
            </div>
            <span className="text-[11px] text-stone-400">
              Click any card to inspect itemized SQLite executions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {data.failingStrategiesDiagnostics.map((diag) => (
              <div
                key={diag.strategyId}
                onClick={() => onSelectStrategy?.(diag.strategyName)}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col justify-between hover:border-stone-400 dark:hover:border-stone-700 transition cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">
                        FAILS IN: {diag.failingRegime}
                      </span>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                        {diag.strategyName}
                      </h5>
                    </div>
                    <span className="shrink-0 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                      {diag.winRateInFailingRegime}% Win ({diag.netPnlInFailingRegime >= 0 ? '+' : ''}₹{diag.netPnlInFailingRegime})
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    <strong className="text-stone-800 dark:text-stone-200">Why it fails:</strong>{' '}
                    {diag.failureRootCause}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-[11px]">
                  <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Guardrail:</strong> {diag.recommendedGuardrail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 font-medium">
                    <ArrowRight className="h-3 w-3 shrink-0 text-amber-500" />
                    <span>Switch to: {diag.bestAlternativeStrategy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  );
};
