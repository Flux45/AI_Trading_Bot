import React, { useState, useEffect } from 'react';
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
import { ActiveTradesLivePnl } from './components/ActiveTradesLivePnl';
import { SelectedStockHorizonCard } from './components/SelectedStockHorizonCard';
import { DecisionReasoningView } from './components/DecisionReasoningView';
import { MyStocksView } from './components/MyStocksView';
import { AlgoResearchBot } from './components/AlgoResearchBot';
import { TitansView } from './components/TitansView';
import { AnalystHub } from './components/AnalystHub';
import { ToastNotificationCenter } from './components/ToastNotificationCenter';
import { HeartbeatSentinelModal } from './components/HeartbeatSentinelModal';
import { TradesPdfReportModal } from './components/TradesPdfReportModal';
import { StrategyInspectorModal } from './components/StrategyInspectorModal';
import { usePnlAlerts } from './hooks/usePnlAlerts';
import { useTheme } from './hooks/useTheme';
import { useTradingState } from './hooks/useTradingState';
import type {
  MarketContext,
  PipelineResult,
  OrderTicket,
  SystemConfig,
  TradingHorizonMode,
} from './types';

const INITIAL_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [tradingMode, setTradingMode] = useState<TradingHorizonMode>('INTRADAY');
  const [watchlist, setWatchlist] = useState<string[]>(INITIAL_WATCHLIST);
  const [selectedTicker, setSelectedTicker] = useState<string>('RELIANCE');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  // Modals & User Feedback Toasts
  const [showAlertSettings, setShowAlertSettings] = useState<boolean>(false);
  const [showHeartbeatModal, setShowHeartbeatModal] = useState<boolean>(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);
  const [inspectingStrategyId, setInspectingStrategyId] = useState<string | null>(null);
  const [analystSubTab, setAnalystSubTab] = useState<'catchup' | 'matrix' | 'trends' | 'scorecard' | 'stress_test' | 'ask' | 'history'>('catchup');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Decoupled Trading State Service Hook (SOLID Principle)
  const {
    config,
    setConfig,
    positions,
    setPositions,
    tradeHistory,
    setTradeHistory,
    transactions,
    scannedStocks,
    isScanning,
    marketSentiment,
    autonomousSummary,
    daemonStatus,
    setDaemonStatus,
    isLoadingAutonomous,
    accounting,
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
    strategyMetrics,
  } = useTradingState(tradingMode);

  // P&L Alert Sounds & Threshold Monitoring
  const {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    triggerTestAlert,
  } = usePnlAlerts(positions);

  // Fetch initial market context for selected stock
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch(`/api/market-context/${selectedTicker}?mode=${tradingMode}`);
        if (res.ok) {
          const data = await res.json();
          setMarketContext(data);
        }
      } catch (err) {
        console.error('Failed to load initial stock context:', err);
      }
    };
    fetchContext();
  }, [tradingMode]);

  // Periodic In-App Sentinel Keep-Alive ping (every 45s while browser tab is active)
  useEffect(() => {
    const keepAlivePing = () => {
      fetch('/api/heartbeat?source=In-App%20Browser%20Sentinel', { method: 'GET' }).catch(() => {});
    };
    keepAlivePing();
    const interval = setInterval(keepAlivePing, 45000);
    return () => clearInterval(interval);
  }, []);

  // When selectedTicker changes, update market context
  const handleSelectTicker = async (ticker: string) => {
    setSelectedTicker(ticker);
    try {
      const res = await fetch(`/api/market-context/${ticker}?mode=${tradingMode}`);
      if (res.ok) {
        const data = await res.json();
        setMarketContext(data);
      }
    } catch (err) {
      console.error(`Failed to fetch context for ${ticker}:`, err);
    }
  };

  // Switch between Long Trading and Intraday Trading
  const handleTradingModeChange = (newMode: TradingHorizonMode) => {
    setTradingMode(newMode);
    const qMode = newMode === 'SWING' ? 'long' : 'intraday';
    fetchMemoryAndPositions(qMode);
    fetchTransactions(qMode);
    fetchTradeHistory(qMode);
    fetchAccounting(qMode);
    fetch(`/api/market-context/${selectedTicker}?mode=${newMode}&fresh=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMarketContext(data);
      })
      .catch((err) => console.warn('Context mode switch failed:', err));
  };

  // Select stock from Scanner or History and jump directly into Pipeline
  const handleSelectStockForPipeline = (ticker: string) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist((prev) => [ticker, ...prev]);
    }
    setSelectedTicker(ticker);
    setActiveTab('pipeline');
    handleRunSingle(ticker);
  };

  // Run pipeline on single ticker
  const handleRunSingle = async (ticker: string) => {
    setIsRunning(true);
    setSelectedTicker(ticker);
    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      if (res.ok) {
        const result: PipelineResult = await res.json();
        setPipelineResult(result);
        if (result.marketContext) {
          setMarketContext(result.marketContext);
        }
        await fetchMemoryAndPositions();
        fetchTransactions();
      }
    } catch (err) {
      console.error(`Failed to run pipeline for ${ticker}:`, err);
    } finally {
      setIsRunning(false);
    }
  };

  // Dedicated manual order execution
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
        body: JSON.stringify(orderParams),
      });
      const data = await res.json();
      if (data.success && data.position) {
        setOrderToast({
          type: 'success',
          message: `Manual ${data.position.action} order executed: ${data.position.shares} shares of ${data.position.ticker} @ ₹${data.position.fill_price}`,
        });
        setTimeout(() => setOrderToast(null), 6000);

        if (data.openPositions) {
          setPositions(data.openPositions);
        } else {
          await fetchMemoryAndPositions();
        }
        fetchTransactions();

        if (pipelineResult && pipelineResult.ticker === orderParams.ticker) {
          setPipelineResult({
            ...pipelineResult,
            executedPosition: data.position,
            steps: pipelineResult.steps.map((s) =>
              s.step === 'EXECUTION'
                ? {
                    ...s,
                    status: 'SUCCESS',
                    title: 'Paper Execution Engine (Manually Executed)',
                    summary: `[MANUAL ORDER EXECUTED] ${data.position.action} ${data.position.shares} shares of ${data.position.ticker} @ ₹${data.position.fill_price} (Order ID: ${data.position.order_id})`,
                    data: data.position,
                  }
                : s
            ),
          });
        }
      } else {
        setOrderToast({
          type: 'error',
          message: data.error || 'Failed to execute manual order. Please check mathematical risk guards.',
        });
        setTimeout(() => setOrderToast(null), 6000);
      }
    } catch (err: any) {
      console.error('Manual order failed:', err);
      setOrderToast({
        type: 'error',
        message: `Execution failed: ${err.message || err}`,
      });
      setTimeout(() => setOrderToast(null), 6000);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Run pipeline sequentially across all watchlist tickers
  const handleRunAll = async () => {
    setIsRunning(true);
    try {
      for (const ticker of watchlist) {
        setSelectedTicker(ticker);
        const res = await fetch('/api/pipeline/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker }),
        });
        if (res.ok) {
          const result: PipelineResult = await res.json();
          setPipelineResult(result);
          if (result.marketContext) {
            setMarketContext(result.marketContext);
          }
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      await fetchMemoryAndPositions();
      fetchTransactions();
    } catch (err) {
      console.error('Scan all failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Add custom ticker to watchlist
  const handleAddTicker = (ticker: string) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
    }
    handleSelectTicker(ticker);
  };

  // Save config
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

  // Start 7-Day Live Real-Time Campaign (Day 1)
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
          setDaemonStatus((prev) =>
            prev ? { ...prev, campaign: data.campaign, adaptiveModel: data.adaptiveModel } : null
          );
        }
        await Promise.all([fetchMemoryAndPositions(), fetchTransactions(), fetchAutonomousSummary()]);
      }
    } catch (err) {
      console.error('Failed to start live 7-day campaign:', err);
    }
  };

  // Immediate Real-Time Scan & Trade
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

  // Calculate aggregate live unrealized P&L across active trades
  const totalUnrealizedPnl = positions.reduce((sum, p) => {
    const cur = p.current_price || p.fill_price;
    const pnl =
      p.action === 'BUY'
        ? (cur - p.fill_price) * p.shares
        : (p.fill_price - cur) * p.shares;
    return sum + pnl;
  }, 0);

  const goodOpportunitiesCount = scannedStocks.filter((s) => s.is_good_opportunity).length;

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'dark bg-[#0c0e12] text-stone-100' : 'bg-stone-100/60 text-stone-900'
      } font-sans antialiased selection:bg-amber-100 dark:selection:bg-amber-900/60 selection:text-amber-900 dark:selection:text-amber-200 transition-colors duration-200`}
    >
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        config={config}
        isRunning={isRunning}
        onQuickHeartbeat={() => handleRunSingle(selectedTicker)}
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
        onOpenAnalyst={() => {
          setActiveTab('analyst');
          setAnalystSubTab('matrix');
        }}
        onOpenCatchup={() => {
          setActiveTab('analyst');
          setAnalystSubTab('catchup');
        }}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Global Active & Ended Trades Section */}
        {activeTab !== 'portfolio' && activeTab !== 'transactions' && (
          <ActiveTradesLivePnl
            positions={positions}
            tradeHistory={tradeHistory}
            onClosePosition={(orderId, exitPrice) => handleClosePosition(orderId, exitPrice)}
            onViewPortfolio={() => setActiveTab('portfolio')}
            onViewTransactions={() => setActiveTab('transactions')}
            onOpenAlertSettings={() => setShowAlertSettings(true)}
            alertThresholds={thresholds}
            defaultExpanded={true}
            onSelectStrategy={(id) => setInspectingStrategyId(id)}
          />
        )}

        {/* TAB 1: Live Pipeline & Radar */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <WatchlistRadar
              watchlist={watchlist}
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
              onRunSingle={handleRunSingle}
              onRunAll={handleRunAll}
              onAddTicker={handleAddTicker}
              isRunning={isRunning}
              onOpenScanner={() => setActiveTab('scanner')}
            />

            {marketSentiment && (
              <MarketSentimentDial
                sentiment={marketSentiment}
                compact={true}
                onClickDetails={() => setActiveTab('news_recommendations')}
              />
            )}

            {orderToast && (
              <div
                id="order-execution-toast"
                className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold shadow-xs transition ${
                  orderToast.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border border-rose-300 text-rose-900'
                }`}
              >
                <span>{orderToast.message}</span>
                <button
                  onClick={() => setOrderToast(null)}
                  className="rounded px-2 py-0.5 text-stone-500 hover:text-stone-800"
                >
                  ✕
                </button>
              </div>
            )}

            {marketContext && (
              <SelectedStockHorizonCard
                ticker={selectedTicker}
                marketContext={marketContext}
                hypothesis={pipelineResult?.hypothesis}
                ticket={pipelineResult?.ticket}
                independentDecision={pipelineResult?.independentDecision}
                onRunHeartbeat={() => handleRunSingle(selectedTicker)}
                isRunning={isRunning}
                onPlaceManualOrder={handlePlaceManualOrder}
                isPlacingOrder={isPlacingOrder}
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
              onExecuteNow={() => handleRunSingle(selectedTicker)}
              onPlaceManualOrder={handlePlaceManualOrder}
              isPlacingOrder={isPlacingOrder}
            />
          </div>
        )}

        {/* TAB: Autonomous Algo Research Bot & Sandbox Lab */}
        {activeTab === 'algo_research' && (
          <AlgoResearchBot
            tradingMode={tradingMode}
            onStrategyApproved={(strategy) => {
              setOrderToast({
                type: 'success',
                message: `Strategy '${strategy.name}' successfully deployed to paper forward-testing under safety limits.`,
              });
            }}
            onNavigateToPortfolio={() => setActiveTab('portfolio')}
          />
        )}

        {/* TAB: Hall of Titans: Master Strategies */}
        {activeTab === 'titans' && (
          <TitansView
            onSelectTickerForPipeline={handleSelectStockForPipeline}
          />
        )}

        {/* TAB: Analyst Learning Agent (Goal: To Be The Best Trader in the World) */}
        {activeTab === 'analyst' && (
          <AnalystHub
            tradingMode={tradingMode}
            onTradingModeChange={handleTradingModeChange}
            onNavigateToTab={(t) => setActiveTab(t as TabType)}
            onSelectStrategy={(id) => setInspectingStrategyId(id)}
            initialSubTab={analystSubTab}
          />
        )}

        {/* TAB: My Stocks Zerodha Statement & AI BOT ADVANCE Audit */}
        {activeTab === 'my_stocks' && (
          <MyStocksView
            onExecuteManualTrade={(ticker, action, shares) => {
              handlePlaceManualOrder({
                ticker,
                action,
                shares,
              });
            }}
          />
        )}

        {/* TAB: Decision Reasoning & Trade Loss Prevention */}
        {activeTab === 'decision_reasoning' && (
          <DecisionReasoningView
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onPlaceManualOrder={handlePlaceManualOrder}
            isPlacingOrder={isPlacingOrder}
            tradeHistory={tradeHistory}
            positions={positions}
          />
        )}

        {/* TAB: Best Returns by Risk Tier */}
        {activeTab === 'risk_tiers' && (
          <RiskTiersDashboard
            scannedStocks={scannedStocks}
            isScanning={isScanning}
            onRefreshScan={() => handleRunUniverseScan()}
            onSelectStockForPipeline={handleSelectStockForPipeline}
            onAddCustomTicker={handleAddCustomTicker}
          />
        )}

        {/* TAB: Full Stock Scanner */}
        {activeTab === 'scanner' && (
          <StockScanner
            scannedStocks={scannedStocks}
            isScanning={isScanning}
            onRunScan={handleRunUniverseScan}
            onSelectStockForPipeline={handleSelectStockForPipeline}
            onAddCustomTicker={handleAddCustomTicker}
          />
        )}

        {/* TAB: Universe Volatility Heatmap */}
        {activeTab === 'volatility_heatmap' && (
          <VolatilityHeatmap
            scannedStocks={scannedStocks}
            isScanning={isScanning}
            onRefreshScan={() => handleRunUniverseScan()}
            onSelectStockForPipeline={handleSelectStockForPipeline}
            onAddCustomTicker={handleAddCustomTicker}
          />
        )}

        {/* TAB: News Based Recommendations */}
        {activeTab === 'news_recommendations' && (
          <NewsBasedRecommendations
            systemConfig={config}
            onSelectStockForPipeline={handleSelectStockForPipeline}
            onTradeExecuted={() => {
              fetchMemoryAndPositions();
              fetchTransactions();
            }}
            positions={positions}
            onClosePosition={handleClosePosition}
            onViewPortfolio={() => setActiveTab('portfolio')}
          />
        )}

        {/* TAB: Dedicated Transaction History Audit Ledger */}
        {activeTab === 'transactions' && (
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

        {/* TAB: Paper Portfolio & Episodic Memory */}
        {activeTab === 'portfolio' && (
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
            onOpenCatchup={() => {
              setActiveTab('analyst');
              setAnalystSubTab('catchup');
            }}
          />
        )}

        {/* TAB: Risk Governor Math Lab */}
        {activeTab === 'risk_math' && <RiskSimulator />}

        {/* TAB: Architecture & Python Code */}
        {activeTab === 'architecture' && <ArchitectureViewer />}

        {/* TAB: config.toml Settings */}
        {activeTab === 'settings' && (
          <ConfigView
            config={config}
            onSaveConfig={handleSaveConfig}
            onOpenHeartbeat={() => setShowHeartbeatModal(true)}
            onOpenPdfReport={() => setShowPdfReportModal(true)}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-12 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#11131a] py-6 text-center text-xs text-stone-500 dark:text-stone-400 transition-colors">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-medium text-stone-700 dark:text-stone-200">
            AI BOT ADVANCE &bull; Quantitative Reasoning Engine
          </p>
          <p className="mt-1 text-[11px] text-stone-400 dark:text-stone-500">
            Decoupled SOLID Architecture &bull; 40-Stock Universe Sensory Ingestion &bull; Full Transaction Audit History &bull; SQLite Episodic Memory &bull; Gemini 3-Agent Debate &bull; Deterministic Mathematical Sizing &bull; Paper / Zerodha Kite Gateway &bull; 24/7 Keep-Alive Sentinel
          </p>
        </div>
      </footer>

      {/* 24/7 Heartbeat Sentinel & Free Keep-Alive Modal */}
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
          setActiveTab('portfolio');
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
        onOpenScheduleSettings={() => setActiveTab('settings')}
      />

      {/* Strategy Inspector Modal (Itemized Trades & Real Returns) */}
      <StrategyInspectorModal
        strategyId={inspectingStrategyId}
        onClose={() => setInspectingStrategyId(null)}
        onOpenStressTester={(stratId) => {
          setInspectingStrategyId(null);
          setActiveTab('analyst');
          setAnalystSubTab('stress_test');
        }}
      />
    </div>
  );
}
