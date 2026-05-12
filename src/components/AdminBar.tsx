"use client";

import { useState, useEffect } from "react";
import { useSWRConfig } from "swr";

export function AdminBar() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function createFamily() {
    if (!keyword.trim()) return;
    setStatus("CREATING...");
    try {
      const res = await fetch("/api/families/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`CREATED: ${data.family} (${data.reclassified} tokens reclassified)`);
        mutate(() => true);
        setTimeout(() => {
          setKeyword("");
          setStatus(null);
          setOpen(false);
        }, 2000);
      } else {
        setStatus(`ERROR: ${data.error}`);
      }
    } catch {
      setStatus("ERROR: Network failure");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/70">
      <div className="panel p-4 w-full max-w-md border border-troll-green/40">
        <div className="text-[10px] text-troll-dim uppercase tracking-widest mb-3">
          ADD NARRATIVE FAMILY // CMD+K
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFamily()}
            placeholder="keyword (e.g. kitty, gme, pepe)"
            autoFocus
            className="flex-1 bg-troll-dark border border-troll-border rounded px-3 py-2 text-sm text-troll-green placeholder:text-troll-dark focus:border-troll-green/60 focus:outline-none"
          />
          <button
            onClick={createFamily}
            className="px-4 py-2 rounded border border-troll-green/40 text-troll-green text-xs hover:bg-troll-green/10 transition-colors"
          >
            CREATE
          </button>
        </div>
        {status && (
          <div className="mt-2 text-xs text-troll-warn">{status}</div>
        )}
        <div className="mt-3 text-[10px] text-troll-dark">
          Creates a new family, adds classification rule, and reclassifies matching tokens instantly.
          Press ESC to close.
        </div>
      </div>
    </div>
  );
}
