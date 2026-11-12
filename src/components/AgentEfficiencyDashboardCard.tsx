import React from 'react';
import {
  Gauge,
  Target,
  ShieldCheck,
  TrendingUp,
  Award,
  CheckCircle2,
  BarChart3,
  Scale,
} from 'lucide-react';
import { PageSection } from './ui/ReusableComponents';

export interface StrategyEfficiencyBreakdownItem {
  strategyName: string;
  tradesCount: number;
  winRatePct: number;
  netPnl: number;
  efficiencyPct: number;
}

export interface AgentEfficiencySummaryData {
  strategyEfficiencyScore: number;
  profitFactor: number;
  capitalUtilizationPct: number;
  topStrategyName: string;
  topStrategyPnl: number;
  overallSuccessRatePct: number;
  closedWinRatePct: number;
  winningTradesCount: number;
  losingTradesCount: number;
  liveInProfitCount: number;
  liveInDrawdownCount: number;
  avgWinRupees: number;
  avgLossRupees: number;
  payoffRatio: number;
  sharpeRatio: number;
  sortinoRatio: number;
  achievedRiskRewardRatio: number;
  targetMinRiskReward: number;
  maxDrawdownPct: number;
  ruinCeilingPct: number;
  returnOnEquityPct: number;
  returnOnAllocatedCapitalPct: number;
  strategyBreakdown: StrategyEfficiencyBreakdownItem[];
}

interface AgentEfficiencyDashboardCardProps {
  data: AgentEfficiencySummaryData;
  onSelectStrategy?: (strategyName: string) => void;
}

export const AgentEfficiencyDashboardCard: React.FC<AgentEfficiencyDashboardCardProps> = ({
  data,
  onSelectStrategy,
}) => {
  const totalTradesSample =
    data.winningTradesCount +
    data.losingTradesCount +
    data.liveInProfitCount +
    data.liveInDrawdownCount;

  const winSegmentPct =
    totalTradesSample > 0
      ? Math.round(((data.winningTradesCount + data.liveInProfitCount) / totalTradesSample) * 100)
      : Math.round(data.overallSuccessRatePct);

  const lossSegmentPct = Math.max(0, 100 - winSegmentPct);

  return (
    <PageSection
      title="Daily Strategy Efficiency, Trade Success Rate & Risk-Adjusted Returns"
      subtitle="Quantitative evaluation of strategy execution quality, win/loss payoff asymmetry, and volatility-adjusted performance"
      badge={`EFFICIENCY SCORE: ${data.strategyEfficiencyScore}/100`}
    >
      <div className="space-y-5">
        {/* Top 3-Pillar Grid: Strategy Efficiency | Trade Success Rate | Risk-Adjusted Returns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* PILLAR 1: TOTAL STRATEGY EFFICIENCY */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Gauge className="h-3.5 w-3.5 text-amber-500" />
                  1. Total Strategy Efficiency
                </span>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                  {data.strategyEfficiencyScore >= 80 ? 'HIGH EFFICIENCY' : 'OPTIMAL'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                    {data.strategyEfficiencyScore}%
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Composite Execution Efficiency
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {data.profitFactor.toFixed(2)}x
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Profit Factor
                  </div>
                </div>
              </div>

              {/* Efficiency Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, data.strategyEfficiencyScore))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Top Strategy</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                  {data.topStrategyName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Capital Deployed</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {data.capitalUtilizationPct}% Active
                </span>
              </div>
            </div>
          </div>

          {/* PILLAR 2: TRADE SUCCESS RATE & PAYOFF ASYMMETRY */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Target className="h-3.5 w-3.5 text-emerald-500" />
                  2. Trade Success Rate
                </span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {data.winningTradesCount + data.liveInProfitCount}W / {data.losingTradesCount + data.liveInDrawdownCount}L
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {data.overallSuccessRatePct}%
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Combined Win &amp; Live-Profit Rate
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                    {data.closedWinRatePct}%
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Closed Realized Win Rate
                  </div>
                </div>
              </div>

              {/* Stacked Win/Loss Split Bar */}
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${winSegmentPct}%` }}
                  title={`Winning & In-Profit: ${winSegmentPct}%`}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${lossSegmentPct}%` }}
                  title={`Drawdown / Stopped: ${lossSegmentPct}%`}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Avg Win vs Loss</span>
                <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +₹{data.avgWinRupees.toFixed(0)}
                </span>
                <span className="text-stone-400 mx-1">/</span>
                <span className="font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  -₹{data.avgLossRupees.toFixed(0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Live / Ended Split</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
                  {data.liveInProfitCount + data.liveInDrawdownCount} Blue • {data.winningTradesCount + data.losingTradesCount} Yellow
                </span>
              </div>
            </div>
          </div>

          {/* PILLAR 3: RISK-ADJUSTED RETURNS */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  3. Risk-Adjusted Returns
                </span>
                <span className="rounded bg-blue-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                  R:R {data.achievedRiskRewardRatio}:1
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                    {data.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Sharpe Ratio (Sortino: {data.sortinoRatio.toFixed(2)})
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold font-mono tabular-nums ${
                      data.returnOnEquityPct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {data.returnOnEquityPct >= 0 ? '+' : ''}
                    {data.returnOnEquityPct}%
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Return on Total Equity
                  </div>
                </div>
              </div>

              {/* Risk Drawdown Buffer Bar */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span>Max Drawdown: {data.maxDrawdownPct}%</span>
                <span>Ruin Limit: {data.ruinCeilingPct}% / trade</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Return on Deployed</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    data.returnOnAllocatedCapitalPct >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {data.returnOnAllocatedCapitalPct >= 0 ? '+' : ''}
                  {data.returnOnAllocatedCapitalPct}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Target Min R:R</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  &ge; {data.targetMinRiskReward.toFixed(1)}:1 Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Strategy Efficiency & Return Table */}
        {data.strategyBreakdown && data.strategyBreakdown.length > 0 && (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Strategy-Level Efficiency &amp; P&amp;L Attribution
                </h4>
              </div>
              <span className="text-[11px] text-stone-400">
                Click any strategy row to inspect itemized SQLite executions
              </span>
            </div>

            <div className="space-y-2.5">
              {data.strategyBreakdown.map((item) => (
                <div
                  key={item.strategyName}
                  onClick={() => onSelectStrategy?.(item.strategyName)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-950/40 px-3.5 py-2.5 hover:border-stone-300 dark:hover:border-stone-700 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="rounded bg-stone-200 dark:bg-stone-800 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                      {item.efficiencyPct}% EFF
                    </span>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {item.strategyName}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400 tabular-nums">
                      ({item.tradesCount} {item.tradesCount === 1 ? 'trade' : 'trades'})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                    <div className="w-28 hidden md:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, item.winRatePct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-stone-600 dark:text-stone-400">
                      Win: <strong className="text-stone-900 dark:text-stone-100">{item.winRatePct}%</strong>
                    </span>
                    <span
                      className={`font-bold min-w-[72px] text-right ${
                        item.netPnl >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.netPnl >= 0 ? '+' : ''}₹{item.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageSection>
  );
};
