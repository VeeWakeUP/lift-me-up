// Offline self-check for the scheduler: `npm run push:verify`. Needs no credentials and sends nothing.
import assert from 'node:assert/strict';
import { plan, contentForDay, dayNumber, OFFSETS, uuidV5 } from './daily-push';
import { QUOTES, VERSES } from '../src/data/content';
import { dailyPick, localDayNumber } from '../src/lib/daily';

// 1) For many calendar dates the notification content == what the app computes for that local date
let checked = 0;
for (let i = 0; i < 800; i++) {
  const d = new Date(2026, 0, 1 + i); // local calendar date, as the app sees it
  const app = { q: dailyPick(QUOTES, 3, localDayNumber(d)).id, v: dailyPick(VERSES, 5, localDayNumber(d)).id };
  const c = contentForDay(dayNumber(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  assert.equal(c.quote.id, app.q); assert.equal(c.verse.id, app.v); checked++;
}
// 2) Plan: every offset gets 09:00 local, with the right local date, exactly once per window; alternation never doubles
const now = new Date('2026-11-16T03:02:00Z');
const items = plan(now, 'https://x.github.io/lift-me-up/', 36);
const byKey = new Map<string, number>();
for (const p of items) {
  const local = new Date(Date.parse(p.sendAtUtc) + p.offsetMin * 60000);
  assert.equal(local.getUTCHours(), 9); assert.equal(local.getUTCMinutes(), 0);
  assert.equal(p.localDate, local.toISOString().slice(0, 10));
  assert.ok(Date.parse(p.sendAtUtc) > now.getTime() && Date.parse(p.sendAtUtc) <= now.getTime() + 36 * 3600e3);
  const k = `${p.offsetMin}|${p.localDate}|${p.lang}`; byKey.set(k, (byKey.get(k) ?? 0) + 1);
  const alt = p.filters.filter((f: any) => f.value === 'alt').length;
  assert.equal(alt, p.kind === contentForDay(dayNumber(...p.localDate.split('-').map(Number) as [number, number, number])).alternating ? 1 : 0);
  assert.ok(p.url.includes(p.kind === 'quote' ? '#/motivation?id=q-' : '#/bible?id=v-'));
}
for (const n of byKey.values()) assert.equal(n, 2); // one quote + one verse notification per (offset,date,lang); 'alt' users are in only one of them
assert.equal(new Set(items.map((p) => p.logicalId)).size, items.length); // ids are unique
assert.equal(new Set(items.map((p) => p.idempotencyKey)).size, items.length); // so are the keys
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/; // RFC 9562 UUID, version 5
for (const p of items) {
  assert.match(p.idempotencyKey, UUID);
  assert.equal(p.idempotencyKey, uuidV5(p.logicalId)); // deterministic: the same notification always gets the same key
  assert.match(p.sendAfter, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+00:00$/); // ISO 8601 with offset
}
assert.equal(uuidV5('python.org', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'), '886313e1-3b8a-5372-9b90-0c9aee199e5d'); // Python's uuid.uuid5(NAMESPACE_DNS, 'python.org')
// 3) Two runs 12 h apart plan the same ids for the overlap (so OneSignal dedups them)
const later = plan(new Date('2026-11-16T15:02:00Z'), 'https://x.github.io/lift-me-up/', 36);
const overlap = later.filter((p) => items.some((q) => q.idempotencyKey === p.idempotencyKey));
console.log('dates checked:', checked, '| planned:', items.length, '| offsets:', OFFSETS.length, '| overlapping keys between runs:', overlap.length);
assert.ok(overlap.length > 0);
const sample = items.find((p) => p.offsetMin === 120 && p.lang === 'el' && p.kind === 'verse')!;
console.log(JSON.stringify({ at: sample.sendAtUtc, id: sample.contentId, heading: sample.heading, body: sample.body, url: sample.url }, null, 1));
console.log('ALL CHECKS PASSED');
