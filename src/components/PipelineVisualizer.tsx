import React, { useState } from 'react';
import {
  Activity,
  Brain,
  ShieldCheck,
  Zap,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ShoppingBag,
  Sliders,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { PipelineResult, TradeHypothesis, OrderTicket, ExecutedPosition } from '../types';
import { calculateTimeHorizon } from '../utils/quantMetrics';

interface PipelineVisualizerProps {
  pipelineResult: PipelineResult | null;
  isRunning: boolean;
  onExecuteNow: () => void;
  onPlaceManualOrder?: (params: {
    ticker: string;
    action: 'BUY' | 'SELL';
    shares: number;
    entry_price?: number;
    stop_loss?: number;
    target_price?: number;
    ticket?: OrderTicket;
  }) => Promise<void>;
  isPlacingOrder?: boolean;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  pipelineResult,
  isRunning,
  onExecuteNow,
  onPlaceManualOrder,
  isPlacingOrder = false,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'debate' | 'risk_math'>('summary');
  const [showFullPrompts, setShowFullPrompts] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customShares, setCustomShares] = useState<number>(0);
  const [customStopLoss, setCustomStopLoss] = useState<number>(0);
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(0);

  if (isRunning) {
    return (
      <div id="pipeline-running-card" className="rounded-xl border border-blue-200 bg-blue-50/50 p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md animate-pulse">
          <Brain className="h-7 w-7 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-stone-900">Executing Heartbeat Pipeline</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
          Running market ingestion &rarr; episodic post-mortem retrieval &rarr; Gemini 3-agent committee debate &rarr; deterministic risk validation...
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            Ingesting NSE Candles
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            Debating Bull vs. Bear
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            Enforcing Ruin-Prevention
          </div>
        </div>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div id="pipeline-empty-card" className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-600">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-stone-800">Pipeline Ready to Ingest & Reason</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-stone-500">
          Trigger a real-time quantitative heartbeat run to process market data through the 4 decoupled architectural layers.
        </p>
        <button
          id="btn-trigger-heartbeat-empty"
          onClick={onExecuteNow}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 shadow-xs"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          Run Heartbeat Pipeline
        </button>
      </div>
    );
  }

  const { steps, hypothesis, ticket, executedPosition, marketContext, pastLessons, ticker } = pipelineResult;

  return (
    <div id="pipeline-visualizer-container" className="space-y-4">
      {/* Pipeline Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Heartbeat Run</span>
            <span className="text-xs text-stone-400">&bull;</span>
            <span className="text-xs font-mono text-stone-500">{new Date(pipelineResult.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900">{ticker}</h2>
            {hypothesis && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                  hypothesis.bias === 'BULLISH'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : hypothesis.bias === 'BEARISH'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {hypothesis.bias === 'BULLISH' ? <TrendingUp className="h-3 w-3" /> : hypothesis.bias === 'BEARISH' ? <TrendingDown className="h-3 w-3" /> : null}
                {hypothesis.bias} ({(hypothesis.confidence * 100).toFixed(0)}%)
              </span>
            )}
            {hypothesis && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                <Target className="h-3 w-3 text-emerald-600" />
                +{hypothesis.return_margin_pct || ((Math.abs(hypothesis.target_price - (marketContext?.current_price || hypothesis.target_price)) / (marketContext?.current_price || 1)) * 100).toFixed(1)}% Return Margin
              </span>
            )}
            {hypothesis && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800" title={hypothesis.approx_time_label || ''}>
                <Clock className="h-3 w-3 text-amber-600" />
                Approx. Time: {hypothesis.approx_time_label || `~${hypothesis.approx_days_to_target || 7}d`}
              </span>
            )}
            {ticket && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                  ticket.status === 'APPROVED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {ticket.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3 text-blue-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />}
                Risk Check: {ticket.status}
              </span>
            )}
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs">
          <button
            id="tab-summary"
            onClick={() => setActiveTab('summary')}
            className={`rounded-md px-3 py-1 font-medium transition ${activeTab === 'summary' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            4-Layer Pipeline
          </button>
          <button
            id="tab-debate"
            onClick={() => setActiveTab('debate')}
            className={`rounded-md px-3 py-1 font-medium transition ${activeTab === 'debate' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            AI Multi-Agent Debate
          </button>
          <button
            id="tab-risk-math"
            onClick={() => setActiveTab('risk_math')}
            className={`rounded-md px-3 py-1 font-medium transition ${activeTab === 'risk_math' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Mathematical Guards
          </button>
        </div>
      </div>

      {/* AUTONOMOUS DECISION & MANUAL ORDER PLACEMENT ACTION CARD */}
      {ticket && (
        <div id="autonomous-decision-action-card" className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Autonomous Decision &amp; Manual Order Routing</h3>
                  {pipelineResult.independentDecision ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-black ${
                        pipelineResult.independentDecision.verdict === 'STRONG_BUY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : pipelineResult.independentDecision.verdict === 'BUY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pipelineResult.independentDecision.verdict === 'SELL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {pipelineResult.independentDecision.verdictLabel}
                    </span>
                  ) : (
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
                      Decision: {ticket.status === 'APPROVED' ? ticket.action : 'PASS'}
                    </span>
                  )}
                  {pipelineResult.independentDecision?.opportunityGrade && (
                    <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700">
                      Grade: {pipelineResult.independentDecision.opportunityGrade}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  Scan completed without automatic order placement. The system has independently evaluated the setup — review parameters and execute manually below.
                </p>
              </div>
            </div>

            {executedPosition ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Order Placed: {executedPosition.shares} shares @ ₹{executedPosition.fill_price} ({executedPosition.order_id})</span>
              </div>
            ) : null}
          </div>

          {/* Decision Metrics Strip */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 rounded-lg bg-stone-50 p-3 text-xs border border-stone-100">
            <div>
              <span className="text-stone-400 font-medium">Recommended Action</span>
              <p className="mt-0.5 font-bold text-stone-900 flex items-center gap-1">
                {ticket.action === 'BUY' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
                {ticket.action || 'BUY'} {ticket.shares || 1} Shares
              </p>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Target Price</span>
              <p className="mt-0.5 font-mono font-bold text-emerald-700">
                ₹{ticket.target_price?.toFixed(2) || '—'}
                {hypothesis?.return_margin_pct ? ` (+${hypothesis.return_margin_pct}%)` : ''}
              </p>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Invalidation Stop</span>
              <p className="mt-0.5 font-mono font-bold text-rose-700">
                ₹{ticket.stop_loss?.toFixed(2) || '—'}
              </p>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Est. Capital Required</span>
              <p className="mt-0.5 font-mono font-bold text-stone-900">
                ₹{ticket.capital_allocated?.toLocaleString('en-IN') || (ticket.shares && ticket.entry_price ? (ticket.shares * ticket.entry_price).toLocaleString('en-IN') : '—')}
              </p>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Max Rupee Risk</span>
              <p className="mt-0.5 font-mono font-bold text-rose-600">
                ₹{ticket.rupee_risk?.toLocaleString('en-IN') || '—'} (≤ 1%)
              </p>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Risk-to-Reward</span>
              <p className="mt-0.5 font-mono font-bold text-indigo-700">
                {ticket.risk_reward_ratio ? `${ticket.risk_reward_ratio}:1` : (pipelineResult.independentDecision?.riskRewardRatio ? `${pipelineResult.independentDecision.riskRewardRatio}:1` : '2.4:1')}
              </p>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-stone-600">
              {ticket.status === 'APPROVED' ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Deterministic Risk Check: Approved for manual entry with 1% portfolio risk cap.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Check: {ticket.reason || 'Parameters outside standard mathematical safety envelope'}
                </span>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Inline Quantity Stepper */}
              <div className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-500 uppercase mr-1">Qty:</span>
                <button
                  type="button"
                  onClick={() => setCustomShares((prev) => Math.max(1, (prev || ticket.shares || 1) - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-200 text-xs font-bold"
                  title="Decrease quantity by 1"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={customShares > 0 ? customShares : (ticket.shares || 1)}
                  onChange={(e) => setCustomShares(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-xs font-mono font-bold text-stone-900 border-none bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomShares((prev) => (prev || ticket.shares || 1) + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-200 text-xs font-bold"
                  title="Increase quantity by 1"
                >
                  +
                </button>
              </div>

              <button
                id="btn-toggle-custom-order"
                onClick={() => {
                  setCustomShares(customShares > 0 ? customShares : (ticket.shares || 1));
                  setCustomStopLoss(customStopLoss > 0 ? customStopLoss : (ticket.stop_loss || (marketContext?.current_price ? Number((marketContext.current_price * 0.98).toFixed(2)) : 0)));
                  setCustomTargetPrice(customTargetPrice > 0 ? customTargetPrice : (ticket.target_price || (marketContext?.current_price ? Number((marketContext.current_price * 1.05).toFixed(2)) : 0)));
                  setShowCustomizer(!showCustomizer);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-2xs"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-500" />
                <span>{showCustomizer ? 'Hide Details' : 'Targets & Presets'}</span>
              </button>

              {onPlaceManualOrder && (
                <button
                  id="btn-place-manual-order-main"
                  onClick={() => onPlaceManualOrder({
                    ticker,
                    action: ticket.action || 'BUY',
                    shares: customShares > 0 ? customShares : (ticket.shares || 1),
                    entry_price: ticket.entry_price || marketContext?.current_price,
                    stop_loss: customStopLoss > 0 ? customStopLoss : ticket.stop_loss,
                    target_price: customTargetPrice > 0 ? customTargetPrice : ticket.target_price,
                    ticket,
                  })}
                  disabled={isPlacingOrder || !!executedPosition}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
                    executedPosition
                      ? 'bg-stone-400 cursor-not-allowed'
                      : ticket.action === 'SELL'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <ShoppingBag className={`h-3.5 w-3.5 ${isPlacingOrder ? 'animate-spin' : ''}`} />
                  <span>
                    {executedPosition
                      ? 'Order Already Placed'
                      : isPlacingOrder
                      ? 'Executing Manual Order...'
                      : `Place Manual ${ticket.action || 'BUY'} Order (${customShares > 0 ? customShares : (ticket.shares || 1)} Shares)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Customizer Form */}
          {showCustomizer && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-800">Customize Order Parameters for {ticker}</span>
                <span className="text-[11px] text-stone-500">Fine-tune shares, target price or stop-loss before execution</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Number of Shares</label>
                  <input
                    type="number"
                    min={1}
                    value={customShares}
                    onChange={(e) => setCustomShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 focus:border-stone-500 focus:outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-stone-500">
                    Est. Value: ₹{((customShares || 1) * (ticket.entry_price || marketContext?.current_price || 1)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-emerald-600 font-medium">
                    +{ticket.entry_price ? (((customTargetPrice - ticket.entry_price) / ticket.entry_price) * 100).toFixed(1) : 0}% Target Upside
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customStopLoss}
                    onChange={(e) => setCustomStopLoss(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 focus:border-rose-500 focus:outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-rose-600 font-medium">
                    Risk: ₹{((Math.abs((ticket.entry_price || marketContext?.current_price || 0) - customStopLoss)) * customShares).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomizer(false)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                {onPlaceManualOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      onPlaceManualOrder({
                        ticker,
                        action: ticket.action || 'BUY',
                        shares: customShares,
                        entry_price: ticket.entry_price || marketContext?.current_price,
                        stop_loss: customStopLoss,
                        target_price: customTargetPrice,
                      });
                      setShowCustomizer(false);
                    }}
                    disabled={isPlacingOrder}
                    className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-stone-800 shadow-xs transition"
                  >
                    Confirm &amp; Place Custom Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: 4-Layer Sequential Pipeline */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isSuccess = step.status === 'SUCCESS';
            const isRejected = step.status === 'REJECTED';
            const isPending = step.status === 'PENDING';

            let Icon = Activity;
            let iconBg = 'bg-stone-100 text-stone-700';

            if (step.step === 'SENSORY') {
              Icon = Activity;
              iconBg = 'bg-blue-100 text-blue-700';
            } else if (step.step === 'MEMORY') {
              Icon = BookOpen;
              iconBg = 'bg-purple-100 text-purple-700';
            } else if (step.step === 'COGNITIVE') {
              Icon = Brain;
              iconBg = 'bg-indigo-100 text-indigo-700';
            } else if (step.step === 'RISK') {
              Icon = ShieldCheck;
              iconBg = isRejected ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
            } else if (step.step === 'EXECUTION') {
              Icon = Zap;
              iconBg = isPending ? 'bg-stone-100 text-stone-400' : 'bg-emerald-100 text-emerald-700';
            }

            return (
              <div
                key={step.step}
                id={`pipeline-step-${step.step.toLowerCase()}`}
                className={`rounded-xl border p-3.5 transition shadow-xs ${
                  isRejected
                    ? 'border-amber-200 bg-amber-50/40'
                    : isPending
                    ? 'border-stone-200 bg-stone-50/60 opacity-60'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-stone-400">0{idx + 1}</span>
                        <h4 className="text-sm font-bold text-stone-900">{step.title}</h4>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600 leading-relaxed">{step.summary}</p>
                    </div>
                  </div>

                  {step.durationMs !== undefined && step.durationMs > 0 && (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-stone-400">
                      <Clock className="h-3 w-3" />
                      {step.durationMs}ms
                    </span>
                  )}
                </div>

                {/* Specific Step Insets */}
                {step.step === 'SENSORY' && marketContext && (
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-stone-50 p-2 text-xs">
                    <div>
                      <span className="text-stone-400">CMP (Close)</span>
                      <p className="font-bold text-stone-900">₹{marketContext.current_price}</p>
                    </div>
                    <div>
                      <span className="text-stone-400">ATR-14 Volatility</span>
                      <p className="font-bold text-amber-700">₹{marketContext.atr_14}</p>
                    </div>
                    <div>
                      <span className="text-stone-400">20d SMA</span>
                      <p className="font-bold text-blue-700">₹{marketContext.sma_20}</p>
                    </div>
                    <div>
                      <span className="text-stone-400">20d Momentum</span>
                      <p className={`font-bold ${marketContext.pct_return_20d >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {marketContext.pct_return_20d > 0 ? '+' : ''}{marketContext.pct_return_20d}%
                      </p>
                    </div>
                  </div>
                )}

                {step.step === 'MEMORY' && pastLessons && pastLessons.length > 0 && (
                  <div className="mt-2.5 rounded-lg border border-purple-100 bg-purple-50/50 p-2.5 text-xs">
                    <span className="font-semibold text-purple-900">Retrieved Post-Mortem Lesson:</span>
                    <p className="mt-0.5 italic text-purple-800">"{pastLessons[0].lesson}"</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-purple-600">
                      <span>Past Bias: {pastLessons[0].bias}</span>
                      <span>&bull;</span>
                      <span>PnL: ₹{pastLessons[0].pnl}</span>
                    </div>
                  </div>
                )}

                {step.step === 'COGNITIVE' && hypothesis && (
                  <div className="mt-2.5 space-y-1.5 rounded-lg bg-stone-50 p-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-600">Synthesized Hypothesis</span>
                        {hypothesis.engine_mode === 'GEMINI_AI' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                            <Sparkles className="h-2.5 w-2.5" /> Gemini 3.8 Flash
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                            <Scale className="h-2.5 w-2.5" /> Quant Committee Engine
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-stone-500">Conviction: {(hypothesis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md border border-stone-200/80 bg-white p-2 text-[11px]">
                      <div>
                        <span className="text-stone-400">Target Price</span>
                        <p className="font-mono font-bold text-stone-900">₹{hypothesis.target_price}</p>
                      </div>
                      <div>
                        <span className="text-stone-400">Return Margin</span>
                        <p className="font-mono font-bold text-emerald-700">+{hypothesis.return_margin_pct || '4.8'}%</p>
                      </div>
                      <div>
                        <span className="text-stone-400 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 text-amber-500" /> Approx. Time
                        </span>
                        <p className="font-semibold text-stone-900" title={hypothesis.approx_time_label || ''}>
                          {hypothesis.approx_time_label || `~${hypothesis.approx_days_to_target || 7} Days`}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-400">Invalidation Stop</span>
                        <p className="font-mono font-bold text-rose-600">₹{hypothesis.stop_loss}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="font-semibold text-emerald-700">Bull Rationale:</span>
                        <p className="text-stone-600">{hypothesis.bull_rationale}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-rose-700">Bear Counter-Thesis:</span>
                        <p className="text-stone-600">{hypothesis.bear_counter_thesis}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step.step === 'RISK' && ticket && (
                  <div className="mt-2.5 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs">
                    {ticket.status === 'APPROVED' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-stone-400">Position Size</span>
                          <p className="font-bold text-stone-900">{ticket.shares} shares</p>
                        </div>
                        <div>
                          <span className="text-stone-400">Capital Allocated</span>
                          <p className="font-bold text-stone-900">₹{ticket.capital_allocated?.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="text-stone-400">Max Rupee Risk (1%)</span>
                          <p className="font-bold text-rose-700">₹{ticket.rupee_risk?.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="text-stone-400">ATR Stop Distance</span>
                          <p className="font-bold text-emerald-700">{ticket.atr_multiplier}x ATR (Min 1.2x)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>Ruin Guard Active: <strong>{ticket.reason}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {step.step === 'EXECUTION' && (
                  executedPosition ? (
                    <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-900">{executedPosition.order_id}</span>
                          <span className="rounded bg-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900">
                            {executedPosition.action} {executedPosition.shares} @ ₹{executedPosition.fill_price}
                          </span>
                          <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">FILLED</span>
                        </div>
                        <span className="text-[11px] text-emerald-700">Executed via Paper Engine (0.05% realistic slippage applied)</span>
                      </div>
                    </div>
                  ) : ticket?.status === 'APPROVED' ? (
                    <div className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 font-bold text-[11px]">
                              STANDBY &bull; AWAITING MANUAL ORDER
                            </span>
                            <span className="font-semibold text-stone-800">
                              {ticket.action} {ticket.shares} shares @ ₹{ticket.entry_price}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-stone-600">
                            Heartbeat scan formulated independent thesis. No automatic order was executed.
                          </p>
                        </div>
                        {onPlaceManualOrder && (
                          <button
                            id="btn-step5-place-manual-order"
                            onClick={() => onPlaceManualOrder({
                              ticker,
                              action: ticket.action || 'BUY',
                              shares: ticket.shares || 1,
                              entry_price: ticket.entry_price,
                              stop_loss: ticket.stop_loss,
                              target_price: ticket.target_price,
                              ticket,
                            })}
                            disabled={isPlacingOrder}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isPlacingOrder ? 'Routing Order...' : `Place Manual ${ticket.action} Order`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-500">
                      Order execution bypassed — risk governor rejected parameters.
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Multi-Agent Debate Persona View */}
      {activeTab === 'debate' && hypothesis && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  Cognitive Committee Debate & Synthesis
                </h3>
                {hypothesis.engine_mode === 'GEMINI_AI' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    <Sparkles className="h-2.5 w-2.5" /> Gemini 3.8 Flash Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                    <Scale className="h-2.5 w-2.5" /> Quantitative Algorithmic Model
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Pitted personas arguing upside momentum vs downside risk before arriving at calibrated conviction
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400">Synthesized Bias</span>
              <p className="text-sm font-extrabold text-stone-900">{hypothesis.bias}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bullish Analyst Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">B</span>
                  <h4 className="text-xs font-bold text-emerald-900">Bullish Analyst</h4>
                </div>
                <span className="text-[10px] uppercase font-mono text-emerald-700">Momentum & Upside</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-950">
                {hypothesis.bull_rationale}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/70 p-2 text-[11px]">
                <span className="text-stone-500">Take-Profit Target:</span>
                <span className="font-mono font-bold text-emerald-700">₹{hypothesis.target_price}</span>
              </div>
            </div>

            {/* Bearish Analyst Card */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">S</span>
                  <h4 className="text-xs font-bold text-rose-900">Bearish Analyst</h4>
                </div>
                <span className="text-[10px] uppercase font-mono text-rose-700">Downside & Traps</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-rose-950">
                {hypothesis.bear_counter_thesis}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/70 p-2 text-[11px]">
                <span className="text-stone-500">Invalidation Stop:</span>
                <span className="font-mono font-bold text-rose-700">₹{hypothesis.stop_loss}</span>
              </div>
            </div>
          </div>

          {/* Impartial Risk Evaluator Card */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-700" />
                <h4 className="text-xs font-bold text-indigo-900">Impartial Risk Evaluator & Synthesis</h4>
              </div>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                Conviction: {(hypothesis.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-stone-700">Invalidation Criteria:</span>
                <p className="mt-0.5 text-stone-600">{hypothesis.invalidation_criteria}</p>
              </div>
              <div>
                <span className="font-semibold text-stone-700">ATR Stop Guard Rule:</span>
                <p className="mt-0.5 text-stone-600">
                  Stop loss distance ₹{Math.abs((marketContext?.current_price || 0) - hypothesis.stop_loss).toFixed(2)} must be &ge; 1.5x ATR (₹{((marketContext?.atr_14 || 0) * 1.5).toFixed(2)}).
                </p>
              </div>
            </div>

            {/* Conviction Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>Neutral Zone (&lt;50%)</span>
                <span>Conviction Gate (65%)</span>
                <span>High Conviction (&gt;80%)</span>
              </div>
              <div className="relative mt-1 h-2.5 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    hypothesis.confidence >= 0.65 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${hypothesis.confidence * 100}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-stone-800" title="65% Threshold" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Mathematical Guards & Sizing Breakdown */}
      {activeTab === 'risk_math' && ticket && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Deterministic Risk Governor (Paperclip Math Checks)
            </h3>
            <p className="text-xs text-stone-500">
              The LLM never sizes positions. Mathematical formulas bound risk to preserve capital against ruin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Guard 1 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">1. Conviction Threshold Gate</span>
                {hypothesis && hypothesis.confidence >= 0.65 && hypothesis.bias !== 'NEUTRAL' ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Pass (&ge;0.65)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-rose-700">
                    <XCircle className="h-3.5 w-3.5" /> Fail
                  </span>
                )}
              </div>
              <p className="mt-1 text-stone-500">
                Rule: Reject if bias is NEUTRAL or confidence &lt; 0.65.
              </p>
              <div className="mt-2 rounded bg-white p-1.5 font-mono text-[11px] text-stone-700">
                Score: {hypothesis ? (hypothesis.confidence * 100).toFixed(1) : 0}% | Bias: {hypothesis?.bias}
              </div>
            </div>

            {/* Guard 2 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">2. ATR Volatility Spacing Check</span>
                {ticket.risk_per_share && marketContext && ticket.risk_per_share >= marketContext.atr_14 * 1.2 ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Pass (&ge;1.2x ATR)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-rose-700">
                    <XCircle className="h-3.5 w-3.5" /> Too Tight
                  </span>
                )}
              </div>
              <p className="mt-1 text-stone-500">
                Rule: Stop distance |CMP - SL| must exceed 1.2x ATR to prevent market noise whipsaws.
              </p>
              <div className="mt-2 rounded bg-white p-1.5 font-mono text-[11px] text-stone-700">
                Risk/share: ₹{ticket.risk_per_share || 0} vs 1.2x ATR: ₹{((marketContext?.atr_14 || 0) * 1.2).toFixed(2)} ({ticket.atr_multiplier}x ATR)
              </div>
            </div>

            {/* Guard 3 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">3. Fractional Sizing (1% Equity Risk)</span>
                <span className="font-mono text-emerald-700 font-bold">max_rupee_loss / risk_per_share</span>
              </div>
              <p className="mt-1 text-stone-500">
                Rule: On stop-out, portfolio loss strictly equals 1% (₹1,000 on ₹1,00,000 equity).
              </p>
              <div className="mt-2 rounded bg-white p-1.5 font-mono text-[11px] text-stone-700">
                Target Shares = ₹1,000 / ₹{ticket.risk_per_share || 1} = {ticket.shares || 0} shares
              </div>
            </div>

            {/* Guard 4 */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">4. Portfolio Concentration Cap (20%)</span>
                <span className="font-mono text-stone-600 font-bold">&le; 20% Total Equity</span>
              </div>
              <p className="mt-1 text-stone-500">
                Rule: Max capital in single position capped at ₹20,000 (0.20 * ₹1,00,000).
              </p>
              <div className="mt-2 rounded bg-white p-1.5 font-mono text-[11px] text-stone-700">
                Allocated: ₹{ticket.capital_allocated?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-xs text-blue-900">
            <span className="font-bold">Final Order Ticket Status: </span>
            <span className={ticket.status === 'APPROVED' ? 'font-extrabold text-blue-700' : 'font-extrabold text-amber-700'}>
              {ticket.status} {ticket.reason ? `(${ticket.reason})` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
