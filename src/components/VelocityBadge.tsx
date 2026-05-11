"use client";

import clsx from "clsx";

export function VelocityBadge({ score }: { score: number }) {
  const rounded = Math.round(score);

  return (
    <span
      className={clsx(
        "inline-block px-1.5 py-0.5 text-xs font-bold rounded tabular-nums",
        rounded >= 70 && "text-troll-green animate-pulse-glow",
        rounded >= 30 && rounded < 70 && "text-troll-green",
        rounded < 30 && "text-troll-dim"
      )}
    >
      {rounded}
    </span>
  );
}
