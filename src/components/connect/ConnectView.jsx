import { useLayoutEffect, useReducer, useRef } from 'react';
import { SimulationLabel } from '../../design-system/index.js';
import {
  connectReducer,
  createConnectState
} from '../../connect/connectWorkspace.js';
import { currentUser, staffNames } from '../../connect/demoFixtures.js';
import { ThreadList } from './ThreadList.jsx';
import { ThreadDetail } from './ThreadDetail.jsx';
import { NotificationPreview } from './NotificationPreview.jsx';

export function ConnectView({ patients = [], tasks = [], selectedPatientId }) {
  const [state, dispatch] = useReducer(
    connectReducer,
    { patients, selectedPatientId },
    createConnectState
  );
  const sequence = useRef(0);
  const listRef = useRef(null);
  const headingRef = useRef(null);
  const focusThread = useRef(false);
  const thread = state.threads.find(
    (item) => item.id === state.selectedThreadId
  );
  useLayoutEffect(() => {
    if (focusThread.current) {
      headingRef.current?.focus();
      focusThread.current = false;
    }
  }, [state.selectedThreadId]);
  function act(type, payload = {}) {
    sequence.current += 1;
    const at = new Date(
      Date.UTC(2026, 8, 20, 9, sequence.current)
    ).toISOString();
    dispatch({
      type,
      ...payload,
      at,
      id: `connect-action-${sequence.current}`
    });
  }
  return (
    <section className="sf-connect" aria-labelledby="connect-title">
      <header className="sf-connect__heading">
        <div>
          <p className="eyebrow">SafeFlow Connect</p>
          <h2 id="connect-title">Communication</h2>
        </div>
        <SimulationLabel />
      </header>
      <p className="sf-connect__boundary">
        Simulation only. Fictional patients and staff. Not connected to Teams,
        NHSmail, SMS, WhatsApp or any live service. Human review required.
      </p>
      <p>
        Signed in as (simulation): <strong>{staffNames[currentUser.id]}</strong>{' '}
        · Clinician
      </p>
      <p
        className="sf-connect__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.announcement}
      </p>
      <div className="sf-connect__layout">
        <ThreadList
          threads={state.threads}
          selectedThreadId={thread.id}
          listRef={listRef}
          onSelect={(threadId) => {
            focusThread.current = true;
            act('select-thread', { threadId });
            if (threadId === thread.id) headingRef.current?.focus();
          }}
        />
        <ThreadDetail
          key={thread.id}
          headingRef={headingRef}
          thread={thread}
          state={state}
          tasks={tasks}
          act={act}
          onBack={() => listRef.current?.focus()}
        />
      </div>
      <div className="sf-connect__footer">
        <NotificationPreview category={state.notificationCategory} />
        <details className="sf-connect__activity">
          <summary>Simulation activity</summary>
          {state.activity.length ? (
            <ul>
              {state.activity.map((event) => (
                <li key={event.id}>
                  {event.type} · {staffNames[event.actor.id]} ·{' '}
                  {event.subjectRef.kind}: {event.subjectRef.id} ·{' '}
                  <time dateTime={event.at}>{event.at.slice(11, 16)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activity yet. Actions appear here as references only.</p>
          )}
        </details>
      </div>
    </section>
  );
}
