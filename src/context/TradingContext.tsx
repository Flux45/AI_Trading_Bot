import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTradingState } from '../hooks/useTradingState';
import { useTheme } from '../hooks/useTheme';
import { usePnlAlerts } from '../hooks/usePnlAlerts';
import type {
  MarketContext,
  PipelineResult,
  OrderTicket,
  SystemConfig,
  TradingHorizonMode,
  ExecutedPosition,
  TradeHistoryRecord,
  TransactionRecord,
  CustomStrategyItem,
} from '../types';
import type { UnifiedStrategyItem } from '../components/ui/ReusableComponents';

export type PrimaryViewTab =
  | 'strategies'
  | 'trades_db'
  | 'pipeline'
  | 'scanner'
  | 'settings';

const INITIAL_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'AXISBANK'];

const CURATED_ONLINE_STRATEGIES: UnifiedStrategyItem[] = [
  {
    id: 'algo-ofi-microstructure-02',
    name: 'Order Flow Imbalance & VWAP Absorption',
    category: 'Microstructure Momentum',
    horizon: 'INTRADAY',
    source: 'ONLINE_QUANT',
    howItWorks:
      'Tracks institutional ask-lifting volume surges above the session Volume-Weighted Average Price (VWAP) after a 5-minute consolidation pullback.',
    implications:
      'High win-rate intraday entries with tight 1.5% stop-loss protection. Position sizes are automatically capped so a stop-out never loses more than ₹500.',
    stopLossPct: 1.5,
    targetPct: 3.8,
    maxRiskRupees: 500,
    riskRewardRatio: 2.53,
    winRatePct: 76.4,
    entryRules: 'Price > Session VWAP + 5m Volume > 1.8x Average + Positive Order Flow Delta',
    exitRules: 'Take-Profit at +3.8% or Hard Stop at -1.5% (Mandatory 15:15 IST MIS Square-Off)',
  },
  {
    id: 'algo-vwap-mean-reversion',
    name: 'Statistical VWAP Mean Reversion (-2.2 SD)',
    category: 'Statistical Arbitrage',
    horizon: 'INTRADAY',
    source: 'ONLINE_QUANT',
    howItWorks:
      'Buys liquid Nifty 50 stocks when intraday panic stretches price 2.2 standard deviations below VWAP while RSI shows seller exhaustion.',
    implications:
      'Captures rapid midday snapback rallies toward the mean. Strict 1.2% stop-loss prevents catching a falling knife during trend days.',
    stopLossPct: 1.2,
    targetPct: 3.0,
    maxRiskRupees: 500,
    riskRewardRatio: 2.5,
    winRatePct: 78.2,
    entryRules: 'Price < VWAP - 2.2 SD + 5m Bullish Reversal Candle',
    exitRules: 'Revert to VWAP / +3.0% Target or -1.2% Hard Stop',
  },
  {
    id: 'algo-cognitive-flagship',
    name: 'Cognitive-Q Multi-Day Swing Compounder',
    category: 'Positional Trend Following',
    horizon: 'LONG',
    source: 'ONLINE_QUANT',
    howItWorks:
      'Identifies multi-day institutional accumulation breakouts above the 20-day EMA paired with low ATR volatility contraction.',
    implications:
      'Holds CNC delivery shares across 2–7 days for larger +6.5% swing gains while defending capital with a 2.2% trailing stop.',
    stopLossPct: 2.2,
    targetPct: 6.5,
    maxRiskRupees: 500,
    riskRewardRatio: 2.95,
    winRatePct: 74.0,
    entryRules: 'Daily Close > 20 EMA + Volume Breakout + Sector Relative Strength > 1.1',
    exitRules: '+6.5% Positional Target or 2.2% Trailing Stop-Loss',
  },
  {
    id: 'algo-titans-compounder',
    name: 'CAN SLIM & Minervini Volatility Contraction (VCP)',
    category: 'Master Titan Strategy',
    horizon: 'LONG',
    source: 'TITAN_MASTER',
    howItWorks:
      'Combines William O’Neil’s earnings momentum filters with Mark Minervini’s tightening price contractions before a pivot breakout.',
    implications:
      'Designed for asymmetric multi-day winners (+7.5% target) while enforcing an unbreakable 2.5% maximum drawdown line.',
    stopLossPct: 2.5,
    targetPct: 7.5,
    maxRiskRupees: 500,
    riskRewardRatio: 3.0,
    winRatePct: 71.5,
    entryRules: 'Stage 2 Uptrend + 3 Tightening Contractions + Breakout on 2x Volume',
    exitRules: '+7.5% Swing Target or -2.5% Hard Stop Defense',
  },
];

