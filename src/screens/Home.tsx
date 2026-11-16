import { ArrowRight, Heart, PenLine, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { QUOTES, VERSES, verseReference } from '../data/content';
import type { I18nKey } from '../data/i18n';
import { dailyPick } from '../lib/daily';
import { formatLongDate } from '../lib/explorer';
import { useApp } from '../lib/AppContext';
import { hrefFor } from '../lib/router';
import { NotifyInvite } from '../components/Notifications';

function greetingKey(hour: number): I18nKey {
  if (hour >= 5 && hour < 12) return 'home.greeting.morning';
  if (hour >= 12 && hour < 17) return 'home.greeting.afternoon';
  if (hour >= 17 && hour < 22) return 'home.greeting.evening';
  return 'home.greeting.night';
}

export default function Home() {
  const { t, lang, favorites, customQuotes } = useApp();
  const quote = useMemo(() => dailyPick(QUOTES, 3), []);
  const verse = useMemo(() => dailyPick(VERSES, 5), []);
  const now = new Date();

  return (
    <section className="screen home-screen" aria-labelledby="home-title">
      <div className="home-hero">
        <p className="kicker home-date">
          <time dateTime={now.toISOString().slice(0, 10)}>{formatLongDate(lang, now)}</time>
        </p>
        <h1 id="home-title" className="home-greeting">
          {t(greetingKey(now.getHours()))}
        </h1>
        <p className="home-welcome">{t('home.welcome')}</p>
      </div>

      <h2 className="section-label">{t('home.recommended')}</h2>
      <div className="home-cards">
        {/* Featured motivational quote */}
        <article className={`feature feature-quote tone-${quote.category}`} aria-labelledby="feat-q-label">
          <p id="feat-q-label" className="feature-label">
            {t('home.todaysQuote')}
          </p>
          <blockquote className="feature-quote-text">{quote.text[lang]}</blockquote>
          <a className="btn btn-primary feature-cta" href={hrefFor('motivation')}>
            <span>{t('home.openMotivation')}</span>
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </article>

        {/* Featured Bible verse */}
        <article className="feature feature-verse" aria-labelledby="feat-v-label">
          <p id="feat-v-label" className="feature-label">
            {t('home.todaysVerse')}
          </p>
          <blockquote className="feature-verse-text">{verse.text[lang]}</blockquote>
          <p className="feature-verse-ref">{verseReference(verse, lang)}</p>
          <a className="btn btn-primary feature-cta" href={hrefFor('bible')}>
            <span>{t('home.openBible')}</span>
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </article>
      </div>

      <nav className="home-links" aria-label={t('home.yourSpace')}>
        <a href={hrefFor('favorites')} className="mini-link">
          <Heart size={20} aria-hidden="true" />
          <span>
            {t('nav.favorites')} <small>({favorites.length})</small>
          </span>
        </a>
        <a href={hrefFor('my-quotes')} className="mini-link">
          <PenLine size={20} aria-hidden="true" />
          <span>
            {t('nav.myQuotes')} <small>({customQuotes.length})</small>
          </span>
        </a>
        <a href={hrefFor('settings')} className="mini-link">
          <Settings size={20} aria-hidden="true" />
          <span>{t('nav.settings')}</span>
        </a>
      </nav>

      <footer className="home-foot">
        <p className="tagline">{t('tagline')}</p>
        <p className="privacy-line">{t('home.privacy')}</p>
      </footer>
      <NotifyInvite />
    </section>
  );
}
