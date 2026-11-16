import { useEffect, useRef, useState } from 'react';

/**
 * A tiny hash router. Hash URLs keep the app a pure static site that works on GitHub Pages
 * without any server-side rewrite rules.
 */
export type Route = 'home' | 'motivation' | 'bible' | 'favorites' | 'my-quotes' | 'settings';
export type World = 'home' | 'motivation' | 'bible';

const ROUTES: Route[] = ['home', 'motivation', 'bible', 'favorites', 'my-quotes', 'settings'];

export function parseHash(hash: string = window.location.hash): Route {
  const name = hash.replace(/^#\/?/, '').split(/[?/]/)[0] as Route;
  return ROUTES.includes(name) ? name : 'home';
}

export function hrefFor(route: Route): string {
  return route === 'home' ? '#/' : `#/${route}`;
}

export function worldOf(route: Route): World {
  if (route === 'motivation' || route === 'my-quotes') return 'motivation';
  if (route === 'bible') return 'bible';
  return 'home';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Reads `?name=value` pairs from the hash, e.g. `#/bible?id=v-faith-1`. */
export function hashParams(hash: string = window.location.hash): URLSearchParams {
  const i = hash.indexOf('?');
  return new URLSearchParams(i >= 0 ? hash.slice(i + 1) : '');
}

/**
 * Notification deep links look like `#/motivation?id=<quote id>`. When one arrives (on first
 * load, or while the app is already open) hand the id to `onId`. If the screen recognises the
 * card (returns true) the id is removed from the address, so a reload or a back-navigation
 * does not repeat it. A screen that does not know the id leaves it for the one that does.
 */
export function useDeepLinkId(onId: (id: string) => boolean) {
  const latest = useRef(onId);
  latest.current = onId;
  useEffect(() => {
    const check = () => {
      const id = hashParams().get('id');
      if (!id) return;
      if (!latest.current(id)) return; // not a card of this screen: leave the link for the right one
      const clean = window.location.hash.split('?')[0] || '#/';
      window.history.replaceState(null, '', window.location.pathname + window.location.search + clean);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
}
