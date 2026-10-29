import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Trophy,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Sliders,
  Compass,
  ArrowRight,
  Send,
  Zap,
  Clock,
  Briefcase,
  Flame,
  Newspaper,
  BookOpen,
  Target,
  BarChart3,
  Scale,
  Award,
  Layers,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { TradingHorizonMode } from '../types';
import { StrategyStressTester } from './StrategyStressTester';
import { AnalystCatchupView } from './AnalystCatchupView';

export interface StrategyRolloutParameters {
  recommendedAtrMultiplier: number;
  suggestedRiskPct: number;
  preferredTimeWindow: string;
  capitalAllocationPct: number;
  stopLossMethod: string;
}

export interface AnalystStrategyEvaluation {
  strategyId: string;
  strategyName: string;
  category: 'INTRADAY' | 'LONG' | 'HYBRID';
  winRatePct: number;
  totalTrades: number;
  profitFactor: number;
  expectedValueRupees: number;
  confidenceScore: number;
  realMoneyRolloutStatus: 'CONFIDENT_REAL_MONEY_ROLLOUT' | 'PAPER_INCUBATION_ONLY' | 'REVISE_OR_HALT';
  probabilityProfitVsLoss: string;
  readinessReasoning: string;
  recommendedParameters: StrategyRolloutParameters;
  keyEdge: string;
  primaryRisk: string;
}

export interface AnalystMacroSynthesis {
  niftyTrend: string;
  vixRegime: string;
  leadingSectors: string[];
  laggingSectors: string[];
  catalystHeadlines: string[];
  sentimentScore: number;
}

export interface AnalystDailyScorecard {
  intradayNetPnl: number;
  intradayWinRate: number;
  intradayTradeCount: number;
  longNetPnl: number;
  longWinRate: number;
  longTradeCount: number;
  netCombinedPnl: number;
  overallExpectancy: string;
}

export interface AnalystSynthesisReport {
  agentName: string;
  goal: string;
  timestamp: string;
  evolutionLevel: string;
  executiveSummary: string;
  macroSynthesis: AnalystMacroSynthesis;
  dailyScorecard: AnalystDailyScorecard;
  strategyEvaluations: AnalystStrategyEvaluation[];
  dailyLessonsLearned: string[];
  worldClassDirectives: string[];
  learningMilestones: {
    totalDaysStudied: number;
    cumulativeWinRateImprovement: string;
    drawdownAvoidanceImpact: string;
  };
  generatedVia: 'GEMINI_3_8_FLASH' | 'DETERMINISTIC_QUANT_SYNTHESIS';
}

interface AnalystHubProps {
  tradingMode?: TradingHorizonMode;
  onTradingModeChange?: (mode: TradingHorizonMode) => void;
  onNavigateToTab?: (tab: string) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  onSelectStrategy?: (strategyIdOrName: string) => void;
  initialSubTab?: 'catchup' | 'matrix' | 'trends' | 'scorecard' | 'stress_test' | 'ask' | 'history';
}

