import { BookOpen, Heart, House, Moon, PenLine, Settings, Sun, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { useApp } from '../lib/AppContext';
import { hrefFor, type Route } from '../lib/router';
import type { I18nKey } from '../data/i18n';
import { Logo } from './Logo';

interface NavItem {
  route: Route;
  label: I18nKey;
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>;
}

const MOBILE_ITEMS: NavItem[] = [
  { route: 'home', label: 'nav.home', Icon: House },
  { route: 'motivation', label: 'nav.motivation', Icon: Zap },
  { route: 'bible', label: 'nav.bible', Icon: BookOpen },
  { route: 'favorites', label: 'nav.favorites', Icon: Heart },
  { route: 'settings', label: 'nav.settings', Icon: Settings },
];

const DESKTOP_ITEMS: NavItem[] = [
  { route: 'home', label: 'nav.home', Icon: House },
  { route: 'motivation', label: 'nav.motivation', Icon: Zap },
  { route: 'bible', label: 'nav.bible', Icon: BookOpen },
  { route: 'favorites', label: 'nav.favorites', Icon: Heart },
  { route: 'my-quotes', label: 'nav.myQuotes', Icon: PenLine },
  { route: 'settings', label: 'nav.settings', Icon: Settings },
];

function NavLinks({ items, route, variant }: { items: NavItem[]; route: Route; variant: 'top' | 'bottom' }) {
  const { t } = useApp();
  return (
    <nav className={`nav nav-${variant}`} aria-label={t('nav.main')}>
      <ul>
        {items.map(({ route: r, label, Icon }) => (
          <li key={r}>
            <a href={hrefFor(r)} aria-current={r === route ? 'page' : undefined} className="nav-link">
              <Icon size={variant === 'bottom' ? 22 : 18} aria-hidden="true" />
              <span>{t(label)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Header({ route }: { route: Route }) {
  const { t, lang, setLang, resolvedTheme, setTheme, notify } = useApp();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  const chooseLang = (l: 'en' | 'el') => {
    if (l === lang) return;
    setLang(l);
    notify(l === 'el' ? 'Η γλώσσα άλλαξε σε Ελληνικά.' : 'Language changed to English.');
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href={hrefFor('home')} className="brand-link" aria-label={t('nav.backHome')}>
          <Logo />
        </a>
        <div className="header-nav-desktop">
          <NavLinks items={DESKTOP_ITEMS} route={route} variant="top" />
        </div>
        <div className="header-tools">
          <div className="lang-toggle" role="group" aria-label={t('header.language')}>
            <button
              type="button"
              lang="en"
              aria-pressed={lang === 'en'}
              onClick={() => chooseLang('en')}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              lang="el"
              aria-pressed={lang === 'el'}
              onClick={() => chooseLang('el')}
              aria-label="Ελληνικά"
            >
              ΕΛ
            </button>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
          >
            {resolvedTheme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ route }: { route: Route }) {
  return (
    <div className="bottom-nav-wrap">
      <NavLinks items={MOBILE_ITEMS} route={route} variant="bottom" />
    </div>
  );
}
