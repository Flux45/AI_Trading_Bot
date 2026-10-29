export type BiasType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type ActionType = 'BUY' | 'SELL';
export type ProductType = 'CNC' | 'MIS';
export type TradingHorizonMode = 'SWING' | 'INTRADAY';

export interface SystemConfig {
  credentials: {
    geminiApiKeySet: boolean;
    geminiOperational?: boolean;
    geminiMessage?: string;
  };
  zerodha: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    isConnected: boolean;
  };
  system: {
    paperTradingMode: boolean;
    initialPaperCapital: number;
    currentPaperCapital: number;
    maxRiskPerTradePct: number; // e.g. 0.01 (1%)
    maxPositionConcentration: number; // e.g. 0.20 (20%)
    defaultProductType: ProductType;
    tradingMode?: TradingHorizonMode;
  };
  weeklyReportSchedule?: WeeklyReportScheduleConfig;
}

export interface WeeklyReportScheduleConfig {
  enabled: boolean;
  recipientEmail: string;
  dayOfWeek: 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | 'MONDAY';
  timeOfDay: string; // e.g. "15:30"
  timeZone: string; // e.g. "Asia/Kolkata"
  includeStrategies: boolean;
  includePnlSnapshots: boolean;
  includeOpenPositions: boolean;
  includeClosedTrades: boolean;
  includeLessons: boolean;
  lastSentAt?: string;
  lastStatus?: 'SUCCESS' | 'FAILED' | 'IDLE';
  lastStatusMessage?: string;
  lastPreviewUrl?: string;
  nextScheduledAt?: string;
}

export interface DispatchHistoryRecord {
  id: string;
  timestamp: string;
  recipient: string;
  status: 'SUCCESS' | 'FAILED';
  subject: string;
  pdfSizeBytes: number;
  pdfFilename: string;
  messageId?: string;
  previewUrl?: string;
  isTestRun: boolean;
  summary: {
    totalEquity: number;
    liquidCash: number;
    unrealizedPnl: number;
    realizedPnl: number;
    activePositionsCount: number;
    closedTradesCount: number;
    topStrategyName: string;
    topStrategyReturnPct: number;
  };
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  time?: string;
}

export interface PriceVerification {
  is_verified: boolean;
  yahoo_price: number;
  tradingview_price: number;
  difference_pct: number;
  source: string;
  verified_at: string;
  status: 'EXACT_MATCH' | 'VERIFIED' | 'SYNCHRONIZED';
}

export interface MarketContext {
  ticker: string;
  current_price: number;
  atr_14: number;
  sma_20: number;
  pct_return_20d: number;
  recent_trend: 'BULLISH' | 'BEARISH';
  candles: Candle[];
  currency: string;
  lastUpdated: string;
  target_price?: number;
  stop_loss?: number;
  return_margin_pct?: number;
  approx_days_to_target?: number;
  approx_time_label?: string;
  timeframe?: 'INTRADAY_5M' | 'INTRADAY_15M' | 'INTRADAY_1M' | 'DAILY';
  intraday_open?: number;
  intraday_high?: number;
  intraday_low?: number;
  vwap?: number;
  orb_high?: number;
  orb_low?: number;
  yahoo_live_price?: number;
  tradingview_price?: number;
  price_verification?: PriceVerification;
}

export interface TradeHypothesis {
  ticker: string;
  bias: BiasType;
  confidence: number; // 0.0 - 1.0
  target_price: number;
  stop_loss: number;
  bull_rationale: string;
  bear_counter_thesis: string;
  invalidation_criteria: string;
  evaluator_summary?: string;
  engine_mode?: 'GEMINI_AI' | 'QUANT_ALGORITHMIC';
  return_margin_pct?: number;
  approx_days_to_target?: number;
  approx_time_label?: string;
}

export interface PastLesson {
  bias: BiasType;
  pnl: number;
  lesson: string;
  timestamp?: string;
}

export type DecisionVerdict = 'STRONG_BUY' | 'BUY' | 'HOLD_WAIT' | 'SELL' | 'AVOID';

export interface IndependentDecision {
  verdict: DecisionVerdict;
  verdictLabel: string;
  opportunityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  convictionPct: number;
  riskRewardRatio: number;
  returnMarginPct: number;
  riskMarginPct: number;
  suggestedAction: 'BUY' | 'SELL' | 'PASS';
  isBestCandidate: boolean;
  reasoning: string;
  orderReady: boolean;
}

