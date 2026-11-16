# Daily push notifications: setup

Everything in the project is finished except the account and secrets only you can create. Until you
add them the feature stays **switched off and invisible**: no invitation appears, Settings says
"Notifications are not set up on this copy of the app yet", and no request is made to any push service.

## How it works

```
 Browser (GitHub Pages)                         OneSignal                    GitHub Actions
 ──────────────────────                         ─────────                    ──────────────
 user clicks Enable  ──► permission + subscribe ──► stores device token
 app sets 4 tags     ──► daily=1, lang, kind, tzo (UTC offset)
                                                                              twice a day:
                                                  ◄── schedules notifications ◄─ scripts/daily-push.ts
                                                       (send_after = 09:00 local per UTC offset,
                                                        filtered by the tags, idempotency_key = dedup key)
 notification arrives, even with the site closed ◄─ delivers at 09:00 local
 click ──► https://…/#/bible?id=v-hope-1  → the app shows exactly that verse
```

* **No backend of our own.** Subscriptions and preferences go straight from the browser to OneSignal
  through its SDK using the *public* App ID. Nothing secret is in the website.
* **The REST API key** (secret) exists only as a GitHub Actions secret and is used only by
  `scripts/daily-push.ts`.
* **The message** is taken from the app's own content (`src/data/content.ts`) with the app's own
  daily-pick function, evaluated for the recipient's local date. `npm run push:verify` proves this
  offline for 800 dates (no credentials needed).
* **"Both, alternating daily"** users are tagged `kind=alt`; they get a quote on even days and a
  verse on odd days (days since 1970-01-01 in their own date), in a single notification per day.
* **Duplicates:** every scheduled notification has a fixed `idempotency_key`, a UUIDv5 derived from
  `lmu-<local date>-o<offset>-<lang>-<kind>`. OneSignal answers a repeated key with the original result
  instead of sending again (keys are kept for 30 days; the planning window is 36 hours), so the
  twice-daily runs and manual re-runs cannot double-send.

## 1. Create the OneSignal app (free plan is enough)

1. Sign up at <https://onesignal.com> and **New App/Website → Web**.
2. Choose **Custom Code** integration.
3. **Site Name:** Lift Me Up. **Site URL:** your site's origin, e.g. `https://<user>.github.io`
   (the origin, without `/lift-me-up/`). Keep **Local Testing** off for production.
4. **Auto Resubscribe:** on. **Permission prompts / Slide prompts / Welcome notification:** leave
   everything OFF. The app asks for permission itself, only after a click on Enable.
5. **Default icon:** upload `public/icon-512.png`.
6. Finish the wizard and copy:
   * **App ID** (public)
   * **App API Key** (called "REST API Key" in older screens): *Settings → API Keys* / *Keys & IDs* (secret). The scheduler sends it as `Authorization: Key <key>`.

For **iPhone / iPad (iOS 16.4+)** also enable *Safari* web push in the OneSignal web configuration if
the wizard offers it. On iOS push only works for the app installed on the Home Screen (see below).

## 2. Add the values to GitHub

Repository → **Settings → Secrets and variables → Actions**

| Where | Name | Value |
|---|---|---|
| Variables | `ONESIGNAL_APP_ID` | the OneSignal App ID |
| Variables | `SITE_URL` | `https://<user>.github.io/lift-me-up/` (with the trailing slash) |
| Secrets | `ONESIGNAL_REST_API_KEY` | the App API Key |

Then **redeploy** (push to `main`, or run *Deploy to GitHub Pages*). The deploy workflow passes
`ONESIGNAL_APP_ID` to the build as `VITE_ONESIGNAL_APP_ID`. For local development copy `.env.example`
to `.env.local` and fill in the App ID.

## 3. Turn the scheduler on

`.github/workflows/daily-push.yml` runs at 04:17 and 16:17 UTC. Try it first:

1. **Actions → Schedule daily push notifications → Run workflow** with *dry run* ticked: it prints the plan.
2. Run it again with *dry run* off: it schedules the next 36 hours at OneSignal.
3. Re-run it once more: the second run must report the same notifications (repeat keys), not new ones. Then check **OneSignal → Messages → Scheduled**: you should see one entry per UTC offset, language and
   content type.

Notes: GitHub may start a scheduled run a few minutes late, and **disables scheduled workflows after
60 days without repository activity**. Open the Actions tab now and then, or push a commit.

## 4. Send a real test push (do this before announcing the feature)

