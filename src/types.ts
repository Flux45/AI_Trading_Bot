export type BiasType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type ActionType = 'BUY' | 'SELL';
export type ProductType = 'CNC' | 'MIS';

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
  };
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
}

export interface TradeHistoryRecord {
  id: number;
  ticker: string;
  bias: BiasType;
  action: ActionType;
  shares: number;
  entry_price: number;
  exit_price: number;
  pnl_realized: number;
  pnl_pct: number;
  lesson: string;
  timestamp: string;
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



