import React, { useState } from 'react';
import { Search, Plus, Play } from 'lucide-react';

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
    <div
      id="watchlist-radar-container"
      className="rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-white">
            Liquid NSE Watchlist Radar (Click Stock for Instant Pipeline Analysis)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Select any stock below to run the 5-stage quantitative pipeline and inspect Target, Stop &amp; Return Margin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              id="btn-open-scanner-shortcut"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition shadow-2xs cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-amber-500" />
              Multi-Sector Universe Scanner
            </button>
          )}

          <button
            id="btn-scan-watchlist"
            onClick={onRunAll}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Play className={`h-3 w-3 text-amber-300 ${isRunning ? 'animate-spin' : ''}`} />
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
              type="button"
              disabled={isRunning}
              onClick={() => onSelectTicker(ticker)}
              className={`group flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                isSelected
                  ? 'border-2 border-blue-400 bg-blue-600 text-white shadow-sm'
                  : 'border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span>{ticker}</span>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-300' : 'text-stone-500 dark:text-stone-400'}`}>
                .NS
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSingle(ticker);
                }}
                title="Run fast pipeline on this stock"
                className={`ml-0.5 rounded p-0.5 transition ${
                  isSelected
                    ? 'hover:bg-blue-700 text-white'
                    : 'hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300'
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
            className="w-32 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs uppercase font-mono text-stone-950 dark:text-white placeholder:normal-case placeholder:font-sans placeholder:text-stone-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
