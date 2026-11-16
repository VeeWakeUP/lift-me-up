import { useEffect, useRef, useState } from 'react';
import { BottomNav, Header } from './components/Chrome';
import { Toast } from './components/Ui';
import { AppProvider, useApp } from './lib/AppContext';
import { push, usePush } from './lib/push';
import { useHashRoute, usePrefersReducedMotion, worldOf, type Route, type World } from './lib/router';
import Bible from './screens/Bible';
import Favorites from './screens/Favorites';
import Home from './screens/Home';
import Motivation from './screens/Motivation';
import MyQuotes from './screens/MyQuotes';
import Settings from './screens/Settings';

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'motivation':
      return <Motivation />;
    case 'bible':
      return <Bible />;
    case 'favorites':
      return <Favorites />;
    case 'my-quotes':
      return <MyQuotes />;
    case 'settings':
      return <Settings />;
    default:
      return <Home />;
  }
}

/** Soft candlelight and paper grain for the library world. */
function BibleBackdrop() {
  return (
    <div className="backdrop backdrop-bible" aria-hidden="true">
      <span className="bd-glow" />
      <span className="bd-vignette" />
    </div>
  );
}

function Shell() {
  const { t, lang } = useApp();
  usePush(); // confirms an earlier subscription (only if the user opted in before)
  useEffect(() => {
    void push.syncLang(lang);
  }, [lang]);
  const hashRoute = useHashRoute();
  const reduced = usePrefersReducedMotion();

  /* `shown` lags `hashRoute` while a world-to-world transition covers the screen. */
  const [shown, setShown] = useState<Route>(hashRoute);
  const [wipe, setWipe] = useState<World | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    const current = shownRef.current;
    if (hashRoute === current) {
      setWipe(null);
      return;
    }
    const to = worldOf(hashRoute);
    if (reduced || worldOf(current) === to) {
      setWipe(null);
      setShown(hashRoute);
      return;
    }
    setWipe(to);
    const swap = window.setTimeout(() => setShown(hashRoute), 520);
    const done = window.setTimeout(() => setWipe(null), 1150);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(done);
    };
  }, [hashRoute, reduced]);

  const world = worldOf(shown);
  useEffect(() => {
    document.documentElement.dataset.world = world;
  }, [world]);

  /* Move focus + scroll to the top of the new screen (not on first load). */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [shown]);

  return (
    <div className={`app ${shown === 'home' ? 'is-home-page' : ''}`} data-world={world}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        {t('nav.skip')}
      </a>
      {world === 'bible' && <BibleBackdrop />}
      <Header route={shown} />
      <main id="main" ref={mainRef} tabIndex={-1} lang={lang} key={shown} className="main">
        <Screen route={shown} />
      </main>
      <BottomNav route={shown} />
      <Toast />
      {wipe && (
        <div className={`wipe wipe-${wipe}`} aria-hidden="true">
          <span className="wipe-a" />
          <span className="wipe-b" />
          <span className="wipe-c" />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
