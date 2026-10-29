import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  Award,
  ShieldCheck,
  Scale,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { TradingHorizonMode } from '../types';

interface CumulativePnlDataPoint {
  step: number;
  time: string;
  timestamp: string;
  tradePnl: number;
  cumulativePnl: number;
  equity: number;
  ticker: string;
  strategy: string;
  isProfit: boolean;
  duration?: string;
  exitReason?: string;
}

interface ComparisonDataPoint {
  step: number;
  label: string;
  intradayCumulativePnl: number;
  longCumulativePnl: number;
  netCombinedPnl: number;
}

interface CumulativePnlResponse {
  success: boolean;
  intraday: {
    series: CumulativePnlDataPoint[];
    netPnl: number;
    tradeCount: number;
    winRatePct: number;
  };
  long: {
    series: CumulativePnlDataPoint[];
    netPnl: number;
    tradeCount: number;
    winRatePct: number;
  };
  comparisonSeries: ComparisonDataPoint[];
}

interface CumulativePnlChartProps {
  currentMode?: TradingHorizonMode;
  onModeChange?: (mode: TradingHorizonMode) => void;
}

export const CumulativePnlChart: React.FC<CumulativePnlChartProps> = ({
  currentMode = 'INTRADAY',
  onModeChange,
}) => {
  const [data, setData] = useState<CumulativePnlResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'CURRENT' | 'INTRADAY' | 'LONG' | 'COMPARISON'>('CURRENT');

  const fetchCumulativeData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/portfolio/cumulative-pnl');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load cumulative PnL series:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCumulativeData();
  }, [currentMode]);

  const activeModeKey = viewMode === 'CURRENT'
    ? (currentMode === 'INTRADAY' ? 'intraday' : 'long')
    : viewMode === 'INTRADAY'
    ? 'intraday'
    : 'long';

  const isComparison = viewMode === 'COMPARISON';

  const singleModeData = data ? data[activeModeKey] : null;
  const seriesData = isComparison
    ? (data?.comparisonSeries || [])
    : (singleModeData?.series || []);

  // Compute key curve metrics
  const netPnl = singleModeData?.netPnl ?? 0;
  const pnlValues = (singleModeData?.series || []).map((s) => s.cumulativePnl);
  const peakPnl = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const lowestPnl = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;
  const maxDrawdown = peakPnl > lowestPnl ? Number((peakPnl - lowestPnl).toFixed(2)) : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    if (isComparison) {
      const item = payload[0]?.payload as ComparisonDataPoint;
      if (!item) return null;
      return (
        <div className="rounded-xl border border-stone-800 bg-stone-950/95 p-3.5 text-xs text-white shadow-xl backdrop-blur-md space-y-2 min-w-56 font-mono">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 font-sans">
            <span className="font-bold text-stone-300">{item.label}</span>
            <span className="text-[10px] text-stone-500">Comparative Step</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-sans flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                ⚡ Intraday Cumulative:
              </span>
              <strong className={item.intradayCumulativePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {item.intradayCumulativePnl >= 0 ? '+' : ''}₹{item.intradayCumulativePnl}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-sans flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                📈 Long / Positional:
              </span>
              <strong className={item.longCumulativePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {item.longCumulativePnl >= 0 ? '+' : ''}₹{item.longCumulativePnl}
              </strong>
            </div>

            <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between">
              <span className="text-stone-400 font-sans">Net Combined:</span>
              <strong className={item.netCombinedPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {item.netCombinedPnl >= 0 ? '+' : ''}₹{item.netCombinedPnl}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    const item = payload[0]?.payload as CumulativePnlDataPoint;
    if (!item) return null;

    return (
      <div className="rounded-xl border border-stone-800 bg-stone-950/95 p-3.5 text-xs text-white shadow-xl backdrop-blur-md space-y-2 min-w-64 font-mono">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 font-sans">
          <div className="flex items-center gap-2">
            <strong className="text-amber-400 font-bold text-sm">{item.ticker}</strong>
            <span className="text-[10px] text-stone-400">{item.time}</span>
          </div>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
            item.tradePnl >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
          }`}>
            {item.tradePnl >= 0 ? '+' : ''}₹{item.tradePnl}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-stone-400 font-sans">Cumulative Curve P&L:</span>
            <strong className={item.cumulativePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {item.cumulativePnl >= 0 ? '+' : ''}₹{item.cumulativePnl}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-400 font-sans">Total Reserve Balance:</span>
            <span className="text-stone-200 font-bold">₹{item.equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {item.strategy && (
            <div className="pt-1 text-[10px] text-stone-400 font-sans">
              <span className="text-stone-500 block">Strategy:</span>
              <span className="text-stone-300 font-semibold">{item.strategy}</span>
            </div>
          )}

          {item.duration && (
            <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/80">
              <span className="font-sans">Holding Duration:</span>
              <span className="text-purple-300 font-bold">{item.duration}</span>
            </div>
          )}

          {item.exitReason && (
            <div className="text-[10px] text-stone-400 pt-0.5 font-sans truncate" title={item.exitReason}>
              <span>Trigger: <strong className="text-stone-300">{item.exitReason}</strong></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              Cumulative Realized P&amp;L Curve
              <span className="rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 border border-stone-200 font-mono">
                Recharts Analytics
              </span>
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Independent chronological equity trajectories tracking sequential realized gains, high watermarks, and risk drawdowns for <strong>Intraday (MIS)</strong> and <strong>Long (CNC)</strong>.
          </p>
        </div>

        {/* View Selection Controls */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-stone-100 p-1 border border-stone-200">
          <button
            type="button"
            onClick={() => setViewMode('CURRENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'CURRENT'
                ? 'bg-white text-stone-950 shadow-2xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active Mode ({currentMode === 'INTRADAY' ? '⚡ Intraday' : '📈 Long'})
          </button>

          <button
            type="button"
            onClick={() => setViewMode('INTRADAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'INTRADAY'
                ? 'bg-amber-500 text-stone-950 shadow-2xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Intraday Only</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('LONG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'LONG'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>Long Only</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('COMPARISON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'COMPARISON'
                ? 'bg-stone-900 text-white shadow-2xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Scale className="h-3 w-3" />
            <span>Dual Overlay</span>
          </button>

          <button
            type="button"
            onClick={fetchCumulativeData}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 transition hover:bg-stone-200/50"
            title="Refresh PnL Series"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK PERFORMANCE METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-sans">
            {isComparison ? 'Net Combined P&L' : 'Net Realized P&L'}
          </span>
          <p className={`mt-0.5 font-mono text-base font-extrabold ${
            (isComparison ? (data?.intraday.netPnl || 0) + (data?.long.netPnl || 0) : netPnl) >= 0
              ? 'text-emerald-600'
              : 'text-rose-600'
          }`}>
            {(isComparison ? (data?.intraday.netPnl || 0) + (data?.long.netPnl || 0) : netPnl) >= 0 ? '+' : ''}
            ₹{(isComparison ? (data?.intraday.netPnl || 0) + (data?.long.netPnl || 0) : netPnl).toFixed(2)}
          </p>
          <span className="text-[10px] text-stone-500">
            {isComparison ? 'Dual system total' : `${singleModeData?.tradeCount || 0} executed trades`}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-sans">
            Peak P&amp;L High-Watermark
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-stone-900">
            +₹{isComparison ? Math.max(data?.intraday.netPnl || 0, data?.long.netPnl || 0).toFixed(2) : peakPnl.toFixed(2)}
          </p>
          <span className="text-[10px] text-stone-500">Maximum curve elevation</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-sans">
            Maximum Drawdown
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-rose-600">
            ₹{maxDrawdown.toFixed(2)}
          </p>
          <span className="text-[10px] text-stone-500">Peak-to-trough pullback</span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-sans">
            Win Ratio
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-purple-700">
            {isComparison
              ? `${(((data?.intraday.winRatePct || 0) + (data?.long.winRatePct || 0)) / 2).toFixed(1)}%`
              : `${singleModeData?.winRatePct || 0}%`}
          </p>
          <span className="text-[10px] text-stone-500">Positive trade outcome rate</span>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION CANVAS */}
      <div className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold text-stone-700 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {isComparison
              ? 'Dual Mode Comparison (Intraday Gold vs Long Blue)'
              : `${activeModeKey.toUpperCase()} Cumulative Realized Trajectory (₹ INR)`}
          </span>
          <span className="font-mono text-[11px]">Baseline: ₹0.00</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={seriesData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={isComparison ? 'label' : 'time'}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `₹${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />

              {isComparison ? (
                <>
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-bold text-stone-700">{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    name="⚡ Intraday PnL (MIS)"
                    dataKey="intradayCumulativePnl"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#d97706' }}
                  />
                  <Line
                    type="monotone"
                    name="📈 Long PnL (CNC)"
                    dataKey="longCumulativePnl"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                  <Line
                    type="monotone"
                    name="Combined Net PnL"
                    dataKey="netCombinedPnl"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke={activeModeKey === 'intraday' ? '#f59e0b' : '#2563eb'}
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: activeModeKey === 'intraday' ? '#f59e0b' : '#2563eb',
                    strokeWidth: 2,
                    stroke: '#ffffff',
                  }}
                  activeDot={{
                    r: 7,
                    fill: activeModeKey === 'intraday' ? '#d97706' : '#1d4ed8',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer Indicator */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] text-stone-500 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${activeModeKey === 'intraday' ? 'bg-amber-500' : 'bg-blue-600'}`} />
              Active System: <strong>{activeModeKey.toUpperCase()}</strong>
            </span>
            <span>&bull;</span>
            <span>Plotted Data Points: <strong>{seriesData.length}</strong></span>
          </div>

          <div className="flex items-center gap-1 text-stone-400 font-sans">
            <span>Hover over points to inspect individual trade delta and exit rationale</span>
          </div>
        </div>
      </div>
    </div>
  );
};
