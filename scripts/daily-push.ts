/**
 * Lift Me Up: daily push scheduler.
 *
 * Runs on GitHub Actions (see .github/workflows/daily-push.yml), twice a day. Each run looks at the
 * next 36 hours and, for every UTC offset in use in the world, schedules the notification for the
 * moment it is 09:00 there. The notification is created at OneSignal with `send_after`, so
 * delivery happens on OneSignal's servers whether or not anybody has the app open.
 *
 *  - Content comes from the app's own content collection and daily-pick function, evaluated for the
 *    LOCAL calendar date of the recipients. So the quote or verse in the notification is exactly
 *    the one Lift Me Up recommends on that date.
 *  - Recipients are selected by the tags the app sets on subscribed devices:
 *      daily=1, lang=en|el, kind=quote|verse|alt, tzo=<UTC offset in minutes>
 *    `alt` ("both, alternating daily") gets a quote on even days and a verse on odd days (days since
 *    1970-01-01 in the recipient's date), so nobody receives two notifications on one day.
 *  - Every notification carries a deterministic `idempotency_key` (a UUIDv5 derived from the
 *    notification's logical id, e.g. "lmu-2026-11-16-o120-el-verse"). OneSignal returns the original
 *    result for a repeated key instead of sending again (keys are kept for 30 days; our planning
 *    window is 36 hours), so re-running this script is safe.
 *
 * The REST API key is read from the environment and is never part of the website.
 *
 * Usage:
 *   npx tsx scripts/daily-push.ts --dry-run             # print the plan, send nothing
 *   npx tsx scripts/daily-push.ts                       # schedule for real
 *   npx tsx scripts/daily-push.ts --test <subscription-id> [--lang el] [--kind verse]   # one immediate test message
 */
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { QUOTES, VERSES, verseReference, type Lang } from '../src/data/content';
import { STRINGS } from '../src/data/i18n';
import { dailyPick } from '../src/lib/daily';

export type Kind = 'quote' | 'verse';

/** UTC offsets (minutes east of UTC) that are in use somewhere in the world. */
export const OFFSETS = [
  -720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60, 0, 60, 120, 180, 210, 240, 270,
  300, 330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 630, 660, 720, 765, 780, 840,
];
export const DELIVERY_HOUR = 9;
const LANGS: Lang[] = ['en', 'el'];
const KINDS: Kind[] = ['quote', 'verse'];

type Filter = { field: 'tag'; key: string; relation: '='; value: string } | { operator: 'OR' };

export interface Planned {
  /** Human-readable id, used in logs and as the input of the idempotency key. */
  logicalId: string;
  /** RFC 9562 UUID (v5) derived from `logicalId`; the same notification always gets the same key. */
  idempotencyKey: string;
  sendAfter: string;
  sendAtUtc: string;
  offsetMin: number;
  localDate: string;
  lang: Lang;
  kind: Kind;
  contentId: string;
  heading: string;
  body: string;
  url: string;
  filters: Filter[];
}

/** Days since 1970-01-01 for a calendar date: the same number the app's daily pick uses. */
export const dayNumber = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);

/** Fixed namespace for Lift Me Up notification ids (any constant UUID will do). */
const NAMESPACE = 'b6c3a9f0-5d1e-4a7b-9c2d-6f3e8a1b7c40';

