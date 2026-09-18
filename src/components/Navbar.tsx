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
} from 'lucide-react';
import type { SystemConfig } from '../types';

export type TabType = 'pipeline' | 'my_stocks' | 'decision_reasoning' | 'risk_tiers' | 'scanner' | 'volatility_heatmap' | 'news_recommendations' | 'transactions' | 'portfolio' | 'risk_math' | 'architecture' | 'settings';

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
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-stone-900">
                AI BOT ADVANCE
              </h1>
              <span className="rounded bg-stone-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-stone-600">
                NSE QUANT
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Decoupled Quantitative Reasoning & Mathematical Risk Engine
            </p>
          </div>
        </div>

        {/* Global Status Bar */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          {/* Active Trades Live Profit/Loss Indicator */}
          {activeTradesCount > 0 && (
            <button
              id="nav-active-trades-btn"
              onClick={() => onTabChange('portfolio')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                totalUnrealizedPnl >= 0
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100'
                  : 'border-rose-200 bg-rose-50/90 text-rose-800 hover:bg-rose-100'
              }`}
              title="Click to view Active Trades and Manage Positions"
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
              <span>{activeTradesCount} Active Trade{activeTradesCount > 1 ? 's' : ''}:</span>
              <span className="font-mono font-extrabold">
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹
                {totalUnrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5">
            <span className="text-stone-400">Equity:</span>
            <span className="font-mono font-bold text-stone-900">
              ₹{config.system.currentPaperCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              config.system.paperTradingMode
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                config.system.paperTradingMode ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
            {config.system.paperTradingMode ? 'Paper Mode (0.05% Slippage)' : 'Zerodha Live'}
          </span>

          {/* PnL Alerts Settings Trigger */}
          {onOpenAlertSettings && (
            <button
              id="nav-alert-settings-btn"
              onClick={onOpenAlertSettings}
              className="relative flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition shadow-xs text-xs"
              title="Configure Live PnL Alert Thresholds"
            >
              <Bell className="h-3.5 w-3.5 text-amber-500" />
              <span>PnL Alerts</span>
              {alertsCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-extrabold text-white">
                  {alertsCount}
                </span>
              )}
            </button>
          )}

          <button
            id="nav-quick-heartbeat-btn"
            onClick={onQuickHeartbeat}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-xs text-xs"
          >
            <Activity className={`h-3.5 w-3.5 text-amber-400 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing...' : 'Heartbeat Scan'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6">
        <nav className="flex space-x-1 py-1 text-xs">
          <button
            id="nav-tab-pipeline"
            onClick={() => onTabChange('pipeline')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'pipeline'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Live Pipeline & Radar
          </button>

          {/* User Requested: My Stocks Tab with AI BOT ADVANCE Analysis */}
          <button
            id="nav-tab-my_stocks"
            onClick={() => onTabChange('my_stocks')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'my_stocks'
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-indigo-50/50'
                : 'border-transparent text-stone-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
            My Stocks
            <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-800 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5 text-amber-500" /> AI BOT ADVANCE
            </span>
          </button>

          {/* User Requested: Decision Reasoning & Loss Prevention Tab */}
          <button
            id="nav-tab-decision_reasoning"
            onClick={() => onTabChange('decision_reasoning')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'decision_reasoning'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-amber-500" />
            Decision Reasoning &amp; Loss Prevention
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
              Why Buy &amp; Loss Rules
            </span>
          </button>

          {/* Dedicated Tab: Best Returns by Risk Tier (Low, Med, High Risk) */}
          <button
            id="nav-tab-risk_tiers"
            onClick={() => onTabChange('risk_tiers')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'risk_tiers'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-emerald-600" />
            Best Returns: Low &bull; Med &bull; High Risk
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
              3 Tiers
            </span>
          </button>

          {/* Stock Opportunity Scanner (All Sectors) */}
          <button
            id="nav-tab-scanner"
            onClick={() => onTabChange('scanner')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'scanner'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Stock Scanner (All Sectors)
            {goodOpportunitiesCount > 0 && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                {goodOpportunitiesCount} Prime
              </span>
            )}
          </button>

          {/* Volatility Heatmap Tab */}
          <button
            id="nav-tab-volatility_heatmap"
            onClick={() => onTabChange('volatility_heatmap')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'volatility_heatmap'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Volatility Heatmap
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-orange-800">
              ATR Map
            </span>
          </button>

          {/* User Requested: News Based Recommendations Tab */}
          <button
            id="nav-tab-news_recommendations"
            onClick={() => onTabChange('news_recommendations')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'news_recommendations'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Newspaper className="h-3.5 w-3.5 text-orange-500" />
            News Based Recommendations
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-orange-800">
              Leading Sites
            </span>
          </button>

          {/* New Tab: Dedicated Transaction History */}
          <button
            id="nav-tab-transactions"
            onClick={() => onTabChange('transactions')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'transactions'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <History className="h-3.5 w-3.5 text-stone-700" />
            Transaction History
            {transactionsCount > 0 && (
              <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.2 text-[9px] font-mono font-bold text-stone-600">
                {transactionsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-portfolio"
            onClick={() => onTabChange('portfolio')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'portfolio'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Paper Portfolio & Memory
            {activeTradesCount > 0 && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                  totalUnrealizedPnl >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeTradesCount} Active &bull; {totalUnrealizedPnl >= 0 ? '+' : ''}₹{Math.round(totalUnrealizedPnl)}
              </span>
            )}
          </button>

          <button
            id="nav-tab-risk_math"
            onClick={() => onTabChange('risk_math')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'risk_math'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Risk Governor Math Lab
          </button>

          <button
            id="nav-tab-architecture"
            onClick={() => onTabChange('architecture')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'architecture'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            Architecture & Python Code (8 Modules)
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 font-medium transition ${
              activeTab === 'settings'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            config.toml Settings
          </button>
        </nav>
      </div>
    </header>
  );
};

