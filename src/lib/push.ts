/**
 * Daily push notifications (OneSignal Web Push).
 *
 *  - Everything is opt-in. The OneSignal SDK is NOT loaded until the user has clicked
 *    Enable (or had already enabled notifications earlier), so a visitor who never opts in
 *    makes no request to the push provider, and no browser permission prompt can appear.
 *  - The app ID below is public by design. The REST API key that sends the notifications
 *    lives only in the scheduler (GitHub Actions secret), never in this code.
 *  - The provider stores a device token plus four non-sensitive tags used by the scheduler:
 *      daily=1, lang=en|el, kind=quote|verse|alt, tzo=<UTC offset in minutes>
 *  - The switch only reads "on" when the browser permission AND the push subscription have
 *    both been confirmed by the SDK.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { Lang } from '../data/content';
import { KEYS, readJSON, writeJSON } from './storage';

export type PushKind = 'quote' | 'verse' | 'both';
export type Support = 'ok' | 'ios-install' | 'unsupported' | 'unconfigured';
export type Permission = 'default' | 'granted' | 'denied' | 'unsupported';
export type PushError = 'denied' | 'failed' | 'timeout' | null;

export interface PushState {
  support: Support;
  permission: Permission;
  /** Permission granted AND an active push subscription confirmed by the SDK. */
  subscribed: boolean;
  /** Verifying an earlier subscription in the background. */
  checking: boolean;
  busy: boolean;
  error: PushError;
  kind: PushKind;
  inviteDismissed: boolean;
}

/** The tag value used by the scheduler for each content choice. */
const KIND_TAG: Record<PushKind, string> = { quote: 'quote', verse: 'verse', both: 'alt' };
const TAG_KEYS = ['daily', 'lang', 'kind', 'tzo'];
const SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const APP_ID = (import.meta.env.VITE_ONESIGNAL_APP_ID ?? '').trim();

/* ----------------------------- minimal SDK typing ---------------------------- */
interface OneSignalApi {
  init(options: Record<string, unknown>): Promise<void>;
  Notifications: { requestPermission(): Promise<unknown> };
  User: {
    addTags(tags: Record<string, string>): void;
    removeTags(keys: string[]): void;
    PushSubscription: {
      readonly id: string | null | undefined;
      readonly optedIn: boolean | undefined;
      optIn(): Promise<void>;
      optOut(): Promise<void>;
    };
  };
}
declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalApi) => void | Promise<void>>;
    /** Test seam, honoured in development builds only. */
    __lmuOneSignalMock?: OneSignalApi;
  }
}

/* ------------------------------ feature detection ---------------------------- */
function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function detectSupport(): Support {
  if (!APP_ID) return 'unconfigured';
  const capable =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
  if (!capable && isIos() && !isStandalone()) return 'ios-install';
  return capable ? 'ok' : 'unsupported';
}
function nativePermission(): Permission {
  return 'Notification' in window ? (Notification.permission as Permission) : 'unsupported';
}

/** The folder the app is served from, e.g. "/lift-me-up/" on GitHub Pages or "/" locally. */
function basePath(): string {
  return new URL(import.meta.env.BASE_URL, window.location.href).pathname;
}

/* ----------------------------------- SDK ------------------------------------ */
let sdk: Promise<OneSignalApi> | null = null;

function loadSdk(): Promise<OneSignalApi> {
  if (import.meta.env.DEV && window.__lmuOneSignalMock) return Promise.resolve(window.__lmuOneSignalMock);
  if (sdk) return sdk;
  sdk = new Promise<OneSignalApi>((resolve, reject) => {
    const base = basePath();
    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (os) => {
      try {
        await os.init({
          appId: APP_ID,
          serviceWorkerPath: `${base.replace(/^\//, '')}OneSignalSDKWorker.js`,
          serviceWorkerParam: { scope: base },
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false }, // we provide our own, gentle UI
          welcomeNotification: { disable: true },
          autoResubscribe: true,
          // reuse an open tab and navigate it to the deep link when a notification is clicked
          notificationClickHandlerMatch: 'origin',
          notificationClickHandlerAction: 'navigate',
        });
        resolve(os);
      } catch (e) {
        reject(e);
      }
    });
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.defer = true;
    s.onerror = () => reject(new Error('OneSignal SDK could not be loaded'));
    document.head.appendChild(s);
  }).catch((e) => {
    sdk = null; // allow a later retry
    throw e;
  });
  return sdk;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
async function waitFor(check: () => boolean, ms = 12000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await wait(250);
  }
  return check();
}

const subscriptionConfirmed = (os: OneSignalApi) =>
  nativePermission() === 'granted' && os.User.PushSubscription.optedIn === true && !!os.User.PushSubscription.id;

