import { useState, useEffect, useCallback } from 'react';
import type {
  SystemConfig,
  ExecutedPosition,
  TradeHistoryRecord,
  TransactionRecord,
  ScannedStock,
  MarketSentimentSummary,
  Autonomous7DaySummary,
  AutonomousDaemonStatus,
  PortfolioAccounting,
  OrderTicket,
  PipelineResult,
  StrategyPerformanceSummary,
  TradingHorizonMode,
} from '../types';

export function useTradingState(initialMode: TradingHorizonMode = 'INTRADAY') {
  const [tradingMode, setTradingMode] = useState<TradingHorizonMode>(initialMode);

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
      maxPositionConcentration: 0.2,
      defaultProductType: initialMode === 'INTRADAY' ? 'MIS' : 'CNC',
    },
  });

  const [positions, setPositions] = useState<ExecutedPosition[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [strategyMetrics, setStrategyMetrics] = useState<StrategyPerformanceSummary[]>([]);
  const [scannedStocks, setScannedStocks] = useState<ScannedStock[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentSummary | null>(null);
  const [autonomousSummary, setAutonomousSummary] = useState<Autonomous7DaySummary | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<AutonomousDaemonStatus | null>(null);
  const [isLoadingAutonomous, setIsLoadingAutonomous] = useState<boolean>(false);
  const [accounting, setAccounting] = useState<PortfolioAccounting | null>(null);

  const modeQuery = tradingMode === 'SWING' ? 'long' : 'intraday';

  // Keep internal tradingMode in sync whenever initialMode changes from caller
  useEffect(() => {
    if (initialMode && initialMode !== tradingMode) {
      setTradingMode(initialMode);
    }
  }, [initialMode, tradingMode]);

  // Fetch transactions from server for current mode
  const fetchTransactions = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    try {
      const res = await fetch(`/api/transactions?mode=${qMode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, [modeQuery]);

  // Dedicated fetch for trade history from canonical route
  const fetchTradeHistory = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    try {
      const res = await fetch(`/api/trade-history?mode=${qMode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tradeHistory) {
          setTradeHistory(data.tradeHistory);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trade history:', err);
    }
  }, [modeQuery]);

  // Dedicated fetch for unified canonical portfolio accounting for current mode
  const fetchAccounting = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    try {
      const res = await fetch(`/api/portfolio/accounting?mode=${qMode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.accounting) {
          setAccounting(data.accounting);
          if (data.accounting.openPositions) {
            setPositions(data.accounting.openPositions);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch accounting:', e);
    }
  }, [modeQuery]);

  // Fetch strategy performance metrics for current mode
  const fetchStrategyMetrics = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    try {
      const res = await fetch(`/api/strategy-performance?mode=${qMode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.strategies) {
          setStrategyMetrics(data.strategies);
        }
      }
    } catch (err) {
      console.error('Failed to fetch strategy metrics:', err);
    }
  }, [modeQuery]);

  // Fetch market sentiment
  const fetchMarketSentiment = useCallback(async () => {
    try {
      const res = await fetch('/api/market-sentiment');
      if (res.ok) {
        const data = await res.json();
        if (data.sentiment) setMarketSentiment(data.sentiment);
      }
    } catch (e) {
      console.error('Failed to load market sentiment:', e);
    }
  }, []);

  // Fetch Autonomous 7-Day Summary
  const fetchAutonomousSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/autonomous/7day-summary');
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setAutonomousSummary(data.summary);
        if (data.status) setDaemonStatus(data.status);
      }
    } catch (e) {
      console.error('Failed to fetch autonomous 7-day summary:', e);
    }
  }, []);

  // Reload memory, positions, and capital for current mode
  const fetchMemoryAndPositions = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    try {
      const memRes = await fetch(`/api/memory?mode=${qMode}`);
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
      await fetchAccounting(qMode);
      await fetchTradeHistory(qMode);
      await fetchStrategyMetrics(qMode);
      await fetchTransactions(qMode);
    } catch (e) {
      console.error('Failed to reload positions:', e);
    }
  }, [modeQuery, fetchAccounting, fetchTradeHistory, fetchStrategyMetrics, fetchTransactions]);

  // Run Universe Scanner
  const handleRunUniverseScan = useCallback(async (options?: { sector?: string; lowRiskOnly?: boolean }) => {
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
  }, []);

  // Close position and reflect into current mode
  const handleClosePosition = useCallback(async (orderId: string, exitPrice: number, exitReason?: string) => {
    const res = await fetch('/api/positions/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        exit_price: exitPrice,
        mode: modeQuery,
        exit_reason: exitReason,
      }),
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
      await fetchMemoryAndPositions();
    }
  }, [modeQuery, fetchMemoryAndPositions]);

  // Reset portfolio for current mode
  const handleResetPortfolio = useCallback(async (modeOverride?: string) => {
    const qMode = modeOverride || modeQuery;
    const res = await fetch('/api/portfolio/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: qMode }),
    });
    if (res.ok) {
      await fetchMemoryAndPositions(qMode);
    }
  }, [modeQuery, fetchMemoryAndPositions]);

  // Reset completely to zero
  const handleResetZero = useCallback(async () => {
    await handleResetPortfolio(modeQuery);
  }, [handleResetPortfolio, modeQuery]);

  // Launch live campaign
  const handleRunAutonomous7Day = useCallback(async (initialTicker?: string) => {
    setIsLoadingAutonomous(true);
    try {
      const res = await fetch('/api/autonomous/start-live-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialTicker: initialTicker || 'AXISBANK' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setAutonomousSummary(data.summary);
        if (data.accounting) setAccounting(data.accounting);
        await fetchMemoryAndPositions();
      }
    } catch (e) {
      console.error('Failed to launch live campaign:', e);
    } finally {
      setIsLoadingAutonomous(false);
    }
  }, [fetchMemoryAndPositions]);

  // Toggle Autonomous Daemon
  const handleToggleDaemon = useCallback(async (enabled?: boolean) => {
    try {
      const res = await fetch('/api/autonomous/daemon-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) setDaemonStatus(data.status);
      }
    } catch (e) {
      console.error('Failed to toggle daemon:', e);
    }
  }, []);

  // Add custom ticker to universe
  const handleAddCustomTicker = useCallback(async (ticker: string) => {
    try {
      const res = await fetch('/api/scanner/add-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase().trim() }),
      });
      if (res.ok) {
        await handleRunUniverseScan();
      }
    } catch (e) {
      console.error('Failed to add custom ticker:', e);
    }
  }, [handleRunUniverseScan]);

  // Initial load when tradingMode changes
  useEffect(() => {
    const qMode = tradingMode === 'SWING' ? 'long' : 'intraday';
    fetchMemoryAndPositions(qMode);
    fetchTransactions(qMode);
    fetchTradeHistory(qMode);
    fetchAccounting(qMode);
    fetchStrategyMetrics(qMode);
    fetchMarketSentiment();
    fetchAutonomousSummary();
    handleRunUniverseScan();
  }, [tradingMode]);

  // Polling intervals for positions and daemon status
  useEffect(() => {
    const daemonInterval = setInterval(async () => {
      try {
        const statusRes = await fetch('/api/autonomous/status');
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.status) setDaemonStatus(data.status);
        }
      } catch {
        // ignore polling error
      }
    }, 15000);

    const positionsInterval = setInterval(async () => {
      try {
        const posRes = await fetch(`/api/positions?mode=${modeQuery}`);
        if (posRes.ok) {
          const posData = await posRes.json();
          if (posData.openPositions) setPositions(posData.openPositions);
          if (posData.accounting) setAccounting(posData.accounting);
        }
        fetchTransactions(modeQuery);
        fetchTradeHistory(modeQuery);
      } catch {
        // ignore polling error
      }
    }, 12000);

    return () => {
      clearInterval(daemonInterval);
      clearInterval(positionsInterval);
    };
  }, [modeQuery, fetchTransactions, fetchTradeHistory]);

  return {
    tradingMode,
    setTradingMode,
    config,
    setConfig,
    positions,
    setPositions,
    tradeHistory,
    setTradeHistory,
    transactions,
    setTransactions,
    strategyMetrics,
    scannedStocks,
    setScannedStocks,
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
    fetchStrategyMetrics,
    fetchMarketSentiment,
    fetchAutonomousSummary,
    handleRunUniverseScan,
    handleClosePosition,
    handleResetPortfolio,
    handleRunAutonomous7Day,
    handleToggleDaemon,
    handleResetZero,
    handleAddCustomTicker,
  };
}
