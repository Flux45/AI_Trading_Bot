import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import type { Candle, MarketContext, TradeHypothesis } from '../types';
import { calculateTimeHorizon } from '../utils/quantMetrics';

interface CandleChartProps {
  marketContext: MarketContext;
  hypothesis?: TradeHypothesis | null;
}

export const CandleChart: React.FC<CandleChartProps> = ({ marketContext, hypothesis }) => {
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const candles = marketContext.candles || [];

  const targetPrice = hypothesis?.target_price || marketContext.target_price;
  const stopLoss = hypothesis?.stop_loss || marketContext.stop_loss;
  const horizon = calculateTimeHorizon(
    marketContext.current_price,
    targetPrice,
    stopLoss,
    marketContext.atr_14,
    marketContext.pct_return_20d
  );

  if (candles.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500">
        No candle data available
      </div>
    );
  }

  // Determine bounds
  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.985;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.015;
  const priceRange = maxPrice - minPrice || 1;

  const width = 760;
  const height = 280;
  const paddingLeft = 12;
  const paddingRight = 64;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getY = (price: number) => {
    return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = Math.max(chartWidth / candles.length - 2, 4);

  // Compute 20-day SMA points for the chart
  const smaPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i >= 19) {
      const slice = candles.slice(i - 19, i + 1);
      const avg = slice.reduce((sum, c) => sum + c.close, 0) / 20;
      const x = paddingLeft + i * (chartWidth / (candles.length - 1 || 1));
      smaPoints.push({ x, y: getY(avg) });
    }
  }

  const smaPath = smaPoints.length > 0
    ? `M ${smaPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  return (
    <div id="candle-chart-container" className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Sensory Engine Chart</span>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">{marketContext.ticker}.NS</h3>
              <span className="text-xs rounded bg-stone-100 px-1.5 py-0.5 font-mono text-stone-600">Daily Candles (45d)</span>
            </div>
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-xs text-stone-400">Latest Close</span>
            <p className="text-base font-bold text-stone-900">₹{marketContext.current_price.toLocaleString('en-IN')}</p>
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-xs text-stone-400">ATR(14)</span>
            <p className="text-sm font-semibold text-amber-700">₹{marketContext.atr_14}</p>
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-xs text-stone-400">20d SMA</span>
            <p className="text-sm font-semibold text-blue-700">₹{marketContext.sma_20}</p>
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-xs text-stone-400">Return Margin</span>
            <p className="text-sm font-bold text-emerald-700">+{horizon.returnMarginPct}%</p>
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Approx. Time
            </span>
            <p
              className="text-sm font-semibold text-stone-900 cursor-help"
              title={horizon.approxTimeLabel}
            >
              ~{horizon.approxDays}d <span className="text-[10px] text-stone-500 font-normal">({horizon.calendarWeeks})</span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-stone-600">20-Day SMA</span>
          </div>
          {hypothesis && hypothesis.stop_loss > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-red-500" />
              <span className="text-stone-600">Stop (₹{hypothesis.stop_loss})</span>
            </div>
          )}
          {hypothesis && hypothesis.target_price > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-emerald-500" />
              <span className="text-stone-600">Target (₹{hypothesis.target_price} &bull; ~{horizon.approxDays}d)</span>
            </div>
          )}
        </div>
      </div>

      {hoveredCandle && (
        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-mono text-stone-700">
          <span className="font-semibold text-stone-900">{hoveredCandle.date}</span>
          <span>O: ₹{hoveredCandle.open}</span>
          <span>H: ₹{hoveredCandle.high}</span>
          <span>L: ₹{hoveredCandle.low}</span>
          <span className={hoveredCandle.close >= hoveredCandle.open ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
            C: ₹{hoveredCandle.close}
          </span>
          <span>Vol: {(hoveredCandle.volume / 1000).toFixed(0)}k</span>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 w-full min-w-[500px]"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const price = minPrice + priceRange * ratio;
            const y = getY(price);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 4}
                  fill="#78716c"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ₹{price.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* 20-Day SMA Line */}
          {smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Trade Hypothesis Levels (Stop-loss & Target) */}
          {hypothesis && hypothesis.stop_loss > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(hypothesis.stop_loss)}
                x2={width - paddingRight}
                y2={getY(hypothesis.stop_loss)}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <rect
                x={width - paddingRight + 4}
                y={getY(hypothesis.stop_loss) - 8}
                width="56"
                height="16"
                rx="3"
                fill="#fee2e2"
              />
              <text
                x={width - paddingRight + 8}
                y={getY(hypothesis.stop_loss) + 4}
                fill="#b91c1c"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                SL: ₹{hypothesis.stop_loss}
              </text>
            </g>
          )}

          {hypothesis && hypothesis.target_price > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(hypothesis.target_price)}
                x2={width - paddingRight}
                y2={getY(hypothesis.target_price)}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <rect
                x={width - paddingRight + 2}
                y={getY(hypothesis.target_price) - 9}
                width="60"
                height="18"
                rx="3"
                fill="#d1fae5"
                stroke="#a7f3d0"
              />
              <text
                x={width - paddingRight + 5}
                y={getY(hypothesis.target_price) + 3.5}
                fill="#047857"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ₹{hypothesis.target_price} (~{horizon.approxDays}d)
              </text>
            </g>
          )}

          {/* Candlesticks */}
          {candles.map((candle, idx) => {
            const x = paddingLeft + idx * (chartWidth / (candles.length - 1 || 1));
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            const isGreen = candle.close >= candle.open;
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);
            const color = isGreen ? '#10b981' : '#f43f5e';

            return (
              <g
                key={idx}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredCandle(candle)}
              >
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? '#10b981' : '#f43f5e'}
                  rx="1"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
        <span>Oldest: {candles[0]?.date}</span>
        <span className="font-mono">Formula: ATR(14) = Mean(Max(H-L, |H-Cp|, |L-Cp|))</span>
        <span>Latest: {candles[candles.length - 1]?.date}</span>
      </div>
    </div>
  );
};
