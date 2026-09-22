import { useRef, useState } from 'react';
import { STRUCTURED_REQUEST_TYPES } from '../../connect/index.js';
import {
  resolveDemoRecipient,
  staffNames
} from '../../connect/demoFixtures.js';
import { Badge } from '../../design-system/index.js';
import { RoleRecipientPicker, humanLabel } from './RoleRecipientPicker.jsx';
import { MessageComposer } from './MessageComposer.jsx';
import { StructuredRequestCard } from './StructuredRequestCard.jsx';
import { AiDraftReviewPanel } from './AiDraftReviewPanel.jsx';
import { TaskLinkPicker } from './TaskLinkPicker.jsx';

export function ThreadDetail({
  thread,
  state,
  tasks,
  act,
  onBack,
  headingRef
}) {
  const [roleKey, setRoleKey] = useState('senior-nurse');
  const [summary, setSummary] = useState('');
  const [requestType, setRequestType] = useState('review-request');
  const inputRef = useRef(null);
  const recipient = resolveDemoRecipient(roleKey);
  const disabledReason = recipient.kind === 'person' ? '' : recipient.reason;
  const eligibleTasks = tasks.filter(
    (task) => thread.scope !== 'patient' || task.patientId === thread.patientRef
  );
  return (
    <section
      className="sf-connect__detail"
      aria-labelledby="connect-thread-title"
    >
      <button type="button" className="sf-connect__back" onClick={onBack}>
        Back to threads
      </button>
      <header>
        <p>
          {humanLabel(thread.scope)} thread
          {thread.patientRef ? ` · ${thread.patientRef}` : ''}
        </p>
        <h3 id="connect-thread-title" tabIndex={-1} ref={headingRef}>
          {thread.title}
        </h3>
      </header>
      <ol className="sf-connect__timeline" aria-label="Thread timeline">
        {state.events
          .filter((event) => event.threadId === thread.id)
          .map((event) => {
            const request = state.requests.find(
              (item) => item.eventId === event.id
            );
            return (
              <li key={event.id}>
                <article>
                  <div className="sf-connect__event-meta">
                    <Badge>{humanLabel(event.kind)}</Badge>
                    <span>
                      {staffNames[event.author.id]} ·{' '}
                      {
                        {
                          human: 'Clinician',
                          system: 'System',
                          'ai-draft': 'AI draft'
                        }[event.author.kind]
                      }
                    </span>
                    <time dateTime={event.createdAt}>
                      {event.createdAt.slice(11, 16)}
                    </time>
                    <span>{humanLabel(event.status)}</span>
                  </div>
                  <p className="sf-connect__body">{event.body}</p>
                  {event.recipientId && (
                    <p>To: {staffNames[event.recipientId]}</p>
                  )}
                  {event.author.kind === 'ai-draft' && (
                    <p>
                      Approved by {staffNames[event.approvedBy]} ·{' '}
                      {event.approvedAt.slice(11, 16)}
                    </p>
                  )}
                  {event.reference && (
                    <p>Existing task: {event.reference.taskId}</p>
                  )}
                  {request && (
                    <StructuredRequestCard
                      request={request}
                      onTransition={(to) =>
                        act('transition-request', { requestId: request.id, to })
                      }
                    />
                  )}
                </article>
              </li>
            );
          })}
      </ol>
      <RoleRecipientPicker value={roleKey} onChange={setRoleKey} />
      <MessageComposer
        inputRef={inputRef}
        text={state.composerText}
        onChange={(text) => act('composer', { text })}
        onSend={() => act('send-message', { roleKey })}
        disabledReason={disabledReason}
      />
      <button type="button" onClick={() => act('draft')}>
        Draft reply (simulation)
      </button>
      {state.drafts
        .filter((draft) => draft.threadId === thread.id)
        .map((draft) => (
          <AiDraftReviewPanel
            key={draft.id}
            draft={draft}
            disabledReason={disabledReason}
            onApprove={() =>
              act('approve-draft', { draftId: draft.id, roleKey })
            }
            onDiscard={() => act('discard-draft', { draftId: draft.id })}
            onEdit={() => {
              act('edit-draft', { draftId: draft.id });
              inputRef.current?.focus();
            }}
          />
        ))}
      <details className="sf-connect__tools">
        <summary>New request</summary>
        <form
          className="sf-connect__form"
          onSubmit={(event) => {
            event.preventDefault();
            act('create-request', { summary, requestType, roleKey });
            setSummary('');
          }}
        >
          <label htmlFor="connect-request-type">Request type</label>
          <select
            id="connect-request-type"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
          >
            {STRUCTURED_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanLabel(type)}
              </option>
            ))}
          </select>
          <p>Addressed to the recipient role selected above.</p>
          <label htmlFor="connect-summary">Request summary</label>
          <input
            id="connect-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            maxLength={240}
          />
          <button
            type="submit"
            disabled={Boolean(disabledReason) || !summary.trim()}
          >
            Send request
          </button>
          {disabledReason && <p>{disabledReason}</p>}
        </form>
      </details>
      <details className="sf-connect__tools">
        <summary>Link an existing task</summary>
        <TaskLinkPicker
          tasks={eligibleTasks}
          onLink={(taskId) =>
            act('link-task', {
              taskId,
              existingTaskIds: eligibleTasks.map((task) => task.id)
            })
          }
        />
      </details>
    </section>
  );
}