/** RFC 9562 UUID version 5 (name-based, SHA-1): deterministic, so repeat requests share one key. */
export function uuidV5(name: string, namespace: string = NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const h = createHash('sha1').update(ns).update(name, 'utf8').digest();
  h[6] = (h[6] & 0x0f) | 0x50; // version 5
  h[8] = (h[8] & 0x3f) | 0x80; // RFC variant
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** The quote and verse Lift Me Up recommends for a calendar date, and which one "both" users get. */
export function contentForDay(day: number) {
  return {
    quote: dailyPick(QUOTES, 3, day),
    verse: dailyPick(VERSES, 5, day),
    alternating: (day % 2 === 0 ? 'quote' : 'verse') as Kind,
  };
}

export function messageFor(kind: Kind, lang: Lang, day: number): { heading: string; body: string; id: string } {
  const c = contentForDay(day);
  if (kind === 'quote') {
    return { heading: STRINGS[lang]['push.notifQuote'], body: c.quote.text[lang], id: c.quote.id };
  }
  const word = STRINGS[lang]['bible.paraphrase'].toLowerCase();
  return {
    heading: STRINGS[lang]['push.notifVerse'],
    body: `${c.verse.text[lang]} — ${verseReference(c.verse, lang)} (${word})`,
    id: c.verse.id,
  };
}

const group = (lang: Lang, offset: number, kindTag: string): Filter[] => [
  { field: 'tag', key: 'daily', relation: '=', value: '1' },
  { field: 'tag', key: 'lang', relation: '=', value: lang },
  { field: 'tag', key: 'tzo', relation: '=', value: String(offset) },
  { field: 'tag', key: 'kind', relation: '=', value: kindTag },
];

/** (A AND B AND C AND kind=quote) OR (A AND B AND C AND kind=alt) ... */
export function filtersFor(kind: Kind, lang: Lang, offset: number, alternating: Kind): Filter[] {
  const groups = [group(lang, offset, kind)];
  if (alternating === kind) groups.push(group(lang, offset, 'alt'));
  return groups.flatMap((g, i) => (i === 0 ? g : [{ operator: 'OR' as const }, ...g]));
}

/** ISO 8601 with an explicit offset, the format shown in OneSignal's current API reference. */
const sendAfterString = (ms: number) => {
  const d = new Date(ms);
  return `${ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes(),
  )}:00+00:00`;
};

/** Everything that must be scheduled so that each offset gets its 09:00 inside the next `hours` hours. */
export function plan(now: Date, siteUrl: string, hours = 36): Planned[] {
  const site = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const out: Planned[] = [];
  const from = now.getTime() + 3 * 60_000; // never schedule into the past
  const to = now.getTime() + hours * 3_600_000;
  for (const offset of OFFSETS) {
    // the recipients' local date today, then a few days around it
    const local = new Date(now.getTime() + offset * 60_000);
    for (let delta = -1; delta <= 2; delta++) {
      const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + delta));
      const [y, m, dd] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
      const at = Date.UTC(y, m - 1, dd, DELIVERY_HOUR, 0) - offset * 60_000; // 09:00 local, as a UTC instant
      if (at < from || at > to) continue;
      const day = dayNumber(y, m, dd);
      const alt = contentForDay(day).alternating;
      for (const lang of LANGS) {
        for (const kind of KINDS) {
          const msg = messageFor(kind, lang, day);
          const logicalId = `lmu-${ymd(y, m, dd)}-o${offset}-${lang}-${kind}`;
          out.push({
            logicalId,
            idempotencyKey: uuidV5(logicalId),
            sendAfter: sendAfterString(at),
            sendAtUtc: new Date(at).toISOString(),
            offsetMin: offset,
            localDate: ymd(y, m, dd),
            lang,
            kind,
            contentId: msg.id,
            heading: msg.heading,
            body: msg.body,
            url: `${site}#/${kind === 'quote' ? 'motivation' : 'bible'}?id=${msg.id}`,
            filters: filtersFor(kind, lang, offset, alt),
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.sendAtUtc.localeCompare(b.sendAtUtc));
}

/* ---------------------------------------------------------------------------- */
/*  OneSignal REST                                                              */
/* ---------------------------------------------------------------------------- */
const API = process.env.ONESIGNAL_API_URL ?? 'https://api.onesignal.com/notifications?c=push'; // override only for local tests

function payload(appId: string, site: string, p: Pick<Planned, 'heading' | 'body' | 'url'>) {
  return {
    app_id: appId,
    target_channel: 'push',
    headings: { en: p.heading, el: p.heading },
    contents: { en: p.body, el: p.body },
    url: p.url,
    ttl: 12 * 3600, // drop it if the device stays offline for half a day
    web_push_topic: 'lift-me-up-daily', // a newer daily message replaces an unread older one
    chrome_web_icon: `${site}icon-192.png`,
    chrome_web_badge: `${site}icon-192.png`,
  };
}

type Outcome = 'sent' | 'skipped' | 'failed';
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** One API call with a timeout and a few retries for rate limits, server errors and network hiccups. */
export async function post(key: string, body: unknown): Promise<{ outcome: Outcome; detail: string }> {
  const MAX_ATTEMPTS = 4;
  let lastDetail = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;
    let text = '';
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      text = await res.text();
    } catch (e) {
      lastDetail = `network error: ${e instanceof Error ? e.message : String(e)}`; // retried below
    }

    if (res) {
      let json: { id?: string; errors?: unknown } = {};
      try {
        json = JSON.parse(text);
      } catch {
        /* not JSON */
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `OneSignal rejected the credentials (${res.status}). Check ONESIGNAL_REST_API_KEY (an App API Key) and ONESIGNAL_APP_ID.`,
        );
      }
      // 200 with an `id`: accepted (a repeated idempotency key returns the original result).
      if (res.ok && json.id) return { outcome: 'sent', detail: json.id };
      // 200 without an `id`: valid request, but no subscribers match (normal while a segment is still empty).
      if (res.ok) return { outcome: 'skipped', detail: 'no matching subscribers' };
      const errs = JSON.stringify(json.errors ?? text).toLowerCase();
      if (/recipients|not subscribed|no subscribed/.test(errs)) return { outcome: 'skipped', detail: 'no matching subscribers' };
      lastDetail = `${res.status} ${text.slice(0, 300)}`;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return { outcome: 'failed', detail: lastDetail }; // e.g. 400: retrying cannot help
      const retryAfter = Number(res.headers.get('retry-after'));
      if (attempt < MAX_ATTEMPTS) {
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 60) * 1000 : 2 ** attempt * 1000);
        continue;
      }
    } else if (attempt < MAX_ATTEMPTS) {
      await sleep(2 ** attempt * 1000);
    }
  }
  return { outcome: 'failed', detail: lastDetail };
}

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const flag = (name: string) => process.argv.includes(name);