export interface BestStockOpportunity {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  decision: DecisionVerdict;
  grade: 'A+' | 'A' | 'B+' | 'B';
  conviction: number;
  returnMarginPct: number;
  riskRewardRatio: number;
  targetPrice: number;
  stopLoss: number;
  suggestedShares: number;
  capitalRequired: number;
  riskAmount: number;
  rationale: string;
}

export interface OrderTicket {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  ticker?: string;
  action?: ActionType;
  shares?: number;
  entry_price?: number;
  stop_loss?: number;
  target_price?: number;
  rupee_risk?: number;
  capital_allocated?: number;
  risk_per_share?: number;
  atr_multiplier?: number;
  risk_reward_ratio?: number;
}

export interface ExecutedPosition {
  order_id: string;
  ticker: string;
  action: ActionType;
  shares: number;
  entry_price: number;
  fill_price: number; // with 0.05% slippage applied
  stop_loss: number;
  target_price: number;
  capital_allocated: number;
  rupee_risk: number;
  timestamp: string;
  current_price?: number;
  unrealized_pnl?: number;
  unrealized_pnl_pct?: number;
  status: 'OPEN' | 'CLOSED';
  breached_stop_ticks?: number;
  breached_target_ticks?: number;
  strategy_id?: string;
  strategy_name?: string;
  market_scenario_rationale?: string;
  entry_time?: string;
  trade_mode?: 'INTRADAY' | 'LONG';
  product_type?: 'MIS' | 'CNC';
  holding_duration?: string;
}

export interface TradeHistoryRecord {
  id: number;
  order_id?: string;
  ticker: string;
  company_name?: string;
  bias: BiasType;
  action: ActionType;
  shares: number;
  entry_price: number;
  exit_price: number;
  pnl_realized: number;
  pnl_pct: number;
  lesson: string;
  timestamp: string;
  entry_time?: string;
  exit_time?: string;
  duration?: string;
  duration_ms?: number;
  exit_reason?: string;
  trade_mode?: 'INTRADAY' | 'LONG';
  product_type?: 'MIS' | 'CNC';
  execution_mode?: string;
  strategy_id?: string;
  strategy_name?: string;
  gain_loss_diagnosis?: string;
}

export interface StrategyPerformanceSummary {
  strategy_id: string;
  strategy_name: string;
  trade_mode: 'INTRADAY' | 'LONG';
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  net_pnl_rupees: number;
  avg_pnl_pct: number;
  avg_duration: string;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  verdict: 'HIGH_PERFORMER' | 'MODERATE' | 'UNDERPERFORMING';
  verdict_label: string;
  recommendation: string;
}

export interface PipelineStep {
  step: 'SENSORY' | 'MEMORY' | 'COGNITIVE' | 'RISK' | 'EXECUTION';
  title: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'REJECTED' | 'FAILED';
  summary: string;
  data?: any;
  durationMs?: number;
}

export interface PipelineResult {
  ticker: string;
  timestamp: string;
  steps: PipelineStep[];
  marketContext?: MarketContext;
  pastLessons?: PastLesson[];
  hypothesis?: TradeHypothesis;
  ticket?: OrderTicket;
  executedPosition?: ExecutedPosition;
  independentDecision?: IndependentDecision;
  success: boolean;
  message: string;
}

export interface AlgorithmicPillar {
  name: string;
  score: number; // 0-100
  status: 'OPTIMAL' | 'FAVORABLE' | 'NEUTRAL' | 'CAUTION';
  headline: string;
  details: string;
  metrics: { label: string; value: string }[];
}

export interface BuyDecisionReasoning {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  verdict: 'STRONG_BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD_WAIT';
  convictionScore: number; // e.g. 88%
  automatedBuyReason: string;
  riskRewardRatio: number;
  targetPrice: number;
  stopLoss: number;
  returnMarginPct: number;
  riskMarginPct: number;
  recommendedShares: number;
  capitalRequired: number;
  keyCatalysts: string[];
  pillars: AlgorithmicPillar[];
  invalidationCriteria: string;
  riskGovernorClearance: {
    passed: boolean;
    ruinProbability: number;
    kellySuggestedPct: number;
    maxAllowedLossRupees: number;
  };
}

