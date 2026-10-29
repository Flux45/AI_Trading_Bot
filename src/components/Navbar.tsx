import React from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  FileCode,
  Settings,
  Briefcase,
  Zap,
  Sparkles,
  History,
  Clock,
  Target,
  Flame,
  Newspaper,
  Bell,
  BrainCircuit,
  Radio,
  Sun,
  Moon,
  Compass,
  Trophy,
  Award,
  TrendingUp,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { SystemConfig, TradingHorizonMode } from '../types';

export type TabType =
  | 'pipeline'
  | 'my_stocks'
  | 'decision_reasoning'
  | 'risk_tiers'
  | 'scanner'
  | 'volatility_heatmap'
  | 'news_recommendations'
  | 'transactions'
  | 'portfolio'
  | 'risk_math'
  | 'architecture'
  | 'settings'
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
  onOpenAlertSettings,
  alertsCount = 0,
  onOpenHeartbeat,
  theme = 'dark',
  onToggleTheme,
  tradingMode = 'INTRADAY',
  onTradingModeChange,
  onOpenPdfReport,
  onOpenAnalyst,
  onOpenCatchup,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-xs transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        {/* Brand Zone + Two Tabs (Long Trading vs Intraday Trading) */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 dark:bg-amber-500/20 text-white dark:text-amber-400 border dark:border-amber-500/30 shadow-xs">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-white">
                AI BOT ADVANCE
              </h1>
              <span className="font-mono text-[10px] font-bold text-stone-500 dark:text-stone-400">
                NSE QUANT
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden xl:block">
              Decoupled Quantitative Reasoning &amp; Mathematical Risk Engine
            </p>
          </div>

          {/* TWO TABS BESIDE AI BOT ADVANCED: Long Trading vs Intraday Trading */}
          <div
            id="heading-mode-tabs"
            className="flex items-center rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/90 dark:bg-[#161a23] p-0.5 shadow-xs ml-1 sm:ml-3"
          >
            <button
              id="heading-tab-long-trading"
              type="button"
              onClick={() => onTradingModeChange?.('SWING')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                tradingMode === 'SWING'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-amber-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Long-Term / Swing Trading: Positional holdings, multi-day horizon, Warren Buffett / Titans strategies"
            >
              <TrendingUp className={`h-3.5 w-3.5 ${tradingMode === 'SWING' ? 'text-blue-500' : 'text-stone-400'}`} />
              <span className="font-medium whitespace-nowrap">Long Trading</span>
            </button>

            <button
              id="heading-tab-intraday-trading"
              type="button"
              onClick={() => onTradingModeChange?.('INTRADAY')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                tradingMode === 'INTRADAY'
                  ? 'bg-amber-500 dark:bg-amber-400 text-stone-950 shadow-xs border border-amber-600/30 font-extrabold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
              title="Intraday Trading: Pure 9:15-15:15 IST execution, live Yahoo/TradingView verified prices, 5m candles, VWAP/ORB algos, mandatory 15:15 auto square-off"
            >
              <Zap className={`h-3.5 w-3.5 ${tradingMode === 'INTRADAY' ? 'text-stone-950 fill-stone-950' : 'text-amber-500'}`} />
              <span className="whitespace-nowrap">Intraday Trading</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </button>
          </div>
        </div>

        {/* Global Controls & Status Zone */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Active Trades Live P&L Indicator (Redirects to Transaction History) */}
          {activeTradesCount > 0 && (
            <button
              id="nav-active-trades-btn"
              onClick={() => onTabChange('transactions')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                totalUnrealizedPnl >= 0
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                  : 'border-rose-200 bg-rose-50/90 text-rose-800 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50'
              }`}
              title="Click to view Active Trades and Live P&L in Transaction History"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    totalUnrealizedPnl >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    totalUnrealizedPnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span>{activeTradesCount} Active:</span>
              <span className="font-mono font-extrabold tabular-nums">
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹
                {totalUnrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </button>
          )}

          {/* Equity Value */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 px-3 py-1.5 text-stone-600 dark:text-stone-300">
            <span className="text-stone-400">Equity:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
              ₹{config.system.currentPaperCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Analyst Learning Agent Trigger - World's Best Trader AI */}
          <button
            id="nav-analyst-agent-btn"
            onClick={onOpenAnalyst ? onOpenAnalyst : () => onTabChange('analyst')}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-bold transition shadow-xs text-xs ${
              activeTab === 'analyst'
                ? 'border-purple-500 bg-purple-600 text-white shadow-purple-500/20'
                : 'border-purple-300 dark:border-purple-600/70 bg-gradient-to-r from-purple-50 dark:from-purple-950/40 to-indigo-50 dark:to-indigo-950/40 text-purple-900 dark:text-purple-300 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50'
            }`}
            title="Analyst: Autonomous Learning Agent — Goal: To Be The Best Trader in the World"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <BrainCircuit className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-extrabold tracking-tight">Analyst</span>
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1 py-0.2 rounded font-mono">
              AI Trader
            </span>
          </button>

          {/* Brief of the Day (Catch-Up) Trigger */}
          {onOpenCatchup && (
            <button
              id="nav-brief-of-day-btn"
              onClick={onOpenCatchup}
              className="flex items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-600/70 bg-purple-50/90 dark:bg-purple-950/40 px-2.5 py-1.5 font-bold text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition shadow-xs text-xs cursor-pointer"
              title="Analyst Brief of the Day: See what the Analyst did while you were away, market changes, and trades taken"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Brief of the Day</span>
              <span className="sm:hidden">Brief</span>
              <span className="text-[9px] bg-purple-200/80 dark:bg-purple-900/70 text-purple-900 dark:text-purple-200 px-1 py-0.2 rounded font-mono font-bold">
                Catch-Up
              </span>
            </button>
          )}

          {/* Official Audit Report PDF Modal Trigger */}
          {onOpenPdfReport && (
            <button
              id="nav-pdf-report-btn"
              onClick={onOpenPdfReport}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-600/70 bg-amber-50 dark:bg-amber-500/20 px-2.5 py-1.5 font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition shadow-xs text-xs"
              title="View, Print & Download Official Trades Audit PDF Report"
            >
              <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">PDF Audit Report</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}

          {/* 24/7 Heartbeat Sentinel Trigger */}
          {onOpenHeartbeat && (
            <button
              id="nav-heartbeat-sentinel-btn"
              onClick={onOpenHeartbeat}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/50 px-2.5 py-1.5 font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-xs text-xs"
              title="24/7 System Heartbeat & Keep-Alive Sentinel"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">24/7 Bot</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          {onToggleTheme && (
            <button
              id="nav-theme-toggle-btn"
              onClick={onToggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/70 text-stone-700 dark:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition shadow-xs text-xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-stone-700" />
              )}
            </button>
          )}

          {/* Single Heartbeat Trigger */}
          <button
            id="nav-quick-heartbeat-btn"
            onClick={onQuickHeartbeat}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 px-3 py-1.5 font-semibold text-white dark:text-stone-950 transition hover:bg-stone-800 dark:hover:bg-amber-400 disabled:opacity-50 shadow-xs text-xs font-mono"
          >
            <Activity className={`h-3.5 w-3.5 text-amber-400 dark:text-stone-950 ${isRunning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRunning ? 'Scanning...' : 'Scan Market'}</span>
          </button>
        </div>
      </div>

      {/* Intraday Active Banner & Live Price Verification Status */}
      {tradingMode === 'INTRADAY' ? (
        <div className="bg-amber-500/10 dark:bg-amber-400/10 border-t border-b border-amber-500/20 px-4 py-1 text-[11px] text-amber-800 dark:text-amber-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold flex items-center gap-1 uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200">
                <Zap className="h-3 w-3 fill-amber-500 text-amber-600 dark:text-amber-300" />
                Intraday Quant Desk Active
              </span>
              <span className="hidden md:inline">•</span>
              <span className="font-mono text-[10px]">Timeframe: 5-Min / 1-Min Intraday Bars</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-[10px]">Session: 09:15 - 15:30 IST</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Auto Square-off: 15:15 IST (MIS 5x)</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Yahoo Live &amp; TradingView Price Feed: Verified Synchronized
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-500/10 dark:bg-blue-400/10 border-t border-b border-blue-500/20 px-4 py-1 text-[11px] text-blue-800 dark:text-blue-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold flex items-center gap-1 uppercase tracking-wider text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-900 dark:text-blue-200">
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                Long-Term &amp; Swing Mode
              </span>
              <span className="hidden md:inline">•</span>
              <span className="text-[10px]">Positional Swing Horizon • Multi-Day Holdings • Titans Portfolio</span>
            </div>
            <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
              Live Yahoo Finance NSE Feed Active
            </div>
          </div>
        </div>
      )}

      {/* Streamlined, Organized Navigation Bar with Zero-Pill Discipline */}
      <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 scrollbar-none">
        <nav className="flex items-center space-x-1 py-1 text-xs whitespace-nowrap">
          {/* GROUP 1: TRADING DESK */}
          <div className="flex items-center space-x-1">
            <button
              id="nav-tab-pipeline"
              onClick={() => onTabChange('pipeline')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'pipeline'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Live Pipeline &amp; Radar
            </button>

            <button
              id="nav-tab-transactions"
              onClick={() => onTabChange('transactions')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'transactions'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Active Trades &amp; History
              {transactionsCount > 0 && (
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 tabular-nums">
                  ({transactionsCount})
                </span>
              )}
            </button>

            <button
              id="nav-tab-portfolio"
              onClick={() => onTabChange('portfolio')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'portfolio'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Paper Portfolio &amp; Memory
            </button>

            <button
              id="nav-tab-my_stocks"
              onClick={() => onTabChange('my_stocks')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'my_stocks'
                  ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              My Stocks
            </button>
          </div>

          {/* Group Separator */}
          <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 shrink-0" aria-hidden="true" />

          {/* GROUP 2: RESEARCH & ALGORITHMS */}
          <div className="flex items-center space-x-1">
            {/* FEATURED: Analyst (Learning Agent - World's Best Trader AI) */}
            <button
              id="nav-tab-analyst"
              onClick={() => onTabChange('analyst')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'analyst'
                  ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300 font-bold bg-purple-50/50 dark:bg-purple-950/30'
                  : 'border-transparent text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Analyst (Learning Agent)</span>
            </button>

            {/* NEW TAB: Strategy Arena & Sandbox Lab */}
            <button
              id="nav-tab-algo_research"
              onClick={() => onTabChange('algo_research')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'algo_research'
                  ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400 font-semibold bg-amber-50/40 dark:bg-amber-500/10'
                  : 'border-transparent text-amber-700 dark:text-amber-400/90 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Strategy Arena &amp; Sandbox
            </button>

            {/* NEW TAB: Hall of Titans: Master Strategies */}
            <button
              id="nav-tab-titans"
              onClick={() => onTabChange('titans')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'titans'
                  ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400 font-semibold bg-amber-50/40 dark:bg-amber-500/10'
                  : 'border-transparent text-amber-700 dark:text-amber-400/90 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
            >
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Hall of Titans
            </button>

            <button
              id="nav-tab-scanner"
              onClick={() => onTabChange('scanner')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'scanner'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Stock Scanner
              {goodOpportunitiesCount > 0 && (
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ({goodOpportunitiesCount})
                </span>
              )}
            </button>

            <button
              id="nav-tab-decision_reasoning"
              onClick={() => onTabChange('decision_reasoning')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'decision_reasoning'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5 text-amber-500" />
              Decision Reasoning &amp; Loss Rules
            </button>

            <button
              id="nav-tab-news_recommendations"
              onClick={() => onTabChange('news_recommendations')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'news_recommendations'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Newspaper className="h-3.5 w-3.5 text-orange-500" />
              News Recommendations
            </button>
          </div>

          {/* Group Separator */}
          <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 shrink-0" aria-hidden="true" />

          {/* GROUP 3: RISK & ANALYTICS */}
          <div className="flex items-center space-x-1">
            <button
              id="nav-tab-risk_tiers"
              onClick={() => onTabChange('risk_tiers')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'risk_tiers'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Risk Tiers
            </button>

            <button
              id="nav-tab-volatility_heatmap"
              onClick={() => onTabChange('volatility_heatmap')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'volatility_heatmap'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              Volatility Heatmap
            </button>

            <button
              id="nav-tab-risk_math"
              onClick={() => onTabChange('risk_math')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'risk_math'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Risk Math Lab
            </button>
          </div>

          {/* Group Separator */}
          <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 shrink-0" aria-hidden="true" />

          {/* GROUP 4: SYSTEM & ARCHITECTURE */}
          <div className="flex items-center space-x-1">
            <button
              id="nav-tab-architecture"
              onClick={() => onTabChange('architecture')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'architecture'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              Architecture
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
                activeTab === 'settings'
                  ? 'border-stone-900 text-stone-900 dark:border-amber-400 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
