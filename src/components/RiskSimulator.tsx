import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Calculator, Info } from 'lucide-react';

export const RiskSimulator: React.FC = () => {
  const [equity, setEquity] = useState<number>(100000);
  const [currentPrice, setCurrentPrice] = useState<number>(2980);
  const [stopLoss, setStopLoss] = useState<number>(2935);
  const [targetPrice, setTargetPrice] = useState<number>(3070);
  const [atr, setAtr] = useState<number>(34.5);
  const [bias, setBias] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');
  const [confidence, setConfidence] = useState<number>(0.75);
  const [maxRiskPct, setMaxRiskPct] = useState<number>(0.01);
  const [maxConcentrationPct, setMaxConcentrationPct] = useState<number>(0.20);

  // Deterministic checks
  const isConvictionPass = bias !== 'NEUTRAL' && confidence >= 0.65;
  const riskPerShare = Math.abs(currentPrice - stopLoss);
  const minAtrDist = atr * 1.2;
  const isAtrPass = riskPerShare >= minAtrDist;

  const maxRupeeLoss = equity * maxRiskPct;
  let targetShares = riskPerShare > 0 ? Math.floor(maxRupeeLoss / riskPerShare) : 0;

  const maxCapital = equity * maxConcentrationPct;
  const rawCapitalAllocated = targetShares * currentPrice;
  const isConcentrationCapped = rawCapitalAllocated > maxCapital;

  if (isConcentrationCapped && currentPrice > 0) {
    targetShares = Math.floor(maxCapital / currentPrice);
  }

  const isSharesPass = targetShares > 0;
  const isApproved = isConvictionPass && isAtrPass && isSharesPass;

  const capitalAllocated = targetShares * currentPrice;
  const rupeeRisk = targetShares * riskPerShare;
  const riskReward = Math.abs(targetPrice - currentPrice) / Math.max(riskPerShare, 0.01);

  return (
    <div id="risk-simulator-container" className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
            <Calculator className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Deterministic Risk Governor Math Lab</h2>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed max-w-3xl">
              In the AI Bot Advance architecture, <strong>the LLM is strictly prohibited from sizing trades</strong>.
              This interactive lab exposes the exact mathematical formulas running in <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-stone-800">risk_engine.py</code> that protect the portfolio from ruin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Simulation Inputs</h3>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-stone-700">Account Equity</span>
              <span className="font-mono font-bold text-stone-900">₹{equity.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="20000"
              max="500000"
              step="10000"
              value={equity}
              onChange={(e) => setEquity(Number(e.target.value))}
              className="mt-1 w-full accent-stone-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-stone-700">Current Market Price (₹)</span>
              <span className="font-mono font-bold text-stone-900">₹{currentPrice}</span>
            </div>
            <input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-medium text-stone-700">Stop Loss (₹)</span>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-stone-700">Target Price (₹)</span>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-stone-700">14-Day ATR Volatility (₹)</span>
              <span className="font-mono font-bold text-amber-700">₹{atr}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={atr}
              onChange={(e) => setAtr(Number(e.target.value))}
              className="mt-1 w-full accent-amber-600"
            />
          </div>

          <div className="border-t border-stone-100 pt-3">
            <span className="text-xs font-semibold text-stone-700">Gemini Cognitive Signal</span>
            <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
              {(['BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBias(b)}
                  className={`rounded-md py-1 font-semibold transition text-[11px] ${
                    bias === b ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-stone-700">Conviction Score</span>
              <span className="font-mono font-bold">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="mt-1 w-full accent-blue-600"
            />
            <span className="text-[10px] text-stone-400">Must be &ge; 65% (0.65) to pass</span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
            <div>
              <span className="text-[11px] font-medium text-stone-700">Max Risk / Trade</span>
              <select
                value={maxRiskPct}
                onChange={(e) => setMaxRiskPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 p-1 text-xs"
              >
                <option value={0.005}>0.5% (₹{equity * 0.005})</option>
                <option value={0.01}>1.0% (₹{equity * 0.01})</option>
                <option value={0.02}>2.0% (₹{equity * 0.02})</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] font-medium text-stone-700">Max Concentration</span>
              <select
                value={maxConcentrationPct}
                onChange={(e) => setMaxConcentrationPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 p-1 text-xs"
              >
                <option value={0.10}>10% (₹{equity * 0.1})</option>
                <option value={0.20}>20% (₹{equity * 0.2})</option>
                <option value={0.30}>30% (₹{equity * 0.3})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Mathematical Verification & Order Ticket */}
        <div className="space-y-4 lg:col-span-2">
          {/* Verdict Banner */}
          <div
            className={`rounded-xl border p-4 shadow-xs transition ${
              isApproved ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isApproved ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-base font-extrabold text-stone-900">
                  Ticket Status: {isApproved ? 'APPROVED' : 'REJECTED'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-stone-600">
                R:R Ratio: 1:{riskReward.toFixed(2)}
              </span>
            </div>

            {!isApproved && (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                Reason:{' '}
                {!isConvictionPass
                  ? `Low conviction (${confidence.toFixed(2)}) or NEUTRAL bias (needs >= 0.65)`
                  : !isAtrPass
                  ? `Stop loss too tight (Risk: ₹${riskPerShare.toFixed(2)} < 1.2x ATR: ₹${minAtrDist.toFixed(2)})`
                  : 'Position size calculated to 0 shares under risk boundaries'}
              </p>
            )}
          </div>

          {/* Mathematical Checks Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gate 1 */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">1. Conviction Gate</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    isConvictionPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isConvictionPass ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="mt-1 text-stone-500">Requires Directional Bias and Conviction &ge; 0.65</p>
              <div className="mt-2 rounded bg-stone-50 p-2 font-mono text-[11px] text-stone-700">
                Bias: {bias} | Confidence: {(confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Gate 2 */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">2. ATR Volatility Spacing</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    isAtrPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAtrPass ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="mt-1 text-stone-500">Stop Distance |CMP - SL| must be &ge; 1.2x ATR</p>
              <div className="mt-2 rounded bg-stone-50 p-2 font-mono text-[11px] text-stone-700">
                Risk/Share: ₹{riskPerShare.toFixed(2)} vs Min: ₹{minAtrDist.toFixed(2)} ({(riskPerShare / Math.max(atr, 0.1)).toFixed(2)}x ATR)
              </div>
            </div>

            {/* Gate 3 */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">3. Fractional Risk Sizing</span>
                <span className="font-mono text-emerald-700 font-bold">1% Equity Cap</span>
              </div>
              <p className="mt-1 text-stone-500">max_rupee_loss = equity * risk_pct</p>
              <div className="mt-2 rounded bg-stone-50 p-2 font-mono text-[11px] text-stone-700">
                ₹{equity} &times; {(maxRiskPct * 100)}% = ₹{maxRupeeLoss.toFixed(2)} max loss
              </div>
            </div>

            {/* Gate 4 */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">4. Concentration Cap</span>
                <span className="font-mono text-blue-700 font-bold">20% Total Portfolio</span>
              </div>
              <p className="mt-1 text-stone-500">Single position capital &le; 20% equity</p>
              <div className="mt-2 rounded bg-stone-50 p-2 font-mono text-[11px] text-stone-700">
                Max Allowed: ₹{maxCapital.toFixed(2)} {isConcentrationCapped ? '(Cap Active!)' : '(Within Cap)'}
              </div>
            </div>
          </div>

          {/* Generated Order Ticket */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Computed Order Ticket
            </h4>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-stone-400">Position Size</span>
                <p className="text-lg font-mono font-bold text-stone-900">{targetShares} shares</p>
              </div>
              <div>
                <span className="text-stone-400">Capital Allocated</span>
                <p className="text-lg font-mono font-bold text-stone-900">₹{capitalAllocated.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-stone-400">Rupee Risk on Stop</span>
                <p className="text-lg font-mono font-bold text-rose-700">₹{rupeeRisk.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-stone-400">Potential Reward</span>
                <p className="text-lg font-mono font-bold text-emerald-700">
                  ₹{(targetShares * Math.abs(targetPrice - currentPrice)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
