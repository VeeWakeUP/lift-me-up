import { ArrowRight, RotateCcw } from 'lucide-react';
import { useApp } from '../lib/AppContext';

interface Props {
  canRewind: boolean;
  onRewind: () => void;
  onNext: () => void;
  /** Descriptive label for assistive technology, e.g. "Rewind to the previous quote". */
  rewindLabel: string;
  nextLabel: string;
}

/** The two primary controls under every card stack: Rewind (back through history) and Next. */
export function DeckNav({ canRewind, onRewind, onNext, rewindLabel, nextLabel }: Props) {
  const { t } = useApp();
  return (
    <div className="next-row">
      <button
        type="button"
        className="btn action-btn btn-rewind"
        onClick={onRewind}
        disabled={!canRewind}
        aria-label={rewindLabel}
      >
        <RotateCcw size={20} aria-hidden="true" />
        <span>{t('action.rewind')}</span>
      </button>
      <button type="button" className="btn btn-primary btn-next" onClick={onNext}>
        <span>{nextLabel}</span>
        <ArrowRight size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
