"use client";

import { useEffect, useState } from "react";

export function usePortfolioCollection<T extends { slug?: string }>(collection: string, fallback: T[]) {
  const [items, setItems] = useState<T[]>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/${collection}`, { headers: { accept: "application/json" }, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("The portfolio API is unavailable.");
        return response.json();
      })
      .then((payload: { items?: T[] }) => {
        if (mounted && Array.isArray(payload.items) && payload.items.length) setItems(payload.items);
      })
      .catch(() => { /* Curated bundled content stays available when the API is offline. */ })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, [collection]);

  return { items, ready };
}
