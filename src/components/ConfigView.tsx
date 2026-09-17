import React, { useState } from 'react';
import { Settings, Shield, Cpu, KeyRound, Check, RefreshCw } from 'lucide-react';
import type { SystemConfig, ProductType } from '../types';

interface ConfigViewProps {
  config: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => Promise<void>;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ config, onSaveConfig }) => {
  const [paperMode, setPaperMode] = useState<boolean>(config.system.paperTradingMode);
  const [initialCapital, setInitialCapital] = useState<number>(config.system.initialPaperCapital);
  const [maxRiskPct, setMaxRiskPct] = useState<number>(config.system.maxRiskPerTradePct);
  const [maxConcentration, setMaxConcentration] = useState<number>(config.system.maxPositionConcentration);
  const [productType, setProductType] = useState<ProductType>(config.system.defaultProductType);

  const [kiteApiKey, setKiteApiKey] = useState<string>(config.zerodha.apiKey);
  const [kiteApiSecret, setKiteApiSecret] = useState<string>(config.zerodha.apiSecret);
  const [kiteAccessToken, setKiteAccessToken] = useState<string>(config.zerodha.accessToken);

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        system: {
          ...config.system,
          paperTradingMode: paperMode,
          initialPaperCapital: initialCapital,
          maxRiskPerTradePct: maxRiskPct,
          maxPositionConcentration: maxConcentration,
          defaultProductType: productType,
        },
        zerodha: {
          ...config.zerodha,
          apiKey: kiteApiKey,
          apiSecret: kiteApiSecret,
          accessToken: kiteAccessToken,
          isConnected: !paperMode && Boolean(kiteApiKey && kiteAccessToken),
        },
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="config-view-container" className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
            <Settings className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">System Configuration (config.toml)</h2>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed max-w-3xl">
              Controls operational environments, trading capital limits, and broker connectivity without modifying Python application code.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trading Mode & Capital Controls */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <Shield className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900">Trading Environment & Capital Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700">Execution Mode</label>
              <div className="mt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={paperMode}
                    onChange={() => setPaperMode(true)}
                    className="accent-stone-900"
                  />
                  <span className="font-medium text-stone-900">Paper Trading (0.05% Slippage)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={!paperMode}
                    onChange={() => setPaperMode(false)}
                    className="accent-rose-600"
                  />
                  <span className="font-medium text-rose-700">Live Zerodha Kite Connect</span>
                </label>
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Paper mode simulates orders with real ATR bounds and slippage penalty.
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700">Starting Paper Capital (₹ INR)</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700">Max Risk Per Trade (Fractional Sizing)</label>
              <select
                value={maxRiskPct}
                onChange={(e) => setMaxRiskPct(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 p-2 text-xs"
              >
                <option value={0.005}>0.5% (Conservative - ₹{initialCapital * 0.005})</option>
                <option value={0.01}>1.0% (Default - ₹{initialCapital * 0.01})</option>
                <option value={0.015}>1.5% (Moderate - ₹{initialCapital * 0.015})</option>
                <option value={0.02}>2.0% (Aggressive - ₹{initialCapital * 0.02})</option>
              </select>
              <p className="mt-1 text-[11px] text-stone-500">
                Determines max rupee loss on stop invalidation.
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700">Max Single Position Concentration</label>
              <select
                value={maxConcentration}
                onChange={(e) => setMaxConcentration(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 p-2 text-xs"
              >
                <option value={0.10}>10% Max Capital</option>
                <option value={0.20}>20% Max Capital (Default)</option>
                <option value={0.30}>30% Max Capital</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700">Default Product Type</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="product"
                    checked={productType === 'CNC'}
                    onChange={() => setProductType('CNC')}
                    className="accent-stone-900"
                  />
                  <span className="font-medium text-stone-900">CNC (Cash & Carry / Swing Delivery)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="product"
                    checked={productType === 'MIS'}
                    onChange={() => setProductType('MIS')}
                    className="accent-stone-900"
                  />
                  <span className="font-medium text-stone-900">MIS (Margin Intraday Square-off)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive & Broker Credentials Status */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900">Cognitive & Broker Hook Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Gemini API Status */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">Google Gemini API Gateway</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    config.credentials.geminiOperational
                      ? 'bg-emerald-100 text-emerald-800'
                      : config.credentials.geminiApiKeySet
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {config.credentials.geminiOperational
                    ? 'CONNECTED & ACTIVE'
                    : config.credentials.geminiApiKeySet
                    ? 'STANDBY / QUANT FALLBACK'
                    : 'STANDBY MODE'}
                </span>
              </div>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                {config.credentials.geminiMessage ||
                  (config.credentials.geminiOperational
                    ? 'Server-side Gemini 3.8 Flash model active. Multi-agent debate running live.'
                    : 'Gemini API key managed server-side. High-fidelity algorithmic quantitative committee engine is active.')}
              </p>
            </div>

            {/* Zerodha Kite Hook */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">Zerodha Kite Connect Hook</span>
                <span className="rounded bg-stone-200 px-1.5 py-0.2 text-[10px] font-bold text-stone-700">
                  {paperMode ? 'PAPER MOCK HOOK' : 'LIVE ROUTER READY'}
                </span>
              </div>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                When switching to live trading, <code className="font-mono">broker_interface.py</code> connects directly via KiteConnect API.
              </p>
            </div>
          </div>

          {/* Zerodha Credentials Inputs */}
          <div className="border-t border-stone-100 pt-3 text-xs space-y-3">
            <span className="font-semibold text-stone-700">Zerodha Kite Live Credentials (Optional / Sandbox)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-stone-500">KITE_API_KEY</span>
                <input
                  type="text"
                  value={kiteApiKey}
                  onChange={(e) => setKiteApiKey(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 p-1.5 font-mono text-[11px]"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500">KITE_API_SECRET</span>
                <input
                  type="password"
                  value={kiteApiSecret}
                  onChange={(e) => setKiteApiSecret(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 p-1.5 font-mono text-[11px]"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500">DAILY_ACCESS_TOKEN</span>
                <input
                  type="password"
                  value={kiteAccessToken}
                  onChange={(e) => setKiteAccessToken(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 p-1.5 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3">
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="h-4 w-4" />
              Configuration updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition disabled:opacity-50 shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save Configuration (config.toml)'}
          </button>
        </div>
      </form>
    </div>
  );
};