export const AnalystHub: React.FC<AnalystHubProps> = ({
  tradingMode = 'INTRADAY',
  onTradingModeChange,
  onNavigateToTab,
  isModal = false,
  onCloseModal,
  onSelectStrategy,
  initialSubTab = 'catchup',
}) => {
  const [report, setReport] = useState<AnalystSynthesisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'catchup' | 'matrix' | 'trends' | 'scorecard' | 'stress_test' | 'ask' | 'history'>(initialSubTab);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIDENT_ONLY' | 'INCUBATION_HALT'>('ALL');
  const [appliedStrategy, setAppliedStrategy] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Q&A State
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<
    Array<{
      question: string;
      answer: string;
      confidence: number;
      rolloutAdvice: string;
      directives: string[];
      time: string;
    }>
  >([]);

  // Chronological learning logs
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Fetch initial report
  const fetchReport = async (fresh = false) => {
    try {
      if (fresh) setIsReviewing(true);
      else setIsLoading(true);

      const url = fresh ? '/api/analyst/run-review' : '/api/analyst/report';
      const method = fresh ? 'POST' : 'GET';
      const res = await fetch(url, { method });

      if (res.ok) {
        const json = await res.json();
        if (json.report) {
          setReport(json.report);
          if (fresh) {
            triggerToast('Analyst completed deep market research & platform audit.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Analyst report:', err);
    } finally {
      setIsLoading(false);
      setIsReviewing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/analyst/history');
      if (res.ok) {
        const data = await res.json();
        if (data.history) setHistoryLogs(data.history);
      }
    } catch (err) {
      console.warn('Failed to load analyst history:', err);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchHistory();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyParameters = async (strategy: AnalystStrategyEvaluation) => {
    try {
      const res = await fetch('/api/analyst/apply-strategy-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: strategy.strategyId,
          parameters: strategy.recommendedParameters,
        }),
      });
      if (res.ok) {
        setAppliedStrategy(strategy.strategyId);
        triggerToast(`Applied Analyst parameters for ${strategy.strategyName}`);
        setTimeout(() => setAppliedStrategy(null), 3000);
      }
    } catch (err) {
      console.error('Failed to apply strategy parameters:', err);
    }
  };

  const handleAskAnalyst = async (questionText?: string) => {
    const q = (questionText || userQuery).trim();
    if (!q) return;

    setIsAsking(true);
    try {
      const res = await fetch('/api/analyst/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setQaHistory((prev) => [
            {
              question: q,
              answer: json.data.answer,
              confidence: json.data.confidence || 88,
              rolloutAdvice: json.data.rolloutAdvice || '',
              directives: json.data.directives || [],
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
          setUserQuery('');
        }
      }
    } catch (err) {
      console.error('Ask Analyst failed:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const filteredStrategies = (report?.strategyEvaluations || []).filter((s) => {
    if (statusFilter === 'CONFIDENT_ONLY') return s.realMoneyRolloutStatus === 'CONFIDENT_REAL_MONEY_ROLLOUT';
    if (statusFilter === 'INCUBATION_HALT') return s.realMoneyRolloutStatus !== 'CONFIDENT_REAL_MONEY_ROLLOUT';
    return true;
  });

  const confidentCount = (report?.strategyEvaluations || []).filter(
    (s) => s.realMoneyRolloutStatus === 'CONFIDENT_REAL_MONEY_ROLLOUT'
  ).length;

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : 'max-w-7xl mx-auto px-4 py-4 sm:px-6'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-purple-950 border border-purple-500/50 px-4 py-3 text-sm text-purple-100 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO BANNER: AGENT NAME & PRESTIGE GOAL */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-stone-900 via-[#181226] to-[#0d0f17] p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner">
                <BrainCircuit className="h-6 w-6 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    ANALYST
                  </h1>
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-300 font-mono">
                    Autonomous Learning Agent
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  GOAL OF AGENT: TO BE THE BEST TRADER OF THE WORLD
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              Researches live market trends and financial news, studies daily platform outcomes across Intraday and Long modes, and evaluates every quantitative method. Gives live rollout approval{' '}
              <strong className="text-white underline decoration-emerald-500 underline-offset-2">
                only when mathematically confident there is a higher chance of profit than loss
              </strong>.
            </p>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-400 flex-wrap">
              <span className="flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 font-mono">
                <Sparkles className="h-3 w-3 text-purple-400" />
                {report?.evolutionLevel || 'Level 5: Master Quantitative Macro & Microstructure Intelligence'}
              </span>
              <span className="flex items-center gap-1 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 font-mono">
                <Zap className="h-3 w-3 text-amber-400" />
                Engine: Gemini 3.8 Flash &amp; Deterministic Quant
              </span>
              {report?.timestamp && (
                <span className="text-stone-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated: {new Date(report.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveSubTab('catchup')}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer"
              title="Open the Analyst Catch-Up Daily Briefing"
            >
              <Sparkles className="h-4 w-4 text-purple-200" />
              <span>🌅 Brief of the Day</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stress_test')}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-red-600/30 transition cursor-pointer"
              title="Simulate historical market crashes against active positions"
            >
              <Flame className="h-4 w-4 text-white" />
              <span>Stress-Test Crashes</span>
            </button>

            <button
              onClick={() => fetchReport(true)}
              disabled={isReviewing}
              className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 font-bold px-4 py-2.5 text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Trigger deep research on live market trends, news, and platform outcomes"
            >
              <RefreshCw className={`h-4 w-4 ${isReviewing ? 'animate-spin' : ''}`} />
              <span>{isReviewing ? 'Auditing...' : 'Deep Audit'}</span>
            </button>

            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="rounded-xl border border-stone-700 bg-stone-800/80 px-3 py-2.5 text-xs font-semibold text-stone-300 hover:bg-stone-700 transition"
              >
                Close View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Real-World Rollout Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {confidentCount} / {report?.strategyEvaluations?.length || 6}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Cleared</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Strategies with proven positive mathematical expectancy
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Nifty Trend &amp; Regime</span>
            <Compass className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-base font-bold text-blue-700 dark:text-blue-300 truncate">
            {report?.macroSynthesis.niftyTrend ? report.macroSynthesis.niftyTrend.split(' ')[0] + ' ' + (report.macroSynthesis.niftyTrend.split(' ')[1] || '') : 'Bullish Setup'}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {report?.macroSynthesis.vixRegime || 'India VIX 13.8 Normal'}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Daily Net Expectancy</span>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${(report?.dailyScorecard.netCombinedPnl || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {(report?.dailyScorecard.netCombinedPnl || 0) >= 0 ? '+' : ''}₹{report?.dailyScorecard.netCombinedPnl?.toLocaleString('en-IN') || '0'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Intraday {report?.dailyScorecard.intradayWinRate || 0}% | Long {report?.dailyScorecard.longWinRate || 0}%
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Analyst Edge Progress</span>
            <Trophy className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-xl font-black text-purple-700 dark:text-purple-300 font-mono">
            {report?.learningMilestones.cumulativeWinRateImprovement || '+18.4% Edge Gain'}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {report?.learningMilestones.drawdownAvoidanceImpact || '₹8,420 capital protected'}
          </p>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2 py-1 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveSubTab('catchup')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'catchup'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>🌅 Brief of the Day (Catch-Up)</span>
            <span className="ml-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 text-[10px] font-mono">
              Debrief
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Real-World Rollout Matrix</span>
            <span className="ml-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-mono">
              {confidentCount} Cleared
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'trends'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Newspaper className="h-4 w-4 text-orange-500" />
            <span>Market Trends &amp; News Sentinel</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scorecard')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'scorecard'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>Daily Outcomes &amp; Lessons</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stress_test')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'stress_test'
                ? 'border-red-600 text-red-700 dark:border-red-400 dark:text-red-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Flame className="h-4 w-4 text-red-500" />
            <span>Strategy Stress-Tester</span>
            <span className="ml-1 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 px-1.5 py-0.2 text-[10px] font-mono">
              Crash Sim
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ask')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'ask'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BrainCircuit className="h-4 w-4 text-purple-500" />
            <span>Ask Analyst (Interactive AI)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>Evolutionary Chronicle</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY CALLOUT */}
      {report?.executiveSummary && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed shadow-xs flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-stone-900 dark:text-white block mb-0.5">
              Analyst Executive Intelligence Brief:
            </strong>
            {report.executiveSummary}
          </div>
        </div>
      )}

      {/* TAB 0: BRIEF OF THE DAY (WHILE YOU WERE AWAY DEBRIEF) */}
      {activeSubTab === 'catchup' && (
        <AnalystCatchupView
          onSelectStrategy={onSelectStrategy}
          onNavigateToTab={onNavigateToTab}
          onAskAnalyst={(q) => {
            setActiveSubTab('ask');
            setUserQuery(q);
          }}
        />
      )}

      {/* TAB 1: REAL-WORLD ROLLOUT CONFIDENCE MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-100/70 dark:bg-stone-900/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-500" />
                Real-World Capital Rollout Decision Engine
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Rule of the World's Best Trader: Only deploy real money when empirical profit probability significantly exceeds loss probability.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                  statusFilter === 'ALL'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                All Methods ({report?.strategyEvaluations?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('CONFIDENT_ONLY')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                  statusFilter === 'CONFIDENT_ONLY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                Cleared for Live ({confidentCount})
              </button>
              <button
                onClick={() => setStatusFilter('INCUBATION_HALT')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                  statusFilter === 'INCUBATION_HALT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                Incubation / Halt
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredStrategies.map((strategy) => {
              const isConfident = strategy.realMoneyRolloutStatus === 'CONFIDENT_REAL_MONEY_ROLLOUT';
              const isHalt = strategy.realMoneyRolloutStatus === 'REVISE_OR_HALT';
              const isIncubating = strategy.realMoneyRolloutStatus === 'PAPER_INCUBATION_ONLY';

              return (
                <div
                  key={strategy.strategyId}
                  className={`rounded-2xl border p-5 transition shadow-xs ${
                    isConfident
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-stone-50 to-white dark:from-emerald-950/20 dark:via-stone-900/60 dark:to-stone-900/30'
                      : isHalt
                      ? 'border-rose-500/40 bg-gradient-to-r from-rose-500/5 via-stone-50 to-white dark:from-rose-950/20 dark:via-stone-900/60 dark:to-stone-900/30'
                      : 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-stone-50 to-white dark:from-amber-950/20 dark:via-stone-900/60 dark:to-stone-900/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1 ${
                            isConfident
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                              : isHalt
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isConfident ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              CONFIDENT FOR REAL-WORLD ROLLOUT
                            </>
                          ) : isHalt ? (
                            <>
                              <ShieldAlert className="h-3 w-3" />
                              REVISE OR HALT — DO NOT DEPLOY REAL MONEY
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              PAPER INCUBATION ONLY
                            </>
                          )}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                          {strategy.category}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                        {strategy.strategyName}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-4xl">
                        {strategy.readinessReasoning}
                      </p>
                    </div>

                    {/* Quantitative Snapshot & Confidence Gauge */}
                    <div className="flex items-center gap-4 shrink-0 bg-white/70 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700/60">
                      <div className="text-center">
                        <div className="text-[10px] text-stone-400 uppercase font-sans">Confidence</div>
                        <div
                          className={`text-xl font-black font-mono ${
                            isConfident ? 'text-emerald-600 dark:text-emerald-400' : isHalt ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {strategy.confidenceScore}%
                        </div>
                      </div>

                      <div className="h-8 w-px bg-stone-200 dark:bg-stone-700" />

                      <div className="text-center">
                        <div className="text-[10px] text-stone-400 uppercase font-sans">Win Rate</div>
                        <div className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                          {strategy.winRatePct}%
                        </div>
                      </div>

                      <div className="h-8 w-px bg-stone-200 dark:bg-stone-700" />

                      <div className="text-center">
                        <div className="text-[10px] text-stone-400 uppercase font-sans">Profit Factor</div>
                        <div className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                          {strategy.profitFactor.toFixed(2)}x
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ratio bar & Details */}
                  <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Probability Edge:</span>
                        <strong className="font-mono text-stone-800 dark:text-stone-200">
                          {strategy.probabilityProfitVsLoss}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Core Edge:</span>
                        <span>{strategy.keyEdge}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                        <span className="font-bold text-rose-600 dark:text-rose-400">Primary Risk:</span>
                        <span>{strategy.primaryRisk}</span>
                      </div>
                    </div>

                    {/* Recommended Parameters Box */}
                    <div className="rounded-xl bg-stone-100/90 dark:bg-stone-800/70 p-3 border border-stone-200/60 dark:border-stone-700/50 flex flex-col justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-bold text-stone-900 dark:text-white flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-purple-500" />
                            Analyst Optimized Rollout Parameters
                          </span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">
                            {strategy.recommendedParameters.capitalAllocationPct}% Capital Allocation
                          </span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                          <div>ATR Multiplier: {strategy.recommendedParameters.recommendedAtrMultiplier}x</div>
                          <div>Risk/Trade: {strategy.recommendedParameters.suggestedRiskPct}%</div>
                          <div>Window: {strategy.recommendedParameters.preferredTimeWindow}</div>
                          <div>Stop Method: {strategy.recommendedParameters.stopLossMethod}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStrategy?.(strategy.strategyName || strategy.strategyId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs border border-purple-300 dark:border-purple-600/70 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                          title="Click to view all trades taken by this strategy and its return"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span>View Trades &amp; Return</span>
                        </button>

                        <button
                          onClick={() => handleApplyParameters(strategy)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                            appliedStrategy === strategy.strategyId
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-900 dark:bg-purple-600 text-white hover:bg-stone-800 dark:hover:bg-purple-500'
                          }`}
                        >
                          {appliedStrategy === strategy.strategyId ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Parameters Adopted</span>
                            </>
                          ) : (
                            <>
                              <Sliders className="h-3.5 w-3.5" />
                              <span>Adopt Analyst Parameters</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MARKET TRENDS & NEWS RESEARCH RADAR */}
      {activeSubTab === 'trends' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Macro & Sentiment Structure */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                NSE Market Trend &amp; Regime Intelligence
              </h3>

              <div className="space-y-3">
                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/60 dark:border-stone-700/60">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Nifty 50 Structure</div>
                  <div className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                    {report?.macroSynthesis.niftyTrend || 'Consolidation above key moving averages'}
                  </div>
                </div>

                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/60 dark:border-stone-700/60">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Volatility &amp; VIX Regime</div>
                  <div className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                    {report?.macroSynthesis.vixRegime || 'Normal volatility conducive to directional momentum'}
                  </div>
                </div>

                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/60 dark:border-stone-700/60">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Composite Market Sentiment</span>
                    <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {report?.macroSynthesis.sentimentScore || 65}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(10, Math.min(100, (report?.macroSynthesis.sentimentScore || 65)))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Rotations */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Sector Rotation &amp; Institutional Capital Flow
              </h3>

              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 p-3 border border-emerald-500/30">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Leading Outperforming Sectors (Bullish Bias)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(report?.macroSynthesis.leadingSectors || ['Banking & Financials', 'Pharma', 'Defense']).map((sec, i) => (
                      <span
                        key={i}
                        className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs px-2.5 py-1 rounded-lg font-medium border border-emerald-300 dark:border-emerald-700/50"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-rose-500/5 dark:bg-rose-950/20 p-3 border border-rose-500/30">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1.5">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Lagging / Underperforming Sectors (Avoid or Short)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(report?.macroSynthesis.laggingSectors || ['Information Technology', 'FMCG']).map((sec, i) => (
                      <span
                        key={i}
                        className="bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-xs px-2.5 py-1 rounded-lg font-medium border border-rose-300 dark:border-rose-700/50"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time News Catalyst Stream */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-orange-500" />
                Live Financial Catalysts Analyzed by Analyst
              </h3>
              <span className="text-[11px] text-stone-400">
                Sources: Moneycontrol &bull; Economic Times &bull; Livemint &bull; NSE Filings
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(report?.macroSynthesis.catalystHeadlines || [
                'Nifty Banks record fresh intraday momentum above key support level',
                'Government PLI scheme capex approvals catalyze capital goods leaders',
                'Crude oil price consolidation buffers domestic manufacturing margins',
                'Institutional FII buying recorded across high-ROCE domestic compounders',
              ]).map((headline, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3 text-xs text-stone-800 dark:text-stone-200 flex items-start gap-2.5"
                >
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{headline}</span>
                    <span className="block mt-1 text-[10px] text-stone-400 font-mono">
                      Algorithmic Assessment: Active catalysts factored into risk-adjusted position sizing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY OUTCOMES & LEARNING SCORECARD */}
      {activeSubTab === 'scorecard' && (
        <div className="space-y-5">
          {/* Intraday vs Long Independent Outcomes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Intraday Desk (MIS) Outcomes
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                  Mandatory 15:15 Square-off
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Total Trades</div>
                  <div className="text-base font-black font-mono text-stone-900 dark:text-white">
                    {report?.dailyScorecard.intradayTradeCount || 0}
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Win Rate</div>
                  <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    {report?.dailyScorecard.intradayWinRate || 0}%
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Realized P&amp;L</div>
                  <div
                    className={`text-base font-black font-mono ${
                      (report?.dailyScorecard.intradayNetPnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(report?.dailyScorecard.intradayNetPnl || 0) >= 0 ? '+' : ''}₹
                    {report?.dailyScorecard.intradayNetPnl?.toLocaleString('en-IN') || '0'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Long Swing Desk (CNC) Outcomes
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-900 dark:text-blue-200 font-bold">
                  Multi-Day Positional
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Total Holdings</div>
                  <div className="text-base font-black font-mono text-stone-900 dark:text-white">
                    {report?.dailyScorecard.longTradeCount || 0}
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Win Rate</div>
                  <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                    {report?.dailyScorecard.longWinRate || 0}%
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400">Realized P&amp;L</div>
                  <div
                    className={`text-base font-black font-mono ${
                      (report?.dailyScorecard.longNetPnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(report?.dailyScorecard.longNetPnl || 0) >= 0 ? '+' : ''}₹
                    {report?.dailyScorecard.longNetPnl?.toLocaleString('en-IN') || '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Lessons Learned Ledger */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              Daily Learning Ledger: What Worked &amp; What Failed
            </h3>
            <div className="space-y-2">
              {(report?.dailyLessonsLearned || [
                'Order Flow Imbalance consistently outperforms breakout chasing because it confirms institutional ask lifting rather than retail chart patterns.',
                'The mandatory 15:15 IST auto square-off completely eliminated overnight gap-down risks for Intraday MIS trades.',
                'Positions that took longer than 3 hours in Intraday without reaching 50% target progress experienced a 65% decay in edge — time-stop exits must be prioritized.',
                'Separating Intraday and Long databases has provided total accounting clarity, allowing aggressive sizing on short-term high-Sharpe setups without disrupting compounder portfolios.',
              ]).map((lesson, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3 text-xs text-stone-800 dark:text-stone-200 flex items-start gap-2.5"
                >
                  <ChevronRight className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{lesson}</span>
                </div>
              ))}
            </div>
          </div>

          {/* World-Class Trader Directives */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-950 p-5 text-white shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                Analyst World-Class Trader Directives (The 5 Golden Laws)
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              {(report?.worldClassDirectives || [
                'Directive 1 (The Golden Law): Never risk real money on any strategy with win rate under 60% or profit factor under 1.8.',
                'Directive 2 (Asymmetric Payoff): Cut losing trades with zero hesitation at the mathematical stop; let winning multi-agent setups run into calculated targets.',
                'Directive 3 (False Breakout Elimination): Forbid trades in the first 15 minutes (09:15-09:30 IST) unless institutional order flow imbalance exceeds 3:1.',
                'Directive 4 (Capital Concentration Cap): Never allow any single ticker to absorb more than 20% of live trading reserves.',
                'Directive 5 (Continuous Mastery): Analyze every win and every loss daily. The best trader in the world does not guess — he exploits mathematically proven probabilities.',
              ]).map((directive, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-black/40 border border-amber-500/20 p-2.5 flex items-start gap-2 font-mono"
                >
                  <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                  <span className="text-stone-200 leading-relaxed">{directive}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: STRATEGY STRESS-TESTER (HISTORICAL CRASH SIMULATOR) */}
      {activeSubTab === 'stress_test' && (
        <StrategyStressTester
          tradingMode={tradingMode}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* TAB 4: ASK ANALYST (INTERACTIVE AI TERMINAL) */}
      {activeSubTab === 'ask' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-purple-500/30 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-purple-500" />
                Direct Strategic Consultation with Analyst
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Powered by Gemini 3.8 Flash. Grounded in real-time NSE market depth, active platform trade history, and mathematical expectancy.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400 font-semibold">Quick Consultations:</span>
              {[
                'Which strategy is safest for ₹5,00,000 live capital today?',
                'How to avoid false breakout losses in morning session?',
                'Evaluate Nifty trend and our current open positions',
                'What parameters should we adjust for high Sharpe ratio?',
              ].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setUserQuery(qp);
                    handleAskAnalyst(qp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition font-medium"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAnalyst();
                }}
                placeholder="Ask Analyst how to optimize strategies or execute in live market..."
                className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 px-4 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleAskAnalyst()}
                disabled={isAsking || !userQuery.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-xs font-bold transition disabled:opacity-50 shadow-md shadow-purple-600/20"
              >
                <Send className={`h-3.5 w-3.5 ${isAsking ? 'animate-pulse' : ''}`} />
                <span>{isAsking ? 'Analyzing...' : 'Ask'}</span>
              </button>
            </div>
          </div>

          {/* Q&A Thread */}
          <div className="space-y-4">
            {qaHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center text-xs text-stone-400">
                <BrainCircuit className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-50" />
                Ask any question above to consult the Analyst on market trends, trade setups, and live rollout safety.
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-purple-500/20 bg-stone-50/80 dark:bg-stone-900/60 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs border-b border-stone-200 dark:border-stone-800 pb-2">
                    <span className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      Q: {item.question}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">{item.time}</span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                    <p>{item.answer}</p>

                    {item.rolloutAdvice && (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-900 dark:text-emerald-300 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Rollout Verdict: {item.rolloutAdvice}</span>
                      </div>
                    )}

                    {item.directives && item.directives.length > 0 && (
                      <div className="pt-2 text-xs text-stone-600 dark:text-stone-400 space-y-1">
                        <div className="font-bold text-purple-600 dark:text-purple-400 uppercase text-[10px] tracking-wide">
                          Action Directives:
                        </div>
                        {item.directives.map((dir, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-1.5">
                            <span className="text-purple-500 font-mono">&bull;</span>
                            <span>{dir}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EVOLUTIONARY CHRONICLE */}
      {activeSubTab === 'history' && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Chronological Learning Log (Persistent SQLite Episodic Memory)
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              Total Audits Stored: {historyLogs.length}
            </span>
          </div>

          <div className="space-y-3">
            {historyLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                Running audits will record daily evolutionary chronicle entries into SQLite.
              </div>
            ) : (
              historyLogs.map((log, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 p-4 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                      {log.evolutionLevel || 'Level 5 Audit'}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Recent'}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {log.executiveSummary}
                  </p>
                  {log.dailyScorecard && (
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-500 font-mono">
                      <span>Intraday P&amp;L: ₹{log.dailyScorecard.intradayNetPnl || 0}</span>
                      <span>Long P&amp;L: ₹{log.dailyScorecard.longNetPnl || 0}</span>
                      <span>Expectancy: {log.dailyScorecard.overallExpectancy}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
