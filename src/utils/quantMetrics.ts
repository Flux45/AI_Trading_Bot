export interface TimeHorizonDetails {
  targetDistance: number;
  returnMarginPct: number;
  riskMarginPct: number;
  riskRewardRatio: number;
  approxDays: number;
  minDays: number;
  maxDays: number;
  approxTimeLabel: string;
  shortLabel: string;
  velocityPerDay: string;
  dailyProgressRupees: number;
  calendarWeeks: string;
  momentumDriftPace: 'ACCELERATED' | 'STEADY' | 'CONSOLIDATING';
  horizonDescription: string;
}

/**
 * Calculates quantitative swing horizon based on ATR volatility,
 * 20-day momentum velocity, and target distance.
 */
export function calculateTimeHorizon(
  currentPrice: number,
  targetPrice?: number,
  stopLoss?: number,
  atr: number = 0,
  pctReturn20d: number = 0
): TimeHorizonDetails {
  const safeAtr = atr > 0 ? atr : currentPrice * 0.018;
  const isUp = pctReturn20d >= 0;

  const target =
    targetPrice && targetPrice > 0
      ? targetPrice
      : isUp
      ? Number((currentPrice + safeAtr * 2.4).toFixed(2))
      : Number((currentPrice - safeAtr * 2.2).toFixed(2));

  const stop =
    stopLoss && stopLoss > 0
      ? stopLoss
      : isUp
      ? Number((currentPrice - safeAtr * 1.5).toFixed(2))
      : Number((currentPrice + safeAtr * 1.5).toFixed(2));

  const targetDistance = Math.abs(target - currentPrice);
  const stopDistance = Math.abs(currentPrice - stop);

  const returnMarginPct = Number(((targetDistance / currentPrice) * 100).toFixed(2));
  const riskMarginPct = Number(((stopDistance / currentPrice) * 100).toFixed(2));
  const riskRewardRatio = Number((returnMarginPct / Math.max(riskMarginPct, 0.1)).toFixed(2));

  const momentumAbs = Math.abs(pctReturn20d);
  let efficiency = 0.35;
  let momentumDriftPace: 'ACCELERATED' | 'STEADY' | 'CONSOLIDATING' = 'STEADY';

  if (momentumAbs >= 4.0) {
    efficiency = 0.44;
    momentumDriftPace = 'ACCELERATED';
  } else if (momentumAbs >= 1.5) {
    efficiency = 0.35;
    momentumDriftPace = 'STEADY';
  } else {
    efficiency = 0.27;
    momentumDriftPace = 'CONSOLIDATING';
  }

  const dailyProgressRupees = Math.max(safeAtr * efficiency, currentPrice * 0.0035);
  const approxDays = Math.max(2, Math.round(targetDistance / dailyProgressRupees));
  const minDays = Math.max(1, Math.round(approxDays * 0.75));
  const maxDays = Math.max(minDays + 2, Math.round(approxDays * 1.35));
  const weeksNum = (approxDays / 5).toFixed(1);
  const calendarWeeks = approxDays <= 5 ? '< 1 wk' : `~${weeksNum} wks`;

  const approxTimeLabel = `~${minDays}–${maxDays} Trading Days (${calendarWeeks})`;
  const shortLabel = `~${approxDays}d (${calendarWeeks})`;

  const horizonDescription = `Projected at ₹${dailyProgressRupees.toFixed(2)}/day directional drift (~${(
    efficiency * 100
  ).toFixed(0)}% ATR-14 volatility efficiency).`;

  return {
    targetDistance,
    returnMarginPct,
    riskMarginPct,
    riskRewardRatio,
    approxDays,
    minDays,
    maxDays,
    approxTimeLabel,
    shortLabel,
    velocityPerDay: `₹${dailyProgressRupees.toFixed(2)}/day`,
    dailyProgressRupees,
    calendarWeeks,
    momentumDriftPace,
    horizonDescription,
  };
}
