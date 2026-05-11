"use client";

import clsx from "clsx";
import type { FamilyName } from "@/types";
import { FAMILY_COLORS, FAMILY_LABELS } from "@/types";

const ALL_FAMILIES: (FamilyName | "all")[] = [
  "all",
  "troll",
  "hanta",
  "goblin",
  "ai",
  "ufo",
  "charity",
  "brainrot",
];

export function FamilyTabs({
  active,
  onSelect,
}: {
  active: FamilyName | "all";
  onSelect: (family: FamilyName | "all") => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-2 border-b border-troll-border">
      {ALL_FAMILIES.map((f) => {
        const isActive = f === active;
        const color = f === "all" ? "#00FF41" : FAMILY_COLORS[f];
        const label = f === "all" ? "ALL" : FAMILY_LABELS[f];

        return (
          <button
            key={f}
            onClick={() => onSelect(f)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded transition-all",
              isActive
                ? "text-black"
                : "text-troll-dim hover:text-troll-green"
            )}
            style={
              isActive
                ? { backgroundColor: color, color: "#000" }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
