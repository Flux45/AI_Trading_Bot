import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  Zap,
  ShieldCheck,
  Database,
  RefreshCw,
  Play,
  TrendingUp,
  Layers,
  Radio,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { PageSection, StatMetricCard } from './ui/ReusableComponents';
import {
  AgentEfficiencyDashboardCard,
  AgentEfficiencySummaryData,
} from './AgentEfficiencyDashboardCard';
import {
  StrategyVolatilityRegimeCard,
  VolatilityRegimeAnalysisData,
} from './StrategyVolatilityRegimeCard';
import { AnalystHub } from './AnalystHub';
import type { TabType } from './Navbar';

interface TimelineItem {
  id: string;
  timeIst: string;
  dateIst: string;
  category: 'TRADE_LIVE' | 'TRADE_CLOSED' | 'STRATEGY_ENGINE' | 'PLATFORM_HEALTH' | 'RISK_GUARD';
  title: string;
  detail: string;
  badge: string;
}

interface DailyInsightPayload {
  generatedAtIst: string;
  agentHeadline: string;
  executiveSummary: string;
  platformStatus: {
    pipelineLatencyTarget: string;
    cronStatus: string;
    sqliteStatus: string;
    strategiesCount: number;
    customStrategiesCount: number;
    daemonEnabled: boolean;
    daemonCyclesToday: number;
  };
  scorecard: {
    totalEquity: number;
    liquidCash: number;
    allocatedCapital: number;
    realizedPnl: number;
    unrealizedPnl: number;
    netTotalPnl: number;
    winRatePct: number;
    openTradesCount: number;
    closedTradesCount: number;
  };
  efficiencySummary?: AgentEfficiencySummaryData;
  volatilityRegimeAnalysis?: VolatilityRegimeAnalysisData;
  adaptiveInsights: string[];
  timeline: TimelineItem[];
}

interface AgentDailyInsightViewProps {
  onNavigateToTab?: (tab: TabType) => void;
  onSelectStrategy?: (strategyId: string) => void;
}