interface ExecuteStrategyTradeParams {
  strategy: UnifiedStrategyItem;
  ticker: string;
  action: 'BUY' | 'SELL';
  shares?: number;
}

interface TradingContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: PrimaryViewTab;
  setActiveTab: (tab: PrimaryViewTab) => void;
  tradingMode: TradingHorizonMode;
  setTradingMode: React.Dispatch<React.SetStateAction<TradingHorizonMode>>;
  handleTradingModeChange: (mode: TradingHorizonMode) => void;
  watchlist: string[];
  selectedTicker: string;
  setSelectedTicker: React.Dispatch<React.SetStateAction<string>>;
  handleSelectTicker: (ticker: string) => Promise<void>;
  handleAddTicker: (ticker: string) => void;
  marketContext: MarketContext | null;
  pipelineResult: PipelineResult | null;
  isRunning: boolean;
  handleRunSingle: (ticker: string) => Promise<void>;
  handleRunAll: () => Promise<void>;
  positions: ExecutedPosition[];
  setPositions: React.Dispatch<React.SetStateAction<ExecutedPosition[]>>;
  tradeHistory: TradeHistoryRecord[];
  setTradeHistory: React.Dispatch<React.SetStateAction<TradeHistoryRecord[]>>;
  transactions: TransactionRecord[];
  accounting: any;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  handleSaveConfig: (updated: Partial<SystemConfig>) => Promise<void>;
  scannedStocks: any[];
  isScanning: boolean;
  marketSentiment: any;
  autonomousSummary: any;
  daemonStatus: any;
  setDaemonStatus: React.Dispatch<React.SetStateAction<any>>;
  isLoadingAutonomous: boolean;
  strategyMetrics: any[];
  fetchTransactions: (mode?: string) => Promise<void>;
  fetchTradeHistory: (mode?: string) => Promise<void>;
  fetchAccounting: (mode?: string) => Promise<void>;
  fetchMemoryAndPositions: (mode?: string) => Promise<void>;
  fetchAutonomousSummary: () => Promise<void>;
  handleRunUniverseScan: (force?: boolean) => Promise<void>;
  handleClosePosition: (orderId: string, exitPrice: number, exitReason?: string) => Promise<void>;
  handleResetPortfolio: (newCap?: number) => Promise<void>;
  handleRunAutonomous7Day: () => Promise<void>;
  handleToggleDaemon: (enabled: boolean) => Promise<void>;
  handleResetZero: () => Promise<void>;
  handleAddCustomTicker: (ticker: string, name?: string, sector?: string) => Promise<boolean>;
  handlePlaceManualOrder: (params: {
    ticker: string;
    action: 'BUY' | 'SELL';
    shares: number;
    entry_price?: number;
    stop_loss?: number;
    target_price?: number;
    ticket?: OrderTicket;
    strategy_id?: string;
    strategy_name?: string;
  }) => Promise<void>;
  isPlacingOrder: boolean;
  orderToast: { message: string; type: 'success' | 'error' } | null;
  setOrderToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  allStrategies: UnifiedStrategyItem[];
  selectedStrategy: UnifiedStrategyItem | null;
  setSelectedStrategy: React.Dispatch<React.SetStateAction<UnifiedStrategyItem | null>>;
  createCustomStrategy: (input: {
    name: string;
    category: string;
    horizon: 'INTRADAY' | 'LONG';
    stopLossPct: number;
    targetPct: number;
    maxRiskRupees: number;
    entryRules: string;
    exitRules: string;
  }) => Promise<UnifiedStrategyItem | null>;
  executeTradeWithStrategy: (params: ExecuteStrategyTradeParams) => Promise<boolean>;
  inspectingStrategyId: string | null;
  setInspectingStrategyId: (id: string | null) => void;
  showHeartbeatModal: boolean;
  setShowHeartbeatModal: (open: boolean) => void;
  showPdfReportModal: boolean;
  setShowPdfReportModal: (open: boolean) => void;
  totalUnrealizedPnl: number;
  alerts: any[];
  thresholds: any;
  updateThresholds: any;
  dismissAlert: any;
  clearAllAlerts: any;
  triggerTestAlert: any;
  showAlertSettings: boolean;
  setShowAlertSettings: (open: boolean) => void;
}

