import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  X,
  Sliders,
  Volume2,
  VolumeX,
  Bell,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { PnlToastAlert, PnlAlertThresholds } from '../types';

interface ToastNotificationCenterProps {
  alerts: PnlToastAlert[];
  thresholds: PnlAlertThresholds;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onUpdateThresholds: (thresholds: Partial<PnlAlertThresholds>) => void;
  onSelectPosition?: (orderId: string) => void;
  onTriggerTestAlert?: (type: 'profit' | 'loss') => void;
}

export const ToastNotificationCenter: React.FC<ToastNotificationCenterProps> = ({
  alerts,
  thresholds,
  isOpen,
  onOpenChange,
  onDismiss,
  onClearAll,
  onUpdateThresholds,
  onSelectPosition,
  onTriggerTestAlert,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const showSettingsModal = isOpen !== undefined ? isOpen : internalOpen;
  const setShowSettingsModal = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    setInternalOpen(open);
  };
  const [localThresholds, setLocalThresholds] = useState<PnlAlertThresholds>(thresholds);

  // Sync local thresholds when prop updates
  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  const handleSaveSettings = () => {
    onUpdateThresholds(localThresholds);
    setShowSettingsModal(false);
  };

  return (
    <>
      {/* Floating Bottom-Right Toast Stack */}
      <div
        id="toast-notification-container"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {alerts.map((alert) => (
            <ToastItem
              key={alert.id}
              alert={alert}
              onDismiss={() => onDismiss(alert.id)}
              onViewTrade={() => {
                if (onSelectPosition) {
                  onSelectPosition(alert.orderId);
                }
                onDismiss(alert.id);
              }}
            />
          ))}
        </AnimatePresence>

        {/* Floating Quick Settings Trigger when there are alerts or user wants to configure */}
        {alerts.length > 0 && (
          <div className="flex justify-end gap-2 pointer-events-auto pr-1">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow-md border border-stone-200 backdrop-blur-xs hover:bg-stone-50 transition"
              title="Configure Alert Thresholds"
            >
              <Sliders className="h-3 w-3 text-stone-500" />
              <span>Thresholds</span>
            </button>
            <button
              onClick={onClearAll}
              className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-500 shadow-md border border-stone-200 backdrop-blur-xs hover:bg-stone-50 hover:text-stone-800 transition"
            >
              Dismiss All ({alerts.length})
            </button>
          </div>
        )}
      </div>

      {/* Threshold Configuration Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Live PnL Alert Thresholds</h3>
                  <p className="text-xs text-stone-500">Configure toast triggers for active trade profits & drawdowns</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-stone-700">
              {/* Master Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 border border-stone-200/80">
                <div>
                  <span className="font-semibold text-stone-900 text-xs">Enable PnL Alert Toasts</span>
                  <p className="text-[11px] text-stone-500">Monitor live active trades and pop up notifications</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localThresholds.enabled}
                    onChange={(e) => setLocalThresholds((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-stone-300 peer-checked:bg-emerald-600 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 border border-stone-200/80">
                <div className="flex items-center gap-2">
                  {localThresholds.soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-stone-400" />
                  )}
                  <div>
                    <span className="font-semibold text-stone-900 text-xs">Audio Chime</span>
                    <p className="text-[11px] text-stone-500">Synthesize gentle rising/descending audio tone</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localThresholds.soundEnabled}
                    onChange={(e) => setLocalThresholds((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-stone-300 peer-checked:bg-emerald-600 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              {/* Thresholds Input Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Profit Threshold % */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                  <label className="text-xs font-semibold text-emerald-900 block">
                    Profit Threshold (%)
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-xs font-bold text-emerald-700 mr-1">+</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={localThresholds.profitPct}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({ ...prev, profitPct: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-emerald-300 bg-white px-2 py-1 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-700 ml-1.5">%</span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 mt-1 block">Trigger when gain &ge; this %</span>
                </div>

                {/* Loss Threshold % */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                  <label className="text-xs font-semibold text-rose-900 block">
                    Loss Threshold (%)
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-xs font-bold text-rose-700 mr-1">-</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={Math.abs(localThresholds.lossPct)}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          lossPct: -Math.abs(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="w-full rounded-lg border border-rose-300 bg-white px-2 py-1 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-700 ml-1.5">%</span>
                  </div>
                  <span className="text-[10px] text-rose-700/80 mt-1 block">Trigger when loss &le; this %</span>
                </div>

                {/* Profit Threshold ₹ */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <label className="text-xs font-semibold text-stone-700 block">
                    Profit Threshold (₹)
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-xs font-bold text-stone-500 mr-1">+₹</span>
                    <input
                      type="number"
                      step="50"
                      min="10"
                      value={localThresholds.profitRupees}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({ ...prev, profitRupees: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Absolute profit in INR</span>
                </div>

                {/* Loss Threshold ₹ */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <label className="text-xs font-semibold text-stone-700 block">
                    Loss Threshold (₹)
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-xs font-bold text-stone-500 mr-1">-₹</span>
                    <input
                      type="number"
                      step="50"
                      min="10"
                      value={Math.abs(localThresholds.lossRupees)}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          lossRupees: -Math.abs(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Absolute drawdown in INR</span>
                </div>
              </div>

              {/* Target & Stop Alert Toggles */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-stone-700 font-medium">Alert when Trade Reaches Target Price</span>
                  <input
                    type="checkbox"
                    checked={localThresholds.alertOnTargetHit}
                    onChange={(e) =>
                      setLocalThresholds((prev) => ({ ...prev, alertOnTargetHit: e.target.checked }))
                    }
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-stone-700 font-medium">Alert when Trade Hits Stop-Loss Margin</span>
                  <input
                    type="checkbox"
                    checked={localThresholds.alertOnStopHit}
                    onChange={(e) =>
                      setLocalThresholds((prev) => ({ ...prev, alertOnStopHit: e.target.checked }))
                    }
                    className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              {/* Test Notification Buttons */}
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3">
                <span className="text-xs font-semibold text-stone-600 block mb-2">Simulate Test Toast Alert</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onTriggerTestAlert?.('profit')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Test Profit Toast
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestAlert?.('loss')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Test Loss Toast
                  </button>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition"
              >
                Save Thresholds
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Subcomponent for individual toast
interface ToastItemProps {
  alert: PnlToastAlert;
  onDismiss: () => void;
  onViewTrade: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ alert, onDismiss, onViewTrade }) => {
  const [isPaused, setIsPaused] = useState(false);
  const duration = alert.duration || 6500;
  const [remainingTime, setRemainingTime] = useState(duration);

  // Keep a stable ref to onDismiss so interval/effect closures don't trigger unnecessary re-subscriptions
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismissedRef = useRef(false);
  const handleDismiss = useCallback(() => {
    if (!dismissedRef.current) {
      dismissedRef.current = true;
      onDismissRef.current();
    }
  }, []);

  // Countdown timer that strictly updates remainingTime without executing parent side effects during render/reducer
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - intervalTime;
        return next > 0 ? next : 0;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Cleanly trigger dismissal in an effect once remainingTime elapses to 0
  useEffect(() => {
    if (remainingTime <= 0) {
      handleDismiss();
    }
  }, [remainingTime, handleDismiss]);

  const progress = Math.max(0, Math.min(100, (remainingTime / duration) * 100));

  const isProfit = alert.type === 'profit_threshold' || alert.type === 'target_hit';
  const isLoss = alert.type === 'loss_threshold' || alert.type === 'stop_hit';

  const badgeColor =
    alert.type === 'profit_threshold'
      ? 'bg-emerald-500 text-white'
      : alert.type === 'target_hit'
      ? 'bg-blue-600 text-white'
      : alert.type === 'stop_hit'
      ? 'bg-rose-600 text-white'
      : 'bg-rose-500 text-white';

  const cardBorder =
    alert.type === 'profit_threshold'
      ? 'border-emerald-200 bg-white shadow-lg'
      : alert.type === 'target_hit'
      ? 'border-blue-200 bg-white shadow-lg'
      : alert.type === 'stop_hit'
      ? 'border-rose-200 bg-white shadow-lg'
      : 'border-rose-200 bg-white shadow-lg';

  const progressColor =
    alert.type === 'profit_threshold'
      ? 'bg-emerald-500'
      : alert.type === 'target_hit'
      ? 'bg-blue-500'
      : 'bg-rose-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-4 ${cardBorder}`}
    >
      {/* Top Bar with Icon, Tag & Dismiss */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ${badgeColor}`}>
            {alert.type === 'profit_threshold' && <TrendingUp className="h-4 w-4" />}
            {alert.type === 'target_hit' && <Target className="h-4 w-4" />}
            {alert.type === 'loss_threshold' && <TrendingDown className="h-4 w-4" />}
            {alert.type === 'stop_hit' && <ShieldAlert className="h-4 w-4" />}
            {alert.type === 'info' && <Sparkles className="h-4 w-4" />}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-stone-900 text-sm tracking-tight">{alert.ticker}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  alert.action === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {alert.action}
              </span>
              <span className="text-[10px] font-semibold text-stone-400">&bull; {alert.thresholdReached}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Alert Body */}
      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs text-stone-600 leading-relaxed font-sans">{alert.message}</p>
          <p className="text-[10px] font-mono text-stone-400 mt-0.5">
            CMP: ₹{alert.currentPrice.toFixed(2)} &bull; {alert.timestamp}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`font-mono text-base font-extrabold flex items-center justify-end gap-1 ${
              isProfit ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            <span>
              {alert.pnl >= 0 ? '+' : ''}₹{alert.pnl.toFixed(2)}
            </span>
          </div>
          <span
            className={`font-mono text-xs font-bold ${
              alert.pnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            ({alert.pnlPct >= 0 ? '+' : ''}{alert.pnlPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
        <span className="text-[10px] text-stone-400 italic">Live PnL Monitor</span>
        <button
          onClick={() => {
            handleDismiss();
            onViewTrade();
          }}
          className="flex items-center gap-1 text-xs font-bold text-stone-800 hover:text-blue-600 transition"
        >
          <span>View Trade Details</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Progress Bar for Auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100">
        <div
          className={`h-full ${progressColor} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
