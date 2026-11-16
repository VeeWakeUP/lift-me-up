import { Check, Copy, Heart, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp, type FavType } from '../lib/AppContext';
import { copyText, shareText } from '../lib/share';

/* ------------------------------- Toast ------------------------------------ */

export function Toast() {
  const { toast, dismissToast, t } = useApp();
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div className="toast" key={toast.key}>
          <span className="toast-msg">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.onClick();
                dismissToast();
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" className="toast-close" onClick={dismissToast} aria-label={t('action.close')}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Confirm dialog -------------------------------- */

interface ConfirmProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger, onConfirm, onCancel }: ConfirmProps) {
  const { t } = useApp();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dlg-title"
      aria-describedby="dlg-body"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
    >
      <div className="dialog-card">
        <h2 id="dlg-title">{title}</h2>
        <p id="dlg-body">{body}</p>
        <div className="dialog-actions">
          {/* Cancel is first in DOM order so it is the safe, default-focused choice */}
          <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>
            {t('action.cancel')}
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------ Segmented ---------------------------------- */

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; ariaLabel?: string; lang?: string }[];
  onChange: (v: T) => void;
  className?: string;
}

/** Accessible single-choice control (radio group with arrow-key support). */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  };
  return (
    <div className={`segmented ${className ?? ''}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.ariaLabel}
          lang={o.lang}
          tabIndex={value === o.value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Favorite button ---------------------------- */

export function FavButton({
  type,
  id,
  className,
  iconOnly,
}: {
  type: FavType;
  id: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { favorites, isFav, setFav, t, notify } = useApp();
  const on = isFav(type, id);
  const [burst, setBurst] = useState(0);

  const toggle = () => {
    const next = !on;
    const previous = favorites.find((f) => f.type === type && f.id === id)?.savedAt;
    setFav(type, id, next);
    if (next) setBurst((b) => b + 1);
    notify(
      next ? t('toast.saved') : t('toast.removed'),
      next ? undefined : { label: t('action.undo'), onClick: () => setFav(type, id, true, previous) },
    );
  };

  return (
    <button
      type="button"
      className={`btn action-btn fav-btn ${on ? 'is-on' : ''} ${className ?? ''}`}
      aria-pressed={on}
      onClick={toggle}
      aria-label={iconOnly ? (on ? t('fav.remove') : t('action.save')) : undefined}
    >
      <span className="fav-icon" aria-hidden="true">
        <Heart size={20} fill={on ? 'currentColor' : 'none'} />
        {burst > 0 && on && (
          <span className="fav-burst" key={burst}>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ ['--a' as string]: `${i * 45}deg` }} />
            ))}
          </span>
        )}
      </span>
      {!iconOnly && <span>{on ? t('action.saved') : t('action.save')}</span>}
    </button>
  );
}

/* ----------------------------- Copy / Share -------------------------------- */

export function CopyButton({ text, className, iconOnly }: { text: string; className?: string; iconOnly?: boolean }) {
  const { t, notify } = useApp();
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(false), 1600);
      notify(t('toast.copied'));
    } else {
      notify(t('toast.copyFailed'));
    }
  };
  return (
    <button
      type="button"
      className={`btn action-btn ${className ?? ''}`}
      onClick={onClick}
      aria-label={iconOnly ? t('action.copy') : undefined}
    >
      {done ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
      {!iconOnly && <span>{t('action.copy')}</span>}
    </button>
  );
}

export function ShareButton({
  title,
  text,
  className,
  iconOnly,
}: {
  title: string;
  text: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { t, notify } = useApp();
  const onClick = async () => {
    const r = await shareText(title, text);
    if (r === 'shared') notify(t('toast.shared'));
    else if (r === 'copied') notify(t('toast.sharedCopied'));
    else if (r === 'failed') notify(t('toast.copyFailed'));
  };
  return (
    <button
      type="button"
      className={`btn action-btn ${className ?? ''}`}
      onClick={onClick}
      aria-label={iconOnly ? t('action.share') : undefined}
    >
      <Share2 size={20} aria-hidden="true" />
      {!iconOnly && <span>{t('action.share')}</span>}
    </button>
  );
}

/* ------------------------------- Empty state ------------------------------- */

export function EmptyState({
  title,
  body,
  children,
  art,
}: {
  title: string;
  body: string;
  children?: ReactNode;
  art?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {art && <div className="empty-art" aria-hidden="true">{art}</div>}
      <h2>{title}</h2>
      <p>{body}</p>
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}
