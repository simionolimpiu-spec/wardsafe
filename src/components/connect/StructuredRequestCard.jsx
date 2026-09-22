import { useRef, useState } from 'react';
import { REQUEST_TRANSITIONS } from '../../connect/index.js';
import { staffNames } from '../../connect/demoFixtures.js';
import { Badge } from '../../design-system/index.js';
import { humanLabel } from './RoleRecipientPicker.jsx';
const labels = {
  delivered: 'Simulate delivery',
  read: 'Simulate read',
  acknowledged: 'Acknowledge',
  accepted: 'Accept',
  'in-progress': 'Start',
  completed: 'Complete',
  declined: 'Decline'
};
export function StructuredRequestCard({ request, onTransition }) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef(null);
  const allowed = REQUEST_TRANSITIONS[request.state];
  function close() {
    setConfirming(false);
    cancelRef.current?.focus();
  }
  const buttons = (states) =>
    states.map((to) => (
      <button type="button" key={to} onClick={() => onTransition(to)}>
        {labels[to]}
      </button>
    ));
  return (
    <section
      className="sf-connect__request"
      aria-label={`${humanLabel(request.type)} lifecycle`}
    >
      <h4>{humanLabel(request.type)}</h4>
      <Badge>{humanLabel(request.state)}</Badge>
      <p>Recipient: {staffNames[request.recipientId]}</p>
      <details>
        <summary>Request history</summary>
        <ol>
          {request.history.map((entry, index) => (
            <li key={index}>
              {humanLabel(entry.to)} · {staffNames[entry.actor.id]} (
              {entry.actor.kind}) ·{' '}
              <time dateTime={entry.at}>{entry.at.slice(11, 16)}</time>
            </li>
          ))}
        </ol>
      </details>
      <div className="sf-connect__actions">
        {buttons(allowed.filter((to) => ['delivered', 'read'].includes(to)))}
      </div>
      {allowed.some(
        (to) => !['delivered', 'read', 'cancelled'].includes(to)
      ) && (
        <fieldset>
          <legend>Recipient actions (simulation)</legend>
          <div className="sf-connect__actions">
            {buttons(
              allowed.filter(
                (to) => !['delivered', 'read', 'cancelled'].includes(to)
              )
            )}
          </div>
          {allowed.includes('acknowledged') && (
            <p>Acknowledged does not mean accepted</p>
          )}
        </fieldset>
      )}
      {allowed.includes('cancelled') && (
        <>
          <button
            type="button"
            ref={cancelRef}
            onClick={() => setConfirming(true)}
          >
            Cancel request
          </button>
          {confirming && (
            <div
              className="sf-connect__confirmation"
              role="group"
              aria-label="Confirm cancellation"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  close();
                }
              }}
            >
              <p>Cancel this request as the current fictional clinician?</p>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setConfirming(false);
                  onTransition('cancelled');
                }}
              >
                Confirm cancellation
              </button>
              <button type="button" onClick={close}>
                Keep request
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
