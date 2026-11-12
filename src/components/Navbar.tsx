import React from 'react';
import {
  Activity,
  Settings,
  Zap,
  Sparkles,
  History,
  Radio,
  Sun,
  Moon,
  TrendingUp,
  FileText,
  Compass,
  BrainCircuit,
  ShieldAlert,
} from 'lucide-react';
import type { SystemConfig, TradingHorizonMode } from '../types';

export type TabType =
  | 'strategies'
  | 'trades_db'
  | 'pipeline'
  | 'agent_insight'
  | 'scanner'
  | 'settings'
  | 'transactions'
  | 'portfolio'
  | 'my_stocks'
  | 'decision_reasoning'
  | 'risk_tiers'
  | 'volatility_heatmap'
  | 'news_recommendations'
  | 'risk_math'
  | 'architecture'
  | 'algo_research'
  | 'titans'
  | 'analyst';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  config: SystemConfig;
  isRunning: boolean;
  onQuickHeartbeat: () => void;
  transactionsCount?: number;
  goodOpportunitiesCount?: number;
  activeTradesCount?: number;
  totalUnrealizedPnl?: number;
  onOpenAlertSettings?: () => void;
  alertsCount?: number;
  onOpenHeartbeat?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  tradingMode?: TradingHorizonMode;
  onTradingModeChange?: (mode: TradingHorizonMode) => void;
  onOpenPdfReport?: () => void;
  onOpenAnalyst?: () => void;
  onOpenCatchup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  config,
  isRunning,
  onQuickHeartbeat,
  transactionsCount = 0,
  goodOpportunitiesCount = 0,
  activeTradesCount = 0,
  totalUnrealizedPnl = 0,
  onOpenHeartbeat,
  theme = 'dark',
  onToggleTheme,
  tradingMode = 'INTRADAY',
  onTradingModeChange,
  onOpenPdfReport,
}) => {
  const isStrategiesActive =
    activeTab === 'strategies' ||
    activeTab === 'algo_research' ||
    activeTab === 'titans' ||
    activeTab === 'risk_math';

  const isTradesActive =
    activeTab === 'trades_db' ||
    activeTab === 'transactions' ||
    activeTab === 'portfolio' ||
    activeTab === 'my_stocks';

  const isPipelineActive = activeTab === 'pipeline';

  const isLossReasoningActive = activeTab === 'decision_reasoning';

  const isAgentInsightActive =
    activeTab === 'agent_insight' || activeTab === 'analyst';

  const isScannerActive =
    activeTab === 'scanner' ||
    activeTab === 'risk_tiers' ||
    activeTab === 'volatility_heatmap' ||
    activeTab === 'news_recommendations';

  const isSettingsActive =
    activeTab === 'settings' || activeTab === 'architecture';

  return (
    <header className="sticky top-0 z-40 border-b-2 border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 transition-colors shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Brand + Horizon Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Zap className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-stone-950 dark:text-white">
                AI BOT ADVANCE
              </h1>
              <span className="font-mono text-[10px] font-bold text-stone-600 dark:text-stone-300">
                NSE STRATEGY &amp; RISK DESK
              </span>
            </div>
          </div>

          {/* Intraday vs Long Horizon Switch */}
          <div
            id="heading-mode-tabs"
            className="flex items-center rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-0.5 ml-2"
          >
            <button
              id="heading-tab-intraday-trading"
              type="button"
              onClick={() => onTradingModeChange?.('INTRADAY')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                tradingMode === 'INTRADAY'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>Intraday (MIS)</span>
            </button>

            <button
              id="heading-tab-long-trading"
              type="button"
              onClick={() => onTradingModeChange?.('SWING')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                tradingMode === 'SWING'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              <span>Swing / Long (CNC)</span>
            </button>
          </div>
        </div>

        {/* Right: Single clean row of key status & utilities */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Lost Trades & Algo Fix Button */}
          <button
            id="nav-loss-analysis-btn"
            onClick={() => onTabChange('decision_reasoning')}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              isLossReasoningActive
                ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                : 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900'
            }`}
            title="Inspect Stocks Where We Lost Trades, Root Causes & Algorithm Fixes"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lost Trades &amp; Algo Fix</span>
          </button>

          {/* Quick Agent Daily Insight Button */}
          <button
            id="nav-agent-insight-btn"
            onClick={() => onTabChange('agent_insight')}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              isAgentInsightActive
                ? 'border-blue-500 bg-blue-600 text-white shadow-xs'
                : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
            title="View Full-Day Agent Activity & Platform Insight"
          >
            <BrainCircuit className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Agent Insight</span>
          </button>

          {/* Live Trades Badge -> jumps straight to Active Trades & DB Ledger */}
          <button
            id="nav-active-trades-btn"
            onClick={() => onTabChange('trades_db')}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTradesCount > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/80 text-blue-950 dark:text-blue-200'
                : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
            }`}
            title="View Live Trades (Blue Box) & Ended Trades (Yellow Dashed Box)"
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>{activeTradesCount} Live</span>
            {activeTradesCount > 0 && (
              <span
                className={`font-mono font-extrabold tabular-nums ${
                  totalUnrealizedPnl >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                ({totalUnrealizedPnl >= 0 ? '+' : ''}₹
                {totalUnrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
              </span>
            )}
          </button>

          {/* Capital Display */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 text-stone-700 dark:text-stone-300">
            <span className="text-stone-500 dark:text-stone-400 font-semibold">Capital:</span>
            <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
              ₹{config.system.currentPaperCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* PDF Audit Report */}
          {onOpenPdfReport && (
            <button
              id="nav-pdf-report-btn"
              onClick={onOpenPdfReport}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 font-bold text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
              title="Open Weekly PDF Report & Email Scheduler"
            >
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>
          )}

          {/* 24/7 Cron Sentinel */}
          {onOpenHeartbeat && (
            <button
              id="nav-heartbeat-sentinel-btn"
              onClick={onOpenHeartbeat}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1.5 font-bold text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
              title="24/7 Cron Keep-Alive Sentinel (Direct 200 OK Fixed)"
            >
              <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Cron OK</span>
            </button>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              id="nav-theme-toggle-btn"
              onClick={onToggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
              title="Toggle Light / Dark Mode"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Quick Market Scan */}
          <button
            id="nav-quick-heartbeat-btn"
            onClick={onQuickHeartbeat}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 font-bold text-white transition disabled:opacity-50 text-xs cursor-pointer shadow-xs"
          >
            <Activity className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Fast Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* High-Contrast Navigation Tabs Covering 100% of Platform Capabilities */}
      <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/90">
        <nav className="flex items-center space-x-1.5 py-1.5 text-xs whitespace-nowrap">
          <button
            id="nav-tab-strategies"
            onClick={() => onTabChange('strategies')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isStrategiesActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>1. Strategy Builder &amp; Arena</span>
          </button>

          <button
            id="nav-tab-trades_db"
            onClick={() => onTabChange('trades_db')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isTradesActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>2. Active Trades &amp; SQLite DB</span>
            <span className={`font-mono text-[10px] tabular-nums ${isTradesActive ? 'text-blue-100' : 'text-stone-500 dark:text-stone-400'}`}>
              ({activeTradesCount} Live / {transactionsCount} Logs)
            </span>
          </button>

          <button
            id="nav-tab-pipeline"
            onClick={() => onTabChange('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isPipelineActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>3. Fast Pipeline &amp; Execution</span>
          </button>

          <button
            id="nav-tab-decision_reasoning"
            onClick={() => onTabChange('decision_reasoning')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isLossReasoningActive
                ? 'bg-rose-600 text-white shadow-xs'
                : 'border border-rose-300 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>4. Lost Trades &amp; Algo Fixes</span>
          </button>

          <button
            id="nav-tab-agent_insight"
            onClick={() => onTabChange('agent_insight')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isAgentInsightActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>5. Agent Daily Insight</span>
          </button>

          <button
            id="nav-tab-scanner"
            onClick={() => onTabChange('scanner')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isScannerActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>6. Scanner, Risk Tiers &amp; News</span>
            {goodOpportunitiesCount > 0 && (
              <span className={`font-mono text-[10px] tabular-nums ${isScannerActive ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ({goodOpportunitiesCount})
              </span>
            )}
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              isSettingsActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>7. Cron Fix, Email PDF &amp; Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
