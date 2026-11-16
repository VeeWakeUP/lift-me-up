import { useCallback, useState } from 'react';
import type { Lang } from '../data/content';
import { pickNext } from './daily';

export const localeFor = (lang: Lang) => (lang === 'el' ? 'el-GR' : 'en-GB');

export function formatLongDate(lang: Lang, d: Date = new Date()): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatShortDate(lang: Lang, d: Date = new Date()): string {
  return new Intl.DateTimeFormat(localeFor(lang), { day: 'numeric', month: 'short' }).format(d);
}

const MAX_HISTORY = 60;
const RECENT_WINDOW = 40;

/** One visited card. `cat` is the category filter that was active when it was shown. */
interface Entry {
  id: string;
  cat: string | null;
}

interface DeckState {
  entries: Entry[];
  pos: number;
  /** How many old entries were dropped from the front (keeps `seq` stable). */
  base: number;
  /** The card that "Next" will reveal when there is nothing newer in the history. */
  upcoming: string;
}

/**
 * Card-stack model shared by Daily Motivation and Bible Verses.
 *
 *  - starts on the official daily item (never altered by browsing)
 *  - `advance()` moves forward through already-visited cards, or reveals `upcoming`
 *  - `rewind()` steps back through the real viewing history
 *  - the next card (`peek`) is decided in advance, so it can be shown under the current one
 *  - random picks avoid everything seen recently, so a category is explored fully before it repeats
 *  - each history entry remembers its category filter, so rewinding restores the right chip
 * Only ids are stored, so changing language shows the very same cards.
 */
export function useExplorer<T extends { id: string; category: string }>(items: readonly T[], daily: T) {
  const poolFor = useCallback(
    (cat: string | null) => (cat ? items.filter((i) => i.category === cat) : items),
    [items],
  );
  const pick = useCallback(
    (cat: string | null, entries: Entry[]) =>
      pickNext(poolFor(cat), entries.slice(-RECENT_WINDOW).map((e) => e.id)).id,
    [poolFor],
  );

  const [deck, setDeck] = useState<DeckState>(() => {
    const entries = [{ id: daily.id, cat: null }];
    return { entries, pos: 0, base: 0, upcoming: pick(null, entries) };
  });
  const [nonce, setNonce] = useState(0);
  const [announce, setAnnounce] = useState(false);

  const bump = () => {
    setNonce((n) => n + 1);
    setAnnounce(true);
  };

  /** Append an entry after the current position (dropping any "forward" history). */
  const push = (s: DeckState, entry: Entry): DeckState => {
    let entries = [...s.entries.slice(0, s.pos + 1), entry];
    let base = s.base;
    if (entries.length > MAX_HISTORY) {
      base += entries.length - MAX_HISTORY;
      entries = entries.slice(-MAX_HISTORY);
    }
    return { entries, pos: entries.length - 1, base, upcoming: pick(entry.cat, entries) };
  };

  const advance = () => {
    setDeck((s) => {
      if (s.pos < s.entries.length - 1) return { ...s, pos: s.pos + 1 };
      return push(s, { id: s.upcoming, cat: s.entries[s.pos].cat });
    });
    bump();
  };

  const rewind = () => {
    setDeck((s) => (s.pos > 0 ? { ...s, pos: s.pos - 1 } : s));
    bump();
  };

  const chooseCategory = (cat: string | null) => {
    if (cat === null) {
      backToToday();
      return;
    }
    setDeck((s) => push(s, { id: pick(cat, s.entries.slice(0, s.pos + 1)), cat }));
    bump();
  };

  const backToToday = () => {
    setDeck((s) => {
      const cur = s.entries[s.pos];
      if (cur.id === daily.id && cur.cat === null) return s;
      return push(s, { id: daily.id, cat: null });
    });
    bump();
  };

  /**
   * Jump to a specific card (used by notification links). It becomes a normal history step:
   * the official daily card is not changed, and Rewind returns to where the user was.
   */
  const showId = (id: string) => {
    if (!items.some((i) => i.id === id)) return false;
    setDeck((s) => {
      if (s.entries[s.pos].id === id) return s;
      return push(s, { id, cat: null });
    });
    bump();
    return true;
  };

  const byId = (id: string) => items.find((i) => i.id === id) ?? daily;
  const cur = deck.entries[deck.pos];
  const peekId = deck.pos < deck.entries.length - 1 ? deck.entries[deck.pos + 1].id : deck.upcoming;

  return {
    current: byId(cur.id),
    peek: byId(peekId),
    isOfficial: cur.id === daily.id,
    category: cur.cat,
    /** Absolute position in the viewing history: a stable React key for each card. */
    seq: deck.base + deck.pos,
    nonce,
    announce,
    canRewind: deck.pos > 0,
    advance,
    rewind,
    chooseCategory,
    backToToday,
    showId,
  };
}
