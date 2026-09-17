import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Newspaper,
  ChevronRight
} from 'lucide-react';
import type { SentimentTrendPoint, SentimentTrendSummary } from '../types';

interface MarketSentimentTrendChartProps {
  trendData?: SentimentTrendPoint[];
  summary?: SentimentTrendSummary;
  currentScore?: number;
}

type TimeframeOption = '7d' | '14d' | '30d';

export const MarketSentimentTrendChart: React.FC<MarketSentimentTrendChartProps> = ({
  trendData = [],
  summary,
  currentScore = 80,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<SentimentTrendPoint | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<SentimentTrendPoint | null>(null);

  // Filter based on selected timeframe
  const filteredData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    if (timeframe === '7d') return trendData.slice(-7);
    if (timeframe === '14d') return trendData.slice(-14);
    return trendData;
  }, [trendData, timeframe]);

  // Derived metrics for filtered period
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avg: currentScore,
        peak: currentScore,
        peakDate: 'Today',
        low: currentScore,
        lowDate: 'Today',
        netChange: 0,
      };
    }
    const scores = filteredData.map((d) => d.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / scores.length).toFixed(1));
    const peak = Math.max(...scores);
    const low = Math.min(...scores);
    const peakPoint = filteredData.find((d) => d.score === peak);
    const lowPoint = filteredData.find((d) => d.score === low);
    const netChange = filteredData[filteredData.length - 1].score - filteredData[0].score;

    return {
      avg,
      peak,
      peakDate: peakPoint?.shortDate || peakPoint?.date || '',
      low,
      lowDate: lowPoint?.shortDate || lowPoint?.date || '',
      netChange,
    };
  }, [filteredData, currentScore]);

  // SVG dimensions
  const svgWidth = 860;
  const svgHeight = 280;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Coordinate scales (Score 0 to 100)
  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return paddingTop + chartHeight - (clamped / 100) * chartHeight;
  };

  const getX = (index: number) => {
    if (filteredData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (filteredData.length - 1)) * chartWidth;
  };

  // Build SVG path
  const pathPoints = filteredData.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' L ');
  const linePath = filteredData.length > 0 ? `M ${pathPoints}` : '';
  const areaPath =
    filteredData.length > 0
      ? `M ${getX(0)},${getY(0)} L ${pathPoints} L ${getX(filteredData.length - 1)},${getY(0)} Z`
      : '';

  const getSentimentTierColor = (score: number) => {
    if (score >= 80) return { stroke: '#059669', fill: '#10b981', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 60) return { stroke: '#10b981', fill: '#34d399', badge: 'bg-green-100 text-green-800 border-green-300' };
    if (score >= 45) return { stroke: '#d97706', fill: '#fbbf24', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (score >= 25) return { stroke: '#ea580c', fill: '#fb923c', badge: 'bg-orange-100 text-orange-800 border-orange-300' };
    return { stroke: '#dc2626', fill: '#f87171', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const activeHover = hoveredPoint || selectedMilestone || (filteredData.length > 0 ? filteredData[filteredData.length - 1] : null);

  return (
    <div id="sentiment-historical-trend-card" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
              Market Sentiment Historical Trend (30 Days)
            </h3>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-stone-600">
              Daily Aggregates
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Plots composite headline sentiment & institutional conviction shifts across leading financial portals over time.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1 self-start sm:self-auto rounded-lg border border-stone-200 bg-stone-50 p-1">
          <button
            onClick={() => setTimeframe('7d')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              timeframe === '7d'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('14d')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              timeframe === '14d'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              timeframe === '30d'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            30 Days (Full)
          </button>
        </div>
      </div>

      {/* 4 Statistical Highlight Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {timeframe === '30d' ? '30-Day' : timeframe === '14d' ? '14-Day' : '7-Day'} Mean
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-stone-900">{stats.avg}</span>
            <span className="text-xs font-semibold text-emerald-700">/ 100</span>
          </div>
          <span className="text-[10px] font-medium text-stone-500">
            {stats.avg >= 80 ? 'Extreme Greed' : stats.avg >= 60 ? 'Greed' : stats.avg >= 45 ? 'Neutral' : 'Cautious'}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Period Peak</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-600">{stats.peak}</span>
            <span className="text-[11px] font-semibold text-stone-500">{stats.peakDate}</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-700">Peak Conviction</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Period Low</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-600">{stats.low}</span>
            <span className="text-[11px] font-semibold text-stone-500">{stats.lowDate}</span>
          </div>
          <span className="text-[10px] font-medium text-stone-500">Consolidation Trough</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Net Mood Shift</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-black flex items-center gap-0.5 ${
                stats.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.netChange >= 0 ? '+' : ''}
              {stats.netChange}
              {stats.netChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
            </span>
            <span className="text-[10px] text-stone-500">pts</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-700">
            {stats.netChange >= 10 ? 'Strong Bullish Expansion' : stats.netChange >= 0 ? 'Positive Drift' : 'Risk Caution'}
          </span>
        </div>
      </div>

      {/* Main SVG Historical Trend Chart */}
      <div className="mt-5 relative overflow-x-auto rounded-xl border border-stone-200 bg-stone-900 p-2 shadow-inner">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '600px' }}
        >
          <defs>
            {/* Area Gradient */}
            <linearGradient id="sentimentAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
            </linearGradient>

            {/* Line Gradient */}
            <linearGradient id="sentimentLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Sentiment Tier Background Zones */}
          {/* 80 - 100: Extreme Greed */}
          <rect
            x={paddingLeft}
            y={getY(100)}
            width={chartWidth}
            height={getY(80) - getY(100)}
            fill="#059669"
            fillOpacity="0.08"
          />
          {/* 60 - 80: Greed */}
          <rect
            x={paddingLeft}
            y={getY(80)}
            width={chartWidth}
            height={getY(60) - getY(80)}
            fill="#10b981"
            fillOpacity="0.04"
          />
          {/* 45 - 60: Neutral */}
          <rect
            x={paddingLeft}
            y={getY(60)}
            width={chartWidth}
            height={getY(45) - getY(60)}
            fill="#eab308"
            fillOpacity="0.04"
          />
          {/* 25 - 45: Fear */}
          <rect
            x={paddingLeft}
            y={getY(45)}
            width={chartWidth}
            height={getY(25) - getY(45)}
            fill="#f97316"
            fillOpacity="0.04"
          />
          {/* 0 - 25: Extreme Fear */}
          <rect
            x={paddingLeft}
            y={getY(25)}
            width={chartWidth}
            height={getY(0) - getY(25)}
            fill="#ef4444"
            fillOpacity="0.06"
          />

          {/* Horizontal Grid lines & Score Labels */}
          {[100, 80, 60, 45, 25, 0].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke={level === 80 || level === 60 ? '#334155' : '#1e293b'}
                  strokeDasharray={level === 80 || level === 60 ? '3 3' : '2 2'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-stone-400 font-semibold"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Sentiment Tier Names on Right Edge */}
          <text
            x={paddingLeft + chartWidth - 8}
            y={getY(90)}
            textAnchor="end"
            className="text-[9px] font-bold fill-emerald-400/70 tracking-wider uppercase"
          >
            Extreme Greed
          </text>
          <text
            x={paddingLeft + chartWidth - 8}
            y={getY(70)}
            textAnchor="end"
            className="text-[9px] font-bold fill-green-400/60 tracking-wider uppercase"
          >
            Greed / Bullish
          </text>
          <text
            x={paddingLeft + chartWidth - 8}
            y={getY(52)}
            textAnchor="end"
            className="text-[9px] font-bold fill-amber-400/60 tracking-wider uppercase"
          >
            Neutral Range
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#sentimentAreaGrad)" />

          {/* Line Chart */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#sentimentLineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Interactivity */}
          {filteredData.map((point, index) => {
            const x = getX(index);
            const y = getY(point.score);
            const isHovered = hoveredPoint?.date === point.date;
            const isSelected = selectedMilestone?.date === point.date;
            const isToday = index === filteredData.length - 1;
            const tierColor = getSentimentTierColor(point.score);

            return (
              <g
                key={point.date}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(point)}
                onClick={() => setSelectedMilestone(point)}
              >
                {/* Active vertical guide line on hover */}
                {(isHovered || isSelected) && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartHeight}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? 8 : isToday ? 6 : 4}
                  fill={tierColor.fill}
                  fillOpacity={isHovered || isSelected ? 0.35 : 0.15}
                  className="transition-all duration-150"
                />

                {/* Point core */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? 4.5 : isToday ? 3.5 : 2.5}
                  fill={isToday ? '#ffffff' : tierColor.stroke}
                  stroke={isToday ? '#10b981' : '#ffffff'}
                  strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Today's pulsing beacon */}
                {isToday && (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* X-Axis Date Labels (Selective spacing for readability) */}
                {(index === 0 ||
                  index === Math.floor(filteredData.length / 2) ||
                  index === filteredData.length - 1 ||
                  (filteredData.length <= 14 && index % 2 === 0) ||
                  (filteredData.length > 14 && index % 5 === 0)) && (
                  <text
                    x={x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={`font-mono text-[10px] ${
                      isToday ? 'fill-emerald-400 font-bold' : 'fill-stone-400'
                    }`}
                  >
                    {point.shortDate}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Detail Card: Selected / Hovered Day Catalyst */}
      {activeHover && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/90 p-4 transition-all duration-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                <Calendar className="h-3 w-3 text-amber-400" />
                {activeHover.date}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                  getSentimentTierColor(activeHover.score).badge
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Score: {activeHover.score}/100 &bull; {activeHover.label}
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                {activeHover.bias}
              </span>
            </div>

            {activeHover.sourceEvent && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
                <Newspaper className="h-3.5 w-3.5 text-stone-400" />
                Source: <strong className="text-stone-700">{activeHover.sourceEvent}</strong>
              </span>
            )}
          </div>

          <div className="mt-2 flex items-start gap-2">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-stone-900">Key Headline & Institutional Catalyst: </span>
              <span className="text-xs text-stone-700">{activeHover.keyCatalyst}</span>
            </div>
          </div>
        </div>
      )}

      {/* 30-Day Narrative Shift Commentary */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-stone-400" />
          Data grounded in daily headline feeds across 6 leading financial news portals (ET, Moneycontrol, Mint, BS, CNBC-TV18, Reuters).
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-stone-700">
          Live Tracking Active
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </span>
      </div>
    </div>
  );
};
