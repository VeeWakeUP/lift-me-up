import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';

export type DeckDir = 'left' | 'right';
/** How the new top card arrives: restored from a side (rewind), or a soft cross-fade (category change). */
export type DeckEnter = 'fade' | 'from-left' | 'from-right' | null;

export interface DeckHandle {
  /** Same as a swipe: the top card leaves and the next one rises. */
  next: () => void;
  rewind: () => void;
  isBusy: () => boolean;
}

interface Props<T extends { id: string }> {
  top: T;
  /** The card waiting underneath (the one that will be shown next). */
  under: T | null;
  /** Position of `top` in the viewing history; gives every card a stable key. */
  seq: number;
  renderCard: (item: T) => ReactNode;
  canRewind: boolean;
  /** Called once the top card has left the screen. The parent moves its history forward. */
  onAdvance: () => void;
  /** The parent steps its history back. `enter` tells the deck how the restored card arrives. */
  onRewind: (enter: DeckEnter) => void;
  enter: DeckEnter;
  handleRef?: Ref<DeckHandle>;
  label: string;
}

/* ---- tuning ------------------------------------------------------------------ */
const MOUSE_THRESHOLD = 5; // px before a mouse press becomes a swipe
const TOUCH_SLOP = 8; // px of sideways travel before a finger gesture starts
const MIN_DISTANCE = 80; // px (or 22% of the card width, whichever is larger) to commit a swipe
const FLICK_DISTANCE = 36; // px: a fast flick may commit after only this much travel
const FLICK_VELOCITY = 0.45; // px/ms
const MAX_TILT = 7; // degrees while dragging
const EXIT_MS = 260;
const ENTER_MS = 400;

