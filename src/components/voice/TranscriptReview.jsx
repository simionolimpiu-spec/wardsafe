import { Badge } from '../../design-system/index.js';
import { NumericConfirmation } from './NumericConfirmation.jsx';

export function TranscriptReview({ state, review, act, headingRef, approveRef, labelRef }) {
  const { candidate } = state;
  return (
    <section className="sf-voice__panel" aria-labelledby="voice-transcript-title">
      <h3 id="voice-transcript-title" tabIndex={-1} ref={headingRef}>Transcript review</h3>
      <Badge tone="review">Draft only. Human review required.</Badge>
      <p>A transcript is a draft, never a record. Saving retains review metadata only.</p>
      <h4>Raw text (read-only)</h4>
      <p className="sf-voice__raw">{candidate.rawText}</p>
      <p>Confidence {Math.round(candidate.confidence * 100)} percent. {candidate.reliability === 'reviewable' ? 'Reviewable.' : 'Not reliable enough to approve.'}</p>
      {candidate.safeFailureMessage && <p className="sf-voice__notice">{candidate.safeFailureMessage}</p>}
      <label className="sf-voice__field">Your edit
        <textarea rows={4} value={state.editedText ?? ''} onChange={(event) => act('edit', { text: event.target.value })} />
      </label>
      <p>Edits remain separate from the immutable raw text. Changing an edit clears previous numeric confirmations.</p>
      {review.numericSafety.numericConfirmationRequired && <NumericConfirmation
        safety={review.numericSafety} values={state.confirmedNumericValues} act={act} labelRef={labelRef} />}
      <p>Fictional reviewer: {state.reviewer.name}</p>
      <div className="sf-voice__actions">
        <button type="button" ref={approveRef} disabled={Boolean(review.disabledReason)}
          aria-describedby={review.disabledReason ? 'voice-approval-reason' : undefined}
          onClick={() => act('approve')}>Approve and save review (simulation)</button>
        {candidate.safeFailureMessage && <button type="button" onClick={() => act('repeat')}>Repeat dictation</button>}
      </div>
      {review.disabledReason && <p id="voice-approval-reason">Approval unavailable: {review.disabledReason}.</p>}
    </section>
  );
}
