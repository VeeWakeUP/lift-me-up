/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public OneSignal App ID (safe to expose). Leave empty to disable the notification feature. */
  readonly VITE_ONESIGNAL_APP_ID?: string;
}
