import React, { useState } from 'react';
import { Search, Plus, Play, ChevronRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface WatchlistRadarProps {
  watchlist: string[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onRunSingle: (ticker: string) => void;
  onRunAll: () => void;
  onAddTicker: (ticker: string) => void;
  isRunning: boolean;
  onOpenScanner?: () => void;
}

export const WatchlistRadar: React.FC<WatchlistRadarProps> = ({
  watchlist,
  selectedTicker,
  onSelectTicker,
  onRunSingle,
  onRunAll,
  onAddTicker,
  isRunning,
  onOpenScanner,
}) => {
  const [newTicker, setNewTicker] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    onAddTicker(newTicker.trim().toUpperCase());
    setNewTicker('');
  };

  return (
    <div id="watchlist-radar-container" className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Liquid NSE Watchlist Radar
          </h2>
          <p className="text-xs text-stone-600">
            Target universe evaluated through the decoupled pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              id="btn-open-scanner-shortcut"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-2xs"
            >
              <Search className="h-3 w-3 text-amber-500" />
              Multi-Sector Universe Scanner
            </button>
          )}

          <button
            id="btn-scan-watchlist"
            onClick={onRunAll}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition disabled:opacity-50 shadow-xs"
          >
            <Play className={`h-3 w-3 text-amber-400 ${isRunning ? 'animate-spin' : ''}`} />
            Scan All ({watchlist.length})
          </button>
        </div>
      </div>


      {/* Tickers list */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {watchlist.map((ticker) => {
          const isSelected = selectedTicker === ticker;
          return (
            <button
              key={ticker}
              id={`ticker-pill-${ticker}`}
              onClick={() => onSelectTicker(ticker)}
              className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <span>{ticker}</span>
              <span className={`text-[10px] ${isSelected ? 'text-amber-400' : 'text-stone-400'}`}>
                .NS
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSingle(ticker);
                }}
                title="Run heartbeat on this stock"
                className={`ml-1 rounded p-0.5 transition ${
                  isSelected
                    ? 'hover:bg-stone-800 text-stone-300'
                    : 'hover:bg-stone-300 text-stone-500'
                }`}
              >
                <Play className="h-2.5 w-2.5" />
              </span>
            </button>
          );
        })}

        {/* Add custom ticker form */}
        <form onSubmit={handleAdd} className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Add NSE Symbol..."
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            className="w-28 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs uppercase font-mono placeholder:normal-case placeholder:font-sans focus:border-stone-400 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
