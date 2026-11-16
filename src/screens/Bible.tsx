import { Download, Undo2 } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { DeckNav } from '../components/DeckNav';
import { SwipeDeck, useDeckEnter, type DeckHandle } from '../components/SwipeDeck';
import { CopyButton, FavButton, ShareButton } from '../components/Ui';
import { VersePage } from '../components/Verse';
import { VERSES, VERSE_CATEGORIES, verseReference, type Verse } from '../data/content';
import { VERSE_CATEGORY_LABELS } from '../data/i18n';
import { dailyPick } from '../lib/daily';
import { useExplorer } from '../lib/explorer';
import { useApp } from '../lib/AppContext';
import { useDeepLinkId } from '../lib/router';
import { downloadBlob, renderVerseImage } from '../lib/verseImage';

export default function Bible() {
  const { lang, t, notify } = useApp();
  const daily = useMemo(() => dailyPick(VERSES, 5), []);
  const ex = useExplorer(VERSES, daily);
  const deck = useRef<DeckHandle>(null);
  const [enter, trigger] = useDeckEnter();
  // arriving from a notification: show exactly the card it mentioned
  useDeepLinkId((id) => {
    const ok = ex.showId(id);
    if (ok) trigger('fade');
    return ok;
  });

  const verse = ex.current;
  const text = verse.text[lang];
  const ref = verseReference(verse, lang);
  const shareBody = `“${text}” — ${ref} (${t('bible.paraphrase').toLowerCase()})\nLift Me Up`;

  /** A category change swaps the card with a soft cross-fade instead of a swipe. */
  const replace = (change: () => void) => {
    if (deck.current?.isBusy()) return;
    trigger('fade');
    change();
  };

  const renderCard = (v: Verse) => {
    const official = v.id === daily.id;
    return (
      <VersePage
        text={v.text[lang]}
        reference={verseReference(v, lang)}
        official={official}
        label={official ? t('bible.officialLabel') : t('bible.exploredLabel')}
        paraphraseLabel={t('bible.paraphrase')}
      />
    );
  };

  const downloadImage = async () => {
    try {
      const blob = await renderVerseImage({
        text,
        reference: ref,
        label: ex.isOfficial ? t('bible.officialLabel') : t('nav.bible'),
        paraphraseLabel: t('bible.paraphrase'),
        paraphraseNote: t('bible.paraphraseNote'),
        lang,
      });
      downloadBlob(blob, `lift-me-up-${verse.book}-${verse.chapter}-${verse.verses}-${lang}.png`);
      notify(t('toast.downloaded'));
    } catch {
      notify(t('toast.downloadFailed'));
    }
  };

  return (
    <section className="screen bible-screen" aria-labelledby="bible-title">
      <h1 id="bible-title" className="display-title">
        {t('bible.title')}
      </h1>

      <nav className="cats" aria-label={t('bible.categories')}>
        <ul>
          <li>
            <button type="button" aria-pressed={ex.category === null} onClick={() => replace(ex.backToToday)}>
              {t('bible.all')}
            </button>
          </li>
          {VERSE_CATEGORIES.map((c) => (
            <li key={c}>
              <button type="button" aria-pressed={ex.category === c} onClick={() => replace(() => ex.chooseCategory(c))}>
                {VERSE_CATEGORY_LABELS[c][lang]}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <SwipeDeck
        top={verse}
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
        label={t('bible.title')}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {ex.announce ? t('bible.newVerseAnnounce', { text, ref }) : ''}
      </p>

      <p className="deck-hint" aria-hidden="true">
        <span className="hint-mouse">{t('deck.hint')}</span>
        <span className="hint-touch">{t('deck.hintTouch')}</span>
      </p>
      <p className="paraphrase-caption">{t('bible.paraphraseNote')}</p>

      <div className="actions deck-actions">
        <DeckNav
          canRewind={ex.canRewind}
          onRewind={() => deck.current?.rewind()}
          onNext={() => deck.current?.next()}
          rewindLabel={t('bible.rewind')}
          nextLabel={t('bible.next')}
        />
        <div className="action-row">
          <FavButton type="verse" id={verse.id} />
          <CopyButton text={shareBody} />
          <ShareButton title="Lift Me Up" text={shareBody} />
        </div>
        <button type="button" className="own-link download-link" onClick={downloadImage}>
          <Download size={18} aria-hidden="true" />
          <span>{t('action.downloadImage')}</span>
        </button>
        {!ex.isOfficial && (
          <button type="button" className="btn btn-ghost btn-today" onClick={() => replace(ex.backToToday)}>
            <Undo2 size={18} aria-hidden="true" />
            <span>{t('bible.backToToday')}</span>
          </button>
        )}
      </div>
    </section>
  );
}
