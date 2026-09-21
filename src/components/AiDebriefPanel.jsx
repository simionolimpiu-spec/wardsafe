import { useEffect, useRef, useState } from 'react';
import { discoveryScenarios } from '../data/scenarioLibrary.js';
import { createDebriefReview, debriefSafetyExamples, draftDeterministicDebrief, NOTES_LIMIT } from '../domain/aiDebrief.js';
import { buildApiUrl, createApiHeaders } from '../services/apiBaseUrl.js';
import '../styles/ai-debrief.css';

const actor = Object.freeze({ kind: 'human', ref: 'local-educator' });
const clock = { now: () => new Date().toISOString(), createId: () => crypto.randomUUID() };

export function AiDebriefPanel() {
  const [scenarioId, setScenarioId] = useState(discoveryScenarios[0].id);
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [providerReason, setProviderReason] = useState('Live AI is off. Rule-based drafts work without internet.');
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState(null);
  const controller = useRef(null);
  const heading = useRef(null);

  useEffect(() => {
    // Status only: notes stay in this page. Static/offline builds need no server.
    if (window.location.protocol === 'file:') return;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 3000);
    fetch(buildApiUrl('/api/simulation/debrief/status'), { headers: createApiHeaders(), signal: abort.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((status) => { if (!abort.signal.aborted && typeof status?.reason === 'string') setProviderReason(status.reason); })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); abort.abort(); };
  }, []);

  function generate() {
    try {
      const next = createDebriefReview(draftDeterministicDebrief({ scenarioId, notes }), clock);
      if (review) setHistory((previous) => [...previous, review]);
      controller.current = next;
      setReview(next.snapshot());
      setEdits({}); setEditing(null); setError('');
      requestAnimationFrame(() => heading.current?.focus());
    } catch (failure) { setError(failure.message); }
  }
  function decide(lineId, decision) {
    try {
      setReview(controller.current.decide({ lineId, decision, text: edits[lineId], actor }));
      setEditing(null); setError('');
    } catch (failure) { setError(failure.message); }
  }
  function signOff() {
    try { setReview(controller.current.signOff(actor)); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  function download() {
    const payload = { simulationOnly: true, identityVerified: false, reviews: [...history, ...(review ? [review] : [])] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'safeflow-fictional-debrief-audit.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const completed = review?.status === 'completed';
  return (
    <section className="ai-debrief" aria-labelledby="ai-debrief-title">
      <header>
        <p className="eyebrow">Facilitated simulation · human review required</p>
        <h3 id="ai-debrief-title">AI debrief · PEARLS</h3>
        <p>Draft reflection questions from a fictional scenario, then decide on every line. These are discussion prompts, not evidence of learner performance.</p>
        <p className="ai-debrief-provider"><strong>Rule-based mode.</strong> {providerReason}</p>
      </header>
      <div className="ai-debrief-inputs">
        <label htmlFor="debrief-scenario">Debrief scenario</label>
        <select id="debrief-scenario" value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
          {discoveryScenarios.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
        </select>
        <label htmlFor="debrief-notes">Fictional facilitator notes (optional)</label>
        <textarea id="debrief-notes" rows={3} maxLength={NOTES_LIMIT} value={notes}
          aria-describedby="debrief-notes-help" onChange={(event) => setNotes(event.target.value)} />
        <p id="debrief-notes-help">Fictional details only, no patient or staff identifiers. Notes stay in this page and are treated as unverified source data. {notes.length}/{NOTES_LIMIT} characters.</p>
        <button type="button" onClick={generate}>{review ? 'Start a new draft' : 'Draft PEARLS debrief'}</button>
        <p>Drafts and the audit trail are kept only while this page is open. Download the audit before leaving Scenarios or reloading. Starting a new draft preserves earlier reviews below.</p>
      </div>
      {error && editing === null && <p role="alert" className="ai-debrief-error">{error}</p>}
      {review && <div className="ai-debrief-review">
        <h4 ref={heading} tabIndex={-1}>Review: {review.draft.title}</h4>
        <p role="status">{completed ? 'Signed off by the local educator (simulation).' : `${review.pendingCount} lines still need a decision.`}</p>
        <ol className="ai-debrief-lines">
          {review.draft.lines.map((line, index) => {
            const decision = review.decisions[line.id];
            return <li key={line.id} className="ai-debrief-line">
              <h5>{index + 1}. {line.phase}</h5>
              <p className="ai-debrief-label">AI interpretation · rule-based draft{decision?.decision === 'edited' ? ' · edited by educator' : ''}</p>
              <p>{decision?.text ?? line.text}</p>
              <p><strong>Decision:</strong> {decision?.decision ?? 'Awaiting human review'}</p>
              <details><summary>Sources: {line.sourceIds.map((id) => review.draft.sources.find((source) => source.id === id).label).join(', ')}</summary>
                <ul>{line.sourceIds.map((id) => {
                  const source = review.draft.sources.find((item) => item.id === id);
                  return <li key={id}><strong>{source.label}:</strong> {source.text}</li>;
                })}</ul>
              </details>
              {!completed && <div className="ai-debrief-actions" role="group" aria-label={`Review line ${index + 1}`}>
                <button type="button" onClick={() => decide(line.id, 'accepted')}>Accept</button>
                <button type="button" onClick={() => { setEditing(line.id); setEdits((previous) => ({ ...previous, [line.id]: decision?.text ?? line.text })); setError(''); }}>Edit</button>
                <button type="button" onClick={() => decide(line.id, 'rejected')}>Reject</button>
              </div>}
              {editing === line.id && !completed && <div className="ai-debrief-edit">
                <label htmlFor={`edit-${line.id}`}>Edit line {index + 1}</label>
                <textarea id={`edit-${line.id}`} value={edits[line.id]} maxLength={600} rows={4}
                  onChange={(event) => setEdits((previous) => ({ ...previous, [line.id]: event.target.value }))} />
                <p>Keep the reflection grounded in the sources above. Saving runs the wording and source checks again.</p>
                {error && <p role="alert" className="ai-debrief-error">{error}</p>}
                <div className="ai-debrief-actions">
                  <button type="button" onClick={() => decide(line.id, 'edited')}>Save edit</button>
                  <button type="button" onClick={() => { setEditing(null); setError(''); }}>Cancel edit</button>
                </div>
              </div>}
            </li>;
          })}
        </ol>
        <button type="button" disabled={completed || review.pendingCount > 0 || editing !== null} onClick={signOff}>Sign off debrief</button>
        <p>Sign-off requires a decision on every line and no unsaved edit. Rejected lines are excluded from the final debrief.</p>
        {completed && <section aria-label="Signed-off debrief">
          <h4>Educator-reviewed reflection prompts</h4>
          {Object.values(review.decisions).filter(({ decision }) => decision !== 'rejected').length === 0
            ? <p>All lines were rejected. No reflection prompts retained.</p>
            : <ul>{review.draft.lines.filter(({ id }) => review.decisions[id].decision !== 'rejected').map(({ id, sourceIds }) => <li key={id}>AI interpretation · {review.decisions[id].text}<br />Sources: {sourceIds.map((sourceId) => review.draft.sources.find((source) => source.id === sourceId).label).join(', ')}</li>)}</ul>}
        </section>}
        <details className="ai-debrief-audit" open>
          <summary>Visible audit trail ({review.events.length} events)</summary>
          <p>Local simulation events; “local-educator” records a UI action, not an authenticated identity. This is not a durable clinical record.</p>
          <AuditEvents review={review} />
        </details>
      </div>}
      {history.length > 0 && <details><summary>Earlier drafts ({history.length})</summary>
        {history.map((item) => <section key={item.id}><h4>{item.draft.title} · {item.status}</h4><AuditEvents review={item} /></section>)}
      </details>}
      {review && <button type="button" onClick={download}>Download debrief audit (JSON)</button>}
      <details className="ai-debrief-safety">
        <summary>Safety check examples · 3 of 4 blocked</summary>
        <p>The same checks run on every draft and saved edit. They check wording and source references; they do not establish clinical correctness or prove a claim is supported.</p>
        <table><caption>Illustrative checks, not clinical advice</caption><thead><tr><th scope="col">Sample type</th><th scope="col">Result</th></tr></thead>
          <tbody>{debriefSafetyExamples().map(({ label, valid, reason }) => <tr key={label}><th scope="row">{label}</th><td><strong>{valid ? 'Passed' : 'Blocked'}</strong>: {reason}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}

function AuditEvents({ review }) {
  return <ol>{review.events.map((event) => <li key={event.eventId}>
    <time dateTime={event.timestamp}>{event.timestamp}</time> · {event.actor.kind} ({event.actor.ref}) · {event.eventType}
    {event.payload.lineId && <span> · {event.payload.lineId}: {event.payload.decision}<br />Recorded text: {event.payload.text}</span>}
  </li>)}</ol>;
}
