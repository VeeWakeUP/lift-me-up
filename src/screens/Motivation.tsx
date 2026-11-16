import { PenLine, Undo2 } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { DeckNav } from '../components/DeckNav';
import { Poster } from '../components/Poster';
import { SwipeDeck, useDeckEnter, type DeckHandle } from '../components/SwipeDeck';
import { CopyButton, FavButton, ShareButton } from '../components/Ui';
import { QUOTES, QUOTE_CATEGORIES, type Quote } from '../data/content';
import { QUOTE_CATEGORY_LABELS } from '../data/i18n';
import { dailyPick } from '../lib/daily';
import { formatShortDate, useExplorer } from '../lib/explorer';
import { useApp } from '../lib/AppContext';
import { hrefFor, useDeepLinkId } from '../lib/router';

export default function Motivation() {
  const { lang, t } = useApp();
  const daily = useMemo(() => dailyPick(QUOTES, 3), []);
  const ex = useExplorer(QUOTES, daily);
  const deck = useRef<DeckHandle>(null);
  const [enter, trigger] = useDeckEnter();
  // arriving from a notification: show exactly the card it mentioned
  useDeepLinkId((id) => {
    const ok = ex.showId(id);
    if (ok) trigger('fade');
    return ok;
  });

  const quote = ex.current;
  const text = quote.text[lang];
  const shareBody = `“${text}” — Lift Me Up`;

  /** A category change swaps the card with a soft cross-fade instead of a swipe. */
  const replace = (change: () => void) => {
    if (deck.current?.isBusy()) return;
    trigger('fade');
    change();
  };

  const renderCard = (q: Quote) => {
    const official = q.id === daily.id;
    return (
      <Poster
        text={q.text[lang]}
        tone={q.category}
        official={official}
        badge={official ? t('mot.officialLabel') : t('mot.exploredLabel')}
        dateLabel={formatShortDate(lang)}
        foot={<span className="poster-cat">{QUOTE_CATEGORY_LABELS[q.category][lang]}</span>}
      />
    );
  };

  return (
    <section className="screen mot-screen" aria-labelledby="mot-title">
      <h1 id="mot-title" className="display-title">
        {t('mot.title')}
      </h1>

      <div className="chip-row mot-chips" role="group" aria-label={t('mot.categories')}>
        <button type="button" className="chip" aria-pressed={ex.category === null} onClick={() => replace(ex.backToToday)}>
          {t('mot.all')}
        </button>
        {QUOTE_CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={ex.category === c} onClick={() => replace(() => ex.chooseCategory(c))}>
            {QUOTE_CATEGORY_LABELS[c][lang]}
          </button>
        ))}
      </div>

      <SwipeDeck
        top={quote}
        under={ex.peek}
        seq={ex.seq}
        renderCard={renderCard}
        canRewind={ex.canRewind}
        onAdvance={ex.advance}
        onRewind={(kind) => {
          trigger(kind);
          ex.rewind();
        }}
        enter={enter}
        handleRef={deck}
        label={t('mot.title')}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {ex.announce ? t('mot.newQuoteAnnounce', { text }) : ''}
      </p>

      <p className="deck-hint" aria-hidden="true">
        <span className="hint-mouse">{t('deck.hint')}</span>
        <span className="hint-touch">{t('deck.hintTouch')}</span>
      </p>

      <div className="actions deck-actions">
        <DeckNav
          canRewind={ex.canRewind}
          onRewind={() => deck.current?.rewind()}
          onNext={() => deck.current?.next()}
          rewindLabel={t('mot.rewind')}
          nextLabel={t('mot.next')}
        />
        <div className="action-row">
          <FavButton type="quote" id={quote.id} />
          <CopyButton text={shareBody} />
          <ShareButton title="Lift Me Up" text={shareBody} />
        </div>
        {!ex.isOfficial && (
          <button type="button" className="btn btn-ghost btn-today" onClick={() => replace(ex.backToToday)}>
            <Undo2 size={18} aria-hidden="true" />
            <span>{t('mot.backToToday')}</span>
          </button>
        )}
        <a className="own-link" href={hrefFor('my-quotes')}>
          <PenLine size={18} aria-hidden="true" />
          <span>{t('mot.writeOwn')}</span>
        </a>
      </div>
    </section>
  );
}
