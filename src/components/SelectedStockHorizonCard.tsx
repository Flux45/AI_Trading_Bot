import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Zap,
  Calendar,
  Sparkles,
  BarChart3,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Sliders,
  BrainCircuit,
} from 'lucide-react';
import type { MarketContext, TradeHypothesis, ScannedStock, OrderTicket, IndependentDecision } from '../types';
import { calculateTimeHorizon } from '../utils/quantMetrics';

interface SelectedStockHorizonCardProps {
  ticker: string;
  marketContext: MarketContext | null;
  hypothesis?: TradeHypothesis | null;
  scannedStock?: ScannedStock | null;
  ticket?: OrderTicket | null;
  independentDecision?: IndependentDecision | null;
  onRunHeartbeat: () => void;
  isRunning?: boolean;
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
  onOpenLossReasoning?: (ticker: string) => void;
}

export const SelectedStockHorizonCard: React.FC<SelectedStockHorizonCardProps> = ({
  ticker,
  marketContext,
  hypothesis,
  scannedStock,
  ticket,
  independentDecision,
  onRunHeartbeat,
  isRunning,
  onPlaceManualOrder,
  isPlacingOrder = false,
  onOpenLossReasoning,
}) => {
  if (!marketContext) return null;

  const currentPrice = marketContext.current_price;
  const targetPrice =
    hypothesis?.target_price ||
    scannedStock?.target_price ||
    marketContext.target_price;
  const stopLoss =
    hypothesis?.stop_loss ||
    scannedStock?.stop_loss ||
    marketContext.stop_loss;
  const atr = marketContext.atr_14;
  const momentum20d = marketContext.pct_return_20d;

  const horizon = calculateTimeHorizon(
    currentPrice,
    targetPrice,
    stopLoss,
    atr,
    momentum20d
  );

  const bias = hypothesis?.bias || scannedStock?.bias || (momentum20d >= 0 ? 'BULLISH' : 'BEARISH');
  const isBullish = bias === 'BULLISH';
  const confidence = hypothesis?.confidence || scannedStock?.confidence || 0.72;
  const returnMarginPct =
    hypothesis?.return_margin_pct ??
    scannedStock?.return_margin_pct ??
    horizon.returnMarginPct;
  const approxDays =
    hypothesis?.approx_days_to_target ??
    scannedStock?.approx_days_to_target ??
    horizon.approxDays;
  const approxTimeLabel =
    hypothesis?.approx_time_label ??
    scannedStock?.approx_time_label ??
    horizon.approxTimeLabel;

  const targetDiffRupees = Math.abs((targetPrice || currentPrice) - currentPrice);

  // User-selected quantity and order parameters
  const defaultQuantity = ticket?.shares || Math.max(1, Math.floor(15000 / currentPrice));
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>(
    (hypothesis?.bias === 'BEARISH' || ticket?.action === 'SELL') ? 'SELL' : 'BUY'
  );
  const [customStopLoss, setCustomStopLoss] = useState<number>(
    stopLoss || Number((currentPrice * (isBullish ? 0.98 : 1.02)).toFixed(2))
  );
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(
    targetPrice || Number((currentPrice * (isBullish ? 1.05 : 0.95)).toFixed(2))
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  useEffect(() => {
    const newQty = ticket?.shares || Math.max(1, Math.floor(15000 / currentPrice));
    setQuantity(newQty);
    setOrderAction((hypothesis?.bias === 'BEARISH' || ticket?.action === 'SELL') ? 'SELL' : 'BUY');
    if (stopLoss) setCustomStopLoss(stopLoss);
    if (targetPrice) setCustomTargetPrice(targetPrice);
  }, [ticker, ticket?.shares, currentPrice, stopLoss, targetPrice, hypothesis?.bias, ticket?.action]);

  const setQuantityByBudget = (budget: number) => {
    const calculated = Math.max(1, Math.floor(budget / currentPrice));
    setQuantity(calculated);
  };

  return (
    <div
      id={`selected-stock-horizon-${ticker.toLowerCase()}`}
      className="overflow-hidden rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm"
    >
      {/* Top Banner with Ticker Identity & Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-xs">
            {ticker.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-950 dark:text-white">{ticker}.NS</h2>
              {scannedStock?.name && (
                <span className="hidden sm:inline text-xs text-stone-600 dark:text-stone-300 font-medium">
                  {scannedStock.name}
                </span>
              )}
              {scannedStock?.sector && (
                <span className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-800 dark:text-stone-200">
                  {scannedStock.sector}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
              <span>
                Latest:{' '}
                <strong className="text-stone-950 dark:text-white font-mono tabular-nums">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </strong>
              </span>
              <span>&bull;</span>
              <span
                className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
                  momentum20d >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {momentum20d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {momentum20d >= 0 ? '+' : ''}
                {momentum20d}% 20d momentum
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenLossReasoning && (
            <button
              type="button"
              onClick={() => onOpenLossReasoning(ticker)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400 dark:border-amber-500/70 bg-amber-50 dark:bg-amber-950/80 px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 transition cursor-pointer"
            >
              <BrainCircuit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Why Lost / Algo Reasoning</span>
            </button>
          )}

          <button
            id="btn-horizon-trigger-heartbeat"
            onClick={onRunHeartbeat}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Zap className={`h-3.5 w-3.5 text-amber-300 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Analyzing...' : 'Run Fast Pipeline'}</span>
          </button>

          {onPlaceManualOrder && (
            <button
              id="btn-horizon-place-manual-order"
              onClick={() =>
                onPlaceManualOrder({
                  ticker,
                  action: orderAction,
                  shares: quantity,
                  entry_price: currentPrice,
                  stop_loss: customStopLoss,
                  target_price: customTargetPrice,
                  ticket: ticket || undefined,
                })
              }
              disabled={isPlacingOrder}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-50 cursor-pointer ${
                orderAction === 'SELL'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <ShoppingBag className={`h-3.5 w-3.5 ${isPlacingOrder ? 'animate-spin' : ''}`} />
              <span>{isPlacingOrder ? 'Routing...' : `Execute ${orderAction} (${quantity} Qty)`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Post-Scan Autonomous Recommendation Ribbon */}
      {(hypothesis || ticket || independentDecision) && (
        <div
          id="horizon-autonomous-decision-ribbon"
          className="border-b border-amber-300 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/70 px-5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center flex-wrap gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-bold text-stone-950 dark:text-white">
              Autonomous Decision: {independentDecision?.verdictLabel || hypothesis?.bias || 'EVALUATED'}
            </span>
            <span className="text-stone-400 dark:text-stone-500">&bull;</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">
              Target:{' '}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                ₹{targetPrice?.toFixed(2)}
              </strong>{' '}
              (+{returnMarginPct}%)
            </span>
            <span className="text-stone-400 dark:text-stone-500">&bull;</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">
              Stop:{' '}
              <strong className="font-mono text-rose-700 dark:text-rose-400 tabular-nums">
                ₹{stopLoss?.toFixed(2)}
              </strong>
            </span>
            {ticket?.shares ? (
              <>
                <span className="text-stone-400 dark:text-stone-500">&bull;</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  Risk-Sized:{' '}
                  <strong className="font-mono text-stone-950 dark:text-white tabular-nums">
                    {ticket.shares} shares
                  </strong>{' '}
                  (₹{ticket.capital_allocated?.toLocaleString('en-IN')})
                </span>
              </>
            ) : null}
          </div>

          {onPlaceManualOrder && (
            <button
              id="btn-horizon-ribbon-quick-buy"
              onClick={() =>
                onPlaceManualOrder({
                  ticker,
                  action: orderAction,
                  shares: quantity,
                  entry_price: currentPrice,
                  stop_loss: customStopLoss,
                  target_price: customTargetPrice,
                  ticket: ticket || undefined,
                })
              }
              disabled={isPlacingOrder}
              className="flex items-center gap-1 rounded-lg bg-stone-900 dark:bg-amber-500 px-3 py-1 text-xs font-bold text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-3 w-3 text-amber-400 dark:text-stone-950" />
              <span>Execute {quantity} Shares</span>
            </button>
          )}
        </div>
      )}

      {/* Prominent Manual Order Placement & Stock Quantity Selection Console */}
      {onPlaceManualOrder && (
        <div
          id="manual-order-quantity-console"
          className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/90 p-4 sm:px-6 sm:py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 dark:bg-amber-500 text-amber-400 dark:text-stone-950">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-950 dark:text-white">
                  Manual Order Placement &amp; Quantity Selection
                </h3>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  Choose the exact number of shares or allocate by budget for {ticker}.NS
                </p>
              </div>
            </div>

            {/* Action Toggle BUY / SELL */}
            <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setOrderAction('BUY')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                BUY (Long)
              </button>
              <button
                type="button"
                onClick={() => setOrderAction('SELL')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  orderAction === 'SELL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                SELL (Short)
              </button>
            </div>
          </div>

          {/* Quantity Controls & Presets */}
          <div className="mt-3.5 grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
            {/* Col 1: Stepper & Direct Quantity Input */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Select Quantity of Stocks
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-700 transition font-bold text-sm shadow-2xs active:scale-95 cursor-pointer"
                  title="Decrease quantity by 1"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    id="manual-order-quantity-input"
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-center text-sm font-mono font-extrabold text-stone-950 dark:text-white shadow-2xs focus:border-blue-500 focus:outline-none tabular-nums"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-semibold text-stone-500 dark:text-stone-400 pointer-events-none">
                    SHARES
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-700 transition font-bold text-sm shadow-2xs active:scale-95 cursor-pointer"
                  title="Increase quantity by 1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Quantity Presets */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 mr-0.5">Quick:</span>
                {[1, 5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold font-mono transition shadow-2xs cursor-pointer ${
                      quantity === qty
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: Budget Presets & Capital Required */}
            <div className="lg:col-span-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-stone-300 font-semibold">Estimated Capital:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white text-sm tabular-nums">
                  ₹{(quantity * currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                <span>Current Market Price:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-200 tabular-nums">
                  ₹{currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">By Capital:</span>
                {[
                  { label: '₹10K', amount: 10000 },
                  { label: '₹25K', amount: 25000 },
                  { label: '₹50K', amount: 50000 },
                  { label: '₹1L', amount: 100000 },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setQuantityByBudget(b.amount)}
                    className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 3: Execution Button & Summary */}
            <div className="lg:col-span-4 flex flex-col justify-center">
              <button
                id="btn-confirm-place-manual-order"
                type="button"
                onClick={() =>
                  onPlaceManualOrder({
                    ticker,
                    action: orderAction,
                    shares: quantity,
                    entry_price: currentPrice,
                    stop_loss: customStopLoss,
                    target_price: customTargetPrice,
                    ticket: ticket || undefined,
                  })
                }
                disabled={isPlacingOrder}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <ShoppingBag className={`h-4 w-4 ${isPlacingOrder ? 'animate-spin' : ''}`} />
                <span>
                  {isPlacingOrder
                    ? 'Placing Order...'
                    : `Execute ${orderAction} (${quantity} Shares • ₹${Math.round(quantity * currentPrice).toLocaleString('en-IN')})`}
                </span>
              </button>

              {/* Small toggle for fine-tuning stop loss and target price */}
              <div className="mt-1.5 flex items-center justify-between px-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center gap-1 font-bold text-stone-700 dark:text-stone-300 hover:text-blue-600 dark:hover:text-amber-400 transition cursor-pointer"
                >
                  <Sliders className="h-3 w-3" />
                  <span>{showAdvancedSettings ? 'Hide Targets' : 'Customize Target / Stop'}</span>
                </button>
                <span className="font-mono text-[10px] font-semibold text-stone-600 dark:text-stone-300 tabular-nums">
                  SL: ₹{customStopLoss?.toFixed(1)} &bull; TGT: ₹{customTargetPrice?.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Advanced Stop Loss & Target Price Fine-Tuning */}
          {showAdvancedSettings && (
            <div className="mt-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Target Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none"
                  />
                  <div className="mt-1 flex gap-1">
                    {[1.03, 1.05, 1.08].map((mul) => (
                      <button
                        key={mul}
                        type="button"
                        onClick={() => setCustomTargetPrice(Number((currentPrice * mul).toFixed(2)))}
                        className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 cursor-pointer"
                      >
                        +{((mul - 1) * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>
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
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 focus:outline-none"
                  />
                  <div className="mt-1 flex gap-1">
                    {[0.985, 0.98, 0.97].map((mul) => (
                      <button
                        key={mul}
                        type="button"
                        onClick={() => setCustomStopLoss(Number((currentPrice * mul).toFixed(2)))}
                        className="rounded bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-200 hover:bg-rose-200 cursor-pointer"
                      >
                        -{((1 - mul) * 100).toFixed(1)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main High-Contrast Quantitative Grid (Return Margin, Approx Time, Risk Margin & Stop, ATR-14) */}
      <div className="p-5 bg-white dark:bg-stone-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Expected Return Margin (High Contrast Emerald) */}
          <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                Return Margin
              </span>
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                +{returnMarginPct}%
              </span>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 font-sans">
                upside
              </span>
            </div>
            <div className="mt-2.5 space-y-1 pt-2 border-t border-emerald-200 dark:border-emerald-800/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">Target Price:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                  ₹{targetPrice?.toFixed(2) || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">Target Spread:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  +₹{targetDiffRupees.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Approx Time to Gain Return (High Contrast Amber) */}
          <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500/80 bg-amber-50 dark:bg-amber-950 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Approx. Time to Gain
              </span>
              <span className="rounded bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-950 dark:text-amber-100 uppercase">
                {horizon.momentumDriftPace}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-2xl font-black text-stone-950 dark:text-white">
                ~{approxDays}d
              </span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 font-sans">
                ({horizon.calendarWeeks})
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/80">
              <div className="text-xs font-bold text-stone-950 dark:text-white">
                {approxTimeLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
                Drift velocity: <strong className="text-stone-950 dark:text-white font-mono">{horizon.velocityPerDay}</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Volatility & Risk Margin & Stop (High Contrast Rose/Red) */}
          <div className="rounded-xl border-2 border-rose-400 dark:border-rose-500/80 bg-rose-50 dark:bg-rose-950 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-950 dark:text-rose-200">
                Risk Margin &amp; Stop
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
                -{horizon.riskMarginPct}%
              </span>
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 font-sans">
                risk margin
              </span>
            </div>
            <div className="mt-2.5 space-y-1 pt-2 border-t border-rose-200 dark:border-rose-800/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-rose-900 dark:text-rose-200">Stop Loss:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                  ₹{stopLoss?.toFixed(2) || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-rose-900 dark:text-rose-200">R:R Ratio:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                  {horizon.riskRewardRatio}:1
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Quantitative ATR-14 Sensory (High Contrast Indigo/Blue) */}
          <div className="rounded-xl border-2 border-indigo-400 dark:border-indigo-500/80 bg-indigo-50 dark:bg-indigo-950 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                ATR-14 Sensory
              </span>
              <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-2xl font-black text-stone-950 dark:text-white">
                ₹{atr.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 font-sans">
                ({((atr / currentPrice) * 100).toFixed(1)}% / bar)
              </span>
            </div>
            <div className="mt-2.5 space-y-1 pt-2 border-t border-indigo-200 dark:border-indigo-800/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">20-Period SMA:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                  ₹{marketContext.sma_20}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">Conviction:</span>
                <span className="font-mono font-extrabold text-stone-950 dark:text-white tabular-nums">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Time-to-Target Progression Milestones */}
        <div className="mt-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-300 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-950 dark:text-white">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span>Time-to-Return Horizon Roadmap ({ticker})</span>
            </div>
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
              Calculated via Target Distance ÷ (ATR-14 Volatility &times; Momentum Velocity)
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            {/* Phase 1 */}
            <div className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white text-xs">Phase 1: Entry &amp; Stop Anchor</span>
                <span className="rounded bg-blue-100 dark:bg-blue-900/70 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-900 dark:text-blue-200">
                  Stage 1
                </span>
              </div>
              <p className="mt-1.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                Position established at <strong className="font-mono text-stone-950 dark:text-white">₹{currentPrice.toFixed(2)}</strong>. Stop anchor set at <strong className="font-mono text-rose-600 dark:text-rose-400">₹{stopLoss?.toFixed(2)}</strong>.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-950 dark:text-white text-xs">Phase 2: Momentum Drift</span>
                <span className="rounded bg-amber-100 dark:bg-amber-900/70 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-200">
                  Stage 2
                </span>
              </div>
              <p className="mt-1.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                Projected move through <strong className="font-mono text-stone-950 dark:text-white">₹{((currentPrice + (targetPrice || currentPrice)) / 2).toFixed(2)}</strong> midpoint with VWAP confirmation.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">Phase 3: Target Capture</span>
                <span className="rounded bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-950 dark:text-emerald-100">
                  {approxTimeLabel}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                Anticipated capture of <strong className="text-emerald-700 dark:text-emerald-300 font-mono">+{returnMarginPct}%</strong> return margin at <strong className="font-mono">₹{targetPrice?.toFixed(2)}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
