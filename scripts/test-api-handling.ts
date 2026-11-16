// Local check of the API error handling against a fake OneSignal server: `npx tsx scripts/test-api-handling.ts`.
// Sends nothing to the internet.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

const seen: { auth?: string; body?: Record<string, unknown> }[] = [];
let mode = 'ok';
let hits = 0;
const server = createServer((req, res) => {
  let data = '';
  req.on('data', (c) => (data += c));
  req.on('end', () => {
    seen.push({ auth: req.headers.authorization, body: JSON.parse(data || '{}') });
    hits++;
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify(body));
    };
    if (mode === 'ok') return send(200, { id: 'abc-123' });
    if (mode === 'empty') return send(200, { id: '', errors: ['All included players are not subscribed'] });
    if (mode === 'empty-no-errors') return send(200, {});
    if (mode === 'retry') return hits < 3 ? send(429, { errors: ['rate'] }, { 'Retry-After': '1' }) : send(200, { id: 'after-retry' });
    if (mode === 'bad') return send(400, { errors: ['invalid idempotency_key'] });
    if (mode === 'auth') return send(401, { errors: ['bad key'] });
    send(500, { errors: ['boom'] });
  });
});
await new Promise<void>((r) => server.listen(0, r));
process.env.ONESIGNAL_API_URL = `http://127.0.0.1:${(server.address() as { port: number }).port}/notifications`;
const { post } = await import('./daily-push');

const run = async (m: string) => {
  mode = m;
  hits = 0;
  return post('SECRET-KEY', { hello: 'world' });
};
assert.deepEqual(await run('ok'), { outcome: 'sent', detail: 'abc-123' });
assert.equal(seen[seen.length - 1].auth, 'Key SECRET-KEY'); // documented header format
assert.equal((await run('empty')).outcome, 'skipped');
assert.equal((await run('empty-no-errors')).outcome, 'skipped'); // 200 without id = nobody to send to
const r = await run('retry');
assert.deepEqual(r, { outcome: 'sent', detail: 'after-retry' });
assert.equal(hits, 3); // two 429s honoured, third attempt succeeded
assert.equal((await run('bad')).outcome, 'failed');
assert.equal(hits, 1); // a 400 is not retried
await assert.rejects(() => run('auth'), /rejected the credentials/);
console.log('API handling checks passed');
server.close();
