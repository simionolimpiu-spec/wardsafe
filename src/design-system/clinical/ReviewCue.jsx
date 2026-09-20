import { ChevronRight, Clock, UserCheck } from 'lucide-react';
import { Badge } from '../primitives/Badge.jsx';
import { ClinicalStatusBadge } from './ClinicalStatusBadge.jsx';
import { getClinicalState, reviewCategoryLabel, reviewPriorityStatus } from './clinicalStates.js';

/*
 * Review cue components (SF-295).
 *
 * A review cue is information requiring human review. It is never an AI
 * decision, a diagnosis, a treatment recommendation or an automatic
 * escalation. These components are presentation only: cue wording comes from
 * the signal engine and signalOutputGuard and is never rewritten here.
 *
 * Cue shape: { id, category, priority, title, explanation, evidence[],
 *   freshness: { label }, missingDataNotes[], suggestedHumanReviewAction,
 *   ruleId?, rationale?, threshold? }
 */

export const REVIEW_CUE_BOUNDARY = Object.freeze({
  summary: 'Simulation-only cues. Human review required.',
  validation: 'Simulation output for preview only. Not clinically validated and not for clinical decision-making.'
});

/** Category and priority, always as visible text. */
export function ReviewCueMetadata({ category, priority }) {
  return (
    <p className="sf-review-cue__meta">
      <Badge tone="neutral" variant="outline">{reviewCategoryLabel(category)}</Badge>
      <ClinicalStatusBadge status={reviewPriorityStatus(priority)} />
    </p>
  );
}

/** Evidence to check, data freshness and missing data. Visible by default. */
export function ReviewCueEvidence({ cueId, evidence = [], freshness, missingDataNotes = [] }) {
  const evidenceItems = Array.isArray(evidence) ? evidence : [];
  const notes = Array.isArray(missingDataNotes) ? missingDataNotes : [];

  if (evidenceItems.length === 0 && notes.length === 0 && !freshness?.label) {
    return null;
  }

  return (
    <div className="sf-review-cue__evidence">
      {evidenceItems.length > 0 && (
        <div className="sf-review-cue__block">
          <p className="sf-review-cue__label">Evidence to check</p>
          <ul className="sf-review-cue__list">
            {evidenceItems.map((item, index) => (
              <li key={`${cueId}-evidence-${index}`}>{item?.label ?? 'Simulation signal'}</li>
            ))}
          </ul>
        </div>
      )}
      {freshness?.label && (
        <p className="sf-review-cue__freshness">
          <Clock aria-hidden="true" focusable="false" />
          <span>{freshness.label}</span>
        </p>
      )}
      {notes.length > 0 && (
        <div className="sf-review-cue__block">
          <p className="sf-review-cue__label">Missing or not visible</p>
          <ul className="sf-review-cue__list sf-review-cue__list--missing">
            {notes.map((note, index) => (
              <li key={`${cueId}-note-${index}`}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** "Why flagged" disclosure for explicit rule-based cues. Native details element. */
export function ReviewCueRationale({ ruleId, rationale, threshold }) {
  if (!ruleId && !threshold) return null;

  return (
    <details className="sf-review-cue__rationale">
      <summary className="sf-review-cue__rationale-summary">
        <ChevronRight aria-hidden="true" className="sf-review-cue__chevron" focusable="false" />
        <span>Why flagged</span>
      </summary>
      <div className="sf-review-cue__rationale-body">
        {ruleId && (
          <p><span className="sf-review-cue__label">Rule</span> {ruleId}</p>
        )}
        {rationale && <p>{rationale}</p>}
        {threshold && (
          <p><span className="sf-review-cue__label">Threshold</span> {threshold}</p>
        )}
      </div>
    </details>
  );
}

/** One review cue. Never rendered in the critical tone, at any priority. */
export function ReviewCue({ cue, headingLevel = 4 }) {
  const priority = reviewPriorityStatus(cue.priority);
  const tone = getClinicalState(priority.state).tone;
  const Heading = `h${Math.min(Math.max(headingLevel, 2), 6)}`;

  return (
    <article className={`sf-review-cue sf-tone-${tone}`} data-priority={cue.priority ?? 'review'}>
      <ReviewCueMetadata category={cue.category} priority={cue.priority} />
      <Heading className="sf-review-cue__title">{cue.title}</Heading>
      {cue.explanation && <p className="sf-review-cue__text">{cue.explanation}</p>}
      <ReviewCueEvidence
        cueId={cue.id}
        evidence={cue.evidence}
        freshness={cue.freshness}
        missingDataNotes={cue.missingDataNotes}
      />
      {cue.suggestedHumanReviewAction && (
        <p className="sf-review-cue__action">
          <UserCheck aria-hidden="true" focusable="false" />
          <span>{cue.suggestedHumanReviewAction}</span>
        </p>
      )}
      <ReviewCueRationale rationale={cue.rationale} ruleId={cue.ruleId} threshold={cue.threshold} />
    </article>
  );
}

/**
 * Review cue section with the simulation boundary always visible.
 * Keeps the upstream order: the signal engine owns prioritisation.
 */
export function ReviewCueGroup({
  cues = [],
  available = true,
  headingId,
  headingLevel = 3,
  title = 'Simulation Review Cues',
  sourceNotes = [],
  unavailableMessage = 'No signal snapshot available yet.',
  emptyMessage = 'No current simulation review cues for this patient.',
  className = ''
}) {
  const Heading = `h${Math.min(Math.max(headingLevel, 2), 5)}`;
  const notes = sourceNotes.filter(Boolean);

  return (
    <section aria-labelledby={headingId} className={['sf-review-cue-group', className].filter(Boolean).join(' ')}>
      <div className="sf-review-cue-group__header">
        <Heading className="sf-review-cue-group__title" id={headingId}>{title}</Heading>
        <p className="sf-review-cue-group__summary">{REVIEW_CUE_BOUNDARY.summary}</p>
        <p className="sf-review-cue-group__boundary">{REVIEW_CUE_BOUNDARY.validation}</p>
        {notes.length > 0 && <p className="sf-review-cue-group__boundary">{notes.join(' ')}</p>}
      </div>
      {!available && cues.length === 0 ? (
        <p className="sf-review-cue-group__empty">{unavailableMessage}</p>
      ) : cues.length > 0 ? (
        <ul className="sf-review-cue-group__list">
          {cues.map((cue) => (
            <li key={cue.id}>
              <ReviewCue cue={cue} headingLevel={Math.min(headingLevel + 1, 6)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="sf-review-cue-group__empty">{emptyMessage}</p>
      )}
    </section>
  );
}