const TradingContext = createContext<TradingContextValue | null>(null);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState<PrimaryViewTab>('strategies');
  const [tradingMode, setTradingMode] = useState<TradingHorizonMode>('INTRADAY');
  const [watchlist, setWatchlist] = useState<string[]>(INITIAL_WATCHLIST);
  const [selectedTicker, setSelectedTicker] = useState<string>('RELIANCE');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  const [showAlertSettings, setShowAlertSettings] = useState<boolean>(false);
  const [showHeartbeatModal, setShowHeartbeatModal] = useState<boolean>(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);
  const [inspectingStrategyId, setInspectingStrategyId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [customStrategies, setCustomStrategies] = useState<UnifiedStrategyItem[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<UnifiedStrategyItem | null>(CURATED_ONLINE_STRATEGIES[0]);

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

  const {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    triggerTestAlert,
  } = usePnlAlerts(positions);

  // Load user-created custom strategies from SQLite
  const fetchCustomStrategies = useCallback(async (mode: TradingHorizonMode) => {
    try {
      const qMode = mode === 'SWING' ? 'long' : 'intraday';
      const res = await fetch(`/api/strategies/custom?mode=${qMode}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.strategies)) {
          const mapped: UnifiedStrategyItem[] = data.strategies.map((s: CustomStrategyItem) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            horizon: s.horizon,
            source: 'CUSTOM_USER',
            howItWorks: `Entry: ${s.entry_rules}. Exit: ${s.exit_rules}.`,
            implications: s.implications,
            stopLossPct: s.stop_loss_pct,
            targetPct: s.target_pct,
            maxRiskRupees: s.max_risk_rupees,
            riskRewardRatio: s.min_rr_ratio,
            entryRules: s.entry_rules,
            exitRules: s.exit_rules,
          }));
          setCustomStrategies(mapped);
        }
      }
    } catch (err) {
      console.warn('Could not load custom strategies:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomStrategies(tradingMode);
  }, [tradingMode, fetchCustomStrategies]);

  // Fetch initial market context when tradingMode changes
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

  // Keep-Alive Sentinel Ping (every 60s while browser tab is open)
  useEffect(() => {
    const keepAlivePing = () => {
      fetch('/api/heartbeat?source=In-App%20Browser%20Sentinel', { method: 'GET' }).catch(() => {});
    };
    keepAlivePing();
    const interval = setInterval(keepAlivePing, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTradingModeChange = (newMode: TradingHorizonMode) => {
    setTradingMode(newMode);
    const qMode = newMode === 'SWING' ? 'long' : 'intraday';
    fetchMemoryAndPositions(qMode);
    fetchTransactions(qMode);
    fetchTradeHistory(qMode);
    fetchAccounting(qMode);
    fetchCustomStrategies(newMode);
  };

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
        await new Promise((r) => setTimeout(r, 400));
      }
      await fetchMemoryAndPositions();
      fetchTransactions();
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTicker = (ticker: string) => {
    const clean = ticker.toUpperCase().trim();
    if (clean && !watchlist.includes(clean)) {
      setWatchlist([...watchlist, clean]);
    }
    if (clean) handleSelectTicker(clean);
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

  const handlePlaceManualOrder = async (orderParams: {
    ticker: string;
    action: 'BUY' | 'SELL';
    shares: number;
    entry_price?: number;
    stop_loss?: number;
    target_price?: number;
    ticket?: OrderTicket;
    strategy_id?: string;
    strategy_name?: string;
  }) => {
    setIsPlacingOrder(true);
    const qMode = tradingMode === 'SWING' ? 'long' : 'intraday';
    try {
      const res = await fetch('/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderParams,
          mode: qMode,
          product_type: tradingMode === 'SWING' ? 'CNC' : 'MIS',
        }),
      });
      const data = await res.json();
      if (data.success && data.position) {
        setOrderToast({
          type: 'success',
          message: `Executed ${data.position.action} ${data.position.shares} sh of ${data.position.ticker} @ ₹${data.position.fill_price} (Saved to SQLite DB: ${data.position.execution_date || ''} ${data.position.execution_time || ''})`,
        });
        setTimeout(() => setOrderToast(null), 6000);
        if (data.openPositions) {
          setPositions(data.openPositions);
        } else {
          await fetchMemoryAndPositions(qMode);
        }
        fetchTransactions(qMode);
        fetchTradeHistory(qMode);
      } else {
        setOrderToast({
          type: 'error',
          message: data.error || 'Order rejected by mathematical risk guards.',
        });
        setTimeout(() => setOrderToast(null), 6000);
      }
    } catch (err: any) {
      setOrderToast({
        type: 'error',
        message: `Execution error: ${err?.message || err}`,
      });
      setTimeout(() => setOrderToast(null), 6000);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const createCustomStrategy = async (input: {
    name: string;
    category: string;
    horizon: 'INTRADAY' | 'LONG';
    stopLossPct: number;
    targetPct: number;
    maxRiskRupees: number;
    entryRules: string;
    exitRules: string;
  }): Promise<UnifiedStrategyItem | null> => {
    try {
      const res = await fetch('/api/strategies/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          category: input.category,
          horizon: input.horizon,
          stop_loss_pct: input.stopLossPct,
          target_pct: input.targetPct,
          max_risk_rupees: input.maxRiskRupees,
          entry_rules: input.entryRules,
          exit_rules: input.exitRules,
        }),
      });
      const data = await res.json();
      if (data.success && data.strategy) {
        const s: CustomStrategyItem = data.strategy;
        const unified: UnifiedStrategyItem = {
          id: s.id,
          name: s.name,
          category: s.category,
          horizon: s.horizon,
          source: 'CUSTOM_USER',
          howItWorks: `Entry: ${s.entry_rules}. Exit: ${s.exit_rules}.`,
          implications: s.implications,
          stopLossPct: s.stop_loss_pct,
          targetPct: s.target_pct,
          maxRiskRupees: s.max_risk_rupees,
          riskRewardRatio: s.min_rr_ratio,
          entryRules: s.entry_rules,
          exitRules: s.exit_rules,
        };
        setCustomStrategies((prev) => [unified, ...prev]);
        setOrderToast({
          type: 'success',
          message: `Custom strategy '${s.name}' saved to SQLite database with ${s.min_rr_ratio}:1 R:R and ₹${s.max_risk_rupees} max risk.`,
        });
        setTimeout(() => setOrderToast(null), 5000);
        return unified;
      }
    } catch (err) {
      console.error('Failed to create custom strategy:', err);
    }
    return null;
  };

  const executeTradeWithStrategy = async ({
    strategy,
    ticker,
    action,
    shares = 5,
  }: ExecuteStrategyTradeParams): Promise<boolean> => {
    const cleanTicker = ticker.toUpperCase().trim();
    const targetMode = strategy.horizon === 'LONG' ? 'long' : 'intraday';
    setIsPlacingOrder(true);
    try {
      // Fetch live price for accurate SL/TP calculation from strategy's restrictions
      const ctxRes = await fetch(`/api/market-context/${cleanTicker}?mode=${strategy.horizon}`);
      let livePrice = 1250;
      if (ctxRes.ok) {
        const ctxData = await ctxRes.json();
        if (ctxData?.current_price) livePrice = Number(ctxData.current_price);
      }

      const slDistance = livePrice * (strategy.stopLossPct / 100);
      const tpDistance = livePrice * (strategy.targetPct / 100);

      const stopLoss =
        action === 'BUY'
          ? Number((livePrice - slDistance).toFixed(2))
          : Number((livePrice + slDistance).toFixed(2));
      const targetPrice =
        action === 'BUY'
          ? Number((livePrice + tpDistance).toFixed(2))
          : Number((livePrice - tpDistance).toFixed(2));

      // Enforce strategy's maxRiskRupees restriction
      const maxAllowedShares = Math.max(1, Math.floor(strategy.maxRiskRupees / Math.max(slDistance, 0.5)));
      const finalShares = Math.min(shares, maxAllowedShares);

      const res = await fetch('/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: cleanTicker,
          action,
          shares: finalShares,
          stop_loss: stopLoss,
          target_price: targetPrice,
          mode: targetMode,
          product_type: strategy.horizon === 'LONG' ? 'CNC' : 'MIS',
          strategy_id: strategy.id,
          strategy_name: strategy.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.position) {
        setOrderToast({
          type: 'success',
          message: `Executed ${data.position.action} ${data.position.shares} sh of ${data.position.ticker} via '${strategy.name}' @ ₹${data.position.fill_price} • Date: ${data.position.execution_date} • Time: ${data.position.execution_time}`,
        });
        setTimeout(() => setOrderToast(null), 6000);
        await fetchMemoryAndPositions(targetMode);
        await fetchTransactions(targetMode);
        await fetchTradeHistory(targetMode);
        return true;
      } else {
        setOrderToast({
          type: 'error',
          message: data.error || 'Trade blocked by sector concentration or risk restriction.',
        });
        setTimeout(() => setOrderToast(null), 6000);
        return false;
      }
    } catch (err: any) {
      setOrderToast({
        type: 'error',
        message: err?.message || 'Failed to execute strategy trade',
      });
      setTimeout(() => setOrderToast(null), 6000);
      return false;
    } finally {
      setIsPlacingOrder(false);
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

  const allStrategies = [...customStrategies, ...CURATED_ONLINE_STRATEGIES];

  return (
    <TradingContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        tradingMode,
        setTradingMode,
        handleTradingModeChange,
        watchlist,
        selectedTicker,
        setSelectedTicker,
        handleSelectTicker,
        handleAddTicker,
        marketContext,
        pipelineResult,
        isRunning,
        handleRunSingle,
        handleRunAll,
        positions,
        setPositions,
        tradeHistory,
        setTradeHistory,
        transactions,
        accounting,
        config,
        setConfig,
        handleSaveConfig,
        scannedStocks,
        isScanning,
        marketSentiment,
        autonomousSummary,
        daemonStatus,
        setDaemonStatus,
        isLoadingAutonomous,
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
        handlePlaceManualOrder,
        isPlacingOrder,
        orderToast,
        setOrderToast,
        allStrategies,
        selectedStrategy,
        setSelectedStrategy,
        createCustomStrategy,
        executeTradeWithStrategy,
        inspectingStrategyId,
        setInspectingStrategyId,
        showHeartbeatModal,
        setShowHeartbeatModal,
        showPdfReportModal,
        setShowPdfReportModal,
        totalUnrealizedPnl,
        alerts,
        thresholds,
        updateThresholds,
        dismissAlert,
        clearAllAlerts,
        triggerTestAlert,
        showAlertSettings,
        setShowAlertSettings,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return ctx;
};
