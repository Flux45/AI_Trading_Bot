import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  SlidersHorizontal,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  DollarSign,
  Briefcase,
  ChevronRight,
  Eye,
  X,
  Flame,
} from 'lucide-react';
import type {
  NewsBasedRecommendation,
  NewsItem,
  PurchaseOptionType,
  SystemConfig,
  MarketSentimentSummary,
  ExecutedPosition,
} from '../types';
import { MarketSentimentDial } from './MarketSentimentDial';
import { MarketSentimentTrendChart } from './MarketSentimentTrendChart';
import { ActiveTradesLivePnl } from './ActiveTradesLivePnl';

interface NewsBasedRecommendationsProps {
  systemConfig: SystemConfig;
  onSelectStockForPipeline: (ticker: string) => void;
  onTradeExecuted?: () => void;
  positions?: ExecutedPosition[];
  onClosePosition?: (orderId: string, exitPrice: number) => Promise<void>;
  onViewPortfolio?: () => void;
}

export const NewsBasedRecommendations: React.FC<NewsBasedRecommendationsProps> = ({
  systemConfig,
  onSelectStockForPipeline,
  onTradeExecuted,
  positions = [],
  onClosePosition,
  onViewPortfolio,
}) => {
  const [recommendations, setRecommendations] = useState<NewsBasedRecommendation[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('ALL');
  const [selectedCatalyst, setSelectedCatalyst] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'conviction' | 'short_upside' | 'medium_upside'>('conviction');

  // Modal state for direct purchase
  const [buyModalItem, setBuyModalItem] = useState<NewsBasedRecommendation | null>(null);
  const [customShares, setCustomShares] = useState<number>(10);
  const [isExecutingBuy, setIsExecutingBuy] = useState<boolean>(false);
  const [executionNotice, setExecutionNotice] = useState<string | null>(null);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentSummary | null>(null);

  // Raw news stream toggle
  const [showNewsFeedDrawer, setShowNewsFeedDrawer] = useState<boolean>(false);

  // Fetch recommendations
  const fetchNewsRecommendations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/news-recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setNewsItems(data.newsItems || []);
        if (data.marketSentiment) setMarketSentiment(data.marketSentiment);
        setLastScanned(data.lastScanned || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to load news recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger on-demand live news scan across leading sites
  const handleScanNews = async () => {
    try {
      setIsScanning(true);
      const res = await fetch('/api/news-recommendations/scan', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setNewsItems(data.newsItems || []);
        if (data.marketSentiment) setMarketSentiment(data.marketSentiment);
        setLastScanned(data.lastScanned || new Date().toISOString());
      }
    } catch (err) {
      console.error('News scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchNewsRecommendations();
  }, []);

  // Handle direct purchase execution
  const handleConfirmPurchase = async () => {
    if (!buyModalItem) return;
    try {
      setIsExecutingBuy(true);
      const res = await fetch('/api/news-recommendations/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: buyModalItem.ticker,
          customShares,
          customStopLoss: buyModalItem.stopLoss,
          customTarget: buyModalItem.targetPriceShort,
          headline: buyModalItem.headline,
          catalystType: buyModalItem.catalystType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExecutionNotice(
          `Successfully executed purchase of ${customShares} shares of ${buyModalItem.ticker} @ ₹${buyModalItem.currentPrice.toLocaleString('en-IN')}. Position added to active portfolio and recorded in ledger.`
        );
        if (onTradeExecuted) {
          onTradeExecuted();
        }
        setTimeout(() => {
          setBuyModalItem(null);
          setExecutionNotice(null);
        }, 3200);
      } else {
        const err = await res.json();
        alert(`Execution failed: ${err.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Execution network error: ${e?.message || e}`);
    } finally {
      setIsExecutingBuy(false);
    }
  };

  // Unique sectors for dropdown
  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    recommendations.forEach((r) => set.add(r.sector));
    return Array.from(set).sort();
  }, [recommendations]);

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter((rec) => {
        if (selectedOption !== 'ALL' && rec.purchaseOption !== selectedOption) {
          return false;
        }
        if (selectedCatalyst !== 'ALL' && rec.catalystType !== selectedCatalyst) {
          return false;
        }
        if (selectedSector !== 'ALL' && rec.sector !== selectedSector) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTicker = rec.ticker.toLowerCase().includes(q);
          const matchCompany = rec.companyName.toLowerCase().includes(q);
          const matchHeadline = rec.headline.toLowerCase().includes(q);
          const matchThesis = rec.catalystThesis.toLowerCase().includes(q);
          if (!matchTicker && !matchCompany && !matchHeadline && !matchThesis) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'conviction') {
          return b.convictionScore - a.convictionScore;
        }
        if (sortBy === 'short_upside') {
          return b.targetShortUpsidePct - a.targetShortUpsidePct;
        }
        if (sortBy === 'medium_upside') {
          return b.targetMediumUpsidePct - a.targetMediumUpsidePct;
        }
        return 0;
      });
  }, [recommendations, selectedOption, selectedCatalyst, selectedSector, searchQuery, sortBy]);

  // Aggregate metrics
  const totalRecommendations = recommendations.length;
  const strongBuysCount = recommendations.filter((r) => r.purchaseOption === 'STRONG BUY').length;
  const avgShortUpside = recommendations.length
    ? (recommendations.reduce((acc, r) => acc + r.targetShortUpsidePct, 0) / recommendations.length).toFixed(1)
    : '0.0';

  // Format purchase option badge color
  const getOptionBadgeStyle = (option: PurchaseOptionType) => {
    switch (option) {
      case 'STRONG BUY':
        return 'bg-emerald-950 text-emerald-100 border-emerald-800/80 ring-1 ring-emerald-500/30';
      case 'BREAKOUT BUY':
        return 'bg-violet-950 text-violet-100 border-violet-800/80 ring-1 ring-violet-500/30';
      case 'ACCUMULATE ON DIPS':
        return 'bg-sky-950 text-sky-100 border-sky-800/80 ring-1 ring-sky-500/30';
      case 'MOMENTUM BUY':
        return 'bg-amber-950 text-amber-100 border-amber-800/80 ring-1 ring-amber-500/30';
      default:
        return 'bg-stone-800 text-stone-200 border-stone-700';
    }
  };

  return (
    <div id="news-based-recommendations-container" className="space-y-6">
      {/* 1. Header & Live News Ingestion Banner */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white tracking-wide">
                <Newspaper className="h-3.5 w-3.5 text-orange-400" />
                Leading Media Radar
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                <Zap className="h-3 w-3 text-orange-600" />
                Live Catalyst Ingestion
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              News Based Recommendations
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Automated news scanning across leading financial portals (The Economic Times, Moneycontrol, LiveMint, Business Standard, CNBC-TV18, Reuters) translated into structured, quantitative stock purchase options.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-trigger-news-scan"
              onClick={handleScanNews}
              disabled={isScanning}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin text-orange-400' : ''}`} />
              {isScanning ? 'Scanning All Sites...' : 'Scan Latest News Now'}
            </button>

            <button
              id="btn-toggle-news-drawer"
              onClick={() => setShowNewsFeedDrawer(!showNewsFeedDrawer)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              <Eye className="h-4 w-4 text-stone-500" />
              {showNewsFeedDrawer ? 'Hide News Feed' : `View Live Feed (${newsItems.length})`}
            </button>
          </div>
        </div>

        {/* Leading Media Sources Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
          <span className="font-semibold text-stone-700">Monitored Sources:</span>
          {['The Economic Times', 'Moneycontrol', 'LiveMint', 'Business Standard', 'CNBC-TV18', 'Reuters India'].map(
            (source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {source}
              </span>
            )
          )}
          {lastScanned && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-stone-400">
              <Clock className="h-3 w-3" />
              Scanned: {new Date(lastScanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Active Trades Live Profit/Loss Bar (if any open positions exist) */}
      {positions && positions.length > 0 && (
        <ActiveTradesLivePnl
          positions={positions}
          onClosePosition={onClosePosition}
          onViewPortfolio={onViewPortfolio}
          compact={true}
        />
      )}

      {/* 2. Market Sentiment Dial & Executive Intelligence Overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* Market Sentiment Dial using precision gauge chart */}
        <div className="lg:col-span-5 flex flex-col">
          <MarketSentimentDial
            sentiment={marketSentiment}
            isLoading={isScanning}
            onRefresh={handleScanNews}
          />
        </div>

        {/* 4 Executive Stat Cards in a 2x2 grid */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Stock Purchase Options
              </span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{totalRecommendations}</span>
              <span className="text-xs font-medium text-emerald-600">Active Catalysts</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Screened for risk-reward &gt; 2.0</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Strong / Breakout Buys
              </span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{strongBuysCount}</span>
              <span className="text-xs font-medium text-orange-700">Immediate Catalyst</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Mega orders, earnings surprises</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Avg Target Upside
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">+{avgShortUpside}%</span>
              <span className="text-xs font-medium text-stone-500">Short-Term (1–3 wks)</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Grounded in 2.2x 14-day ATR</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Scanned News Articles
              </span>
              <Newspaper className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{newsItems.length}</span>
              <span className="text-xs font-medium text-stone-500">Live Ingested</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Filtered for actionable market impact</p>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart: Aggregated Sentiment Score Over the Last 30 Days */}
      <MarketSentimentTrendChart
        trendData={marketSentiment?.trend30d}
        summary={marketSentiment?.trendSummary}
        currentScore={marketSentiment?.overallScore || 80}
      />

      {/* 3. Live News Feed Ticker / Stream Drawer (Expandable) */}
      {showNewsFeedDrawer && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm transition">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-stone-700" />
              <h2 className="text-sm font-bold text-stone-900">
                Live News Wire Feed from Leading Portals
              </h2>
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-700">
                {newsItems.length} headlines
              </span>
            </div>
            <button
              onClick={() => setShowNewsFeedDrawer(false)}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
            {newsItems.length === 0 ? (
              <p className="py-4 text-center text-xs text-stone-500">
                No raw news items stored. Click &quot;Scan Latest News Now&quot; above to poll feeds.
              </p>
            ) : (
              newsItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-xs hover:border-stone-300"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900">{item.source}</span>
                      <span className="rounded-sm bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                        {item.category}
                      </span>
                      {item.tickersMentioned && item.tickersMentioned.length > 0 && (
                        <div className="flex gap-1">
                          {item.tickersMentioned.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-orange-100 px-1.5 py-0.2 font-bold text-orange-800 text-[10px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-stone-400">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString() : 'Live'}
                      </span>
                    </div>
                    <p className="font-medium text-stone-800">{item.title}</p>
                    {item.summary && item.summary !== item.title && (
                      <p className="text-[11px] text-stone-500 line-clamp-2">{item.summary}</p>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded p-1 text-stone-400 hover:text-stone-700"
                      title="Read original article"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Control Panel */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            id="search-news-recommendations"
            type="text"
            placeholder="Search by ticker (e.g. HAL, LT), company, or news catalyst keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Option filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-stone-500" />
            <select
              id="filter-purchase-option"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 focus:border-stone-900 focus:outline-none"
            >
              <option value="ALL">All Purchase Options</option>
              <option value="STRONG BUY">Strong Buy</option>
              <option value="BREAKOUT BUY">Breakout Buy</option>
              <option value="ACCUMULATE ON DIPS">Accumulate on Dips</option>
              <option value="MOMENTUM BUY">Momentum Buy</option>
            </select>
          </div>

          {/* Catalyst filter */}
          <select
            id="filter-catalyst-type"
            value={selectedCatalyst}
            onChange={(e) => setSelectedCatalyst(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 focus:border-stone-900 focus:outline-none"
          >
            <option value="ALL">All News Catalysts</option>
            <option value="Mega Order Win / Capex">Mega Order Wins</option>
            <option value="Earnings Outperformance">Earnings Surprises</option>
            <option value="Brokerage Upgrade">Brokerage Upgrades</option>
            <option value="Government Policy / PLI">Policy &amp; Approvals</option>
            <option value="Capacity Expansion">Capacity Expansion</option>
          </select>

          {/* Sector filter */}
          <select
            id="filter-sector-type"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 focus:border-stone-900 focus:outline-none"
          >
            <option value="ALL">All Sectors</option>
            {uniqueSectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Sort Control */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-stone-500" />
            <select
              id="sort-news-recommendations"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 focus:border-stone-900 focus:outline-none"
            >
              <option value="conviction">Sort: Highest Conviction</option>
              <option value="short_upside">Sort: Short-Term Upside</option>
              <option value="medium_upside">Sort: Medium-Term Upside</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Recommendations Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
          <p className="mt-3 text-sm font-medium text-stone-700">
            Ingesting news feeds from leading financial sites and evaluating purchase options...
          </p>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <Newspaper className="mx-auto h-10 w-10 text-stone-300" />
          <h2 className="mt-3 text-base font-semibold text-stone-900">
            No News Recommendations Match Filter
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Try adjusting your search query or reset filters to view all scanned news options.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedOption('ALL');
              setSelectedCatalyst('ALL');
              setSelectedSector('ALL');
            }}
            className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredRecommendations.map((rec) => {
            return (
              <div
                key={rec.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
              >
                <div>
                  {/* Top Card Header: Ticker, Company & Purchase Option Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold tracking-tight text-stone-900">
                          {rec.ticker}
                        </span>
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {rec.sector}
                        </span>
                      </div>
                      <h2 className="text-xs font-medium text-stone-500">{rec.companyName}</h2>
                    </div>

                    {/* Purchase Option Tag */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-md border px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-xs ${getOptionBadgeStyle(
                          rec.purchaseOption
                        )}`}
                      >
                        {rec.purchaseOption}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-600">
                        Conviction: <span className="text-stone-900 font-bold">{rec.convictionScore}/100</span>
                      </span>
                    </div>
                  </div>

                  {/* News Source, Timestamp & Catalyst Tag */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 font-semibold text-stone-800">
                      <Newspaper className="h-3 w-3 text-orange-500" />
                      {rec.newsSource}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200/60">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      {rec.catalystType}
                    </span>
                    <span className="text-stone-400 text-[11px] ml-auto">{rec.publishedTime}</span>
                  </div>

                  {/* Headline */}
                  <div className="mt-2.5">
                    <a
                      href={rec.newsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-start gap-1 text-sm font-bold text-stone-900 hover:text-orange-600 transition"
                    >
                      <span>{rec.headline}</span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-orange-600" />
                    </a>
                  </div>

                  {/* Catalyst Thesis & Why Buy Now */}
                  <div className="mt-3 space-y-2 rounded-lg bg-stone-50 p-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">Catalyst Thesis: </span>
                      <span className="text-stone-600">{rec.catalystThesis}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-800">Why Buy Now: </span>
                      <span className="text-stone-600">{rec.whyBuyNow}</span>
                    </div>
                    <div className="flex items-start gap-1.5 pt-1 border-t border-stone-200/60 text-stone-500">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                      <span className="text-[11px]">
                        <strong className="text-stone-700">Risk to Watch:</strong> {rec.risksToWatch}
                      </span>
                    </div>
                  </div>

                  {/* Price, Entry Range, Targets & Stop Loss */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-white p-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-[11px] font-medium text-stone-500">Current Price</span>
                      <div className="font-bold text-stone-900">
                        ₹{rec.currentPrice.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-stone-400">Live Yahoo Feed</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-stone-500">Target 1 (Short)</span>
                      <div className="font-bold text-emerald-700">
                        ₹{rec.targetPriceShort.toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex rounded bg-emerald-50 px-1 text-[10px] font-bold text-emerald-700">
                        +{rec.targetShortUpsidePct}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-stone-500">Target 2 (Medium)</span>
                      <div className="font-bold text-emerald-800">
                        ₹{rec.targetPriceMedium.toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800">
                        +{rec.targetMediumUpsidePct}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-stone-500">Invalidation Stop</span>
                      <div className="font-bold text-rose-700">
                        ₹{rec.stopLoss.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] font-medium text-rose-600">
                        -{rec.riskPct}% (R:R {rec.riskRewardRatio}:1)
                      </span>
                    </div>
                  </div>

                  {/* Additional Execution Specs */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500 px-1">
                    <span>
                      Suggested Entry Range: <strong className="text-stone-800">{rec.entryRange}</strong>
                    </span>
                    <span>
                      Horizon: <strong className="text-stone-800">{rec.timeHorizon}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-5 flex items-center gap-2.5 border-t border-stone-100 pt-4">
                  {/* Action 1: Execute Recommended Purchase */}
                  <button
                    id={`btn-buy-news-option-${rec.ticker}`}
                    onClick={() => {
                      setBuyModalItem(rec);
                      setCustomShares(rec.recommendedShares || 10);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-stone-800"
                  >
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    Execute Purchase Option
                  </button>

                  {/* Action 2: Send to 5-Agent Multi-Agent Committee Debate */}
                  <button
                    id={`btn-pipeline-news-option-${rec.ticker}`}
                    onClick={() => onSelectStockForPipeline(rec.ticker)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 hover:border-stone-400"
                  >
                    <Bot className="h-3.5 w-3.5 text-stone-600" />
                    Analyze in 5-Agent Pipeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Purchase Confirmation Modal */}
      {buyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-stone-900">{buyModalItem.ticker}</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {buyModalItem.purchaseOption}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{buyModalItem.companyName}</p>
              </div>
              <button
                onClick={() => setBuyModalItem(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {executionNotice ? (
              <div className="my-6 rounded-lg bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                {executionNotice}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* News Catalyst Brief */}
                <div className="rounded-lg bg-stone-50 p-3 text-xs">
                  <span className="font-semibold text-stone-700">News Catalyst: </span>
                  <span className="text-stone-600">{buyModalItem.headline}</span>
                  <div className="mt-1 text-[11px] text-stone-400">
                    Source: {buyModalItem.newsSource} • {buyModalItem.catalystType}
                  </div>
                </div>

                {/* Sizing & Capital Controls */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-stone-600">Current Price</label>
                    <div className="mt-1 font-bold text-stone-900 text-sm">
                      ₹{buyModalItem.currentPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-stone-600">Order Action</label>
                    <div className="mt-1 font-bold text-emerald-700 text-sm">BUY (CNC / Delivery)</div>
                  </div>
                </div>

                {/* Shares input */}
                <div>
                  <div className="flex justify-between text-xs">
                    <label className="font-semibold text-stone-700">Quantity (Shares)</label>
                    <span className="text-stone-500">
                      Total Capital: ₹{(customShares * buyModalItem.currentPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customShares}
                    onChange={(e) => setCustomShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Sized to adhere to account risk bounds (max 1% equity loss to stop-loss).
                  </p>
                </div>

                {/* Targets Summary */}
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs">
                  <div>
                    <span className="text-stone-500">Stop-Loss Order:</span>
                    <div className="font-bold text-rose-700">
                      ₹{buyModalItem.stopLoss.toLocaleString('en-IN')} (-{buyModalItem.riskPct}%)
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-500">Target Order:</span>
                    <div className="font-bold text-emerald-700">
                      ₹{buyModalItem.targetPriceShort.toLocaleString('en-IN')} (+{buyModalItem.targetShortUpsidePct}%)
                    </div>
                  </div>
                </div>

                {/* Confirmation Footer */}
                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
                  <button
                    onClick={() => setBuyModalItem(null)}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-news-purchase"
                    onClick={handleConfirmPurchase}
                    disabled={isExecutingBuy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-60"
                  >
                    {isExecutingBuy ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-400" />
                        Executing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Confirm &amp; Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
