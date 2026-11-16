import { Compass, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { QuoteCategory } from '../data/content';
import { LogoMark } from './Logo';

/**
 * Colour psychology: each category (and the neutral "calm" tone used for personal quotes)
 * has its own gradient, defined in motivation.css as `.tone-<name>`.
 */
export type Tone = QuoteCategory | 'calm';

function sizeClass(len: number): string {
  if (len <= 42) return 'size-xl';
  if (len <= 70) return 'size-lg';
  if (len <= 100) return 'size-md';
  return 'size-sm';
}

/* ---------------------------------- Card ----------------------------------- */

interface PosterProps {
  text: string;
  tone: Tone;
  /** Official daily quote vs explored. `undefined` hides the badge (e.g. personal quotes). */
  official?: boolean;
  badge?: string;
  hint?: string;
  dateLabel?: string;
  title?: string;
  foot?: ReactNode;
  compact?: boolean;
}

/** A minimal gradient quote card: the quote is the only thing that matters. */
export function Poster({ text, tone, official, badge, hint, dateLabel, title, foot, compact }: PosterProps) {
  return (
    <article
      className={`poster tone-${tone} ${compact ? 'poster-compact' : ''} ${official === false ? 'is-explored' : ''}`}
    >
      <div className="poster-top">
        {badge && (
          <span className={`poster-badge ${official ? 'badge-official' : 'badge-explored'}`}>
            {official ? <Sun size={14} aria-hidden="true" /> : <Compass size={14} aria-hidden="true" />}
            <span>{badge}</span>
            {dateLabel && official && <span className="badge-date">· {dateLabel}</span>}
          </span>
        )}
        {title && <span className="poster-title">{title}</span>}
      </div>
      <blockquote className={`poster-text ${sizeClass(text.length)}`}>
        {text}
      </blockquote>
      <footer className="poster-foot">
        <span className="poster-sign">
          <LogoMark />
          <span>{hint ?? 'Lift Me Up'}</span>
        </span>
        {foot}
      </footer>
    </article>
  );
}
