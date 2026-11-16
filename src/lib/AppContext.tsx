import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Lang } from '../data/content';
import { translate, type I18nKey } from '../data/i18n';
import { KEYS, readJSON, removeKey, storageAvailable, writeJSON } from './storage';

export type Theme = 'light' | 'dark' | 'system';
export type FavType = 'quote' | 'verse';

export interface Prefs {
  lang: Lang;
  theme: Theme;
}
export interface Favorite {
  type: FavType;
  id: string;
  savedAt: number;
}
export interface CustomQuote {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}
export interface ToastData {
  key: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

export const MAX_QUOTE_LENGTH = 280;
export const MAX_TITLE_LENGTH = 60;

/* ------------------------------ validation -------------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function isPrefs(v: unknown): v is Partial<Prefs> {
  return isObj(v);
}
function isFavList(v: unknown): v is Favorite[] {
  return (
    Array.isArray(v) &&
    v.every(
      (f) =>
        isObj(f) &&
        (f.type === 'quote' || f.type === 'verse') &&
        typeof f.id === 'string' &&
        typeof f.savedAt === 'number',
    )
  );
}
function isCustomList(v: unknown): v is CustomQuote[] {
  return (
    Array.isArray(v) &&
    v.every(
      (q) =>
        isObj(q) &&
        typeof q.id === 'string' &&
        typeof q.text === 'string' &&
        typeof q.title === 'string' &&
        typeof q.createdAt === 'number' &&
        typeof q.updatedAt === 'number',
    )
  );
}

function defaultLang(): Lang {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith('el')) ? 'el' : 'en';
}
const DEFAULT_PREFS = (): Prefs => ({ lang: defaultLang(), theme: 'system' });

function loadPrefs(): Prefs {
  const saved = readJSON<Partial<Prefs>>(KEYS.prefs, {}, isPrefs);
  const d = DEFAULT_PREFS();
  return {
    lang: saved.lang === 'el' || saved.lang === 'en' ? saved.lang : d.lang,
    theme: saved.theme === 'light' || saved.theme === 'dark' || saved.theme === 'system' ? saved.theme : d.theme,
  };
}

/* -------------------------------- context --------------------------------- */

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  t: (key: I18nKey, vars?: Record<string, string | number>) => string;
  storageOk: boolean;

  favorites: Favorite[];
  isFav: (type: FavType, id: string) => boolean;
  setFav: (type: FavType, id: string, on: boolean, savedAt?: number) => void;

  customQuotes: CustomQuote[];
  addCustomQuote: (title: string, text: string) => void;
  updateCustomQuote: (id: string, title: string, text: string) => void;
  deleteCustomQuote: (id: string) => void;

  resetPrefs: () => void;
  eraseAll: () => void;

  toast: ToastData | null;
  notify: (message: string, action?: ToastData['action']) => void;
  dismissToast: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [favorites, setFavorites] = useState<Favorite[]>(() => readJSON(KEYS.favorites, [], isFavList));
  const [customQuotes, setCustomQuotes] = useState<CustomQuote[]>(() =>
    readJSON(KEYS.customQuotes, [], isCustomList),
  );
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const toastKey = useRef(0);
  const warnedStorage = useRef(false);

  const lang = prefs.lang;
  const resolvedTheme: 'light' | 'dark' =
    prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;

  const t = useCallback(
    (key: I18nKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  /* toast */
  const dismissToast = useCallback(() => {
    window.clearTimeout(toastTimer.current);
    setToast(null);
  }, []);
  const notify = useCallback((message: string, action?: ToastData['action']) => {
    window.clearTimeout(toastTimer.current);
    toastKey.current += 1;
    setToast({ key: toastKey.current, message, action });
    toastTimer.current = window.setTimeout(() => setToast(null), action ? 6500 : 3200);
  }, []);

  /* follow the OS colour scheme while theme === 'system' */
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /* reflect language + theme on <html> */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [lang, resolvedTheme]);

  /* persistence */
  const persist = useCallback(
    (key: string, value: unknown) => {
      const ok = writeJSON(key, value);
      if (!ok && !warnedStorage.current) {
        warnedStorage.current = true;
        notify(translate(lang, 'toast.storageUnavailable'));
      }
    },
    [lang, notify],
  );
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) return;
    persist(KEYS.prefs, prefs);
  }, [prefs, persist]);
  useEffect(() => {
    if (firstRun.current) return;
    persist(KEYS.favorites, favorites);
  }, [favorites, persist]);
  useEffect(() => {
    if (firstRun.current) return;
    persist(KEYS.customQuotes, customQuotes);
  }, [customQuotes, persist]);
  useEffect(() => {
    firstRun.current = false;
  }, []);

  /* actions */
  const setLang = useCallback((l: Lang) => setPrefs((p) => ({ ...p, lang: l })), []);
  const setTheme = useCallback((th: Theme) => setPrefs((p) => ({ ...p, theme: th })), []);

  const isFav = useCallback(
    (type: FavType, id: string) => favorites.some((f) => f.type === type && f.id === id),
    [favorites],
  );
  const setFav = useCallback((type: FavType, id: string, on: boolean, savedAt?: number) => {
    setFavorites((list) => {
      const without = list.filter((f) => !(f.type === type && f.id === id));
      return on ? [{ type, id, savedAt: savedAt ?? Date.now() }, ...without] : without;
    });
  }, []);

  const addCustomQuote = useCallback((title: string, text: string) => {
    const now = Date.now();
    const id = `c-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setCustomQuotes((l) => [{ id, title: title.trim(), text: text.trim(), createdAt: now, updatedAt: now }, ...l]);
  }, []);
  const updateCustomQuote = useCallback((id: string, title: string, text: string) => {
    setCustomQuotes((l) =>
      l.map((q) => (q.id === id ? { ...q, title: title.trim(), text: text.trim(), updatedAt: Date.now() } : q)),
    );
  }, []);
  const deleteCustomQuote = useCallback((id: string) => {
    setCustomQuotes((l) => l.filter((q) => q.id !== id));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS());
  }, []);
  const eraseAll = useCallback(() => {
    setPrefs(DEFAULT_PREFS());
    setFavorites([]);
    setCustomQuotes([]);
    removeKey(KEYS.prefs);
    removeKey(KEYS.favorites);
    removeKey(KEYS.customQuotes);
    firstRun.current = true; // skip persisting the freshly emptied state
    window.setTimeout(() => {
      firstRun.current = false;
    }, 0);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      lang,
      setLang,
      theme: prefs.theme,
      resolvedTheme,
      setTheme,
      t,
      storageOk: storageAvailable,
      favorites,
      isFav,
      setFav,
      customQuotes,
      addCustomQuote,
      updateCustomQuote,
      deleteCustomQuote,
      resetPrefs,
      eraseAll,
      toast,
      notify,
      dismissToast,
    }),
    [
      lang, setLang, prefs.theme, resolvedTheme, setTheme, t, favorites, isFav, setFav,
      customQuotes, addCustomQuote, updateCustomQuote, deleteCustomQuote, resetPrefs, eraseAll,
      toast, notify, dismissToast,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
