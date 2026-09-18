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
import { ToastNotificationCenter } from './components/ToastNotificationCenter';
import { usePnlAlerts } from './hooks/usePnlAlerts';
import type {
  SystemConfig,
  MarketContext,
  PipelineResult,
  ExecutedPosition,
  TradeHistoryRecord,
  TransactionRecord,
  ScannedStock,
  MarketSentimentSummary,
  OrderTicket,
  Autonomous7DaySummary,
  AutonomousDaemonStatus,
  PortfolioAccounting,
} from './types';

const INITIAL_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [watchlist, setWatchlist] = useState<string[]>(INITIAL_WATCHLIST);
  const [selectedTicker, setSelectedTicker] = useState<string>('RELIANCE');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [positions, setPositions] = useState<ExecutedPosition[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);

  // Transaction Ledger & Universe Scanner State
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [scannedStocks, setScannedStocks] = useState<ScannedStock[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentSummary | null>(null);

  // Autonomous 7-Day Trading Engine State
  const [autonomousSummary, setAutonomousSummary] = useState<Autonomous7DaySummary | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<AutonomousDaemonStatus | null>(null);
  const [isLoadingAutonomous, setIsLoadingAutonomous] = useState<boolean>(false);
  const [accounting, setAccounting] = useState<PortfolioAccounting | null>(null);

  // Live PnL Toast Notification Alert System
  const [showAlertSettings, setShowAlertSettings] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    triggerTestAlert,
  } = usePnlAlerts(positions);

  const [config, setConfig] = useState<SystemConfig>({
    credentials: {
      geminiApiKeySet: false,
    },
    zerodha: {
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      isConnected: false,
    },
    system: {
      paperTradingMode: true,
      initialPaperCapital: 50000.0,
      currentPaperCapital: 50000.0,
      maxRiskPerTradePct: 0.01,
      maxPositionConcentration: 0.20,
      defaultProductType: 'CNC',
    },
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch config
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }

        // Fetch memory & positions
        const memRes = await fetch('/api/memory');
        if (memRes.ok) {
          const memData = await memRes.json();
          if (memData.openPositions) setPositions(memData.openPositions);
          if (memData.tradeHistory) setTradeHistory(memData.tradeHistory);
          if (memData.accounting) setAccounting(memData.accounting);
        }

        // Fetch dedicated canonical accounting
        fetchAccounting();

        // Fetch transaction audit ledger
        fetchTransactions();

        // Fetch market sentiment
        fetchMarketSentiment();

        // Fetch initial market context for initial ticker
        const ctxRes = await fetch(`/api/market-context/${selectedTicker}`);
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          setMarketContext(ctxData);
        }

        // Background initial scan of 40-stock universe
        handleRunUniverseScan();

        // Fetch Autonomous 7-Day Bot Summary
        fetchAutonomousSummary();
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch market sentiment
  const fetchMarketSentiment = async () => {
    try {
      const res = await fetch('/api/market-sentiment');
      if (res.ok) {
        const data = await res.json();
        if (data.sentiment) setMarketSentiment(data.sentiment);
      }
    } catch (e) {
      console.error('Failed to load market sentiment:', e);
    }
  };

  // Fetch transactions from server
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  // Dedicated fetch for unified canonical portfolio accounting
  const fetchAccounting = async () => {
    try {
      const res = await fetch('/api/portfolio/accounting');
      if (res.ok) {
        const data = await res.json();
        if (data.accounting) {
          setAccounting(data.accounting);
          if (data.accounting.positions) {
            setPositions(data.accounting.positions);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch accounting:', e);
    }
  };

  // Reload memory, positions, and capital
  const fetchMemoryAndPositions = async () => {
    try {
      const memRes = await fetch('/api/memory');
      if (memRes.ok) {
        const memData = await memRes.json();
        if (memData.openPositions) setPositions(memData.openPositions);
        if (memData.tradeHistory) setTradeHistory(memData.tradeHistory);
        if (memData.accounting) setAccounting(memData.accounting);
      }
      const cfgRes = await fetch('/api/config');
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setConfig(cfg);
      }
      fetchAccounting();
    } catch (e) {
      console.error('Failed to reload positions:', e);
    }
  };

  // Run Universe Scanner
  const handleRunUniverseScan = async (options?: { sector?: string; lowRiskOnly?: boolean }) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scanner/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setScannedStocks(data.results);
        }
      }
    } catch (err) {
      console.error('Failed to run universe scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // When selectedTicker changes, update market context
  const handleSelectTicker = async (ticker: string) => {
    setSelectedTicker(ticker);
    try {
      const res = await fetch(`/api/market-context/${ticker}`);
      if (res.ok) {
        const data = await res.json();
        setMarketContext(data);
      }
    } catch (err) {
      console.error(`Failed to fetch context for ${ticker}:`, err);
    }
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
        // Refresh positions, memory & transactions
        const memRes = await fetch('/api/memory');
        if (memRes.ok) {
          const memData = await memRes.json();
          if (memData.openPositions) setPositions(memData.openPositions);
          if (memData.tradeHistory) setTradeHistory(memData.tradeHistory);
        }
        fetchTransactions();
      }
    } catch (err) {
      console.error(`Failed to run pipeline for ${ticker}:`, err);
    } finally {
      setIsRunning(false);
    }
  };

  // Dedicated manual order execution — heartbeat scans no longer place orders automatically
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

        // Auto-dismiss order toast after 6 seconds
        setTimeout(() => setOrderToast(null), 6000);

        // Refresh open positions
        if (data.openPositions) {
          setPositions(data.openPositions);
        } else {
          const memRes = await fetch('/api/memory');
          if (memRes.ok) {
            const memData = await memRes.json();
            if (memData.openPositions) setPositions(memData.openPositions);
          }
        }
        fetchTransactions();

        // Update pipelineResult execution step to reflect manual execution fill
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
        // Small delay between scans
        await new Promise((r) => setTimeout(r, 600));
      }

      // Refresh memory & positions & transactions
      const memRes = await fetch('/api/memory');
      if (memRes.ok) {
        const memData = await memRes.json();
        if (memData.openPositions) setPositions(memData.openPositions);
        if (memData.tradeHistory) setTradeHistory(memData.tradeHistory);
      }
      fetchTransactions();
    } catch (err) {
      console.error('Scan all failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Add custom ticker
  const handleAddTicker = (ticker: string) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
    }
    handleSelectTicker(ticker);
  };

  // Add any custom NSE ticker into global universe
  const handleAddCustomTicker = async (ticker: string, sector?: string) => {
    try {
      const res = await fetch('/api/universe/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, sector }),
      });
      if (res.ok) {
        if (!watchlist.includes(ticker)) {
          setWatchlist((prev) => [ticker, ...prev]);
        }
        await handleRunUniverseScan();
      }
    } catch (err) {
      console.error('Failed to add custom ticker to universe:', err);
    }
  };

  // Close position and reflect
  const handleClosePosition = async (orderId: string, exitPrice: number) => {
    const res = await fetch('/api/positions/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, exit_price: exitPrice }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accounting) {
        setAccounting(data.accounting);
      }
      if (data.updatedCapital) {
        setConfig((prev) => ({
          ...prev,
          system: {
            ...prev.system,
            currentPaperCapital: data.updatedCapital,
          },
        }));
      }

      // Refresh positions, memory & transactions ledger
      await fetchMemoryAndPositions();
      fetchTransactions();
    }
  };

  // Reset portfolio
  const handleResetPortfolio = async () => {
    const res = await fetch('/api/portfolio/reset', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.accounting) setAccounting(data.accounting);
      setConfig((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          currentPaperCapital: data.capital,
        },
      }));
      setPositions([]);
      setTradeHistory([]);
      fetchTransactions();
      fetchAutonomousSummary();
    }
  };

  // Fetch Autonomous 7-Day Summary
  const fetchAutonomousSummary = async () => {
    try {
      const res = await fetch('/api/autonomous/7day-summary');
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setAutonomousSummary(data.summary);
        if (data.status) setDaemonStatus(data.status);
        if (data.accounting) setAccounting(data.accounting);
      }
    } catch (e) {
      console.error('Failed to fetch autonomous 7-day summary:', e);
    }
  };

  // Run 7-day autonomous cycle
  const handleRun7DayCycle = async () => {
    setIsLoadingAutonomous(true);
    try {
      const res = await fetch('/api/autonomous/run-7day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: 50000.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setAutonomousSummary(data.summary);
        if (data.openPositions) setPositions(data.openPositions);
        if (data.tradeHistory) setTradeHistory(data.tradeHistory);
        if (data.accounting) setAccounting(data.accounting);
        if (data.systemConfig) setConfig(data.systemConfig);
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to execute 7-day autonomous cycle:', err);
    } finally {
      setIsLoadingAutonomous(false);
    }
  };

  // Start 7-Day Live Real-Time Campaign (Day 1)
  const handleStartLiveCampaign = async () => {
    setIsLoadingAutonomous(true);
    try {
      const res = await fetch('/api/autonomous/live-campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: 50000.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accounting) setAccounting(data.accounting);
        if (data.campaign && daemonStatus) {
          setDaemonStatus((prev) => prev ? { ...prev, campaign: data.campaign, adaptiveModel: data.adaptiveModel } : null);
        }
        await Promise.all([fetchMemoryAndPositions(), fetchTransactions(), fetchAutonomousSummary()]);
      }
    } catch (err) {
      console.error('Failed to start live 7-day campaign:', err);
    } finally {
      setIsLoadingAutonomous(false);
    }
  };

  // Immediate Real-Time Scan & Trade
  const handleTradeNow = async () => {
    setIsLoadingAutonomous(true);
    try {
      const res = await fetch('/api/autonomous/live-campaign/trade-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accounting) setAccounting(data.accounting);
        await Promise.all([fetchMemoryAndPositions(), fetchTransactions(), fetchAutonomousSummary()]);
      }
    } catch (err) {
      console.error('Failed to execute real-time trade:', err);
    } finally {
      setIsLoadingAutonomous(false);
    }
  };

  // Full reset to zero state
  const handleResetToZero = async () => {
    setIsLoadingAutonomous(true);
    try {
      const res = await fetch('/api/portfolio/reset-zero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCapital: 50000.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        setPositions([]);
        setTradeHistory([]);
        setAutonomousSummary(null);
        if (data.accounting) setAccounting(data.accounting);
        setConfig((prev) => ({
          ...prev,
          system: {
            ...prev.system,
            initialPaperCapital: 50000.0,
            currentPaperCapital: 50000.0,
          },
        }));
        fetchTransactions();
        fetchAutonomousSummary();
      }
    } catch (err) {
      console.error('Failed to reset to zero:', err);
    } finally {
      setIsLoadingAutonomous(false);
    }
  };

  // Toggle Autonomous Bot Daemon
  const handleToggleDaemon = async (enabled?: boolean) => {
    try {
      const res = await fetch('/api/autonomous/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) setDaemonStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to toggle autonomous daemon:', err);
    }
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

  // Periodic background refresh of open positions to keep profit or loss live
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMemoryAndPositions();
      fetchAutonomousSummary();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 antialiased selection:bg-amber-100 selection:text-amber-900">
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
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Universal Persistent Active Trades Live Profit/Loss Bar - Always visible across ALL tabs if open positions exist */}
        {positions.length > 0 && (
          <ActiveTradesLivePnl
            positions={positions}
            onClosePosition={handleClosePosition}
            onViewPortfolio={() => setActiveTab('portfolio')}
            onViewTransactions={() => setActiveTab('transactions')}
            onOpenAlertSettings={() => setShowAlertSettings(true)}
            alertThresholds={{ profitPct: thresholds.profitPct, lossPct: thresholds.lossPct }}
          />
        )}

        {/* TAB 1: Live Pipeline & Radar */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Watchlist Radar Bar */}
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

            {/* Quick Market Sentiment Dial Preview Bar */}
            {marketSentiment && (
              <MarketSentimentDial
                sentiment={marketSentiment}
                compact={true}
                onClickDetails={() => setActiveTab('news_recommendations')}
              />
            )}

            {/* Manual Order Execution Feedback Toast */}
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

            {/* Selected Stock Horizon Card with Independent Verdict & Manual Order Buttons */}
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

            {/* Technical Sensory Chart */}
            {marketContext && (
              <CandleChart
                marketContext={marketContext}
                hypothesis={pipelineResult?.hypothesis}
              />
            )}

            {/* Step-by-Step Pipeline Visualizer with Autonomous Decision & Manual Execution */}
            <PipelineVisualizer
              pipelineResult={pipelineResult}
              isRunning={isRunning}
              onExecuteNow={() => handleRunSingle(selectedTicker)}
              onPlaceManualOrder={handlePlaceManualOrder}
              isPlacingOrder={isPlacingOrder}
            />
          </div>
        )}

        {/* User Requested TAB: My Stocks Zerodha Statement & AI BOT ADVANCE Audit */}
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

        {/* User Requested TAB: Decision Reasoning & Trade Loss Prevention */}
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

        {/* TAB: Best Returns by Risk Tier (Low Risk, Medium Risk, High Risk) */}
        {activeTab === 'risk_tiers' && (
          <RiskTiersDashboard
            scannedStocks={scannedStocks}
            isScanning={isScanning}
            onRefreshScan={() => handleRunUniverseScan()}
            onSelectStockForPipeline={handleSelectStockForPipeline}
            onAddCustomTicker={handleAddCustomTicker}
          />
        )}

        {/* TAB 2: Full Stock Scanner (Good Return Margin & Low Risk) */}
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

        {/* User Requested TAB: News Based Recommendations */}
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

        {/* TAB 3: Dedicated Transaction History Audit Ledger */}
        {activeTab === 'transactions' && (
          <TransactionHistory
            transactions={transactions}
            openPositions={positions}
            onRefresh={fetchTransactions}
            onSelectTickerForPipeline={handleSelectStockForPipeline}
            onClosePosition={handleClosePosition}
          />
        )}

        {/* TAB 4: Paper Portfolio & Episodic Memory */}
        {activeTab === 'portfolio' && (
          <PortfolioPanel
            config={config}
            positions={positions}
            tradeHistory={tradeHistory}
            onClosePosition={handleClosePosition}
            onResetPortfolio={handleResetPortfolio}
            onResetToZero={handleResetToZero}
            onRun7DayCycle={handleRun7DayCycle}
            onStartLiveCampaign={handleStartLiveCampaign}
            onTradeNow={handleTradeNow}
            onToggleDaemon={handleToggleDaemon}
            autonomousSummary={autonomousSummary}
            daemonStatus={daemonStatus}
            onOpenAlertSettings={() => setShowAlertSettings(true)}
            isLoadingAutonomous={isLoadingAutonomous}
            accounting={accounting}
          />
        )}

        {/* TAB 5: Risk Governor Math Lab */}
        {activeTab === 'risk_math' && <RiskSimulator />}

        {/* TAB 6: Architecture & Python Code */}
        {activeTab === 'architecture' && <ArchitectureViewer />}

        {/* TAB 7: config.toml Settings */}
        {activeTab === 'settings' && (
          <ConfigView config={config} onSaveConfig={handleSaveConfig} />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-12 border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-medium text-stone-700">
            AI BOT ADVANCE &bull; Quantitative Reasoning Engine
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            Decoupled Architecture: 40-Stock Universe Sensory Ingestion &bull; Full Transaction Audit History &bull; SQLite Episodic Memory &bull; Gemini 3-Agent Debate &bull; Deterministic Mathematical Sizing &bull; Paper / Zerodha Kite Gateway
          </p>
        </div>
      </footer>

      {/* Toast Notification Center for Live PnL Alerts */}
      <ToastNotificationCenter
        alerts={alerts}
        thresholds={thresholds}
        isOpen={showAlertSettings}
        onOpenChange={setShowAlertSettings}
        onDismiss={dismissAlert}
        onClearAll={clearAllAlerts}
        onUpdateThresholds={updateThresholds}
        onSelectPosition={(orderId) => {
          setActiveTab('portfolio');
        }}
        onTriggerTestAlert={triggerTestAlert}
      />
    </div>
  );
}

