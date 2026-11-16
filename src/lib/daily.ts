/**
 * Daily content logic.
 *
 * The official item for a calendar day is a pure function of the local date, so reloads
 * (and language changes) never alter it. Exploring with "Next" is random but avoids
 * recent repeats.
 */

/** Whole days since 1970-01-01 for the user's *local* calendar date. */
export function localDayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Smallest stride ≥ `start` that is coprime with n, so a full cycle visits every entry once. */
function strideFor(n: number, start: number): number {
  let s = start;
  while (gcd(s, n) !== 1) s++;
  return s;
}

/**
 * Picks the day's entry. A coprime stride walks the list in a scattered order, so
 * consecutive days land in different categories, and every entry appears once per cycle.
 */
export function dailyPick<T>(items: readonly T[], salt: number, day = localDayNumber()): T {
  const n = items.length;
  const stride = strideFor(n, 7);
  const index = (((day * stride + salt) % n) + n) % n;
  return items[index];
}

/** Random next item that is not the current one or any of the recently shown ones. */
export function pickNext<T extends { id: string }>(
  pool: readonly T[],
  recentIds: readonly string[],
): T {
  if (pool.length === 0) throw new Error('Empty pool');
  if (pool.length === 1) return pool[0];
  const window = Math.min(recentIds.length, pool.length - 1);
  const avoid = new Set(recentIds.slice(-window));
  const candidates = pool.filter((p) => !avoid.has(p.id));
  const list = candidates.length ? candidates : pool.filter((p) => p.id !== recentIds[recentIds.length - 1]);
  return list[Math.floor(Math.random() * list.length)];
}