async function main() {
  const siteRaw = process.env.SITE_URL ?? '';
  if (!siteRaw) throw new Error('SITE_URL is not set (e.g. https://<user>.github.io/lift-me-up/).');
  if (!/^https:\/\//.test(siteRaw)) throw new Error('SITE_URL must start with https:// (web push links must be secure).');
  const site = siteRaw.endsWith('/') ? siteRaw : `${siteRaw}/`;
  const now = new Date();

  // --- one immediate test message to a single subscription -------------------------
  const testId = arg('--test');
  if (testId) {
    const lang = (arg('--lang') === 'el' ? 'el' : 'en') as Lang;
    const kind = (arg('--kind') === 'verse' ? 'verse' : 'quote') as Kind;
    const day = dayNumber(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
    const msg = messageFor(kind, lang, day);
    const url = `${site}#/${kind === 'quote' ? 'motivation' : 'bible'}?id=${msg.id}`;
    console.log(`Test (${kind}, ${lang}) -> ${msg.id}\n  ${msg.heading}: ${msg.body}\n  ${url}`);
    if (flag('--dry-run')) return;
    const { ONESIGNAL_APP_ID: appId, ONESIGNAL_REST_API_KEY: key } = process.env;
    if (!appId || !key) throw new Error('ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY are required.');
    const r = await post(key, { ...payload(appId, site, { heading: msg.heading, body: msg.body, url }), include_subscription_ids: [testId] });
    console.log(`Result: ${r.outcome} ${r.detail}`);
    if (r.outcome === 'failed') process.exitCode = 1;
    return;
  }

  // --- the real thing -----------------------------------------------------------------
  const hours = Number(arg('--hours') ?? 36);
  const items = plan(now, site, hours);
  console.log(`Planned ${items.length} scheduled notifications for the next ${hours} h (from ${now.toISOString()}).`);
  if (flag('--dry-run')) {
    for (const p of items) {
      console.log(`${p.sendAtUtc}  offset ${String(p.offsetMin).padStart(4)}  ${p.localDate}  ${p.lang} ${p.kind.padEnd(5)}  ${p.contentId}`);
    }
    return;
  }
  const { ONESIGNAL_APP_ID: appId, ONESIGNAL_REST_API_KEY: key } = process.env;
  if (!appId || !key) throw new Error('ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY are required.');

  const tally: Record<Outcome, number> = { sent: 0, skipped: 0, failed: 0 };
  for (const p of items) {
    const r = await post(key, {
      ...payload(appId, site, p),
      filters: p.filters,
      send_after: p.sendAfter,
      idempotency_key: p.idempotencyKey, // a repeat of this request returns the original result, not a second message
    });
    tally[r.outcome]++;
    if (r.outcome === 'failed') console.error(`FAILED ${p.logicalId}: ${r.detail}`);
    await new Promise((res) => setTimeout(res, 120)); // stay well inside the API rate limit
  }
  console.log(`Done. scheduled=${tally.sent} no-subscribers=${tally.skipped} failed=${tally.failed}`);
  if (tally.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
