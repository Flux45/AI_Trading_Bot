import React from 'react';
import {
  TrendingUp,
  Flame,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Newspaper,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import type { MarketSentimentSummary } from '../types';

interface MarketSentimentDialProps {
  sentiment: MarketSentimentSummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  onClickDetails?: () => void;
}

export const MarketSentimentDial: React.FC<MarketSentimentDialProps> = ({
  sentiment,
  isLoading = false,
  onRefresh,
  compact = false,
  onClickDetails,
}) => {
  const score = sentiment?.overallScore ?? 75;
  const label = sentiment?.label ?? 'Greed / Bullish';
  const bias = sentiment?.bias ?? 'BULLISH';
  const bullishCount = sentiment?.bullishCount ?? 28;
  const neutralCount = sentiment?.neutralCount ?? 8;
  const bearishCount = sentiment?.bearishCount ?? 4;
  const totalArticles = sentiment?.totalArticles ?? 40;
  const avgRecScore = sentiment?.averageRecommendationScore ?? 91.2;
  const topSector = sentiment?.topCatalystSector ?? 'Capital Goods & Defense';
  const mood =
    sentiment?.institutionalMood ??
    'Aggressive domestic capex inflows, mega order wins, and institutional buy upgrades dominating headline flow.';

  // Percentage shares of news sentiment
  const bullishPct = totalArticles > 0 ? Math.round((bullishCount / totalArticles) * 100) : 70;
  const neutralPct = totalArticles > 0 ? Math.round((neutralCount / totalArticles) * 100) : 20;
  const bearishPct = totalArticles > 0 ? Math.max(0, 100 - bullishPct - neutralPct) : 10;

  // Gauge geometry: 180-degree semi-circular arc (speedometer style)
  // Angle maps from -90° (score 0) to +90° (score 100)
  // In degrees: rotation angle = -90 + (score / 100) * 180
  const needleAngle = -90 + (Math.max(0, Math.min(100, score)) / 100) * 180;

  // Color config based on score tier
  const getScoreTheme = (s: number) => {
    if (s >= 80) {
      return {
        bgBadge: 'bg-emerald-950 text-emerald-100 border-emerald-800 ring-emerald-500/30',
        textAccent: 'text-emerald-700',
        needleColor: '#059669',
        glowColor: 'rgba(5, 150, 105, 0.25)',
        status: 'Extreme Greed / Strong Bullish',
      };
    }
    if (s >= 60) {
      return {
        bgBadge: 'bg-emerald-900/90 text-emerald-100 border-emerald-700 ring-emerald-500/20',
        textAccent: 'text-emerald-600',
        needleColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.2)',
        status: 'Greed / Bullish',
      };
    }
    if (s >= 45) {
      return {
        bgBadge: 'bg-amber-950 text-amber-100 border-amber-800 ring-amber-500/20',
        textAccent: 'text-amber-600',
        needleColor: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.2)',
        status: 'Neutral / Selective',
      };
    }
    if (s >= 25) {
      return {
        bgBadge: 'bg-orange-950 text-orange-100 border-orange-800 ring-orange-500/20',
        textAccent: 'text-orange-600',
        needleColor: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.2)',
        status: 'Fear / Cautious',
      };
    }
    return {
      bgBadge: 'bg-rose-950 text-rose-100 border-rose-800 ring-rose-500/20',
      textAccent: 'text-rose-600',
      needleColor: '#dc2626',
      glowColor: 'rgba(220, 38, 38, 0.2)',
      status: 'Extreme Fear / Risk-Off',
    };
  };

  const theme = getScoreTheme(score);

  // SVG dimensions
  const width = compact ? 220 : 280;
  const height = compact ? 130 : 165;
  const cx = width / 2;
  const cy = height - (compact ? 15 : 20);
  const radius = compact ? 85 : 110;
  const strokeWidth = compact ? 14 : 18;

  // Arc segment definitions for 5 sentiment bands
  // Bands: 0-20 (Extreme Fear), 20-40 (Fear), 40-60 (Neutral), 60-80 (Greed), 80-100 (Extreme Greed)
  const segments = [
    { startVal: 0, endVal: 20, color: '#ef4444', label: 'Extreme Fear' },
    { startVal: 20, endVal: 40, color: '#f97316', label: 'Fear' },
    { startVal: 40, endVal: 60, color: '#eab308', label: 'Neutral' },
    { startVal: 60, endVal: 80, color: '#10b981', label: 'Greed' },
    { startVal: 80, endVal: 100, color: '#059669', label: 'Extreme Greed' },
  ];

  // Helper to convert polar to cartesian
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // Helper to describe SVG arc
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  if (compact) {
    return (
      <div
        id="market-sentiment-dial-compact"
        onClick={onClickDetails}
        className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs transition hover:border-stone-300 hover:shadow-sm cursor-pointer"
      >
        <div className="relative shrink-0 flex flex-col items-center">
          <svg width={130} height={75} className="overflow-visible">
            {/* Background Arc */}
            <path
              d={describeArc(65, 68, 52, -90, 90)}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth={8}
              strokeLinecap="round"
            />
            {/* 5 Segments */}
            {segments.map((seg) => {
              const startAngle = -90 + (seg.startVal / 100) * 180;
              const endAngle = -90 + (seg.endVal / 100) * 180;
              return (
                <path
                  key={seg.label}
                  d={describeArc(65, 68, 52, startAngle + 1, endAngle - 1)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={8}
                />
              );
            })}
            {/* Needle */}
            <g
              transform={`rotate(${needleAngle}, 65, 68)`}
              style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <line
                x1={65}
                y1={68}
                x2={65}
                y2={22}
                stroke="#1c1917"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <circle cx={65} cy={68} r={4.5} fill="#1c1917" />
            </g>
          </svg>
          <div className="-mt-3 font-extrabold text-stone-900 text-base">{score}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Market Sentiment Dial
            </span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${theme.bgBadge}`}
            >
              {bias}
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs font-semibold text-stone-800">{label}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500">
            <span className="text-emerald-700 font-medium">+{bullishPct}% Bullish</span>
            <span>•</span>
            <span className="truncate">{totalArticles} Scanned Articles</span>
          </div>
        </div>

        <div className="shrink-0 text-stone-400">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="market-sentiment-dial-container"
      className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white tracking-wide">
              <Compass className="h-3.5 w-3.5 text-orange-400" />
              Market Sentiment Dial
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase shadow-xs ${theme.bgBadge}`}
            >
              {label}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-stone-900">
            Aggregated Media &amp; Catalyst Sentiment
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Real-time composite score weighted from news headlines across leading financial portals and quantitative stock purchase options.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-50"
            title="Re-calculate sentiment"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Main Gauge Dial Visualization Area */}
      <div className="mt-6 flex flex-col items-center justify-center">
        <div className="relative">
          <svg
            width={width}
            height={height}
            className="overflow-visible drop-shadow-xs"
            aria-label={`Market Sentiment Gauge: ${score} out of 100`}
          >
            <defs>
              {/* Filter for subtle needle shadow */}
              <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Base track arc background */}
            <path
              d={describeArc(cx, cy, radius, -90, 90)}
              fill="none"
              stroke="#f5f5f4"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* 5 Distinct Colored Sentiment Segments */}
            {segments.map((seg) => {
              const startAngle = -90 + (seg.startVal / 100) * 180;
              const endAngle = -90 + (seg.endVal / 100) * 180;
              // small 1-degree gap between zones for crisp separation
              const d = describeArc(cx, cy, radius, startAngle + 1, endAngle - 1);
              return (
                <path
                  key={seg.label}
                  d={d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-500"
                />
              );
            })}

            {/* Minor Tick Marks around the arc */}
            {[0, 20, 40, 60, 80, 100].map((val) => {
              const ang = -90 + (val / 100) * 180;
              const pOuter = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 4, ang);
              const pInner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 4, ang);
              return (
                <line
                  key={val}
                  x1={pInner.x}
                  y1={pInner.y}
                  x2={pOuter.x}
                  y2={pOuter.y}
                  stroke="#a8a29e"
                  strokeWidth={1.5}
                />
              );
            })}

            {/* Labels at Extremes and Center */}
            <text
              x={cx - radius + 5}
              y={cy + 16}
              textAnchor="middle"
              className="text-[10px] font-bold fill-stone-400"
            >
              0
            </text>
            <text
              x={cx}
              y={cy - radius + 32}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-stone-400"
            >
              50 (Neutral)
            </text>
            <text
              x={cx + radius - 5}
              y={cy + 16}
              textAnchor="middle"
              className="text-[10px] font-bold fill-stone-400"
            >
              100
            </text>

            {/* Precision Speedometer Needle */}
            <g
              transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
              filter="url(#needle-shadow)"
              style={{
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Pointer Triangle */}
              <polygon
                points={`${cx - 4},${cy} ${cx + 4},${cy} ${cx},${cy - radius + 6}`}
                fill="#1c1917"
              />
              {/* Needle line accent */}
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - radius + 8}
                stroke={theme.needleColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Pivot Outer Ring & Core */}
              <circle cx={cx} cy={cy} r={10} fill="#ffffff" stroke="#1c1917" strokeWidth={3} />
              <circle cx={cx} cy={cy} r={5} fill="#1c1917" />
            </g>
          </svg>

          {/* Central Quantitative Score Overlay */}
          <div className="mt-1 text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black tracking-tight text-stone-900">{score}</span>
              <span className="text-sm font-semibold text-stone-400">/100</span>
            </div>
            <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-stone-600">
              {theme.status}
            </div>
          </div>
        </div>

        {/* Dynamic Sentiment Narrative Box */}
        <div className="mt-4 w-full rounded-lg bg-stone-50 p-3.5 border border-stone-200/80 text-xs">
          <div className="flex items-center gap-1.5 text-stone-700 font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span>Institutional Media Narrative:</span>
          </div>
          <p className="text-stone-600 leading-relaxed">{mood}</p>
        </div>
      </div>

      {/* 3-Column Aggregation Breakdown */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-stone-100 pt-4 text-xs">
        {/* Metric 1: News Ratio Bar */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-2.5">
          <div className="text-[11px] font-semibold text-stone-500 flex justify-between items-center">
            <span>Media Headline Ratio</span>
            <span className="text-stone-700 font-bold">{totalArticles} items</span>
          </div>
          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              style={{ width: `${bullishPct}%` }}
              className="bg-emerald-500"
              title={`Bullish: ${bullishPct}% (${bullishCount})`}
            />
            <div
              style={{ width: `${neutralPct}%` }}
              className="bg-amber-400"
              title={`Neutral: ${neutralPct}% (${neutralCount})`}
            />
            <div
              style={{ width: `${bearishPct}%` }}
              className="bg-rose-500"
              title={`Bearish: ${bearishPct}% (${bearishCount})`}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-stone-500">
            <span className="text-emerald-700 font-bold">{bullishCount} Bullish</span>
            <span className="text-amber-700 font-medium">{neutralCount} Neutral</span>
            <span className="text-rose-700 font-medium">{bearishCount} Bearish</span>
          </div>
        </div>

        {/* Metric 2: Average Recommendations Sentiment */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-2.5">
          <div className="text-[11px] font-semibold text-stone-500">
            Avg Conviction Score
          </div>
          <div className="mt-1 text-lg font-bold text-stone-900">
            {avgRecScore} <span className="text-xs font-normal text-stone-500">/ 100</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            12 Screened Purchase Options
          </div>
        </div>

        {/* Metric 3: Top Catalyst Sector */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-2.5">
          <div className="text-[11px] font-semibold text-stone-500">
            Top Catalyst Sector
          </div>
          <div className="mt-1 text-xs font-bold text-stone-900 truncate">
            {topSector}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            Order Inflows &amp; PLI Tailwinds
          </div>
        </div>
      </div>
    </div>
  );
};
