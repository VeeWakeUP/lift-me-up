import { Database, Info, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { NotificationSettings } from '../components/Notifications';
import { ConfirmDialog, Segmented } from '../components/Ui';
import { push } from '../lib/push';
import type { Lang } from '../data/content';
import { translate } from '../data/i18n';
import { useApp, type Theme } from '../lib/AppContext';

const VERSION = '1.0.0';

export default function Settings() {
  const { t, lang, setLang, theme, setTheme, notify, storageOk, resetPrefs, eraseAll, favorites, customQuotes } = useApp();
  const [dialog, setDialog] = useState<'prefs' | 'all' | null>(null);

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    // announce in the *new* language
    notify(translate(l, 'toast.langChanged'));
  };
  const changeTheme = (th: Theme) => {
    if (th === theme) return;
    setTheme(th);
    notify(t('toast.themeChanged'));
  };

  return (
    <section className="screen settings-screen" aria-labelledby="set-title">
      <header className="screen-head">
        <p className="kicker">
          <span className="kicker-dot" aria-hidden="true" />
          {t('set.kicker')}
        </p>
        <h1 id="set-title" className="display-title">
          {t('set.title')}
        </h1>
      </header>

      <div className="settings-grid">
        <div className="card setting">
          <h2>{t('set.language')}</h2>
          <p className="hint">{t('set.languageHint')}</p>
          <Segmented<Lang>
            label={t('set.language')}
            value={lang}
            onChange={changeLang}
            options={[
              { value: 'en', label: 'English', lang: 'en' },
              { value: 'el', label: 'Ελληνικά', lang: 'el' },
            ]}
          />
        </div>

        <div className="card setting">
          <h2>{t('set.appearance')}</h2>
          <p className="hint">{t('set.appearanceHint')}</p>
          <Segmented<Theme>
            label={t('set.appearance')}
            value={theme}
            onChange={changeTheme}
            options={[
              { value: 'light', label: t('set.theme.light') },
              { value: 'dark', label: t('set.theme.dark') },
              { value: 'system', label: t('set.theme.system') },
            ]}
          />
        </div>

        <NotificationSettings />

        <div className="card setting setting-wide">
          <h2>
            <ShieldCheck size={20} aria-hidden="true" /> {t('set.dataTitle')}
          </h2>
          <p>{t('set.dataIntro')}</p>
          <ul className="data-list">
            <li>
              <Database size={16} aria-hidden="true" /> {t('set.dataItem.prefs')}
            </li>
            <li>
              <Database size={16} aria-hidden="true" /> {t('set.dataItem.favs')} <span className="count">({favorites.length})</span>
            </li>
            <li>
              <Database size={16} aria-hidden="true" /> {t('set.dataItem.mine')} <span className="count">({customQuotes.length})</span>
            </li>
          </ul>
          <p>{t('set.dataOutro')}</p>
          {!storageOk && (
            <p className="notice" role="alert">
              {t('set.storageOff')}
            </p>
          )}
        </div>

        <div className="card setting setting-wide">
          <h2>{t('set.resetTitle')}</h2>
          <div className="reset-row">
            <div>
              <strong>{t('set.resetPrefs')}</strong>
              <p className="hint">{t('set.resetPrefsHint')}</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setDialog('prefs')}>
              <RotateCcw size={18} aria-hidden="true" />
              <span>{t('set.resetPrefs')}</span>
            </button>
          </div>
          <div className="reset-row">
            <div>
              <strong>{t('set.eraseAll')}</strong>
              <p className="hint">{t('set.eraseAllHint')}</p>
            </div>
            <button type="button" className="btn btn-danger" onClick={() => setDialog('all')}>
              <Trash2 size={18} aria-hidden="true" />
              <span>{t('set.eraseAll')}</span>
            </button>
          </div>
        </div>

        <details className="card setting setting-wide about">
          <summary>
            <Info size={20} aria-hidden="true" /> {t('set.aboutTitle')}
          </summary>
          <p>{t('set.aboutBody1')}</p>
          <h3>{t('set.aboutFindingsTitle')}</h3>
          <ul>
            <li>{t('set.about.f1')}</li>
            <li>{t('set.about.f2')}</li>
            <li>{t('set.about.f3')}</li>
            <li>{t('set.about.f4')}</li>
            <li>{t('set.about.f5')}</li>
          </ul>
          <p>{t('set.aboutHonest')}</p>
          <h3>{t('set.aboutBibleTitle')}</h3>
          <p>{t('set.aboutBible')}</p>
          <h3>{t('set.aboutLaterTitle')}</h3>
          <p>{t('set.aboutLater')}</p>
          <p className="version">
            {t('appName')} · {t('set.version', { v: VERSION })}
          </p>
        </details>
      </div>

      <ConfirmDialog
        open={dialog === 'prefs'}
        title={t('set.resetPrefsConfirmTitle')}
        body={t('set.resetPrefsConfirmBody')}
        confirmLabel={t('set.resetPrefs')}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          resetPrefs();
          setDialog(null);
          notify(t('toast.prefsReset'));
        }}
      />
      <ConfirmDialog
        open={dialog === 'all'}
        title={t('set.eraseAllConfirmTitle')}
        body={t('set.eraseAllConfirmBody')}
        confirmLabel={t('set.eraseAllConfirm')}
        danger
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          void push.resetAll();
          eraseAll();
          setDialog(null);
          notify(t('toast.allErased'));
        }}
      />
    </section>
  );
}
