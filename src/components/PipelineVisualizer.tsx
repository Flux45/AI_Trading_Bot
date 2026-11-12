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
  Target,
  ShoppingBag,
  Sliders,
  Check,
} from 'lucide-react';
import type { PipelineResult, OrderTicket } from '../types';

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
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customShares, setCustomShares] = useState<number>(0);
  const [customStopLoss, setCustomStopLoss] = useState<number>(0);
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(0);

  if (isRunning && !pipelineResult) {
    return (
      <div
        id="pipeline-running-card"
        className="rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/80 p-8 text-center shadow-xs"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
          <Brain className="h-6 w-6 animate-spin" />
        </div>
        <h3 className="mt-4 text-base font-bold text-stone-950 dark:text-white">
          Executing Fast 5-Stage Quantitative Pipeline...
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-stone-700 dark:text-stone-300">
          Ingesting NSE 5m candles &rarr; episodic memory lookup &rarr; 3-Agent Committee Debate &rarr; deterministic risk validation.
        </p>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div
        id="pipeline-empty-card"
        className="rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-10 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-stone-950 dark:text-white">
          Pipeline Ready to Ingest &amp; Reason
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-stone-600 dark:text-stone-300">
          Trigger a real-time quantitative pipeline run to process market data through all 5 architectural stages.
        </p>
        <button
          id="btn-trigger-heartbeat-empty"
          onClick={onExecuteNow}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 text-amber-300" />
          Run Fast Pipeline
        </button>
      </div>
    );
  }

  const { steps, hypothesis, ticket, executedPosition, marketContext, pastLessons, ticker } = pipelineResult;

  return (
    <div id="pipeline-visualizer-container" className="space-y-4">
      {/* Pipeline Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
              5-Stage Pipeline Result
            </span>
            <span className="text-xs text-stone-400">&bull;</span>
            <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 tabular-nums">
              {new Date(pipelineResult.timestamp).toLocaleTimeString()}
            </span>
            {isRunning && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <Activity className="h-3 w-3 animate-spin" /> Updating...
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-stone-950 dark:text-white">{ticker}</h2>
            {hypothesis && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-extrabold ${
                  hypothesis.bias === 'BULLISH'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-600'
                    : hypothesis.bias === 'BEARISH'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-400 dark:border-rose-600'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-200 border border-stone-400'
                }`}
              >
                {hypothesis.bias === 'BULLISH' ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : hypothesis.bias === 'BEARISH' ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : null}
                {hypothesis.bias} ({(hypothesis.confidence * 100).toFixed(0)}%)
              </span>
            )}
            {hypothesis && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-300 font-mono tabular-nums">
                <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />+
                {hypothesis.return_margin_pct ||
                  (
                    (Math.abs(hypothesis.target_price - (marketContext?.current_price || hypothesis.target_price)) /
                      (marketContext?.current_price || 1)) *
                    100
                  ).toFixed(1)}
                % Return Margin
              </span>
            )}
            {hypothesis && (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 text-xs font-extrabold text-amber-950 dark:text-amber-300"
                title={hypothesis.approx_time_label || ''}
              >
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Approx. Time: {hypothesis.approx_time_label || `~${hypothesis.approx_days_to_target || 7}d`}
              </span>
            )}
            {ticket && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-extrabold ${
                  ticket.status === 'APPROVED'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-500'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-500'
                }`}
              >
                {ticket.status === 'APPROVED' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                )}
                Risk Check: {ticket.status}
              </span>
            )}
          </div>
        </div>

        {/* High-Contrast View Mode Switcher */}
        <div className="flex rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-1 text-xs gap-1">
          <button
            id="tab-summary"
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            5-Stage Pipeline
          </button>
          <button
            id="tab-debate"
            type="button"
            onClick={() => setActiveTab('debate')}
            className={`rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              activeTab === 'debate'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            3-Agent Committee Debate
          </button>
          <button
            id="tab-risk-math"
            type="button"
            onClick={() => setActiveTab('risk_math')}
            className={`rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
              activeTab === 'risk_math'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            Mathematical Guards
          </button>
        </div>
      </div>

      {/* AUTONOMOUS DECISION & MANUAL ORDER PLACEMENT ACTION CARD */}
      {ticket && (
        <div
          id="autonomous-decision-action-card"
          className="rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                    Autonomous Decision &amp; Strategy Order Routing
                  </h3>
                  {pipelineResult.independentDecision ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-black ${
                        pipelineResult.independentDecision.verdict === 'STRONG_BUY' ||
                        pipelineResult.independentDecision.verdict === 'BUY'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600'
                          : pipelineResult.independentDecision.verdict === 'SELL'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-400 dark:border-rose-600'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-600'
                      }`}
                    >
                      {pipelineResult.independentDecision.verdictLabel}
                    </span>
                  ) : (
                    <span className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                      Decision: {ticket.status === 'APPROVED' ? ticket.action : 'PASS'}
                    </span>
                  )}
                  {pipelineResult.independentDecision?.opportunityGrade && (
                    <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 border border-indigo-400 dark:border-indigo-600 px-2 py-0.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                      Grade: {pipelineResult.independentDecision.opportunityGrade}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
                  Review the risk-governed parameters below and execute directly into the SQLite ledger.
                </p>
              </div>
            </div>

            {executedPosition ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Order Placed: {executedPosition.shares} shares @ ₹{executedPosition.fill_price} ({executedPosition.order_id})
                </span>
              </div>
            ) : null}
          </div>

          {/* Decision Metrics Strip (High Contrast) */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 rounded-xl bg-stone-100 dark:bg-stone-950 p-3.5 text-xs border border-stone-300 dark:border-stone-800">
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Recommended Action</span>
              <p className="mt-1 font-extrabold text-stone-950 dark:text-white flex items-center gap-1 font-mono tabular-nums">
                {ticket.action === 'BUY' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                )}
                {ticket.action || 'BUY'} {ticket.shares || 1} Shares
              </p>
            </div>
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Target Price</span>
              <p className="mt-1 font-mono font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                ₹{ticket.target_price?.toFixed(2) || '—'}
                {hypothesis?.return_margin_pct ? ` (+${hypothesis.return_margin_pct}%)` : ''}
              </p>
            </div>
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Invalidation Stop</span>
              <p className="mt-1 font-mono font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">
                ₹{ticket.stop_loss?.toFixed(2) || '—'}
              </p>
            </div>
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Est. Capital Required</span>
              <p className="mt-1 font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                ₹
                {ticket.capital_allocated?.toLocaleString('en-IN') ||
                  (ticket.shares && ticket.entry_price
                    ? (ticket.shares * ticket.entry_price).toLocaleString('en-IN')
                    : '—')}
              </p>
            </div>
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Max Rupee Risk</span>
              <p className="mt-1 font-mono font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">
                ₹{ticket.rupee_risk?.toLocaleString('en-IN') || '—'} (&le; 1%)
              </p>
            </div>
            <div>
              <span className="text-stone-600 dark:text-stone-400 font-semibold block">Risk-to-Reward</span>
              <p className="mt-1 font-mono font-extrabold text-indigo-700 dark:text-indigo-400 tabular-nums">
                {ticket.risk_reward_ratio
                  ? `${ticket.risk_reward_ratio}:1`
                  : pipelineResult.independentDecision?.riskRewardRatio
                  ? `${pipelineResult.independentDecision.riskRewardRatio}:1`
                  : '2.1:1'}
              </p>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs">
              {ticket.status === 'APPROVED' ? (
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Deterministic Risk Check: Approved for execution within 1% portfolio risk cap.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Check: {ticket.reason || 'Parameters outside standard mathematical safety envelope'}
                </span>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Inline Quantity Stepper */}
              <div className="flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2 py-1">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 uppercase mr-1">Qty:</span>
                <button
                  type="button"
                  onClick={() => setCustomShares((prev) => Math.max(1, (prev || ticket.shares || 1) - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-200 text-xs font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={customShares > 0 ? customShares : ticket.shares || 1}
                  onChange={(e) => setCustomShares(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-xs font-mono font-bold text-stone-950 dark:text-white border-none bg-transparent focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setCustomShares((prev) => (prev || ticket.shares || 1) + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-200 text-xs font-bold cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                id="btn-toggle-custom-order"
                type="button"
                onClick={() => {
                  setCustomShares(customShares > 0 ? customShares : ticket.shares || 1);
                  setCustomStopLoss(
                    customStopLoss > 0
                      ? customStopLoss
                      : ticket.stop_loss ||
                          (marketContext?.current_price ? Number((marketContext.current_price * 0.98).toFixed(2)) : 0)
                  );
                  setCustomTargetPrice(
                    customTargetPrice > 0
                      ? customTargetPrice
                      : ticket.target_price ||
                          (marketContext?.current_price ? Number((marketContext.current_price * 1.05).toFixed(2)) : 0)
                  );
                  setShowCustomizer(!showCustomizer);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-500" />
                <span>{showCustomizer ? 'Hide Details' : 'Targets & Presets'}</span>
              </button>

              {onPlaceManualOrder && (
                <button
                  id="btn-place-manual-order-main"
                  type="button"
                  onClick={() =>
                    onPlaceManualOrder({
                      ticker,
                      action: ticket.action || 'BUY',
                      shares: customShares > 0 ? customShares : ticket.shares || 1,
                      entry_price: ticket.entry_price || marketContext?.current_price,
                      stop_loss: customStopLoss > 0 ? customStopLoss : ticket.stop_loss,
                      target_price: customTargetPrice > 0 ? customTargetPrice : ticket.target_price,
                      ticket,
                    })
                  }
                  disabled={isPlacingOrder || !!executedPosition}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer ${
                    executedPosition
                      ? 'bg-stone-500 cursor-not-allowed'
                      : ticket.action === 'SELL'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <ShoppingBag className={`h-3.5 w-3.5 ${isPlacingOrder ? 'animate-spin' : ''}`} />
                  <span>
                    {executedPosition
                      ? 'Order Already Placed'
                      : isPlacingOrder
                      ? 'Executing Order...'
                      : `Place ${ticket.action || 'BUY'} Order (${customShares > 0 ? customShares : ticket.shares || 1} Shares)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Customizer Form */}
          {showCustomizer && (
            <div className="mt-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="font-bold text-stone-950 dark:text-white">
                  Customize Order Parameters for {ticker}
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">
                  Fine-tune shares, target price or stop-loss before execution
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customShares}
                    onChange={(e) => setCustomShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-mono font-bold text-stone-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Target Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                    Stop Loss (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={customStopLoss}
                    onChange={(e) => setCustomStopLoss(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: 5-Stage Sequential Pipeline */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isSuccess = step.status === 'SUCCESS';
            const isRejected = step.status === 'REJECTED';
            const isPending = step.status === 'PENDING';

            let Icon = Activity;
            let iconBg = 'bg-blue-600 text-white';

            if (step.step === 'SENSORY') {
              Icon = Activity;
              iconBg = 'bg-blue-600 text-white';
            } else if (step.step === 'MEMORY') {
              Icon = BookOpen;
              iconBg = 'bg-purple-600 text-white';
            } else if (step.step === 'COGNITIVE') {
              Icon = Brain;
              iconBg = 'bg-indigo-600 text-white';
            } else if (step.step === 'RISK') {
              Icon = ShieldCheck;
              iconBg = isRejected ? 'bg-amber-500 text-stone-950' : 'bg-emerald-600 text-white';
            } else if (step.step === 'EXECUTION') {
              Icon = Zap;
              iconBg = isPending ? 'bg-amber-500 text-stone-950' : 'bg-emerald-600 text-white';
            }

            return (
              <div
                key={step.step}
                id={`pipeline-step-${step.step.toLowerCase()}`}
                className={`rounded-xl border-2 p-4 transition shadow-xs ${
                  isRejected
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60'
                    : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-amber-400">
                          STAGE 0{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-stone-950 dark:text-white">{step.title}</h4>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            isSuccess
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700'
                              : isRejected
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-700'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-700'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {step.summary}
                      </p>
                    </div>
                  </div>

                  {step.durationMs !== undefined && step.durationMs >= 0 && (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono font-semibold text-stone-600 dark:text-stone-300 tabular-nums">
                      <Clock className="h-3 w-3 text-amber-500" />
                      {step.durationMs}ms
                    </span>
                  )}
                </div>

                {/* Specific Step Insets */}
                {step.step === 'SENSORY' && marketContext && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">CMP (Close)</span>
                      <p className="font-extrabold text-stone-950 dark:text-white">₹{marketContext.current_price}</p>
                    </div>
                    <div>
                      <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">ATR-14 Volatility</span>
                      <p className="font-extrabold text-amber-700 dark:text-amber-400">₹{marketContext.atr_14}</p>
                    </div>
                    <div>
                      <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">20-Period SMA</span>
                      <p className="font-extrabold text-blue-700 dark:text-blue-400">₹{marketContext.sma_20}</p>
                    </div>
                    <div>
                      <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Session Momentum</span>
                      <p
                        className={`font-extrabold ${
                          marketContext.pct_return_20d >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {marketContext.pct_return_20d > 0 ? '+' : ''}
                        {marketContext.pct_return_20d}%
                      </p>
                    </div>
                  </div>
                )}

                {step.step === 'MEMORY' && pastLessons && pastLessons.length > 0 && (
                  <div className="mt-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/70 p-3 text-xs">
                    <span className="font-bold text-purple-950 dark:text-purple-200">
                      Retrieved Episodic Post-Mortem Lesson:
                    </span>
                    <p className="mt-0.5 italic text-purple-900 dark:text-purple-200">
                      &ldquo;{pastLessons[0].lesson}&rdquo;
                    </p>
                  </div>
                )}

                {step.step === 'COGNITIVE' && hypothesis && (
                  <div className="mt-3 space-y-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-xs font-mono tabular-nums">
                      <div>
                        <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Target Price</span>
                        <p className="font-extrabold text-stone-950 dark:text-white">₹{hypothesis.target_price}</p>
                      </div>
                      <div>
                        <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Return Margin</span>
                        <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                          +{hypothesis.return_margin_pct || '4.2'}%
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Approx. Time</span>
                        <p className="font-sans font-bold text-stone-950 dark:text-white">
                          {hypothesis.approx_time_label || `~${hypothesis.approx_days_to_target || 5} Days`}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Stop-Loss</span>
                        <p className="font-extrabold text-rose-700 dark:text-rose-400">₹{hypothesis.stop_loss}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Bull Rationale:</span>
                        <p className="mt-0.5 text-stone-800 dark:text-stone-200">{hypothesis.bull_rationale}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-700 dark:text-rose-400">Bear Counter-Thesis:</span>
                        <p className="mt-0.5 text-stone-800 dark:text-stone-200">{hypothesis.bear_counter_thesis}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step.step === 'RISK' && ticket && (
                  <div className="mt-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3 text-xs">
                    {ticket.status === 'APPROVED' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                        <div>
                          <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Position Size</span>
                          <p className="font-extrabold text-stone-950 dark:text-white">{ticket.shares} shares</p>
                        </div>
                        <div>
                          <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Capital Allocated</span>
                          <p className="font-extrabold text-stone-950 dark:text-white">
                            ₹{ticket.capital_allocated?.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">Max Rupee Risk (1%)</span>
                          <p className="font-extrabold text-rose-700 dark:text-rose-400">
                            ₹{ticket.rupee_risk?.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <span className="text-stone-600 dark:text-stone-400 font-sans block text-[11px]">ATR Stop Distance</span>
                          <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            {ticket.atr_multiplier}x ATR (Min 1.2x)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>
                          Ruin Guard Active: <strong>{ticket.reason}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Multi-Agent Debate Persona View */}
      {activeTab === 'debate' && hypothesis && (
        <div className="space-y-4 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-950 dark:text-white flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  3-Agent Committee Debate &amp; Synthesis
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-900 dark:text-stone-200">
                  <Scale className="h-3 w-3" />{' '}
                  {hypothesis.engine_mode === 'GEMINI_AI' ? 'Gemini 3.8 Flash Live' : 'Quantitative Committee Engine'}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Opposing personas arguing upside momentum vs downside risk before arriving at calibrated conviction
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 dark:text-stone-400">Synthesized Bias</span>
              <p className="text-sm font-extrabold text-stone-950 dark:text-white">{hypothesis.bias}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bullish Analyst Card */}
            <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                    B
                  </span>
                  <h4 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">Bullish Analyst</h4>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  Momentum &amp; Upside
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-900 dark:text-stone-100">
                {hypothesis.bull_rationale}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white dark:bg-stone-900 p-2 text-xs border border-emerald-200 dark:border-emerald-800">
                <span className="text-stone-600 dark:text-stone-300 font-semibold">Take-Profit Target:</span>
                <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                  ₹{hypothesis.target_price}
                </span>
              </div>
            </div>

            {/* Bearish Analyst Card */}
            <div className="rounded-xl border-2 border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                    S
                  </span>
                  <h4 className="text-xs font-extrabold text-rose-950 dark:text-rose-200">Bearish Analyst</h4>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-rose-800 dark:text-rose-300">
                  Downside &amp; Traps
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-900 dark:text-stone-100">
                {hypothesis.bear_counter_thesis}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white dark:bg-stone-900 p-2 text-xs border border-rose-200 dark:border-rose-800">
                <span className="text-stone-600 dark:text-stone-300 font-semibold">Invalidation Stop:</span>
                <span className="font-mono font-extrabold text-rose-700 dark:text-rose-400">
                  ₹{hypothesis.stop_loss}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Mathematical Guards & Sizing Breakdown */}
      {activeTab === 'risk_math' && ticket && (
        <div className="space-y-4 rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-stone-950 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Deterministic Risk Governor (4 Mathematical Guards)
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Mathematical formulas bound risk to preserve capital against ruin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white">1. Conviction Threshold Gate</span>
                {hypothesis && hypothesis.confidence >= 0.65 && hypothesis.bias !== 'NEUTRAL' ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Pass (&ge;65%)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Fail
                  </span>
                )}
              </div>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                Rule: Reject if bias is NEUTRAL or confidence &lt; 65%.
              </p>
              <div className="mt-2 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                Score: {hypothesis ? (hypothesis.confidence * 100).toFixed(1) : 0}% | Bias: {hypothesis?.bias}
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white">2. ATR Volatility Spacing Check</span>
                {ticket.risk_per_share && marketContext && ticket.risk_per_share >= marketContext.atr_14 * 1.2 ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Pass (&ge;1.2x ATR)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Too Tight
                  </span>
                )}
              </div>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                Rule: Stop distance |CMP - SL| must exceed 1.2x ATR to prevent intraday noise whipsaws.
              </p>
              <div className="mt-2 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                Risk/share: ₹{ticket.risk_per_share || 0} vs 1.2x ATR: ₹
                {((marketContext?.atr_14 || 0) * 1.2).toFixed(2)} ({ticket.atr_multiplier}x ATR)
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white">3. Fractional Sizing (1% Equity Risk)</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  max_rupee_loss / risk_per_share
                </span>
              </div>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                Rule: On stop-out, portfolio loss is strictly capped at 1% of equity.
              </p>
              <div className="mt-2 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                Target Shares = {ticket.shares || 0} shares (Max Risk: ₹{ticket.rupee_risk || 0})
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white">4. Portfolio Concentration Cap (20%)</span>
                <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">&le; 20% Total Equity</span>
              </div>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                Rule: Maximum capital in a single position is capped at 20% of total equity.
              </p>
              <div className="mt-2 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                Allocated: ₹{ticket.capital_allocated?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