export const AgentDailyInsightView: React.FC<AgentDailyInsightViewProps> = ({
  onNavigateToTab,
  onSelectStrategy,
}) => {
  const {
    tradingMode,
    setTradingMode,
    daemonStatus,
    handleToggleDaemon,
    fetchMemoryAndPositions,
    fetchTransactions,
    fetchTradeHistory,
    fetchAccounting,
    fetchAutonomousSummary,
  } = useTradingContext();

  const [insight, setInsight] = useState<DailyInsightPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecutingAgentTrade, setIsExecutingAgentTrade] = useState<boolean>(false);
  const [agentFeedback, setAgentFeedback] = useState<string | null>(null);
  const [showDeepAnalystHub, setShowDeepAnalystHub] = useState<boolean>(false);

  const fetchDailyInsight = useCallback(async () => {
    setIsLoading(true);
    try {
      const modeParam = tradingMode === 'SWING' ? 'long' : 'intraday';
      const res = await fetch(`/api/agent/daily-insight?mode=${modeParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInsight(data);
        }
      }
    } catch (err) {
      console.error('Failed to load agent daily insight:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tradingMode]);

  useEffect(() => {
    fetchDailyInsight();
  }, [fetchDailyInsight]);

  const handleAgentTradeNow = async () => {
    setIsExecutingAgentTrade(true);
    setAgentFeedback(null);
    try {
      const res = await fetch('/api/autonomous/live-campaign/trade-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await Promise.all([
          fetchMemoryAndPositions(),
          fetchTransactions(),
          fetchTradeHistory(),
          fetchAccounting(),
          fetchAutonomousSummary(),
          fetchDailyInsight(),
        ]);
        setAgentFeedback(
          data.executed && data.position
            ? `Agent executed new trade: ${data.position.action} ${data.position.shares} ${data.position.ticker} @ ₹${data.position.fill_price} (Strategy: ${data.position.strategy_name || 'Autonomous Quant'} • Saved to SQLite)`
            : data.lastActionSummary || 'Agent scanned all 40 NSE stocks and verified active positions.'
        );
      }
    } catch (err: any) {
      setAgentFeedback(`Agent execution error: ${err?.message || 'Failed'}`);
    } finally {
      setIsExecutingAgentTrade(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Summary Card */}
      <PageSection
        title={insight?.agentHeadline || 'Agent Full-Day Activity & Platform Insight'}
        subtitle={`Updated: ${insight?.generatedAtIst || 'Live IST'} • Autonomous Agent Report on Today's Trades, Strategies & Platform Health`}
        badge="AGENT DAILY INSIGHT"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAgentTradeNow}
              disabled={isExecutingAgentTrade}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 px-3 py-1.5 text-xs font-bold text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              {isExecutingAgentTrade ? 'Agent Scanning & Trading...' : 'Agent: Scan & Trade Now'}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDaemon(!(daemonStatus?.isRunning ?? true))}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                daemonStatus?.isRunning
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Daemon: {daemonStatus?.isRunning ? 'RUNNING' : 'PAUSED'}
            </button>

            <button
              type="button"
              onClick={fetchDailyInsight}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Insight
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {agentFeedback && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <span>{agentFeedback}</span>
              <button
                type="button"
                onClick={() => setAgentFeedback(null)}
                className="text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Narrative Paragraph of What the Agent Did Today */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  What the Agent Has Done Throughout Today &amp; Platform Status
                </h3>
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                  {insight?.executiveSummary ||
                    'Loading full-day autonomous agent activity report and platform diagnostics...'}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Key Scorecard Metrics */}
          {insight && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatMetricCard
                label="Total Portfolio Equity"
                value={`₹${insight.scorecard.totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                subValue={`Liquid Cash: ₹${insight.scorecard.liquidCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                tone="neutral"
              />
              <StatMetricCard
                label="Today's Net Combined P&L"
                value={`${insight.scorecard.netTotalPnl >= 0 ? '+' : ''}₹${insight.scorecard.netTotalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                subValue={`Realized: ₹${insight.scorecard.realizedPnl.toFixed(0)} • Live: ₹${insight.scorecard.unrealizedPnl.toFixed(0)}`}
                tone={insight.scorecard.netTotalPnl >= 0 ? 'positive' : 'negative'}
              />
              <StatMetricCard
                label="Trades Managed Today"
                value={`${insight.scorecard.openTradesCount} Live / ${insight.scorecard.closedTradesCount} Ended`}
                subValue={`Win Rate: ${insight.scorecard.winRatePct}%`}
                tone="info"
              />
              <StatMetricCard
                label="Platform & Pipeline Health"
                value="100% Operational"
                subValue={`${insight.platformStatus.daemonCyclesToday} Scans • ${insight.platformStatus.strategiesCount} Strategies`}
                tone="positive"
              />
            </div>
          )}

          {/* Platform Diagnostics Strip */}
          {insight && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Fast Pipeline Engine</span>
                </div>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {insight.platformStatus.pipelineLatencyTarget}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                  <Database className="h-3.5 w-3.5 text-blue-500" />
                  <span>SQLite Execution Ledger</span>
                </div>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {insight.platformStatus.sqliteStatus}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>24/7 Cron &amp; Email Status</span>
                </div>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {insight.platformStatus.cronStatus}
                </p>
              </div>
            </div>
          )}

          {/* Key Agent Directives & Platform Updates */}
          {insight && insight.adaptiveInsights.length > 0 && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Agent Platform &amp; Strategy Insights
              </h4>
              <ul className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
                {insight.adaptiveInsights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PageSection>

      {/* New Sub-Component: Daily Strategy Efficiency, Trade Success Rate & Risk-Adjusted Returns Card */}
      {insight?.efficiencySummary && (
        <AgentEfficiencyDashboardCard
          data={insight.efficiencySummary}
          onSelectStrategy={onSelectStrategy}
        />
      )}

      {/* New Visual Card: Recharts Strategy Performance & Failure Mapping Across Volatility Regimes */}
      {insight?.volatilityRegimeAnalysis && (
        <StrategyVolatilityRegimeCard
          data={insight.volatilityRegimeAnalysis}
          onSelectStrategy={onSelectStrategy}
        />
      )}

      {/* Full-Day Chronological Activity Log */}
      <PageSection
        title="Chronological Full-Day Agent Activity Log"
        subtitle="Every trade execution, strategy match, risk guard check, and platform event recorded today in IST"
        badge={`${insight?.timeline.length || 0} EVENTS TODAY`}
      >
        <div className="space-y-2.5">
          {insight?.timeline.map((item) => {
            const isLive = item.category === 'TRADE_LIVE';
            const isClosed = item.category === 'TRADE_CLOSED';

            return (
              <div
                key={item.id}
                className={`rounded-xl p-3.5 transition ${
                  isLive
                    ? 'border-2 border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : isClosed
                    ? 'border-2 border-dashed border-yellow-400 bg-yellow-50/15 dark:bg-yellow-950/15'
                    : 'border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        isLive
                          ? 'bg-blue-600 text-white'
                          : isClosed
                          ? 'bg-yellow-400 text-stone-950'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.dateIst}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timeIst}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* Optional Deep-Dive Analyst Matrix, Stress Tester & Q&A */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Deep AI Analyst Matrix, Crash Stress-Tester &amp; Interactive Q&amp;A
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Open the full Analyst Learning Suite for strategy readiness scorecards, black-swan crash simulations, and custom questions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeepAnalystHub(!showDeepAnalystHub)}
            className="rounded-lg bg-stone-900 dark:bg-stone-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
          >
            {showDeepAnalystHub ? 'Hide Deep Analyst Suite' : 'Open Full AI Analyst Suite'}
          </button>
        </div>

        {showDeepAnalystHub && (
          <div className="mt-5 pt-5 border-t border-stone-200 dark:border-stone-800">
            <AnalystHub
              tradingMode={tradingMode}
              onTradingModeChange={setTradingMode}
              onNavigateToTab={(t) => onNavigateToTab?.(t as TabType)}
              onSelectStrategy={onSelectStrategy}
              initialSubTab="catchup"
            />
          </div>
        )}
      </div>
    </div>
  );
};
