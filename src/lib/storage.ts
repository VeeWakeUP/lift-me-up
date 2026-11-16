/**
 * Safe localStorage wrapper. Everything is namespaced and wrapped in try/catch so the
 * app keeps working (in memory) when storage is blocked, e.g. private windows.
 */
const NS = 'liftmeup:v1:';

export const KEYS = {
  prefs: 'prefs',
  favorites: 'favorites',
  customQuotes: 'custom-quotes',
  push: 'push',
} as const;

const memory = new Map<string, string>();

function probe(): boolean {
  try {
    const k = `${NS}__probe`;
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable: boolean = probe();

export function readJSON<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = storageAvailable ? window.localStorage.getItem(NS + key) : memory.get(NS + key) ?? null;
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Returns true when the value was persisted to real browser storage. */
export function writeJSON(key: string, value: unknown): boolean {
  const raw = JSON.stringify(value);
  memory.set(NS + key, raw);
  if (!storageAvailable) return false;
  try {
    window.localStorage.setItem(NS + key, raw);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  memory.delete(NS + key);
  try {
    if (storageAvailable) window.localStorage.removeItem(NS + key);
  } catch {
    /* ignore */
  }
}
