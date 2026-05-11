import type { DexScreenerPair } from "@/types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeVelocity(pair: DexScreenerPair): number {
  const ageHours = (Date.now() - pair.pairCreatedAt) / 3600_000;
  const txns1h = (pair.txns?.h1?.buys ?? 0) + (pair.txns?.h1?.sells ?? 0);
  const txns6h = (pair.txns?.h6?.buys ?? 0) + (pair.txns?.h6?.sells ?? 0);
  const vol1h = pair.volume?.h1 ?? 0;
  const vol6h = pair.volume?.h6 ?? 0;
  const priceChange1h = pair.priceChange?.h1 ?? 0;

  const txnVelocity = (txns1h * 6) / Math.max(txns6h, 1);
  const volVelocity = (vol1h * 6) / Math.max(vol6h, 1);
  const priceMomentum = clamp(priceChange1h / 10, -5, 5);
  const freshnessBonus = ageHours < 24 ? ((24 - ageHours) / 24) * 20 : 0;

  const rawScore =
    txnVelocity * 25 + volVelocity * 25 + priceMomentum * 5 + freshnessBonus;

  return clamp(Math.round(rawScore * 10) / 10, 0, 100);
}

export function hasWhaleFlag(pair: DexScreenerPair): boolean {
  const txns1h = (pair.txns?.h1?.buys ?? 0) + (pair.txns?.h1?.sells ?? 0);
  const vol1h = pair.volume?.h1 ?? 0;

  if (txns1h < 3) return false;

  const avgTxSize = vol1h / txns1h;
  const solPrice = 170;
  const avgTxSol = avgTxSize / solPrice;

  return avgTxSol > 5;
}
