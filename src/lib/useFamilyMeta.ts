"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { FamilyMeta } from "@/types";
import { DEFAULT_FAMILY_COLOR } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFamilyMeta() {
  const { data } = useSWR<FamilyMeta[]>("/api/families/meta", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of data ?? []) m.set(f.name, f.color);
    return m;
  }, [data]);

  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of data ?? []) m.set(f.name, f.label);
    return m;
  }, [data]);

  return {
    families: data ?? [],
    getColor: (name: string) => colorMap.get(name) ?? DEFAULT_FAMILY_COLOR,
    getLabel: (name: string) => labelMap.get(name) ?? name.toUpperCase(),
  };
}
