import { Bell, BellRing, Share } from 'lucide-react';
import { useId } from 'react';
import { useApp } from '../lib/AppContext';
import { push, usePush, type PushKind } from '../lib/push';
import { Segmented } from './Ui';

/** Home: a small, non-blocking invitation, shown until the user answers it once. */
export function NotifyInvite() {
  const { t, notify } = useApp();
  const s = usePush();
  const titleId = useId();

  const visible =
    (s.support === 'ok' || s.support === 'ios-install') &&
    !s.inviteDismissed &&
    !s.subscribed &&
    !s.checking &&
    s.permission !== 'denied';
  if (!visible) return null;

  const enable = async () => {
    const ok = await push.enable();
    if (ok) {
      notify(t('push.enabledToast'));
    } else if (push.getState().error === 'denied') {
      push.dismissInvite();
      notify(t('push.blockedToast'));
    }
  };

  const ios = s.support === 'ios-install';
  return (
    <>
    <div className="invite-spacer" aria-hidden="true" />
    <aside className="notify-invite" aria-labelledby={titleId}>
      <span className="ni-bell" aria-hidden="true">
        <Bell size={22} />
      </span>
      <div className="ni-text">
        <h2 id={titleId}>{t('push.inviteTitle')}</h2>
        <p>{ios ? t('push.iosHow') : t('push.inviteBody')}</p>
        {s.error && !ios && (
          <p className="ni-error" role="alert">
            {t(s.error === 'timeout' ? 'push.err.timeout' : 'push.err.failed')}
          </p>
        )}
        <div className="ni-actions">
          {!ios && (
            <button type="button" className="btn btn-primary ni-enable" onClick={enable} disabled={s.busy}>
              <BellRing size={18} aria-hidden="true" />
              <span>{t('push.enable')}</span>
            </button>
          )}
          <button type="button" className="btn btn-ghost ni-later" onClick={() => push.dismissInvite()} disabled={s.busy}>
            {ios ? t('push.gotIt') : t('push.notNow')}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

/** Settings: the full control panel for daily notifications. */
export function NotificationSettings() {
  const { t, notify } = useApp();
  const s = usePush();
  const switchId = useId();
  const statusId = useId();

  const canToggle = s.support === 'ok' && !s.busy && !s.checking;
  const on = s.subscribed;

  const toggle = async () => {
    if (!canToggle) return;
    if (on) {
      await push.disable();
      notify(t('push.disabledToast'));
    } else {
      const ok = await push.enable();
      if (ok) notify(t('push.enabledToast'));
      else if (push.getState().error === 'denied') notify(t('push.blockedToast'));
    }
  };

  const status = s.checking
    ? t('push.statusChecking')
    : s.busy
      ? t('push.statusBusy')
      : on
        ? t('push.statusOn')
        : t('push.statusOff');

  const permLabel = t(`push.perm.${s.permission}` as 'push.perm.granted');

  return (
    <div className="card setting setting-wide notif-card">
      <h2>
        <BellRing size={20} aria-hidden="true" /> {t('push.title')}
      </h2>
      <p className="hint">{t('push.intro')}</p>

      {s.support === 'unconfigured' && <p className="notice-soft">{t('push.unconfigured')}</p>}
      {s.support === 'unsupported' && <p className="notice-soft">{t('push.unsupported')}</p>}
      {s.support === 'ios-install' && (
        <p className="notice-soft ios-how">
          <Share size={16} aria-hidden="true" /> {t('push.iosHow')}
        </p>
      )}

      <div className="switch-row">
        <label htmlFor={switchId} className="switch-label">
          {t('push.switchLabel')}
          <small id={statusId} aria-live="polite">
            {status}
          </small>
        </label>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby={statusId}
          className={`switch ${on ? 'is-on' : ''}`}
          onClick={toggle}
          disabled={!canToggle}
        >
          <span className="switch-knob" aria-hidden="true" />
        </button>
      </div>

      {s.error && (
        <p className="field-error" role="alert">
          {t(s.error === 'denied' ? 'push.err.denied' : s.error === 'timeout' ? 'push.err.timeout' : 'push.err.failed')}
        </p>
      )}

      <div className="notif-prefs">
        <p className="notif-label" id={`${switchId}-kind`}>
          {t('push.content')}
        </p>
        <Segmented<PushKind>
          label={t('push.content')}
          value={s.kind}
          onChange={(k) => void push.setKind(k)}
          options={[
            { value: 'quote', label: t('push.kind.quote') },
            { value: 'verse', label: t('push.kind.verse') },
            { value: 'both', label: t('push.kind.both') },
          ]}
        />
      </div>

      <dl className="notif-facts">
        <div>
          <dt>{t('push.time')}</dt>
          <dd>{t('push.timeValue')}</dd>
        </div>
        <div>
          <dt>{t('push.permission')}</dt>
          <dd>{permLabel}</dd>
        </div>
        <div>
          <dt>{t('push.subscription')}</dt>
          <dd>{on ? t('push.sub.confirmed') : t('push.sub.none')}</dd>
        </div>
      </dl>

      <p className="hint notif-privacy">{t('push.privacy')}</p>
    </div>
  );
}
