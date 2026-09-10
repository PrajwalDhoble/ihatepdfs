import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "repairmypdf:recent-tools";
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useRecentTools() {
  const [recentSlugs, setRecentSlugs] = useState<string[]>(readRecent);

  const recordVisit = useCallback((slug: string) => {
    const updated = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentSlugs(updated);
  }, []);

  return { recentSlugs, recordVisit };
}

/** Fire-and-forget variant for pages that just need to record a visit once, without reading the list back. */
export function useRecordToolVisit(slug: string) {
  useEffect(() => {
    if (!slug) return;
    const updated = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [slug]);
}