type Phase = 'idle' | 'pending' | 'track';
interface Sample {
  t: number;
  x: number;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Lets a parent trigger a card-arrival animation for a moment, then clears it again. */
export function useDeckEnter(): [DeckEnter, (kind: DeckEnter) => void] {
  const [enter, setEnter] = useState<DeckEnter>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const trigger = useCallback((kind: DeckEnter) => {
    window.clearTimeout(timer.current);
    setEnter(kind);
    if (kind) timer.current = window.setTimeout(() => setEnter(null), ENTER_MS + 60);
  }, []);
  return [enter, trigger];
}

/**
 * One card-stack and one gesture engine for the whole app (Daily Motivation and Bible
 * Verses). The top card follows the pointer; the next card waits underneath and rises as
 * the top card leaves. Swiping left OR right advances. Going back is done with `rewind()`.
 *
 * Movement is written straight to the DOM (no React re-render per pointer move). All
 * state changes that matter (advancing, rewinding) happen on timers, never on animation
 * events, so a throttled or interrupted animation can never leave the stack stuck.
 */
export function SwipeDeck<T extends { id: string }>({
  top,
  under,
  seq,
  renderCard,
  canRewind,
  onAdvance,
  onRewind,
  enter,
  handleRef,
  label,
}: Props<T>) {
  const deckRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ onAdvance, onRewind, canRewind });
  latest.current = { onAdvance, onRewind, canRewind };

  const g = useRef({
    phase: 'idle' as Phase,
    id: -1,
    sx: 0, // pointer x at the start of the press
    sy: 0,
    px: 0, // latest pointer x
    anchor: 0, // pointer x the offset is measured from
    x0: 0, // card offset when the gesture began (a spring-back may still have been running)
    ox: 0, // current card offset
    width: 320,
    thr: MIN_DISTANCE,
    samples: [] as Sample[],
    busy: false,
    committing: false,
    timer: 0,
    safety: 0,
    cleanup: 0,
    dirs: [] as DeckDir[],
  });

  const topEl = () => deckRef.current?.querySelector<HTMLElement>(':scope > .deck-card.is-top') ?? null;

  const setProgress = (p: number) => deckRef.current?.style.setProperty('--p', p.toFixed(3));

  const place = (ox: number) => {
    const el = topEl();
    if (!el) return;
    const tilt = reducedMotion() ? 0 : Math.max(-MAX_TILT, Math.min(MAX_TILT, (ox / g.current.width) * 16));
    el.style.transform = `translate3d(${ox}px,0,0) rotate(${tilt}deg)`; // always fully opaque while held
  };

  const clearInline = () => {
    deckRef.current?.querySelectorAll<HTMLElement>(':scope > .deck-card').forEach((c) => {
      c.style.transition = '';
      c.style.transform = '';
      c.style.opacity = '';
    });
    deckRef.current?.style.removeProperty('--p');
    deckRef.current?.classList.remove('tracking', 'rising');
  };

  const currentOffset = (el: HTMLElement): number => {
    const m = getComputedStyle(el).transform;
    if (!m || m === 'none') return 0;
    try {
      return new DOMMatrixReadOnly(m).m41;
    } catch {
      return 0;
    }
  };

  /* ---------------------------------------------------------- outcomes */
  const springBack = () => {
    const s = g.current;
    const el = topEl();
    deckRef.current?.classList.remove('tracking');
    if (!el) return;
    if (reducedMotion()) {
      clearInline();
      return;
    }
    // soft spring: a little overshoot, then settle
    el.style.transition = 'transform 0.5s cubic-bezier(0.25, 1.4, 0.5, 1), opacity 0.3s ease-out';
    el.style.transform = '';
    el.style.opacity = '';
    setProgress(0);
    window.clearTimeout(s.cleanup);
    s.cleanup = window.setTimeout(() => {
      if (!s.busy && s.phase === 'idle') clearInline();
    }, 560);
  };

  const commit = (dir: DeckDir) => {
    const s = g.current;
    if (s.busy) return;
    s.busy = true;
    s.committing = true;
    s.width = deckRef.current?.offsetWidth ?? s.width;
    window.clearTimeout(s.cleanup);
    s.dirs.push(dir);
    if (s.dirs.length > 80) s.dirs.shift();
    const finish = () => {
      window.clearTimeout(s.timer);
      latest.current.onAdvance();
      // The layout effect below tidies up once React has swapped the cards. Safety net:
      window.clearTimeout(s.safety);
      s.safety = window.setTimeout(() => {
        clearInline();
        s.busy = false;
        s.committing = false;
      }, 500);
    };
    if (reducedMotion()) {
      finish();
      return;
    }
    const el = topEl();
    const deck = deckRef.current;
    if (el && deck) {
      deck.classList.remove('tracking');
      deck.classList.add('rising'); // the card underneath grows to full size
      deck.style.removeProperty('--p');
      const w = s.width * 1.35;
      el.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.3, 0.6, 0.4, 1), opacity ${EXIT_MS}ms ease-in`;
      el.style.transform = `translate3d(${dir === 'left' ? -w : w}px,0,0) rotate(${dir === 'left' ? -10 : 10}deg)`;
      el.style.opacity = '0';
    }
    s.timer = window.setTimeout(finish, EXIT_MS);
  };

  const rewind = () => {
    const s = g.current;
    if (s.busy || !latest.current.canRewind) return;
    s.busy = true;
    const dir = s.dirs.pop() ?? 'left'; // the card comes back from the side it left through
    clearInline();
    latest.current.onRewind(dir === 'left' ? 'from-left' : 'from-right');
    window.clearTimeout(s.timer);
    s.timer = window.setTimeout(() => {
      s.busy = false;
    }, reducedMotion() ? 0 : ENTER_MS);
  };

  useImperativeHandle(
    handleRef,
    () => ({
      next: () => commit('left'),
      rewind,
      isBusy: () => g.current.busy,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ------------------------------------------------------------ pointer */
  const onKeyRef = useRef((e: KeyboardEvent) => {
    if (e.key === 'Escape' && g.current.phase === 'track') {
      g.current.phase = 'idle';
      window.removeEventListener('keydown', onKeyRef.current);
      springBack();
    }
  });

  const beginTrack = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = g.current;
    const el = topEl();
    if (!el) {
      s.phase = 'idle';
      return;
    }
    s.phase = 'track';
    s.x0 = currentOffset(el); // pick up a card that is still springing back, without a jump
    s.ox = s.x0;
    s.anchor = s.px;
    window.clearTimeout(s.cleanup);
    el.style.transition = 'none';
    deckRef.current?.classList.add('tracking');
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    window.addEventListener('keydown', onKeyRef.current);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (s.busy || s.phase !== 'idle') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    s.phase = 'pending';
    s.id = e.pointerId;
    s.sx = s.px = e.clientX;
    s.sy = e.clientY;
    s.samples = [{ t: performance.now(), x: e.clientX }];
    const w = deckRef.current?.offsetWidth ?? 320;
    s.width = w;
    s.thr = Math.max(MIN_DISTANCE, w * 0.22);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id || s.phase === 'idle') return;
    s.px = e.clientX;
    s.samples.push({ t: performance.now(), x: e.clientX });
    if (s.samples.length > 20) s.samples.splice(0, s.samples.length - 20);

    if (s.phase === 'pending') {
      const dx = e.clientX - s.sx;
      const dy = e.clientY - s.sy;
      if (e.pointerType === 'mouse') {
        if (Math.hypot(dx, dy) <= MOUSE_THRESHOLD) return;
      } else if (Math.abs(dx) > TOUCH_SLOP && Math.abs(dx) > Math.abs(dy) * 1.2) {
        /* sideways intent: take over from here */
      } else if (Math.abs(dy) > TOUCH_SLOP) {
        s.phase = 'idle'; // the finger is scrolling the page
        return;
      } else return;
      beginTrack(e);
    }
    s.ox = s.x0 + (e.clientX - s.anchor);
    place(s.ox);
    setProgress(Math.min(Math.abs(s.ox) / s.thr, 1));
  };

  const velocity = (): number => {
    const sm = g.current.samples;
    if (sm.length < 2) return 0;
    const last = sm[sm.length - 1];
    let first = last;
    for (let i = sm.length - 2; i >= 0; i--) {
      if (last.t - sm[i].t > 110) break;
      first = sm[i];
    }
    const dt = last.t - first.t;
    return dt < 8 ? 0 : (last.x - first.x) / dt;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    if (s.phase === 'pending') {
      s.phase = 'idle'; // a plain click or tap
      return;
    }
    if (s.phase !== 'track') return;
    s.phase = 'idle';
    window.removeEventListener('keydown', onKeyRef.current);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    s.px = e.clientX;
    s.samples.push({ t: performance.now(), x: e.clientX });
    const v = velocity();
    const ox = s.ox;
    const far = Math.abs(ox) >= s.thr;
    const flick = Math.abs(ox) >= FLICK_DISTANCE && Math.abs(v) >= FLICK_VELOCITY && Math.sign(v) === Math.sign(ox);
    if (far || flick) commit(ox < 0 ? 'left' : 'right');
    else springBack();
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    if (s.phase === 'track') {
      s.phase = 'idle';
      window.removeEventListener('keydown', onKeyRef.current);
      springBack();
    } else s.phase = 'idle';
  };

  /* ------------------------------------------------------------ effects */
  // Stop the page scrolling under a finger that is swiping the card.
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (g.current.phase === 'track' && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  // The cards were swapped by React: remove every temporary inline style in the same frame.
  useLayoutEffect(() => {
    const s = g.current;
    if (s.committing) {
      clearInline();
      s.committing = false;
      s.busy = false;
      window.clearTimeout(s.safety);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq, top.id]);

  useEffect(() => {
    const s = g.current;
    const key = onKeyRef.current;
    return () => {
      window.clearTimeout(s.timer);
      window.clearTimeout(s.safety);
      window.clearTimeout(s.cleanup);
      window.removeEventListener('keydown', key);
    };
  }, []);

  /* ------------------------------------------------------------- render */
  // Cards are always listed lowest history position first, so React never has to move
  // a DOM node when the top card leaves and the next one takes its place.
  const cards = [
    { item: top, seq, isTop: true },
    ...(under ? [{ item: under, seq: seq + 1, isTop: false }] : []),
  ];

  return (
    <div
      ref={deckRef}
      className="deck"
      role="group"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => {
        if (g.current.phase === 'track') e.preventDefault();
      }}
    >
      {cards.map((c) => (
        <div
          key={`${c.seq}:${c.item.id}`}
          className={`deck-card ${c.isTop ? 'is-top' : 'is-under'} ${c.isTop && enter ? `enter-${enter}` : ''}`}
          inert={!c.isTop}
          aria-hidden={!c.isTop}
        >
          {renderCard(c.item)}
        </div>
      ))}
    </div>
  );
}
