import { useMemo, useState } from 'react';
import { Poster } from '../components/Poster';
import { CopyButton, EmptyState, FavButton, Segmented, ShareButton } from '../components/Ui';
import { VersePage } from '../components/Verse';
import { quoteById, verseById, verseReference } from '../data/content';
import { QUOTE_CATEGORY_LABELS } from '../data/i18n';
import { useApp } from '../lib/AppContext';
import { hrefFor } from '../lib/router';

type Filter = 'all' | 'quote' | 'verse';

export default function Favorites() {
  const { t, lang, favorites } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  /* Drop anything whose id no longer exists in the content collection. */
  const valid = useMemo(
    () =>
      favorites.filter((f) => (f.type === 'quote' ? quoteById.has(f.id) : verseById.has(f.id))),
    [favorites],
  );
  const quotes = valid.filter((f) => f.type === 'quote').length;
  const verses = valid.length - quotes;
  const shown = filter === 'all' ? valid : valid.filter((f) => f.type === filter);

  const filterLabel = filter === 'quote' ? t('fav.quotes') : t('fav.verses');

  return (
    <section className="screen fav-screen" aria-labelledby="fav-title">
      <header className="screen-head">
        <p className="kicker">
          <span className="kicker-dot" aria-hidden="true" />
          {t('fav.kicker')}
        </p>
        <h1 id="fav-title" className="display-title">
          {t('fav.title')}
        </h1>
      </header>

      {valid.length > 0 && (
        <Segmented<Filter>
          className="fav-filter"
          label={t('fav.filters')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `${t('fav.all')} · ${valid.length}` },
            { value: 'quote', label: `${t('fav.quotes')} · ${quotes}` },
            { value: 'verse', label: `${t('fav.verses')} · ${verses}` },
          ]}
        />
      )}

      {valid.length === 0 ? (
        <EmptyState
          title={t('fav.emptyTitle')}
          body={t('fav.emptyBody')}
          art={<EmptyHeart />}
        >
          <a className="btn btn-primary" href={hrefFor('motivation')}>
            {t('fav.goQuotes')}
          </a>
          <a className="btn btn-ghost" href={hrefFor('bible')}>
            {t('fav.goVerses')}
          </a>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState
          title={t('fav.emptyFilteredTitle', { kind: filterLabel })}
          body={t('fav.emptyFilteredBody')}
          art={<EmptyHeart />}
        >
          <a className="btn btn-primary" href={hrefFor(filter === 'quote' ? 'motivation' : 'bible')}>
            {filter === 'quote' ? t('fav.goQuotes') : t('fav.goVerses')}
          </a>
        </EmptyState>
      ) : (
        <ul className="fav-grid">
          {shown.map((f) => {
            if (f.type === 'quote') {
              const q = quoteById.get(f.id)!;
              const text = q.text[lang];
              const body = `“${text}” — Lift Me Up`;
              return (
                <li key={`q-${f.id}`} className="fav-item">
                  <Poster
                    text={text}
                    tone={q.category}
                    compact
                   
                    foot={<span className="poster-cat">{QUOTE_CATEGORY_LABELS[q.category][lang]}</span>}
                  />
                  <div className="fav-actions">
                    <FavButton type="quote" id={f.id} iconOnly />
                    <CopyButton text={body} iconOnly />
                    <ShareButton title="Lift Me Up" text={body} iconOnly />
                  </div>
                </li>
              );
            }
            const v = verseById.get(f.id)!;
            const text = v.text[lang];
            const ref = verseReference(v, lang);
            const body = `“${text}” — ${ref} (${t('bible.paraphrase').toLowerCase()})\nLift Me Up`;
            return (
              <li key={`v-${f.id}`} className="fav-item">
                <VersePage
                  compact
                 
                  text={text}
                  reference={ref}
                  official={false}
                  label={t('nav.bible')}
                  paraphraseLabel={t('bible.paraphrase')}
                />
                <div className="fav-actions">
                  <FavButton type="verse" id={f.id} iconOnly />
                  <CopyButton text={body} iconOnly />
                  <ShareButton title="Lift Me Up" text={body} iconOnly />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EmptyHeart() {
  return (
    <svg viewBox="0 0 120 100" width="120" height="100" focusable="false">
      <circle cx="60" cy="86" r="34" fill="var(--p-orange)" opacity=".9" />
      <path
        d="M60 74C34 56 28 38 40 28c8-7 17-3 20 5 3-8 12-12 20-5 12 10 6 28-20 46z"
        fill="var(--p-violet)"
        stroke="var(--p-lime)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M96 20l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="var(--p-lime)" />
    </svg>
  );
}