1. Open the deployed site over HTTPS, click **Enable** (or turn on *Settings → Daily Notifications*) and allow notifications.
2. In OneSignal go to **Audience → Subscriptions**, find your device and copy its **Subscription ID**.
3. Send an immediate test message (same text and link format as the daily one):

   ```bash
   ONESIGNAL_APP_ID=... ONESIGNAL_REST_API_KEY=... SITE_URL=https://<user>.github.io/lift-me-up/ \
   npx tsx scripts/daily-push.ts --test <subscription-id> --lang el --kind verse
   ```

   (`--dry-run` prints the message without sending it.)
4. Close the site. The notification should still arrive. Click it: Lift Me Up must open on the Bible
   (or Motivation) screen showing exactly that verse (or quote) in your chosen language.

## iPhone and iPad

Safari on iOS only offers Web Push to a web app that has been added to the Home Screen. The app
detects this (`PushManager` is missing in a normal Safari tab) and, instead of an Enable button,
shows a short optional hint: **Share → Add to Home Screen, then open Lift Me Up from there.** The app
already ships a web manifest (`public/manifest.webmanifest`) and icons for this.

## Turning notifications off

*Settings → Daily Notifications* switch (or *Erase all my data*) removes the four tags and opts the
device out at OneSignal, so the scheduler no longer targets it. The user can also block notifications
in the browser at any time; the app notices when it regains focus.

## Known limits (honest list)

* **Time zones and daylight saving:** the 09:00 time is derived from the UTC offset stored when the
  app was last opened. If someone does not open the app across a clock change, their message arrives
  an hour early or late until they next open it (the offset tag refreshes on every visit).
* **"Around 09:00":** delivery can be a few minutes late (scheduler and push services are not exact).
* **Shared github.io origin:** OneSignal's *Site URL* is an origin only (`https://<user>.github.io`), and
  every project site of that user shares it. Use one OneSignal app for this origin and keep the worker
  at its permanent path (`/lift-me-up/OneSignalSDKWorker.js`, scope `/lift-me-up/`). A custom domain avoids the sharing.
* **Unverified here:** the code was written and tested without OneSignal credentials, so real push
  delivery, the OneSignal REST calls (including `filters` and `idempotency_key` behaviour) and iOS Home
  Screen push still need your confirmation using the test above.
* **Browsers:** Web Push does not exist in every browser (e.g. iOS Safari tabs, some in-app browsers).
  The app detects that and says so instead of showing a switch that cannot work.

## Audit notes (before production)

Checked against OneSignal's current documentation; changes made are marked **changed**.

| Area | Result |
|---|---|
| Service worker path and scope | Matches the documented sub-path pattern: `serviceWorkerPath: "lift-me-up/OneSignalSDKWorker.js"` (no leading slash) and `serviceWorkerParam.scope: "/lift-me-up/"` (same directory as the file). The worker is copied to the root of the deployed site. Set through code only (not also in the dashboard). A page opened as `/lift-me-up` without the trailing slash is redirected by GitHub Pages. |
| Authentication and secrets | `Authorization: Key <App API Key>` as documented. The key exists only as a GitHub secret. **Changed:** it is now exposed to the single scheduling step instead of the whole job (so `npm ci` install scripts cannot read it). Only the public App ID reaches the website build. |
| Deduplication | **Changed:** `external_id` is the legacy name (both still work); the documented name is `idempotency_key`, which must be an RFC 9562 UUID, valid 30 days. Keys are now deterministic UUIDv5 values (cross-checked against Python's `uuid.uuid5`). |
| Native time-zone scheduling | **Not adopted.** `delayed_option: timezone` would follow each device's real time zone (DST-correct), but OneSignal's documentation does not say how it combines with `send_after`, nor what happens when 09:00 has already passed (other pages say: next day). That could deliver a quote chosen for date D on date D+1, breaking "the message equals the app's recommendation for that date". The current design keeps explicit instants and per-offset content. Its only weakness is a stale offset tag across a clock change (see above). Worth a real-device experiment later. |
| Scheduling delays and API errors | **Changed:** scheduling happens 36 h ahead, twice a day, so a late or skipped run is covered by the next one. Each API call now has a 20 s timeout and up to 4 attempts (429 honours `Retry-After`; 5xx and network errors back off), one failing item no longer aborts the rest, and a 200 response with no `id` ("no subscribers yet") is counted as skipped instead of failed (it previously would have failed the job daily). `send_after` is now ISO 8601 with offset as in the current reference. The job has a 15 min timeout and `SITE_URL` must be `https://`. |
| Unsubscribe and privacy | Switching off removes the four tags and calls `optOut()`, which marks the subscription unsubscribed (the documented SDK behaviour); a device that is later re-subscribed automatically without tags receives nothing. **Changed:** the privacy sentence no longer claims that only four items are stored. OneSignal also records technical browser/device details and keeps the inactive device record until it is deleted (via OneSignal's dashboard or its delete-subscription API, which needs the API key and so cannot be called from the browser). |
