interface Props {
  /** Show only the mark (rising sun + spark). */
  markOnly?: boolean;
  className?: string;
}

/** The Lift Me Up mark: a sun rising over a horizon, with a spark lifting off it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={`logo-mark ${className ?? ''}`} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      {/* rays */}
      <g className="logo-rays" stroke="var(--logo-sun-b)" strokeWidth="3" strokeLinecap="round">
        <line x1="9" y1="33" x2="14" y2="35" />
        <line x1="15" y1="22" x2="19" y2="26" />
        <line x1="47" y1="33" x2="42" y2="35" />
        <line x1="41" y1="22" x2="37" y2="26" />
      </g>
      {/* sun */}
      <path d="M12 44a16 16 0 0 1 32 0z" fill="var(--logo-sun-a)" />
      {/* horizon */}
      <path d="M6 48.5h44" stroke="var(--logo-ink)" strokeWidth="3" strokeLinecap="round" />
      {/* spark */}
      <path
        className="logo-spark"
        d="M28 4.5l2.6 6.9 6.9 2.6-6.9 2.6L28 23.5l-2.6-6.9L18.5 14l6.9-2.6z"
        fill="var(--logo-spark)"
      />
    </svg>
  );
}

export function Logo({ markOnly, className }: Props) {
  return (
    <span className={`logo ${className ?? ''}`}>
      <LogoMark />
      {!markOnly && (
        <span className="logo-word" aria-hidden="true">
          Lift Me <span className="logo-up">Up</span>
        </span>
      )}
      <span className="sr-only">Lift Me Up</span>
    </span>
  );
}