export interface PreventativeRemedy {
  id: string;
  title: string;
  category: 'ATR_BUFFER' | 'CONFIRMATION_FILTER' | 'POSITION_SIZING' | 'TIME_WINDOW' | 'SECTOR_CORRELATION';
  action: string;
  parameterRule: string;
  preventativeImpact: string;
}

export interface TradeLossAnalysis {
  id: string | number;
  ticker: string;
  action: 'BUY' | 'SELL';
  shares: number;
  entryPrice: number;
  exitPrice: number;
  realizedLossRupees: number;
  lossPct: number;
  exitTrigger: string;
  timestamp: string;
  rootCause: {
    title: string;
    category: 'FALSE_BREAKOUT_TRAP' | 'VOLATILITY_EXPANSION_WHIPSAW' | 'SECTOR_ROTATION_HEADWIND' | 'EARNINGS_GAP_ADVERSE' | 'TIGHT_STOP_PREMATURE_CUT' | 'MARKET_WIDE_LIQUIDATION';
    diagnostic: string;
    contributingSignals: string[];
  };
  preventativeRemedies: PreventativeRemedy[];
  episodicLesson: string;
  guardrailStatus: 'ADOPTED' | 'ACTIVE' | 'CALIBRATING';
}

export type TransactionType = 'ENTRY_BUY' | 'ENTRY_SELL' | 'EXIT_CLOSE' | 'STOP_LOSS' | 'TARGET_EXIT';

export interface TransactionRecord {
  id: string; // e.g. "TXN-001"
  order_id: string; // e.g. "PAPER_1"
  timestamp: string;
  ticker: string;
  company_name?: string;
  sector?: string;
  action: ActionType; // 'BUY' | 'SELL'
  type: TransactionType;
  shares: number;
  price: number; // execution fill price
  total_value: number; // shares * price
  stop_loss?: number;
  target_price?: number;
  rupee_risk?: number;
  realized_pnl?: number;
  realized_pnl_pct?: number;
  current_price?: number;
  current_pnl?: number;
  current_pnl_pct?: number;
  is_active?: boolean;
  execution_mode: 'PAPER' | 'ZERODHA';
  status: 'FILLED' | 'CLOSED' | 'CANCELLED';
  notes?: string;
  strategy_id?: string;
  strategy_name?: string;
  product_type?: 'MIS' | 'CNC';
  trade_mode?: 'INTRADAY' | 'LONG';
}

