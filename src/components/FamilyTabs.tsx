"use client";

import clsx from "clsx";
import { useFamilyMeta } from "@/lib/useFamilyMeta";

export function FamilyTabs({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (family: string) => void;
}) {
  const { families, getColor, getLabel } = useFamilyMeta();

  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-2 border-b border-troll-border">
      <button
        onClick={() => onSelect("all")}
        className={clsx(
          "px-3 py-1.5 text-xs font-medium rounded transition-all",
          active === "all" ? "text-black" : "text-troll-dim hover:text-troll-green"
        )}
        style={active === "all" ? { backgroundColor: "#00FF41", color: "#000" } : undefined}
      >
        ALL
      </button>
      {families.map((f) => {
        const isActive = f.name === active;
        return (
          <button
            key={f.name}
            onClick={() => onSelect(f.name)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded transition-all",
              isActive ? "text-black" : "text-troll-dim hover:text-troll-green"
            )}
            style={isActive ? { backgroundColor: f.color, color: "#000" } : undefined}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
