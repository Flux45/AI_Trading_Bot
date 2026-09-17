import { useState, useEffect, useRef, useCallback } from 'react';
import type { ExecutedPosition, PnlToastAlert, PnlAlertThresholds } from '../types';
import { playProfitChime, playLossWarning, playTargetReachedSound } from '../utils/alertSounds';

const STORAGE_KEY = 'ai_bot_advance_pnl_alert_thresholds';

const DEFAULT_THRESHOLDS: PnlAlertThresholds = {
  profitPct: 1.5, // 1.5% profit
  lossPct: -1.0, // -1.0% loss
  profitRupees: 200, // ₹200
  lossRupees: -150, // -₹150
  alertOnTargetHit: true,
  alertOnStopHit: true,
  enabled: true,
  soundEnabled: true,
};

export function usePnlAlerts(positions: ExecutedPosition[]) {
  // Load saved thresholds or default
  const [thresholds, setThresholds] = useState<PnlAlertThresholds>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) };
      } catch {
        // Ignore localStorage error
      }
    }
    return DEFAULT_THRESHOLDS;
  });

  const [alerts, setAlerts] = useState<PnlToastAlert[]>([]);

  // Ref to track which alerts have already fired for which orders to prevent spamming
  const alertedStatesRef = useRef<Map<string, Set<string>>>(new Map());

  // Save thresholds when updated
  const updateThresholds = useCallback((updated: Partial<PnlAlertThresholds>) => {
    setThresholds((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Helper to add toast alert with a max queue of 5 items
  const pushAlert = useCallback((alert: Omit<PnlToastAlert, 'id' | 'createdAt'>) => {
    const newAlert: PnlToastAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      duration: alert.duration || 6500,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
  }, []);

  // Monitor live positions whenever they update
  useEffect(() => {
    if (!thresholds.enabled || positions.length === 0) return;

    const currentOrderIds = new Set(positions.map((p) => p.order_id));

    // Cleanup closed orders from tracking map
    for (const orderId of alertedStatesRef.current.keys()) {
      if (!currentOrderIds.has(orderId)) {
        alertedStatesRef.current.delete(orderId);
      }
    }

    // Evaluate each active position
    positions.forEach((pos) => {
      const orderId = pos.order_id;
      if (!alertedStatesRef.current.has(orderId)) {
        alertedStatesRef.current.set(orderId, new Set());
      }
      const triggered = alertedStatesRef.current.get(orderId)!;

      const curPrice = pos.current_price || pos.fill_price;
      const fillPrice = pos.fill_price;
      const shares = pos.shares;

      const pnl =
        pos.action === 'BUY'
          ? (curPrice - fillPrice) * shares
          : (fillPrice - curPrice) * shares;

      const pnlPct =
        pos.action === 'BUY'
          ? ((curPrice - fillPrice) / fillPrice) * 100
          : ((fillPrice - curPrice) / fillPrice) * 100;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // 1. Target Price Reached Alert
      if (thresholds.alertOnTargetHit && pos.target_price) {
        const isTargetReached =
          pos.action === 'BUY' ? curPrice >= pos.target_price : curPrice <= pos.target_price;

        if (isTargetReached && !triggered.has('TARGET_HIT')) {
          triggered.add('TARGET_HIT');
          if (thresholds.soundEnabled) playTargetReachedSound();

          pushAlert({
            orderId,
            ticker: pos.ticker,
            action: pos.action,
            type: 'target_hit',
            title: `Target Price Reached for ${pos.ticker}`,
            message: `Position reached target ₹${pos.target_price.toFixed(2)} with profit of ₹${pnl.toFixed(2)}! Consider taking profits or trailing stop.`,
            pnl,
            pnlPct,
            currentPrice: curPrice,
            thresholdReached: `Target Hit (₹${pos.target_price.toFixed(2)})`,
            timestamp: timeStr,
            duration: 8000,
          });
        }
      }

      // 2. Stop-Loss Triggered Alert
      if (thresholds.alertOnStopHit && pos.stop_loss) {
        const isStopHit =
          pos.action === 'BUY' ? curPrice <= pos.stop_loss : curPrice >= pos.stop_loss;

        if (isStopHit && !triggered.has('STOP_HIT')) {
          triggered.add('STOP_HIT');
          if (thresholds.soundEnabled) playLossWarning();

          pushAlert({
            orderId,
            ticker: pos.ticker,
            action: pos.action,
            type: 'stop_hit',
            title: `Stop Loss Triggered for ${pos.ticker}`,
            message: `Trade hit stop-loss boundary at ₹${pos.stop_loss.toFixed(2)} (drawdown -₹${Math.abs(pnl).toFixed(2)}). Risk governor recommends exit.`,
            pnl,
            pnlPct,
            currentPrice: curPrice,
            thresholdReached: `Stop Loss Hit (₹${pos.stop_loss.toFixed(2)})`,
            timestamp: timeStr,
            duration: 8000,
          });
        }
      }

      // 3. Profit Threshold Alert
      const profitThresholdCrossed =
        pnlPct >= thresholds.profitPct || pnl >= thresholds.profitRupees;

      if (profitThresholdCrossed) {
        if (!triggered.has('PROFIT_THRESHOLD')) {
          triggered.add('PROFIT_THRESHOLD');
          if (thresholds.soundEnabled) playProfitChime();

          const reason =
            pnlPct >= thresholds.profitPct
              ? `crossed +${thresholds.profitPct.toFixed(1)}% threshold`
              : `exceeded +₹${thresholds.profitRupees} profit target`;

          pushAlert({
            orderId,
            ticker: pos.ticker,
            action: pos.action,
            type: 'profit_threshold',
            title: `Profit Alert: ${pos.ticker}`,
            message: `Live unrealized profit ${reason}. Currently at ₹${curPrice.toFixed(2)}.`,
            pnl,
            pnlPct,
            currentPrice: curPrice,
            thresholdReached: `+${thresholds.profitPct.toFixed(1)}% / +₹${thresholds.profitRupees}`,
            timestamp: timeStr,
            duration: 6500,
          });
        }
      } else if (pnlPct < thresholds.profitPct * 0.4 && pnl < thresholds.profitRupees * 0.4) {
        // Reset so if profit crosses again later, alert will fire
        triggered.delete('PROFIT_THRESHOLD');
      }

      // 4. Loss Threshold Alert
      const lossThresholdCrossed =
        pnlPct <= thresholds.lossPct || pnl <= thresholds.lossRupees;

      if (lossThresholdCrossed) {
        if (!triggered.has('LOSS_THRESHOLD')) {
          triggered.add('LOSS_THRESHOLD');
          if (thresholds.soundEnabled) playLossWarning();

          const reason =
            pnlPct <= thresholds.lossPct
              ? `crossed ${thresholds.lossPct.toFixed(1)}% risk limit`
              : `exceeded -₹${Math.abs(thresholds.lossRupees)} drawdown limit`;

          pushAlert({
            orderId,
            ticker: pos.ticker,
            action: pos.action,
            type: 'loss_threshold',
            title: `Drawdown Alert: ${pos.ticker}`,
            message: `Live unrealized loss ${reason}. Currently at ₹${curPrice.toFixed(2)}.`,
            pnl,
            pnlPct,
            currentPrice: curPrice,
            thresholdReached: `${thresholds.lossPct.toFixed(1)}% / -₹${Math.abs(thresholds.lossRupees)}`,
            timestamp: timeStr,
            duration: 7000,
          });
        }
      } else if (pnlPct > thresholds.lossPct * 0.4 && pnl > thresholds.lossRupees * 0.4) {
        // Reset so if drawdown re-occurs, alert will fire
        triggered.delete('LOSS_THRESHOLD');
      }
    });
  }, [positions, thresholds, pushAlert]);

  // Test Alert Simulator (allows user to preview notification anytime)
  const triggerTestAlert = useCallback(
    (type: 'profit' | 'loss') => {
      const sampleTicker = positions.length > 0 ? positions[0].ticker : 'RELIANCE';
      const sampleOrderId = positions.length > 0 ? positions[0].order_id : 'PAPER_TEST';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (type === 'profit') {
        if (thresholds.soundEnabled) playProfitChime();
        pushAlert({
          orderId: sampleOrderId,
          ticker: sampleTicker,
          action: 'BUY',
          type: 'profit_threshold',
          title: `Profit Alert: ${sampleTicker}`,
          message: `Live unrealized profit crossed +${thresholds.profitPct.toFixed(1)}% threshold! Target progression at 82%.`,
          pnl: 284.5,
          pnlPct: 2.15,
          currentPrice: 2894.2,
          thresholdReached: `+${thresholds.profitPct.toFixed(1)}% Threshold Met`,
          timestamp: timeStr,
          duration: 6500,
        });
      } else {
        if (thresholds.soundEnabled) playLossWarning();
        pushAlert({
          orderId: sampleOrderId,
          ticker: sampleTicker,
          action: 'BUY',
          type: 'loss_threshold',
          title: `Drawdown Alert: ${sampleTicker}`,
          message: `Live unrealized loss crossed ${thresholds.lossPct.toFixed(1)}% risk boundary! Risk governor monitoring position.`,
          pnl: -168.4,
          pnlPct: -1.35,
          currentPrice: 2812.8,
          thresholdReached: `${thresholds.lossPct.toFixed(1)}% Risk Drawdown`,
          timestamp: timeStr,
          duration: 7000,
        });
      }
    },
    [positions, thresholds, pushAlert]
  );

  return {
    alerts,
    thresholds,
    updateThresholds,
    dismissAlert,
    clearAllAlerts,
    triggerTestAlert,
  };
}
