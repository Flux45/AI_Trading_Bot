import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Zap, Clock, ShieldAlert } from 'lucide-react';
import { Navbar, TabType } from './components/Navbar';
import { WatchlistRadar } from './components/WatchlistRadar';
import { CandleChart } from './components/CandleChart';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { PortfolioPanel } from './components/PortfolioPanel';
import { RiskSimulator } from './components/RiskSimulator';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { ConfigView } from './components/ConfigView';
import { StockScanner } from './components/StockScanner';
import { TransactionHistory } from './components/TransactionHistory';
import { RiskTiersDashboard } from './components/RiskTiersDashboard';
import { VolatilityHeatmap } from './components/VolatilityHeatmap';
import { NewsBasedRecommendations } from './components/NewsBasedRecommendations';
import { MarketSentimentDial } from './components/MarketSentimentDial';
import { SelectedStockHorizonCard } from './components/SelectedStockHorizonCard';
import { DecisionReasoningView } from './components/DecisionReasoningView';
import { MyStocksView } from './components/MyStocksView';
import { AlgoResearchBot } from './components/AlgoResearchBot';
import { TitansView } from './components/TitansView';
import { ToastNotificationCenter } from './components/ToastNotificationCenter';
import { HeartbeatSentinelModal } from './components/HeartbeatSentinelModal';
import { TradesPdfReportModal } from './components/TradesPdfReportModal';
import { StrategyInspectorModal } from './components/StrategyInspectorModal';
import { StrategyBuilderHub } from './components/StrategyBuilderHub';
import { UnifiedTradesLedgerView } from './components/UnifiedTradesLedgerView';
import { AgentDailyInsightView } from './components/AgentDailyInsightView';
import { CronRootCauseCard } from './components/ui/ReusableComponents';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import { usePnlAlerts } from './hooks/usePnlAlerts';
import { useTheme } from './hooks/useTheme';
import type {
  MarketContext,
  PipelineResult,
  OrderTicket,
  SystemConfig,
  TradingHorizonMode,
} from './types';

const INITIAL_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

