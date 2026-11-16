import { Lock, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Poster } from '../components/Poster';
import { ConfirmDialog, CopyButton, EmptyState, ShareButton } from '../components/Ui';
import { MAX_QUOTE_LENGTH, MAX_TITLE_LENGTH, useApp, type CustomQuote } from '../lib/AppContext';
import { localeFor } from '../lib/explorer';

export default function MyQuotes() {
  const { t, lang, customQuotes, addCustomQuote, updateCustomQuote, deleteCustomQuote, notify } = useApp();
  const [editing, setEditing] = useState<CustomQuote | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<'empty' | 'long' | null>(null);
  const [toDelete, setToDelete] = useState<CustomQuote | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const left = MAX_QUOTE_LENGTH - text.trim().length;

  const reset = () => {
    setEditing(null);
    setTitle('');
    setText('');
    setError(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError('empty');
      textRef.current?.focus();
      return;
    }
    if (trimmed.length > MAX_QUOTE_LENGTH) {
      setError('long');
      textRef.current?.focus();
      return;
    }
    if (editing) {
      updateCustomQuote(editing.id, title, trimmed);
      notify(t('toast.quoteUpdated'));
    } else {
      addCustomQuote(title, trimmed);
      notify(t('toast.quoteSaved'));
    }
    reset();
  };

  const startEdit = (q: CustomQuote) => {
    setEditing(q);
    setTitle(q.title);
    setText(q.text);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => textRef.current?.focus({ preventScroll: true }), 250);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteCustomQuote(toDelete.id);
    if (editing?.id === toDelete.id) reset();
    setToDelete(null);
    notify(t('toast.quoteDeleted'));
  };

  const fmt = (ms: number) =>
    new Intl.DateTimeFormat(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));

  const errorMsg =
    error === 'empty' ? t('my.errorEmpty') : error === 'long' ? t('my.errorTooLong', { max: MAX_QUOTE_LENGTH }) : '';

  return (
    <section className="screen my-screen" aria-labelledby="my-title">
      <header className="screen-head mot-head">
        <p className="kicker">
          <span className="kicker-dot" aria-hidden="true" />
          {t('my.kicker')}
        </p>
        <h1 id="my-title" className="display-title">
          <span className="grad-text">{t('my.title')}</span>
        </h1>
        <p className="privacy-pill">
          <Lock size={15} aria-hidden="true" />
          <span>{t('my.privacy')}</span>
        </p>
      </header>

      <form ref={formRef} className="card quote-form" onSubmit={onSubmit} noValidate>
        <h2>{editing ? t('my.formEdit') : t('my.formNew')}</h2>

        <div className="field">
          <label htmlFor="q-title">{t('my.fieldTitle')}</label>
          <input
            id="q-title"
            type="text"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder={t('my.placeholderTitle')}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="q-title-hint"
            autoComplete="off"
          />
          <small id="q-title-hint">{t('my.fieldTitleHint')}</small>
        </div>

        <div className="field">
          <label htmlFor="q-text">{t('my.fieldText')}</label>
          <textarea
            id="q-text"
            ref={textRef}
            rows={4}
            value={text}
            placeholder={t('my.placeholderText')}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`q-text-hint${error ? ' q-text-error' : ''}`}
            aria-required="true"
          />
          <div className="field-meta">
            <small id="q-text-hint">{t('my.fieldTextHint', { max: MAX_QUOTE_LENGTH })}</small>
            <small className={`counter ${left < 0 ? 'over' : left < 30 ? 'near' : ''}`} aria-hidden="true">
              {t('my.charsLeft', { n: left })}
            </small>
          </div>
          <p id="q-text-error" className="field-error" role="alert">
            {errorMsg}
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editing ? t('my.saveChanges') : t('my.save')}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              {t('my.cancelEdit')}
            </button>
          )}
        </div>
      </form>

      <h2 className="section-label">{t('my.listTitle')}</h2>
      {customQuotes.length === 0 ? (
        <EmptyState title={t('my.emptyTitle')} body={t('my.emptyBody')} art={<EmptyPen />} />
      ) : (
        <ul className="fav-grid">
          {customQuotes.map((q) => {
            const body = `“${q.text}” — Lift Me Up`;
            return (
              <li key={q.id} className="fav-item">
                <Poster
                  text={q.text}
                  tone="calm"
                  compact
                 
                  title={q.title || t('my.untitled')}
                  hint={t('my.written', { date: fmt(q.createdAt) })}
                />
                <div className="fav-actions">
                  <button type="button" className="btn action-btn" onClick={() => startEdit(q)}>
                    <Pencil size={18} aria-hidden="true" />
                    <span>{t('action.edit')}</span>
                  </button>
                  <CopyButton text={body} iconOnly />
                  <ShareButton title="Lift Me Up" text={body} iconOnly />
                  <button
                    type="button"
                    className="btn action-btn danger-btn"
                    onClick={() => setToDelete(q)}
                    aria-label={`${t('action.delete')}: ${q.title || q.text.slice(0, 30)}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                    <span>{t('action.delete')}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={t('my.deleteTitle')}
        body={t('my.deleteBody')}
        confirmLabel={t('my.deleteConfirm')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}

function EmptyPen() {
  return (
    <svg viewBox="0 0 120 100" width="120" height="100" focusable="false">
      <rect x="18" y="22" width="84" height="62" rx="10" fill="var(--p-lime)" />
      <path d="M32 44h56M32 58h40" stroke="var(--p-violet)" strokeWidth="5" strokeLinecap="round" />
      <path d="M84 70l22-34 8 6-22 34-12 6z" fill="var(--p-orange)" stroke="var(--p-violet)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