/* ------------------------------------ store ---------------------------------- */
interface Saved {
  enabled: boolean;
  kind: PushKind;
  inviteDismissed: boolean;
}
const isKind = (k: unknown): k is PushKind => k === 'quote' || k === 'verse' || k === 'both';
function loadSaved(): Saved {
  const raw = readJSON<Partial<Saved>>(KEYS.push, {}, (v): v is Partial<Saved> => typeof v === 'object' && v !== null);
  return {
    enabled: raw.enabled === true,
    kind: isKind(raw.kind) ? raw.kind : 'both',
    inviteDismissed: raw.inviteDismissed === true,
  };
}

let saved: Saved = loadSaved();
let state: PushState = {
  support: detectSupport(),
  permission: nativePermission(),
  subscribed: false,
  checking: false,
  busy: false,
  error: null,
  kind: saved.kind,
  inviteDismissed: saved.inviteDismissed,
};
let started = false;
let currentLang: Lang = 'en';
const listeners = new Set<() => void>();

function set(patch: Partial<PushState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function persist(patch: Partial<Saved>) {
  saved = { ...saved, ...patch };
  writeJSON(KEYS.push, saved);
}

const tzOffsetMinutes = () => String(-new Date().getTimezoneOffset());

function writeTags(os: OneSignalApi) {
  os.User.addTags({ daily: '1', lang: currentLang, kind: KIND_TAG[state.kind], tzo: tzOffsetMinutes() });
}

/** Called once per page load: if the user enabled notifications earlier, confirm it is still true. */
async function start() {
  if (started) return;
  started = true;
  if (state.support !== 'ok' || !saved.enabled) return;
  set({ checking: true });
  try {
    const os = await loadSdk();
    const ok = await waitFor(() => subscriptionConfirmed(os), 6000);
    set({ subscribed: ok, permission: nativePermission(), checking: false });
    if (ok) writeTags(os); // keeps language and time-zone offset current
    else persist({ enabled: false }); // revoked in the browser: stay honest
  } catch {
    // Offline or SDK blocked: do not claim it is on.
    set({ subscribed: false, checking: false });
  }
}

export const push = {
  getState: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  start,

  /** Ask for permission (only ever called from a click) and confirm the subscription. */
  async enable(kind?: PushKind): Promise<boolean> {
    if (state.support !== 'ok' || state.busy) return false;
    if (kind) {
      persist({ kind });
      set({ kind });
    }
    set({ busy: true, error: null });
    try {
      const os = await loadSdk();
      await os.Notifications.requestPermission();
      if (nativePermission() !== 'granted') {
        set({ busy: false, permission: nativePermission(), error: 'denied' });
        return false;
      }
      await os.User.PushSubscription.optIn();
      const ok = await waitFor(() => subscriptionConfirmed(os));
      if (!ok) {
        set({ busy: false, permission: nativePermission(), error: 'timeout' });
        return false;
      }
      writeTags(os);
      persist({ enabled: true });
      set({ busy: false, subscribed: true, permission: nativePermission() });
      return true;
    } catch {
      set({ busy: false, permission: nativePermission(), error: 'failed' });
      return false;
    }
  },

  /** Remove the tags and opt the device out, so the scheduler no longer targets it. */
  async disable(): Promise<void> {
    set({ busy: true, error: null });
    persist({ enabled: false });
    try {
      if (state.support === 'ok' && (state.subscribed || sdk || (import.meta.env.DEV && window.__lmuOneSignalMock))) {
        const os = await loadSdk();
        os.User.removeTags(TAG_KEYS);
        await os.User.PushSubscription.optOut();
        await waitFor(() => os.User.PushSubscription.optedIn !== true, 6000);
      }
      set({ busy: false, subscribed: false });
    } catch {
      set({ busy: false, subscribed: false, error: 'failed' });
    }
  },

  async setKind(kind: PushKind) {
    persist({ kind });
    set({ kind });
    if (state.subscribed) {
      try {
        writeTags(await loadSdk());
      } catch {
        set({ error: 'failed' });
      }
    }
  },

  /** Keep the provider's language tag in step with the app language. */
  async syncLang(lang: Lang) {
    currentLang = lang;
    if (!state.subscribed) return;
    try {
      writeTags(await loadSdk());
    } catch {
      /* best effort */
    }
  },

  /** The user may have changed the site permission in the browser's own settings. */
  refreshPermission() {
    const p = nativePermission();
    if (p !== state.permission) set({ permission: p });
  },

  dismissInvite() {
    persist({ inviteDismissed: true });
    set({ inviteDismissed: true });
  },

  /** Used by "Erase all my data": go back to a clean first-visit state. */
  async resetAll() {
    await this.disable();
    saved = { enabled: false, kind: 'both', inviteDismissed: false };
    writeJSON(KEYS.push, saved);
    set({ kind: 'both', inviteDismissed: false, error: null });
  },
};

export function usePush(): PushState {
  const s = useSyncExternalStore(push.subscribe, push.getState, push.getState);
  useEffect(() => {
    void push.start();
    const refresh = () => push.refreshPermission();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return s;
}