function AppWorkspace() {
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('strategies');

  // Clean sub-view states so 100% of platform features are accessible without clutter
  const [strategySubView, setStrategySubView] = useState<'builder' | 'arena' | 'titans' | 'risk_math'>('builder');
  const [tradesSubView, setTradesSubView] = useState<'ledger' | 'portfolio' | 'transactions' | 'my_stocks'>('ledger');
  const [pipelineSubView, setPipelineSubView] = useState<'pipeline' | 'decision_reasoning'>('pipeline');
  const [scannerSubView, setScannerSubView] = useState<'scanner' | 'risk_tiers' | 'heatmap' | 'news'>('scanner');
  const [settingsSubView, setSettingsSubView] = useState<'config' | 'architecture'>('config');

  const [watchlist, setWatchlist] = useState<string[]>(INITIAL_WATCHLIST);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [pipelineDurationMs, setPipelineDurationMs] = useState<number | null>(null);
  const runRequestRef = useRef<number>(0);

  // Modals & User Feedback Toasts
  const [showAlertSettings, setShowAlertSettings] = useState<boolean>(false);
  const [showHeartbeatModal, setShowHeartbeatModal] = useState<boolean>(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);
  const [inspectingStrategyId, setInspectingStrategyId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    tradingMode,
    setTradingMode,
    selectedTicker,
    setSelectedTicker,
    allStrategies,
    selectedStrategy,
    setSelectedStrategy,
    config,
    setConfig,
    positions,
    setPositions,
    tradeHistory,
    transactions,
    scannedStocks,
    isScanning,
    marketSentiment,
    autonomousSummary,
    daemonStatus,
    setDaemonStatus,
    isLoadingAutonomous,
    accounting,
    strategyMetrics,
    fetchTransactions,
    fetchTradeHistory,
    fetchAccounting,
    fetchMemoryAndPositions,
    fetchAutonomousSummary,
    handleRunUniverseScan,
    handleClosePosition,
    handleResetPortfolio,
    handleRunAutonomous7Day,
    handleToggleDaemon,
    handleResetZero,
    handleAddCustomTicker,
  } = useTradingContext();

  // P&L Alert Sounds & Threshold Monitoring
  const {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    triggerTestAlert,
  } = usePnlAlerts(positions);

  // Fast single-stock pipeline execution (instantaneous response, no post-fetch blocking on read-only runs)
  const handleRunSingle = useCallback(
    async (ticker: string, autoExecute = false) => {
      const cleanTicker = (ticker || 'RELIANCE').toUpperCase().replace('.NS', '').trim();
      const reqId = ++runRequestRef.current;
      setIsRunning(true);
      setSelectedTicker(cleanTicker);
      const tStart = Date.now();
      try {
        const res = await fetch('/api/pipeline/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: cleanTicker,
            autoExecute,
            strategyId: selectedStrategy?.id,
            strategyName: selectedStrategy?.name,
          }),
        });
        if (res.ok && reqId === runRequestRef.current) {
          const result: PipelineResult & { openPositions?: any[] } = await res.json();
          setPipelineResult(result);
          setPipelineDurationMs(Date.now() - tStart);
          if (result.marketContext) {
            setMarketContext(result.marketContext);
          }
          // Release loading spinner immediately once pipeline completes!
          setIsRunning(false);

          if (autoExecute) {
            if (result.executedPosition) {
              setOrderToast({
                type: 'success',
                message: `Strategy '${selectedStrategy?.name || 'Quant'}' executed: ${result.executedPosition.action} ${result.executedPosition.shares} ${result.executedPosition.ticker} @ ₹${result.executedPosition.fill_price} (Saved to SQLite: ${result.executedPosition.execution_date || ''} ${result.executedPosition.execution_time || ''})`,
              });
              setTimeout(() => setOrderToast(null), 6000);
            }
            if (result.openPositions) {
              setPositions(result.openPositions);
            }
            // Refresh ledger asynchronously in background only when an order was executed
            Promise.all([
              fetchTransactions(),
              fetchTradeHistory(),
              fetchAccounting(),
            ]).catch(() => {});
          }
        }
      } catch (err) {
        console.error(`Failed to run pipeline for ${cleanTicker}:`, err);
      } finally {
        if (reqId === runRequestRef.current) {
          setIsRunning(false);
        }
      }
    },
    [selectedStrategy?.id, selectedStrategy?.name, setSelectedTicker, setPositions, fetchTransactions, fetchTradeHistory, fetchAccounting]
  );

  // Auto-run fast pipeline once on initial mount so the Pipeline view is populated
  useEffect(() => {
    handleRunSingle('RELIANCE', false);
  }, []);

  // Periodic In-App Sentinel Keep-Alive ping (every 45s while browser tab is active)
  useEffect(() => {
    const keepAlivePing = () => {
      fetch('/api/heartbeat?source=In-App%20Browser%20Sentinel', { method: 'GET' }).catch(() => {});
    };
    keepAlivePing();
    const interval = setInterval(keepAlivePing, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicker = async (ticker: string) => {
    const clean = ticker.toUpperCase().replace('.NS', '').trim();
    setSelectedTicker(clean);
    try {
      const res = await fetch(`/api/market-context/${clean}?mode=${tradingMode}`);
      if (res.ok) {
        const data = await res.json();
        setMarketContext(data);
      }
    } catch (err) {
      console.error(`Failed to fetch context for ${clean}:`, err);
    }
  };

  const handleTradingModeChange = (newMode: TradingHorizonMode) => {
    setTradingMode(newMode);
    const qMode = newMode === 'SWING' ? 'long' : 'intraday';
    fetchMemoryAndPositions(qMode);
    fetchTransactions(qMode);
    fetchTradeHistory(qMode);
    fetchAccounting(qMode);
  };

  const handleSelectStockForPipeline = (ticker: string) => {
    const clean = ticker.toUpperCase().replace('.NS', '').trim();
    if (!watchlist.includes(clean)) {
      setWatchlist((prev) => [clean, ...prev]);
    }
    setActiveTab('pipeline');
    setPipelineSubView('pipeline');
    handleRunSingle(clean, false);
  };

  const handleOpenLossReasoningForTicker = (ticker?: string) => {
    if (ticker) {
      setSelectedTicker(ticker.toUpperCase().replace('.NS', '').trim());
    }
    setActiveTab('decision_reasoning');
  };

  const handlePlaceManualOrder = async (orderParams: {
    ticker: string;
    action: 'BUY' | 'SELL';
    shares: number;
    entry_price?: number;
    stop_loss?: number;
    target_price?: number;
    ticket?: OrderTicket;
  }) => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderParams,
          strategy_id: selectedStrategy?.id || 'MANUAL_DESK',
          strategy_name: selectedStrategy?.name || 'Manual Strategy Execution',
        }),
      });
      const data = await res.json();
      if (data.success && data.position) {
        setOrderToast({
          type: 'success',
          message: `Executed ${data.position.action} ${data.position.shares} shares of ${data.position.ticker} @ ₹${data.position.fill_price} via '${data.position.strategy_name || selectedStrategy?.name}' (SQLite: ${data.position.execution_date || ''} ${data.position.execution_time || ''})`,
        });
        setTimeout(() => setOrderToast(null), 6000);

        if (data.openPositions) {
          setPositions(data.openPositions);
        } else {
          fetchMemoryAndPositions();
        }
        fetchTransactions();
        fetchTradeHistory();
        fetchAccounting();

        if (pipelineResult && pipelineResult.ticker === orderParams.ticker) {
          setPipelineResult({
            ...pipelineResult,
            executedPosition: data.position,
          });
        }
      } else {
        setOrderToast({
          type: 'error',
          message: data.error || 'Failed to execute order.',
        });
        setTimeout(() => setOrderToast(null), 6000);
      }
    } catch (err: any) {
      setOrderToast({
        type: 'error',
        message: `Execution failed: ${err.message || err}`,
      });
      setTimeout(() => setOrderToast(null), 6000);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleRunAll = async () => {
    setIsRunning(true);
    try {
      for (const ticker of watchlist) {
        setSelectedTicker(ticker);
        const res = await fetch('/api/pipeline/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            strategyId: selectedStrategy?.id,
            strategyName: selectedStrategy?.name,
          }),
        });
        if (res.ok) {
          const result: PipelineResult = await res.json();
          setPipelineResult(result);
          if (result.marketContext) {
            setMarketContext(result.marketContext);
          }
        }
      }
    } catch (err) {
      console.error('Scan all failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTicker = (ticker: string) => {
    const clean = ticker.toUpperCase().replace('.NS', '').trim();
    if (!watchlist.includes(clean)) {
      setWatchlist([...watchlist, clean]);
    }
    handleRunSingle(clean, false);
  };

  const handleSaveConfig = async (updated: Partial<SystemConfig>) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
    }
  };

  // Start 7-Day Live Real-Time Campaign
  const handleStartLiveCampaign = async () => {
    try {
      const res = await fetch('/api/autonomous/live-campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: 50000.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign && daemonStatus) {
          setDaemonStatus((prev: any) =>
            prev ? { ...prev, campaign: data.campaign, adaptiveModel: data.adaptiveModel } : null
          );
        }
        await Promise.all([fetchMemoryAndPositions(), fetchTransactions(), fetchAutonomousSummary()]);
      }
    } catch (err) {
      console.error('Failed to start live 7-day campaign:', err);
    }
  };

  // Immediate Real-Time Autonomous Scan & Trade
  const handleTradeNow = async () => {
    try {
      const res = await fetch('/api/autonomous/live-campaign/trade-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await Promise.all([fetchMemoryAndPositions(), fetchTransactions(), fetchAutonomousSummary()]);
      }
    } catch (err) {
      console.error('Failed to execute real-time trade:', err);
    }
  };

  const totalUnrealizedPnl = positions.reduce((sum, p) => {
    const cur = p.current_price || p.fill_price;
    const pnl =
      p.action === 'BUY'
        ? (cur - p.fill_price) * p.shares
        : (p.fill_price - cur) * p.shares;
    return sum + pnl;
  }, 0);

  const goodOpportunitiesCount = scannedStocks.filter((s) => s.is_good_opportunity).length;

  // Map navigation tab to the 7 primary views while preserving sub-view routing
  const resolvedView:
    | 'strategies'
    | 'trades_db'
    | 'pipeline'
    | 'loss_reasoning'
    | 'agent_insight'
    | 'scanner'
    | 'settings' = (() => {
    if (
      activeTab === 'strategies' ||
      activeTab === 'algo_research' ||
      activeTab === 'titans' ||
      activeTab === 'risk_math'
    ) {
      return 'strategies';
    }
    if (
      activeTab === 'trades_db' ||
      activeTab === 'transactions' ||
      activeTab === 'portfolio' ||
      activeTab === 'my_stocks'
    ) {
      return 'trades_db';
    }
    if (activeTab === 'decision_reasoning') {
      return 'loss_reasoning';
    }
    if (activeTab === 'pipeline') {
      return 'pipeline';
    }
    if (activeTab === 'agent_insight' || activeTab === 'analyst') {
      return 'agent_insight';
    }
    if (
      activeTab === 'scanner' ||
      activeTab === 'risk_tiers' ||
      activeTab === 'volatility_heatmap' ||
      activeTab === 'news_recommendations'
    ) {
      return 'scanner';
    }
    return 'settings';
  })();

  const handleNavigateTab = (tab: TabType) => {
    if (tab === 'algo_research') setStrategySubView('arena');
    else if (tab === 'titans') setStrategySubView('titans');
    else if (tab === 'risk_math') setStrategySubView('risk_math');
    else if (tab === 'strategies') setStrategySubView('builder');

    if (tab === 'portfolio') setTradesSubView('portfolio');
    else if (tab === 'transactions') setTradesSubView('transactions');
    else if (tab === 'my_stocks') setTradesSubView('my_stocks');
    else if (tab === 'trades_db') setTradesSubView('ledger');

    if (tab === 'pipeline') setPipelineSubView('pipeline');

    if (tab === 'risk_tiers') setScannerSubView('risk_tiers');
    else if (tab === 'volatility_heatmap') setScannerSubView('heatmap');
    else if (tab === 'news_recommendations') setScannerSubView('news');
    else if (tab === 'scanner') setScannerSubView('scanner');

    if (tab === 'architecture') setSettingsSubView('architecture');
    else if (tab === 'settings') setSettingsSubView('config');

    setActiveTab(tab);
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'dark bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-950'
      } font-sans antialiased transition-colors duration-200`}
    >
      {/* Streamlined Top Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleNavigateTab}
        config={config}
        isRunning={isRunning}
        onQuickHeartbeat={() => {
          setActiveTab('pipeline');
          setPipelineSubView('pipeline');
          handleRunSingle(selectedTicker, false);
        }}
        transactionsCount={transactions.length}
        goodOpportunitiesCount={goodOpportunitiesCount}
        activeTradesCount={positions.length}
        totalUnrealizedPnl={totalUnrealizedPnl}
        onOpenAlertSettings={() => setShowAlertSettings(true)}
        alertsCount={alerts.length}
        onOpenHeartbeat={() => setShowHeartbeatModal(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        tradingMode={tradingMode}
        onTradingModeChange={handleTradingModeChange}
        onOpenPdfReport={() => setShowPdfReportModal(true)}
      />

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {orderToast && (
          <div
            id="order-execution-toast"
            className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-bold transition border-2 ${
              orderToast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-950 dark:text-rose-200'
            }`}
          >
            <span>{orderToast.message}</span>
            <button
              onClick={() => setOrderToast(null)}
              className="rounded px-2 py-0.5 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW 1: Strategy Builder, Restrictions, Arena, Titans & Risk Math */}
        {resolvedView === 'strategies' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5">
              <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                Strategy Workspace &amp; Risk Laboratories
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1">
                <button
                  type="button"
                  onClick={() => setStrategySubView('builder')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    strategySubView === 'builder'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Restrictions &amp; Strategy Builder
                </button>
                <button
                  type="button"
                  onClick={() => setStrategySubView('arena')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    strategySubView === 'arena'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Strategy Arena &amp; Backtest Lab
                </button>
                <button
                  type="button"
                  onClick={() => setStrategySubView('titans')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    strategySubView === 'titans'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Hall of Titans
                </button>
                <button
                  type="button"
                  onClick={() => setStrategySubView('risk_math')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    strategySubView === 'risk_math'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Risk Math Simulator
                </button>
              </div>
            </div>

            {strategySubView === 'builder' && (
              <StrategyBuilderHub onNavigateToTrades={() => setActiveTab('trades_db')} />
            )}
            {strategySubView === 'arena' && (
              <AlgoResearchBot
                tradingMode={tradingMode}
                onStrategyApproved={(strategy) => {
                  setOrderToast({
                    type: 'success',
                    message: `Strategy '${strategy.name}' deployed under mathematical safety limits.`,
                  });
                }}
                onNavigateToPortfolio={() => {
                  setTradesSubView('portfolio');
                  setActiveTab('trades_db');
                }}
              />
            )}
            {strategySubView === 'titans' && (
              <TitansView onSelectTickerForPipeline={handleSelectStockForPipeline} />
            )}
            {strategySubView === 'risk_math' && <RiskSimulator />}
          </div>
        )}

        {/* VIEW 2: Active Trades (Blue Box), Ended Trades (Yellow Dashed Box), Portfolio & SQLite DB */}
        {resolvedView === 'trades_db' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5">
              <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                Active Trades, Autonomous Portfolio &amp; SQLite Execution Ledger
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1">
                <button
                  type="button"
                  onClick={() => setTradesSubView('ledger')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    tradesSubView === 'ledger'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Live (Blue) &amp; Ended (Yellow) + SQLite Table
                </button>
                <button
                  type="button"
                  onClick={() => setTradesSubView('portfolio')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    tradesSubView === 'portfolio'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  7-Day Campaign &amp; Strategy Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setTradesSubView('transactions')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    tradesSubView === 'transactions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Full Audit Ledger ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTradesSubView('my_stocks')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    tradesSubView === 'my_stocks'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  My Stocks &amp; Zerodha Audit
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLossReasoningForTicker()}
                  className="rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                >
                  Lost Trades &amp; Algo Fixes
                </button>
              </div>
            </div>

            {tradesSubView === 'ledger' && (
              <UnifiedTradesLedgerView
                onOpenPdfReport={() => setShowPdfReportModal(true)}
                onSelectStrategy={(id) => setInspectingStrategyId(id)}
                onAnalyzeLoss={handleOpenLossReasoningForTicker}
              />
            )}

            {tradesSubView === 'portfolio' && (
              <PortfolioPanel
                config={config}
                positions={positions}
                tradeHistory={tradeHistory}
                onClosePosition={handleClosePosition}
                onResetPortfolio={handleResetPortfolio}
                onResetToZero={() => handleResetZero()}
                onRun7DayCycle={() => handleRunAutonomous7Day()}
                onStartLiveCampaign={handleStartLiveCampaign}
                onTradeNow={handleTradeNow}
                onToggleDaemon={handleToggleDaemon}
                autonomousSummary={autonomousSummary}
                daemonStatus={daemonStatus}
                onOpenAlertSettings={() => setShowAlertSettings(true)}
                isLoadingAutonomous={isLoadingAutonomous}
                accounting={accounting}
                onOpenPdfReport={() => setShowPdfReportModal(true)}
                tradingMode={tradingMode}
                onTradingModeChange={handleTradingModeChange}
                strategyMetrics={strategyMetrics}
                onSelectStrategy={(id) => setInspectingStrategyId(id)}
                onOpenCatchup={() => setActiveTab('agent_insight')}
              />
            )}

            {tradesSubView === 'transactions' && (
              <TransactionHistory
                transactions={transactions}
                openPositions={positions}
                onRefresh={fetchTransactions}
                onSelectTickerForPipeline={handleSelectStockForPipeline}
                onClosePosition={handleClosePosition}
                onOpenPdfReport={() => setShowPdfReportModal(true)}
                tradingMode={tradingMode}
                onTradingModeChange={handleTradingModeChange}
                onSelectStrategy={(id) => setInspectingStrategyId(id)}
              />
            )}

            {tradesSubView === 'my_stocks' && (
              <MyStocksView
                onExecuteManualTrade={(ticker, action, shares) => {
                  handlePlaceManualOrder({ ticker, action, shares });
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 3: Fast Quant Pipeline, Strategy Execution Bar & Decision Reasoning */}
        {resolvedView === 'pipeline' && (
          <div className="space-y-5">
            {/* Pipeline Strategy Execution Control Bar */}
            <div className="rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      FAST PIPELINE ENGINE
                    </span>
                    {pipelineDurationMs !== null && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        <Clock className="h-3 w-3" />
                        Completed in {pipelineDurationMs}ms
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1.5 text-sm font-black text-stone-950 dark:text-white">
                    5-Stage Quantitative Pipeline &amp; Direct Strategy Execution
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Click any stock below for instant analysis or execute the selected strategy directly into SQLite with date &amp; time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Strategy Selector */}
                  <select
                    value={selectedStrategy?.id || ''}
                    onChange={(e) => {
                      const found = allStrategies.find((s) => s.id === e.target.value);
                      if (found) setSelectedStrategy(found);
                    }}
                    className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs font-bold text-stone-950 dark:text-white"
                  >
                    {allStrategies.map((strat) => (
                      <option key={strat.id} value={strat.id}>
                        Strategy: {strat.name} (SL {strat.stopLossPct}% / Target {strat.targetPct}%)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRunSingle(selectedTicker, false)}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    {isRunning ? 'Analyzing...' : `Analyze ${selectedTicker}`}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunSingle(selectedTicker, true)}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isRunning ? 'Executing...' : `Run & Execute Strategy on ${selectedTicker}`}
                  </button>

                  <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPipelineSubView('pipeline')}
                      className={`rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        pipelineSubView === 'pipeline'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      Chart &amp; Pipeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setPipelineSubView('decision_reasoning')}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        pipelineSubView === 'decision_reasoning'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                      }`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Lost Trades &amp; Algo Fixes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {pipelineSubView === 'pipeline' ? (
              <div className="space-y-6">
                <WatchlistRadar
                  watchlist={watchlist}
                  selectedTicker={selectedTicker}
                  onSelectTicker={(t) => handleRunSingle(t, false)}
                  onRunSingle={(t) => handleRunSingle(t, false)}
                  onRunAll={handleRunAll}
                  onAddTicker={handleAddTicker}
                  isRunning={isRunning}
                  onOpenScanner={() => setActiveTab('scanner')}
                />

                {marketSentiment && (
                  <MarketSentimentDial
                    sentiment={marketSentiment}
                    compact={true}
                    onClickDetails={() => {
                      setScannerSubView('news');
                      setActiveTab('scanner');
                    }}
                  />
                )}

                {marketContext && (
                  <SelectedStockHorizonCard
                    ticker={selectedTicker}
                    marketContext={marketContext}
                    hypothesis={pipelineResult?.hypothesis}
                    ticket={pipelineResult?.ticket}
                    independentDecision={pipelineResult?.independentDecision}
                    onRunHeartbeat={() => handleRunSingle(selectedTicker, false)}
                    isRunning={isRunning}
                    onPlaceManualOrder={handlePlaceManualOrder}
                    isPlacingOrder={isPlacingOrder}
                    onOpenLossReasoning={(ticker) => handleOpenLossReasoningForTicker(ticker)}
                  />
                )}

                {marketContext && (
                  <CandleChart
                    marketContext={marketContext}
                    hypothesis={pipelineResult?.hypothesis}
                  />
                )}

                <PipelineVisualizer
                  pipelineResult={pipelineResult}
                  isRunning={isRunning}
                  onExecuteNow={() => handleRunSingle(selectedTicker, false)}
                  onPlaceManualOrder={handlePlaceManualOrder}
                  isPlacingOrder={isPlacingOrder}
                />
              </div>
            ) : (
              <DecisionReasoningView
                selectedTicker={selectedTicker}
                onSelectTicker={handleSelectTicker}
                onPlaceManualOrder={handlePlaceManualOrder}
                isPlacingOrder={isPlacingOrder}
                tradeHistory={tradeHistory}
                positions={positions}
                initialSubTab="LOSS_POSTMORTEM"
              />
            )}
          </div>
        )}

        {/* VIEW 4: Dedicated Lost Trades Post-Mortem, Reasoning & Algorithm Fixes */}
        {resolvedView === 'loss_reasoning' && (
          <DecisionReasoningView
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onPlaceManualOrder={handlePlaceManualOrder}
            isPlacingOrder={isPlacingOrder}
            tradeHistory={tradeHistory}
            positions={positions}
            initialSubTab="LOSS_POSTMORTEM"
          />
        )}

        {/* VIEW 5: Agent Full-Day Insight & Platform Update */}
        {resolvedView === 'agent_insight' && (
          <AgentDailyInsightView
            onNavigateToTab={handleNavigateTab}
            onSelectStrategy={(id) => setInspectingStrategyId(id)}
          />
        )}

        {/* VIEW 6: Stock Scanner, Risk Tiers, Volatility Heatmap & News Recommendations */}
        {resolvedView === 'scanner' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5">
              <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                40-Stock NSE Opportunity Scanner, Risk Tiers &amp; Catalyst News
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1">
                <button
                  type="button"
                  onClick={() => setScannerSubView('scanner')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    scannerSubView === 'scanner'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Stock Scanner ({scannedStocks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScannerSubView('risk_tiers')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    scannerSubView === 'risk_tiers'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Risk Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setScannerSubView('heatmap')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    scannerSubView === 'heatmap'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Volatility Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setScannerSubView('news')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    scannerSubView === 'news'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  News Recommendations
                </button>
              </div>
            </div>

            {scannerSubView === 'scanner' && (
              <StockScanner
                scannedStocks={scannedStocks}
                isScanning={isScanning}
                onRunScan={handleRunUniverseScan}
                onSelectStockForPipeline={handleSelectStockForPipeline}
                onAddCustomTicker={handleAddCustomTicker}
              />
            )}

            {scannerSubView === 'risk_tiers' && (
              <RiskTiersDashboard
                scannedStocks={scannedStocks}
                isScanning={isScanning}
                onRefreshScan={() => handleRunUniverseScan()}
                onSelectStockForPipeline={handleSelectStockForPipeline}
                onAddCustomTicker={handleAddCustomTicker}
              />
            )}

            {scannerSubView === 'heatmap' && (
              <VolatilityHeatmap
                scannedStocks={scannedStocks}
                isScanning={isScanning}
                onRefreshScan={() => handleRunUniverseScan()}
                onSelectStockForPipeline={handleSelectStockForPipeline}
                onAddCustomTicker={handleAddCustomTicker}
              />
            )}

            {scannerSubView === 'news' && (
              <NewsBasedRecommendations
                systemConfig={config}
                onSelectStockForPipeline={handleSelectStockForPipeline}
                onTradeExecuted={() => {
                  fetchMemoryAndPositions();
                  fetchTransactions();
                }}
                positions={positions}
                onClosePosition={handleClosePosition}
                onViewPortfolio={() => {
                  setTradesSubView('portfolio');
                  setActiveTab('trades_db');
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 7: Cron Failure Diagnosis & Fix + Weekly Email PDF Scheduler + System Settings & Architecture */}
        {resolvedView === 'settings' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5">
              <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                Cron Diagnosis, Automated Weekly Email PDF &amp; System Architecture
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1">
                <button
                  type="button"
                  onClick={() => setSettingsSubView('config')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    settingsSubView === 'config'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  Cron Fix &amp; Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubView('architecture')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    settingsSubView === 'architecture'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  System Architecture &amp; Blueprint
                </button>
              </div>
            </div>

            {settingsSubView === 'config' ? (
              <div className="space-y-6">
                <CronRootCauseCard onOpenSentinel={() => setShowHeartbeatModal(true)} />
                <ConfigView
                  config={config}
                  onSaveConfig={handleSaveConfig}
                  onOpenHeartbeat={() => setShowHeartbeatModal(true)}
                  onOpenPdfReport={() => setShowPdfReportModal(true)}
                />
              </div>
            ) : (
              <ArchitectureViewer />
            )}
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-12 border-t border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 py-5 text-center text-xs text-stone-600 dark:text-stone-300">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-stone-900 dark:text-white">
            AI BOT ADVANCE &bull; Strategy Builder, Fast Pipeline, Lost Trades Post-Mortem &amp; SQLite Ledger
          </span>
          <span className="text-[11px] text-stone-600 dark:text-stone-300 font-mono">
            Live Trades: Blue Box &bull; Ended Trades: Yellow Dashed Box &bull; Cron 200 OK Fixed
          </span>
        </div>
      </footer>

      {/* 24/7 Heartbeat Sentinel Modal */}
      <HeartbeatSentinelModal
        isOpen={showHeartbeatModal}
        onClose={() => setShowHeartbeatModal(false)}
      />

      {/* Toast Notification Center for Live PnL Alerts */}
      <ToastNotificationCenter
        alerts={alerts}
        thresholds={thresholds}
        isOpen={showAlertSettings}
        onOpenChange={setShowAlertSettings}
        onDismiss={dismissAlert}
        onClearAll={clearAllAlerts}
        onUpdateThresholds={updateThresholds}
        onSelectPosition={() => {
          setActiveTab('trades_db');
        }}
        onTriggerTestAlert={triggerTestAlert}
      />

      {/* Official Trades & Portfolio PDF Audit Report Modal */}
      <TradesPdfReportModal
        isOpen={showPdfReportModal}
        onClose={() => setShowPdfReportModal(false)}
        openPositions={positions}
        tradeHistory={tradeHistory}
        transactions={transactions}
        accounting={accounting}
        onOpenScheduleSettings={() => {
          setSettingsSubView('config');
          setActiveTab('settings');
        }}
      />

      {/* Strategy Inspector Modal */}
      <StrategyInspectorModal
        strategyId={inspectingStrategyId}
        onClose={() => setInspectingStrategyId(null)}
        onOpenStressTester={() => {
          setInspectingStrategyId(null);
          setActiveTab('agent_insight');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <AppWorkspace />
    </TradingProvider>
  );
}
