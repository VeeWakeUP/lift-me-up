# Lift Me Up

> **A little inspiration, every day.**

A mobile-first daily inspiration web app with two deliberately different worlds:

| | Daily Motivation | Bible Verses |
|---|---|---|
| Mood | Bold, energetic, youthful | Peaceful, historical, contemplative |
| Look | A minimal gradient card per quote: one colourful surface, one bold centred quote, tinted by the quote's category (see below) | Parchment, leather binding, gold leaf, serif scripture, handwritten accents |
| Motion | Word-by-word rise, swipe between quotes, heart-burst | Ink-bleed text reveal, page turn, candle glow |

The interface is deliberately calm: the quote or verse is the centre of each page and controls are secondary.

It is a university Human-Computer Interaction project, built to be ready for real user testing.
It is a pure static site: **no accounts, no backend, no API keys, no paid services.**

## Features

- **Home** – a background of two connected worlds that melt into each other (indigo, violet and sunrise coral on the left or top; parchment gold and bronze on the right or bottom, joined by a soft rose-peach glow in the middle; no hard edge), with the featured quote card on the modern side and the featured verse card on the parchment side. Also: date, time-aware anonymous greeting, and two featured cards: today's motivational quote and today's Bible verse, each with a button into its section. Saved, My Quotes and Settings are small links below.
- **Daily Motivation** – Quote of the Day, 6 categories (Motivation, Success, Confidence, Discipline, Growth, Hope), a centred gradient card on a swipeable stack with *Next quote* and *Rewind*. Also Save, Copy, Share. The official daily quote and explored quotes are visibly different (solid *Quote of the Day* badge vs dashed *Explored quote* badge, plus a *Back to today's quote* button).
- **Bible Verses** – Verse of the Day, 6 categories (Faith, Strength, Hope, Peace, Courage, Gratitude), book/chapter/verse reference, *Next verse*, Save, Copy, Share. Each verse is a beige aged-paper card with handwritten headings on the same swipeable stack; categories are quiet handwritten words above it.
- **Saved** – save/remove quotes and verses (with *Undo*), filter by type, thoughtful empty states.
- **My Quotes** – write, edit and delete your own quotes (optional title, 280-character limit, accessible validation). Private, local only.
- **Settings** – English / Greek, Light / Dark / Auto, plain-language explanation of local storage, *Reset preferences* and *Erase all my data* (both with confirmation), plus an About section with the research summary.
- **Bilingual** – the whole interface *and* all content switch between English and Greek. Switching language shows the same entry in the other language, never a different one.
- **Daily logic** – the official quote/verse is a pure function of the local calendar date, so it never changes on reload. *Next* picks randomly within the selected category and avoids recent repeats.
- **Native sharing** – uses `navigator.share` where available and falls back to the clipboard (and, if even that is unavailable, tells the user to copy manually).
- **World-to-world transitions** – a colour-bar wipe into Motivation, leather covers opening into the Bible, a rising sun back to Home. Skipped under `prefers-reduced-motion`.


## Swipeable card stack (Motivation and Bible)

Both sections use **one component and one gesture engine** ([`src/components/SwipeDeck.tsx`](src/components/SwipeDeck.tsx)), each with its own card look: a gradient card per quote, a beige parchment card per verse.

- **Swipe left or right: both go to the next card.** The top card follows the pointer (mouse, touch or pen, via Pointer Events), tilts up to 7 degrees and lifts with a deeper shadow while the next card waits underneath and grows as you drag.
- **Release past the threshold** (80 px or 22% of the card width, or a quick flick of 36 px at 0.45 px/ms or faster) and the card slides out while the next one rises into place. **Release before that** and it springs back with a little overshoot; nothing changes.
- **Rewind** (button under the card) goes back through the real viewing history, one card at a time, as often as you like. The restored card flies back in from the side it left through, with its own language, category and category chip. Rewind is disabled when there is nothing earlier. After rewinding, Next walks forward through the same history before picking anything new.
- **History is separate** for Motivation and Bible Verses, never alters the official quote or verse of the day, and is reconciled on category changes: a category switch is a new history step (with a soft cross-fade), and rewinding across it restores the previous category. Random picks avoid everything seen recently, so a category is explored in full before any card repeats.
- **Safe by construction:** gestures and buttons are ignored while a card is leaving, so a single swipe cannot advance twice and rapid input cannot overlap animations. A plain click or tap does nothing. On touch screens vertical scrolling stays native (only a clearly sideways movement takes over). Esc or a cancelled pointer springs the card back. Text selection is disabled on the stack.
- **Without gestures:** Next and Rewind buttons, Favorite, Copy, Share and (Bible) Download as Image. The card underneath is inert and hidden from assistive technology; each newly shown card is announced once politely. With `prefers-reduced-motion` cards change instantly, without tilt or spring.

Thresholds live at the top of `SwipeDeck.tsx`; the history model is `useExplorer` in [`src/lib/explorer.ts`](src/lib/explorer.ts).

## Daily notifications (optional, needs setup)

An optional **real Web Push** feature (OneSignal): one message a day at 09:00 local time, even when the app is closed. Users opt in from a small invitation on Home or from *Settings → Daily Notifications* (switch, content choice: quotes / verses / both alternating, status). Nothing is requested from the browser or the push provider until the user clicks Enable, and no account is needed.

* The message is the quote or verse Lift Me Up recommends on that date, in the user's language; a click opens the matching screen showing exactly that card (`#/bible?id=<verse id>`).
* A scheduler script ([`scripts/daily-push.ts`](scripts/daily-push.ts)) runs on GitHub Actions and holds the only secret (the OneSignal REST API key). Content selection can be checked offline with `npm run push:verify`.
* Until you add your OneSignal App ID the feature stays off and invisible.
* **Full setup, test procedure and known limits: [`docs/PUSH_SETUP.md`](docs/PUSH_SETUP.md).** Real delivery has not been verified yet, because that requires your OneSignal credentials and a deployed HTTPS site.

## Content

All content lives in [`src/data/content.ts`](src/data/content.ts) as a structured collection with unique IDs and both translations.

- **24 original motivational quotes** (4 per category), written for this project. They are intentionally unattributed – no famous author is invented or implied.
- **18 Bible passages** (3 per category) as **original paraphrases in English and Greek**, always labelled *Paraphrase* with a note that they are not a word-for-word translation. No copyrighted Bible translation is reproduced. References use the common modern numbering; Psalms were deliberately avoided because Greek (Septuagint) and Protestant Psalm numbering differ.

> Please have the passages and references reviewed by someone familiar with the text before any public release. The paraphrases are kept close to the widely understood meaning of each passage, but they are not a substitute for reading the full passage in a trusted translation.

## Tech

React 19 · TypeScript · Vite · modern CSS with design tokens ([`src/styles/tokens.css`](src/styles/tokens.css)) · [Lucide](https://lucide.dev) icons · self-hosted fonts via Fontsource (Manrope, Fira Sans Extra Condensed, Alegreya, Caveat – all with Greek support except Caveat, which falls back to Alegreya Italic for Greek). No animation library – everything is CSS.

```
src/
  data/        content.ts (quotes + verses), i18n.ts (UI strings EN/EL)
  lib/         storage, daily-pick logic, explorer hook, share/copy, router, app context
  components/  Logo, header/nav, Poster (motivation), Verse (bible), shared UI
  screens/     Home, Motivation, Bible, Favorites, MyQuotes, Settings
  styles/      tokens, base, home, motivation, bible, screens
```

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). To test on your phone, run `npm run dev -- --host` and open the network URL on the same Wi-Fi.

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm run build:single  # optional: ONE self-contained HTML file in dist-single/ for quick sharing
```

## Publish on GitHub Pages

The app uses relative asset paths (`base: './'`) and hash-based routes (`#/bible`), so it works from any sub-path such as `https://<user>.github.io/lift-me-up/` with no server configuration.

**Option A – GitHub Actions (included)**

1. Create a GitHub repository and push this project to the `main` branch.
2. In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the site and publishes it.
4. Your app is live at `https://<user>.github.io/<repo>/`.

**Option B – manual**

```bash
npm run build
```

Publish the contents of `dist/` to a `gh-pages` branch (for example with `npx gh-pages -d dist`) and select that branch under **Settings → Pages**.

## What is saved locally

Everything is stored in the browser's `localStorage` under the `liftmeup:v1:` prefix and **never leaves the device**:

| Key | Contents |
|---|---|
| `prefs` | language (`en` / `el`) and appearance (`light` / `dark` / `system`) |
| `favorites` | IDs and timestamps of saved quotes and verses |
| `custom-quotes` | the personal quotes you write (title, text, dates) |

If local storage is blocked (e.g. some private windows) the app keeps working in memory and tells the user that changes will not survive closing the page. *Settings → Erase all my data* removes all three keys.

The official daily quote/verse is computed from the date, so no "today's pick" needs to be stored.

## Intentionally excluded

- **Notifications without opting in** – daily push is optional and off by default (see above); there is no tracking or nagging.
- **User accounts, cloud sync, backend, analytics, tracking** – out of scope and unnecessary for the core experience.
- **Public sharing or publishing of personal quotes** – personal quotes are private by design.
- **Verbatim Bible translations** – only labelled original paraphrases are included.

## Research basis

The design is informed by an initial questionnaire of **11 participants**:

- 11/11 preferred using the app on mobile → mobile-first layout, thumb-reachable bottom navigation.
- 9/11 wanted both Greek and English → full bilingual interface and content, instant switching.
- 6/11 wanted both quotes and Bible verses, 5/11 quotes only → two clearly separated worlds.
- 9/11 wanted a stable daily message *and* the option to request another → daily pick + *Next*.
- Single suggestions: customizable appearance, scheduled notifications, personal quotes and favorites → Light/Dark/Auto, My Quotes and Saved built in; notifications deferred.

**User testing has not been carried out yet.** This version is ready to be tested; no further research results are claimed.

## Accessibility

Semantic landmarks and a skip link, visible focus rings, keyboard-operable controls (including arrow keys in segmented controls), `aria-pressed` toggles, live-region announcements for new quotes/verses and toasts, accessible form validation (`aria-invalid`, `role="alert"`), native `<dialog>` confirmations that focus the safe *Cancel* action, AA text contrast checked for every world × light/dark combination, 44px+ touch targets, and full `prefers-reduced-motion` support.
