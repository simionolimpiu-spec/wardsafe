import { useEffect, useRef, useState } from 'react';
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
  const cardRef = useRef(null);
  const headingRef = useRef(null);
  const previousState = useRef(request.state);
  const allowed = REQUEST_TRANSITIONS[request.state];
  // WCAG 2.4.3: the button that moved the request on is gone in the new state.
  // Hand focus to the next step, or to the heading when the request is finished.
  useEffect(() => {
    if (previousState.current === request.state) return;
    previousState.current = request.state;
    const active = document.activeElement;
    if (active && active !== document.body && !cardRef.current?.contains(active)) return;
    const next = cardRef.current?.querySelector('.sf-connect__actions button');
    (next ?? headingRef.current)?.focus();
  }, [request.state]);
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
      ref={cardRef}
    >
      <h4 ref={headingRef} tabIndex={-1}>{humanLabel(request.type)}</h4>
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
