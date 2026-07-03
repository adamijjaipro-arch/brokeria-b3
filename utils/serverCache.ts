interface Entry {
  data: unknown;
  cachedAt: number;
  ttlMs: number;
}

// Module-level map — survives between requests in the same Node.js process
const store = new Map<string, Entry>();

export function get(key: string): unknown | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > entry.ttlMs) return null; // expired
  return entry.data;
}

export function getStale(key: string): unknown | null {
  return store.get(key)?.data ?? null;
}

export function set(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, cachedAt: Date.now(), ttlMs });
}
