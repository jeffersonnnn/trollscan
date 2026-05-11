"use client";

export function WhaleFlag({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span className="animate-pulse-glow cursor-help" title="Recent buys >5 SOL detected">
      🐋
    </span>
  );
}
