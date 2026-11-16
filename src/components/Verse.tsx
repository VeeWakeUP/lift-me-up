import type { ReactNode } from 'react';

/** A small calligraphic divider drawn in ink. */
export function Fleuron({ className }: { className?: string }) {
  return (
    <svg className={`fleuron ${className ?? ''}`} viewBox="0 0 220 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M4 12h74" />
        <path d="M142 12h74" />
        <path d="M78 12c6-9 14-9 18-2s-6 9-6 3 10-7 14-3" />
        <path d="M142 12c-6-9-14-9-18-2s6 9 6 3-10-7-14-3" />
      </g>
      <path d="M110 5l5 7-5 7-5-7z" fill="currentColor" />
    </svg>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg className={`page-corner corner-${pos}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 37V12C3 7 7 3 12 3h25" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

function verseSize(len: number): string {
  if (len <= 95) return 'vs-lg';
  if (len <= 140) return 'vs-md';
  return 'vs-sm';
}

interface VerseProps {
  text: string;
  reference: string;
  official: boolean;
  label: string;
  hint?: string;
  paraphraseLabel: string;
  paraphraseNote?: string;
  compact?: boolean;
  foot?: ReactNode;
}

/** One beige page of the old book. The verse sits in the middle of the page. */
export function VersePage({
  text,
  reference,
  official,
  label,
  paraphraseLabel,
  compact,
  foot,
}: VerseProps) {
  return (
    <article className={`page ${official ? 'is-official' : 'is-explored'} ${compact ? 'page-compact' : ''}`}>
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      <header className="page-head">
        <p className="page-label">{label}</p>
        <Fleuron className="page-fleuron" />
      </header>

      <div className="page-body">
        <blockquote className={`verse-text ${verseSize(text.length)}`}>{text}</blockquote>

        <p className="verse-ref">
          <cite>{reference}</cite>
          <svg className="ref-underline" viewBox="0 0 160 8" aria-hidden="true" focusable="false" preserveAspectRatio="none">
            <path d="M2 5c20-4 40 2 60-1s40-1 60 0 28 1 36-1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </p>
      </div>

      <p className="paraphrase-note">
        <span className="stamp">{paraphraseLabel}</span>
      </p>

      {foot}
    </article>
  );
}