export interface StockUniverseItem {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'BALANCED' | 'ELEVATED';

export interface ScannedStock {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  atr_14: number;
  atr_pct: number; // Volatility metric: (ATR / Price) * 100
  sma_20: number;
  pct_return_20d: number;
  recent_trend: 'BULLISH' | 'BEARISH';
  bias: BiasType;
  confidence: number;
  target_price: number;
  stop_loss: number;
  return_margin_pct: number; // ((target - price) / price) * 100
  risk_margin_pct: number; // ((price - stop) / price) * 100
  risk_reward_ratio: number; // abs(target - price) / abs(price - stop)
  risk_level: RiskLevel;
  opportunity_score: number; // 0 - 100 composite ranking
  is_good_opportunity: boolean; // Flagged as high return margin + low risk
  approx_days_to_target: number; // e.g. 7 trading days
  approx_time_label: string; // e.g. "~6–9 Trading Days (~1.5 wks)"
  qualifying_reasons: string[];
  ticket_status: 'APPROVED' | 'REJECTED';
  shares?: number;
  rupee_risk?: number;
  capital_allocated?: number;
  rejection_reason?: string;
  rationale?: string;
  scannedAt: string;
}

export type PurchaseOptionType = 'STRONG BUY' | 'ACCUMULATE ON DIPS' | 'BREAKOUT BUY' | 'MOMENTUM BUY';

export interface NewsItem {
  id: string;
  title: string;
  source: string; // e.g. "The Economic Times", "LiveMint", "Moneycontrol", "Business Standard", "CNBC-TV18", "Reuters"
  url: string;
  publishedAt: string;
  summary: string;
  tickersMentioned: string[];
  sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Earnings' | 'Order Win' | 'Brokerage Upgrade' | 'Policy & PLI' | 'M&A / Expansion' | 'Sector Tailwind';
}

export interface NewsBasedRecommendation {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  purchaseOption: PurchaseOptionType;
  convictionScore: number; // 0 - 100
  sentimentScore: number; // 0 - 100
  entryRange: string; // e.g. "₹3,450 – ₹3,490"
  targetPriceShort: number;
  targetPriceMedium: number;
  targetShortUpsidePct: number;
  targetMediumUpsidePct: number;
  stopLoss: number;
  riskPct: number;
  riskRewardRatio: number;
  timeHorizon: string; // e.g. "1–2 Weeks Swing"
  headline: string;
  newsSource: string;
  newsUrl: string;
  publishedTime: string;
  catalystType: 'Earnings Outperformance' | 'Mega Order Win / Capex' | 'Brokerage Upgrade' | 'Government Policy / PLI' | 'Strategic M&A' | 'Capacity Expansion';
  catalystThesis: string;
  whyBuyNow: string;
  risksToWatch: string;
  recommendedShares?: number;
  suggestedCapital?: number;
  scannedAt: string;
}

export interface SentimentTrendPoint {
  date: string; // e.g. "Aug 19", "2026-08-19"
  shortDate: string; // e.g. "19 Aug"
  score: number; // 0 - 100
  label: 'Extreme Fear' | 'Fear / Bearish' | 'Neutral' | 'Greed / Bullish' | 'Extreme Greed / High Conviction';
  bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  keyCatalyst: string;
  sourceEvent?: string;
  articlesCount?: number;
}

export interface SentimentTrendSummary {
  averageScore: number;
  highestScore: number;
  highestDate: string;
  lowestScore: number;
  lowestDate: string;
  trendDirection: 'RISING' | 'STABLE' | 'DECLINING';
  netChange30d: number;
}

export interface MarketSentimentSummary {
  overallScore: number; // 0 - 100
  label: 'Extreme Fear' | 'Fear / Bearish' | 'Neutral' | 'Greed / Bullish' | 'Extreme Greed / High Conviction';
  bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  bullishCount: number;
  neutralCount: number;
  bearishCount: number;
  totalArticles: number;
  averageRecommendationScore: number;
  topCatalystSector: string;
  institutionalMood: string;
  lastUpdated: string;
  trend30d?: SentimentTrendPoint[];
  trendSummary?: SentimentTrendSummary;
}

export type ToastType = 'profit_threshold' | 'loss_threshold' | 'target_hit' | 'stop_hit' | 'info';

export interface PnlToastAlert {
  id: string;
  orderId: string;
  ticker: string;
  companyName?: string;
  action: 'BUY' | 'SELL';
  type: ToastType;
  title: string;
  message: string;
  pnl: number;
  pnlPct: number;
  currentPrice: number;
  thresholdReached: string;
  timestamp: string;
  createdAt: number;
  duration?: number; // ms until auto-dismiss
}

export interface PnlAlertThresholds {
  profitPct: number; // e.g. 1.5 (%)
  lossPct: number; // e.g. -1.0 (%)
  profitRupees: number; // e.g. 200 (INR)
  lossRupees: number; // e.g. -150 (INR)
  alertOnTargetHit: boolean;
  alertOnStopHit: boolean;
  enabled: boolean;
  soundEnabled: boolean;
}

export interface UserHolding {
  symbol: string;
  isin: string;
  sector: string;
  quantity: number;
  availableQuantity: number;
  discrepantQuantity: number;
  averagePrice: number;
  previousClosingPrice: number;
  currentValue: number;
  investedValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  // AI BOT ADVANCE Analysis fields
  aiVerdict: 'ACCUMULATE' | 'HOLD_TRAILING_STOP' | 'BOOK_PROFIT' | 'EXIT_CUT_LOSS' | 'TRIM_REDUCE' | 'MONITOR';
  aiScore: number; // 0 - 100
  aiRationale: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  suggestedQtyChange: number; // e.g. -13 to sell all, +10 to add
  targetPrice: number;
  stopLoss: number;
  riskReward: string;
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  keyFlags: string[];
}

export interface RebalanceRecommendation {
  id: string;
  symbol: string;
  actionType: 'EXIT_CUT_LOSS' | 'TRIM_CONCENTRATION' | 'BOOK_PARTIAL_PROFIT' | 'ACCUMULATE_WINNER' | 'HOLD_COMPOUNDER';
  currentShares: number;
  targetShares: number;
  sharesDelta: number;
  approxCapitalImpact: number; // positive = capital freed, negative = capital deployed
  priority: number;
  title: string;
  reasoning: string;
  catalyst: string;
  riskAvoidance: string;
  status: 'PENDING' | 'EXECUTED' | 'DISMISSED';
}

export interface MyStocksPortfolioSummary {
  statementDate: string;
  broker: string;
  investedValue: number;
  presentValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number;
  holdingsCount: number;
  profitableCount: number;
  lossCount: number;
  portfolioHealthScore: number; // 0-100 (e.g. 62/100)
  targetHealthScore: number; // e.g. 89/100
  overallDiagnosis: string;
  capitalToBeHarvested: number;
  capitalToBeReinvested: number;
  projectedAlphaImprovement: string;
  currentBeta: number;
  projectedBeta: number;
  topBleeders: { symbol: string; loss: number; lossPct: number; recommendation: string }[];
  topWinners: { symbol: string; profit: number; profitPct: number; recommendation: string }[];
  recommendations: RebalanceRecommendation[];
  sectorDistribution: { sector: string; value: number; pct: number }[];
}

export interface AutonomousTradeDay {
  dayNumber: number;
  dateLabel: string;
  marketRegime: string;
  analysisSummary: string;
  tradesTaken: {
    symbol: string;
    company: string;
    action: 'BUY' | 'SELL';
    type: 'ENTRY' | 'TARGET_EXIT' | 'TRAILING_STOP_EXIT' | 'STOP_LOSS';
    shares: number;
    price: number;
    value: number;
    rationale: string;
    riskReward: string;
    realizedPnl?: number;
    realizedPnlPct?: number;
  }[];
  endOfDayCapital: number;
  endOfDayEquity: number;
  unrealizedPnl: number;
  netDayPnl: number;
  cumulativeReturnPct: number;
}

export interface Autonomous7DaySummary {
  initialCapital: number;
  endingCapital: number;
  endingEquity: number;
  totalReturnRupees: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  daysExecuted: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  activePositionsCount: number;
  dailyBreakdown: AutonomousTradeDay[];
  episodicLessonsLearned: string[];
}

export interface LearnedAdaptation {
  id: string;
  timestamp: string;
  tradeId: string;
  ticker: string;
  outcome: 'WIN' | 'LOSS';
  realizedPnl: number;
  realizedPnlPct: number;
  insight: string;
  parameterAdjusted: string;
  impactSummary: string;
}

export interface AdaptiveTradingModel {
  version: string;
  totalExperiences: number;
  winRate: number;
  profitFactor: number;
  strategyWeights: {
    momentumBreakout: number; // 0-100
    trendFollowing20EMA: number;
    meanReversionPullback: number;
    lowBetaCompounder: number;
  };
  sectorConvictionMultipliers: Record<string, number>;
  calibratedParameters: {
    atrStopMultiplier: number; // e.g. 1.5 - 1.9x
    atrTargetMultiplier: number; // e.g. 2.4 - 3.2x
    minRiskReward: number; // e.g. 2.5:1
    maxRiskPerTradeRupees: number; // e.g. ₹500
    maxOpenPositions: number; // e.g. 4
    maxPositionsPerSector?: number; // e.g. 1 (strict sector diversification)
    kellyFractionMultiplier: number;
  };
  recentAdaptations: LearnedAdaptation[];
  learningProgressSummary: string;
}

export interface AutonomousLiveCampaign {
  campaignId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate: string;
  currentDay: number; // 1 to 7
  totalDays: number; // 7
  isLiveRealtime: boolean;
  unlimitedTradesAllowed: boolean;
  initialCapital: number;
  totalTradesExecuted: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRate: number;
  netRealizedPnl: number;
  totalEquity: number;
  activePositionsCount: number;
  lastExecutionTimestamp?: string;
  nextScheduledScanSeconds: number;
}

export interface AutonomousDaemonStatus {
  isRunning: boolean;
  mode: 'AUTONOMOUS_7_DAY' | 'STANDBY';
  riskProfile: 'SAFEST_ASYMMETRIC';
  initialCapital: number;
  currentCapital: number;
  totalReturnRupees: number;
  totalReturnPct: number;
  tradesCount: number;
  lastPulseTime: string;
  nextPulseSeconds: number;
  lastActionSummary: string;
  campaign?: AutonomousLiveCampaign;
  adaptiveModel?: AdaptiveTradingModel;
}

export interface PortfolioAccounting {
  initialCapital: number;
  liquidCash: number;
  investedCapital: number;
  currentHoldingsValue: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalEquity: number;
  netTotalReturn: number;
  netTotalReturnPct: number;
  activePositionsCount: number;
}

export interface HeartbeatRecord {
  id?: number;
  timestamp: string;
  source: string;
  ip?: string;
  user_agent?: string;
  duration_ms?: number;
  status_code?: number;
  active_positions_count?: number;
  memory_mb?: number;
  notes?: string;
}

export interface HeartbeatTelemetry {
  success: boolean;
  status: string;
  uptime_seconds: number;
  boot_time: string;
  active_positions_count: number;
  autonomous_daemon: {
    isRunning: boolean;
    cycleCount: number;
    lastTickAt?: string;
  };
  stats: {
    totalPings: number;
    lastPing: HeartbeatRecord | null;
    pingsLast24Hours: number;
    cronJobOrgPings: number;
    avgDurationMs: number;
  };
  recent_pings: HeartbeatRecord[];
  cronjob_api_key_configured: boolean;
  suggested_endpoints: {
    production: string;
    development: string;
    current_request: string;
  };
  server_time: {
    utc: string;
    ist: string;
  };
}

// ==========================================
// ALGO RESEARCH BOT & SANDBOX LAB TYPES
// ==========================================

export type AlgoStrategyCategory =
  | 'MOMENTUM_BREAKOUT'
  | 'MEAN_REVERSION_PAIRS'
  | 'VOLATILITY_EXPANSION'
  | 'ORDER_FLOW_MICROSTRUCTURE'
  | 'AI_ML_REGIME'
  | 'INTRADAY_QUANT'
  | 'INTRADAY_MOMENTUM'
  | 'INTRADAY_HFT';

export interface DiscoveredAlgoStrategy {
  id: string;
  name: string;
  category: AlgoStrategyCategory;
  categoryLabel: string;
  author_or_source: string;
  source_url: string;
  discovered_at: string;
  description: string;
  mathematical_formula: string;
  logic_summary: {
    entry_rule: string;
    exit_rule: string;
    stop_loss_rule: string;
    position_sizing: string;
  };
  code_snippet: string;
  default_parameters: Record<string, number | string>;
  target_universe: string;
  credibility_rating: 'A+' | 'A' | 'B+' | 'B' | 'C';
  overfitting_risk_score: number; // 0-100 (lower is better, e.g. 12 = low risk)
  market_regime_suitability: {
    bull: 'EXCELLENT' | 'MODERATE' | 'POOR';
    bear: 'EXCELLENT' | 'MODERATE' | 'POOR';
    sideways_choppy: 'EXCELLENT' | 'MODERATE' | 'POOR';
  };
  audited_metrics: {
    annualized_return_pct: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown_pct: number;
    calmar_ratio: number;
    win_rate_pct: number;
    profit_factor: number;
    total_simulated_trades: number;
    avg_trade_duration_days: number;
  };
  is_approved_for_paper: boolean;
  deployment_config?: {
    approved_at: string;
    max_capital_allocation: number;
    hard_stop_loss_pct: number;
    auto_paper_execution: boolean;
    status: 'ACTIVE_PAPER' | 'QUEUED' | 'PAUSED';
  };
}

export interface BacktestSimulationRequest {
  strategy_id: string;
  time_horizon: '30D' | '90D' | '180D' | '1Y';
  initial_capital: number;
  slippage_pct?: number; // default 0.05
  stt_and_fees?: boolean; // default true
  selected_tickers?: string[];
}

export interface BacktestTradeLog {
  id: string;
  date: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number;
  shares: number;
  pnl: number;
  pnl_pct: number;
  reason: string;
}

export interface BacktestEquityPoint {
  day: number;
  date: string;
  strategy_equity: number;
  baseline_equity: number;
  benchmark_nifty_equity: number;
  drawdown_pct: number;
}

export interface BacktestSimulationResult {
  run_id: string;
  strategy_id: string;
  strategy_name: string;
  timestamp: string;
  time_horizon: string;
  initial_capital: number;
  final_equity: number;
  net_pnl: number;
  total_return_pct: number;
  baseline_comparison: {
    baseline_name: string;
    baseline_return_pct: number;
    baseline_sharpe: number;
    baseline_max_drawdown_pct: number;
    alpha_generated_pct: number;
  };
  performance: {
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    max_drawdown_pct: number;
    win_rate_pct: number;
    profit_factor: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    avg_win_rupees: number;
    avg_loss_rupees: number;
    largest_win_rupees: number;
    largest_loss_rupees: number;
    total_brokerage_and_taxes_inr: number;
  };
  regime_breakdown: {
    bull_days_return_pct: number;
    bear_days_return_pct: number;
    choppy_days_return_pct: number;
  };
  equity_curve: BacktestEquityPoint[];
  trade_log: BacktestTradeLog[];
}

export interface AlgoDiscoverySweepStatus {
  is_searching: boolean;
  last_sweep_time: string;
  total_strategies_discovered: number;
  sources_crawled: string[];
  categories_covered: string[];
}

export interface StrategyActiveHolding {
  ticker: string;
  company_name: string;
  shares: number;
  entry_fill_price: number;
  current_price: number;
  stop_loss: number;
  target_price: number;
  capital_allocated: number;
  rupee_risk: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  execution_timestamp: string;
  market_scenario_rationale: string;
  risk_reward_ratio: number;
}

export interface StrategyLedger {
  strategy_id: string;
  strategy_name: string;
  category: AlgoStrategyCategory;
  categoryLabel: string;
  initial_capital: number; // ₹25,000 isolated paper capital
  liquid_cash: number;
  invested_capital: number;
  total_equity: number;
  realized_pnl: number;
  unrealized_pnl: number;
  net_return_rupees: number;
  net_return_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  trade_count: number;
  winning_trades: number;
  losing_trades: number;
  is_active_24_7: boolean;
  status: 'ACTIVE_PAPER' | 'PAUSED' | 'BENCHMARK_FLAGSHIP';
  last_evaluated_at: string;
  last_action_summary: string;
  active_holdings: StrategyActiveHolding[];
  closed_trades: TradeHistoryRecord[];
  equity_curve?: { timestamp: string; equity: number; cash: number }[];
}

export interface StrategyLeaderboardEntry {
  rank: number;
  strategy_id: string;
  strategy_name: string;
  category: AlgoStrategyCategory;
  categoryLabel: string;
  status: 'ACTIVE_PAPER' | 'PAUSED' | 'BENCHMARK_FLAGSHIP';
  is_flagship?: boolean;
  is_ensemble?: boolean;
  allocated_capital: number;
  total_equity: number;
  net_return_rupees: number;
  net_return_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  trade_count: number;
  active_positions_count: number;
  last_evaluated_at: string;
}

export interface TitanBibliographyItem {
  title: string;
  role: 'Author' | 'Co-Author' | 'Annual Letters' | 'Articles & Essays' | 'Whitepaper & Speeches';
  year: string;
  significance: string;
  url?: string;
}

export interface TitanWritingItem {
  title: string;
  publication_or_source: string;
  date_or_edition: string;
  summary_takeaway: string;
  url?: string;
}

export interface TitanLiveSignal {
  ticker: string;
  company_name: string;
  current_price: number;
  signal: 'STRONG_BUY' | 'ACCUMULATE' | 'WATCH_PIVOT';
  conviction_score: number;
  primary_metric: string;
  intrinsic_or_pivot_level: number;
  stop_loss: number;
  target_price: number;
  catalyst_or_rationale: string;
}

export interface TitanMaster {
  id: string;
  name: string;
  title: string;
  firm_or_era: string;
  avatar_initials: string;
  accent_color: string;
  cagr_or_track_record: string;
  core_philosophy: string;
  key_quote: string;
  bibliography: TitanBibliographyItem[];
  articles_and_letters: TitanWritingItem[];
  mathematical_strategy: {
    formula_or_model: string;
    screening_criteria: string[];
    entry_trigger: string;
    stop_loss_discipline: string;
    profit_target_rule: string;
    position_sizing_rule: string;
  };
  target_universe: string;
  live_signals: TitanLiveSignal[];
  sub_ledger: StrategyLedger;
}
