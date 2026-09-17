import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Zap,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  BarChart3,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Sliders,
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
  const stopDiffRupees = Math.abs(currentPrice - (stopLoss || currentPrice));

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
      className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs"
    >
      {/* Top Banner with Ticker Identity & Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/70 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-black text-amber-400 shadow-2xs">
            {ticker.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900">{ticker}.NS</h2>
              {scannedStock?.name && (
                <span className="hidden sm:inline text-xs text-stone-500 font-medium">
                  {scannedStock.name}
                </span>
              )}
              {scannedStock?.sector && (
                <span className="rounded-md bg-stone-200/70 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                  {scannedStock.sector}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Latest: <strong className="text-stone-900 font-mono">₹{currentPrice.toLocaleString('en-IN')}</strong></span>
              <span>&bull;</span>
              <span className={`inline-flex items-center gap-0.5 font-bold ${momentum20d >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {momentum20d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {momentum20d >= 0 ? '+' : ''}{momentum20d}% 20d momentum
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-horizon-trigger-heartbeat"
            onClick={onRunHeartbeat}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-xs"
          >
            <Zap className={`h-3.5 w-3.5 text-amber-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Analyzing...' : 'Run Heartbeat Scan'}</span>
          </button>

          {onPlaceManualOrder && (
            <button
              id="btn-horizon-place-manual-order"
              onClick={() => onPlaceManualOrder({
                ticker,
                action: orderAction,
                shares: quantity,
                entry_price: currentPrice,
                stop_loss: customStopLoss,
                target_price: customTargetPrice,
                ticket: ticket || undefined,
              })}
              disabled={isPlacingOrder}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-50 ${
                orderAction === 'SELL'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
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
        <div id="horizon-autonomous-decision-ribbon" className="border-b border-stone-100 bg-amber-50/40 px-5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-bold text-stone-800">
              Autonomous Decision: {independentDecision?.verdictLabel || hypothesis?.bias || 'EVALUATED'}
            </span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-600">
              Target: <strong className="font-mono text-emerald-700">₹{targetPrice?.toFixed(2)}</strong> (+{returnMarginPct}%)
            </span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-600">
              Stop: <strong className="font-mono text-rose-700">₹{stopLoss?.toFixed(2)}</strong>
            </span>
            {ticket?.shares ? (
              <>
                <span className="text-stone-300">&bull;</span>
                <span className="text-stone-600">
                  Risk-Sized: <strong className="font-mono text-stone-900">{ticket.shares} shares</strong> (₹{ticket.capital_allocated?.toLocaleString('en-IN')})
                </span>
              </>
            ) : null}
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-500 italic">Select quantity below to place order</span>
          </div>

          {onPlaceManualOrder && (
            <button
              id="btn-horizon-ribbon-quick-buy"
              onClick={() => onPlaceManualOrder({
                ticker,
                action: orderAction,
                shares: quantity,
                entry_price: currentPrice,
                stop_loss: customStopLoss,
                target_price: customTargetPrice,
                ticket: ticket || undefined,
              })}
              disabled={isPlacingOrder}
              className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1 text-xs font-bold text-white hover:bg-stone-800 transition shadow-2xs disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3 text-amber-400" />
              <span>Execute {quantity} Shares</span>
            </button>
          )}
        </div>
      )}

      {/* Prominent Manual Order Placement & Stock Quantity Selection Console */}
      {onPlaceManualOrder && (
        <div id="manual-order-quantity-console" className="border-b border-stone-200 bg-stone-50/80 p-4 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Manual Order Placement &amp; Quantity Selection
                </h3>
                <p className="text-[11px] text-stone-500">
                  Choose the exact number of shares or allocate by budget for {ticker}.NS
                </p>
              </div>
            </div>

            {/* Action Toggle BUY / SELL */}
            <div className="flex items-center rounded-lg border border-stone-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setOrderAction('BUY')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                BUY (Long)
              </button>
              <button
                type="button"
                onClick={() => setOrderAction('SELL')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  orderAction === 'SELL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Select Quantity of Stocks
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition font-bold text-sm shadow-2xs active:scale-95"
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
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-center text-sm font-mono font-extrabold text-stone-900 shadow-2xs focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-semibold text-stone-400 pointer-events-none">
                    SHARES
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition font-bold text-sm shadow-2xs active:scale-95"
                  title="Increase quantity by 1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Quantity Presets */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 mr-0.5">Quick:</span>
                {[1, 5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold font-mono transition shadow-2xs ${
                      quantity === qty
                        ? 'bg-stone-900 text-amber-400'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: Budget Presets & Capital Required */}
            <div className="lg:col-span-4 rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Estimated Capital:</span>
                <span className="font-mono font-extrabold text-stone-900 text-sm">
                  ₹{(quantity * currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                <span>Current Market Price:</span>
                <span className="font-mono font-bold text-stone-700">₹{currentPrice.toFixed(2)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-400">By Capital:</span>
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
                    className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
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
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <ShoppingBag className={`h-4 w-4 ${isPlacingOrder ? 'animate-spin' : ''}`} />
                <span>
                  {isPlacingOrder
                    ? 'Placing Order...'
                    : `Execute ${orderAction} (${quantity} Shares &bull; ₹${Math.round(quantity * currentPrice).toLocaleString('en-IN')})`}
                </span>
              </button>

              {/* Small toggle for fine-tuning stop loss and target price */}
              <div className="mt-1.5 flex items-center justify-between px-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center gap-1 font-semibold text-stone-500 hover:text-stone-800 transition"
                >
                  <Sliders className="h-3 w-3" />
                  <span>{showAdvancedSettings ? 'Hide Targets' : 'Customize Target / Stop'}</span>
                </button>
                <span className="font-mono text-[10px] text-stone-400">
                  SL: ₹{customStopLoss?.toFixed(1)} &bull; TGT: ₹{customTargetPrice?.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Advanced Stop Loss & Target Price Fine-Tuning */}
          {showAdvancedSettings && (
            <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Target Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none"
                  />
                  <div className="mt-1 flex gap-1">
                    {[1.03, 1.05, 1.08].map((mul) => (
                      <button
                        key={mul}
                        type="button"
                        onClick={() => setCustomTargetPrice(Number((currentPrice * mul).toFixed(2)))}
                        className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        +{((mul - 1) * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    Stop Loss (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={customStopLoss}
                    onChange={(e) => setCustomStopLoss(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 focus:bg-white focus:outline-none"
                  />
                  <div className="mt-1 flex gap-1">
                    {[0.985, 0.98, 0.97].map((mul) => (
                      <button
                        key={mul}
                        type="button"
                        onClick={() => setCustomStopLoss(Number((currentPrice * mul).toFixed(2)))}
                        className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 hover:bg-rose-100"
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

      {/* Main Quantitative Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Expected Return Margin */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Return Margin
              </span>
              <Target className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">+{returnMarginPct}%</span>
              <span className="text-xs font-semibold text-emerald-800">upside</span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-500">Target Price:</span>
                <span className="font-mono font-bold text-stone-900">₹{targetPrice?.toFixed(2) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Target Spread:</span>
                <span className="font-mono font-semibold text-emerald-700">+₹{targetDiffRupees.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Approx Time to Gain Return (Key Request!) */}
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Approx. Time to Gain
              </span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900 uppercase">
                {horizon.momentumDriftPace}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900">~{approxDays}d</span>
              <span className="text-xs font-bold text-amber-800">
                ({horizon.calendarWeeks})
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-[11px] font-bold text-stone-800">
                {approxTimeLabel}
              </div>
              <div className="mt-0.5 text-[10px] text-stone-500 leading-tight">
                Directional drift: <strong className="text-stone-700">{horizon.velocityPerDay}</strong> at ATR efficiency
              </div>
            </div>
          </div>

          {/* Card 3: Volatility & Risk Margin */}
          <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Risk Margin &amp; Stop
              </span>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600">-{horizon.riskMarginPct}%</span>
              <span className="text-xs font-semibold text-stone-500">risk margin</span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-500">Stop Loss:</span>
                <span className="font-mono font-bold text-stone-900">₹{stopLoss?.toFixed(2) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">R:R Ratio:</span>
                <span className="font-mono font-bold text-stone-800">{horizon.riskRewardRatio}:1</span>
              </div>
            </div>
          </div>

          {/* Card 4: Quantitative ATR Drift Velocity */}
          <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                ATR-14 Sensory
              </span>
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900">₹{atr.toFixed(1)}</span>
              <span className="text-xs font-medium text-stone-500">
                ({((atr / currentPrice) * 100).toFixed(1)}% / day)
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-500">20-Day SMA:</span>
                <span className="font-mono font-bold text-stone-900">₹{marketContext.sma_20}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Conviction:</span>
                <span className="font-mono font-bold text-stone-800">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Time-to-Target Progression Milestones */}
        <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              <span>Time-to-Return Horizon Roadmap ({ticker})</span>
            </div>
            <span className="text-[11px] text-stone-500">
              Calculated via Target Distance ÷ (ATR-14 Volatility &times; Momentum Velocity)
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
            {/* Phase 1 */}
            <div className="rounded-lg border border-stone-200 bg-white p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700 text-[11px]">Phase 1: Entry &amp; Ingestion</span>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-600">
                  Day 1–2
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Position established at ₹{currentPrice.toFixed(2)}. Stop anchor set at ₹{stopLoss?.toFixed(2)}. Initial volatility buffer absorbed.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="rounded-lg border border-stone-200 bg-white p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700 text-[11px]">Phase 2: Momentum Drift</span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                  Day 3–{Math.max(3, Math.round(approxDays * 0.65))}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Projected move through ₹{((currentPrice + (targetPrice || currentPrice)) / 2).toFixed(2)} midpoint. 20-day trend confirmation.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-[11px]">Phase 3: Target Window</span>
                <span className="rounded bg-emerald-200/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                  {approxTimeLabel}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800 font-medium">
                Anticipated capture of <strong className="text-emerald-900">+{returnMarginPct}%</strong> return margin at ₹{targetPrice?.toFixed(2)}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
