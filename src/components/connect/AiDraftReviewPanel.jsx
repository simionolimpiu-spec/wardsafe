import { Badge } from '../../design-system/index.js';
export function AiDraftReviewPanel({
  draft,
  onApprove,
  onEdit,
  onDiscard,
  disabledReason
}) {
  return (
    <section className="sf-connect__draft" aria-label="AI draft review">
      <Badge tone="review">AI draft - review required</Badge>
      <p>{draft.body}</p>
      <p>Fixed simulation template. Review the wording before sending.</p>
      <div className="sf-connect__actions">
        <button
          type="button"
          disabled={Boolean(disabledReason)}
          onClick={onApprove}
        >
          Approve and send
        </button>
        <button type="button" onClick={onEdit}>
          Edit as my message
        </button>
        <button type="button" onClick={onDiscard}>
          Discard
        </button>
      </div>
      {disabledReason && <p>{disabledReason}</p>}
    </section>
  );
}
