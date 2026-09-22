import { useEffect, useId, useRef, useState } from 'react';
import { createReviewRun, createSimulatedPatientSource } from '../agent/index.js';
import '../styles/agent-review.css';

function createPatientRun(patient) {
  return createReviewRun({ patientId: patient.id, workspaceId: 'patient-safety-simulation' }, {
    now: () => new Date().toISOString(), createId: () => crypto.randomUUID(),
    patientSource: createSimulatedPatientSource([patient])
  });
}

/** Mounted with a patient key by PatientSafetyPanel; never starts automatically. */
export function AgentReviewPanel({ patient, createRun = createPatientRun }) {
  const prefix = useId();
  const activeRun = useRef(null);
  const mounted = useRef(true);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    mounted.current = true;
    activeRun.current = null;
    setResult(null);
    setRunning(false);
    setEditing(false);
    setEditedText('');
    setError('');
    return () => { mounted.current = false; activeRun.current?.cancel(); activeRun.current = null; };
  }, [patient]);

  async function start() {
    if (running || result?.cue) return;
    setError('');
    setRunning(true);
    setResult(null);
    let run;
    try {
      run = createRun(patient);
      activeRun.current = run;
      const next = await run.run();
      if (mounted.current && activeRun.current === run) setResult(next);
    } catch {
      if (mounted.current && (!run || activeRun.current === run)) setError('The simulation review could not start. Try again.');
    } finally {
      if (mounted.current && (!run || activeRun.current === run)) setRunning(false);
    }
  }

  function record(decision) {
    try {
      const next = activeRun.current.recordHumanReview({ decision, reviewerRef: 'fictional-demo-reviewer',
        editedText: decision === 'edited' ? editedText : '' });
      setResult(next);
      setEditing(false);
      setError('');
    } catch {
      setError('Enter a review of 1 to 2,000 characters before saving your edit.');
    }
  }

  const cue = result?.cue;
  const generated = cue?.generatedInterpretation.content;
  const potassiumFacts = cue?.evidence.filter(({ factType }) => factType === 'potassium') ?? [];
  const status = running ? 'Reading the fictional record…'
    : result?.status === 'awaiting-human-review' ? 'Human review required.'
      : result?.status === 'completed' ? `Human review recorded: ${cue.status}.`
        : result?.status === 'cancelled' ? 'Review cancelled. No review cue was created.'
          : result?.status === 'error' ? 'Review stopped. No review cue was created. You can retry.'
            : 'Ready to review the fictional record.';

  return (
    <section className="agent-review" aria-labelledby={`${prefix}-heading`}>
      <h3 id={`${prefix}-heading`}>Simulated agent review</h3>
      <p>DCU-031 learning example · Mock AI · Simulation-only review</p>
      <p className="risk-support-boundary">Review support only. Not clinically validated and not for clinical decision-making.</p>
      <p aria-live="polite" aria-atomic="true">{status}</p>
      {!cue && <div className="agent-review-actions">
        <button type="button" className="secondary-action" disabled={running} onClick={start}>
          {result || error ? 'Retry simulated review' : 'Run simulated review'}
        </button>
        {running && <button type="button" className="secondary-action" onClick={() => activeRun.current?.cancel()}>Cancel review</button>}
      </div>}
      {error && <p role="alert">{error}</p>}
      {cue && <>
        <h4>Source facts</h4>
        <ul>{potassiumFacts.map((fact) => <li key={fact.factId}>
          Potassium {fact.value} {fact.unit} at {fact.provenance.observedAtLabel}
        </li>)}</ul>
        <h4>Deterministic signal</h4>
        <p>Recorded potassium change: {cue.deterministicSignals.trend.change ?? 'not available'} mmol/L. Derived from the source facts.</p>
        <h4>AI interpretation · Untrusted draft</h4>
        <p>{generated.interpretation}</p>
        <p>{generated.uncertainty}</p>
        <p>{generated.suggestedReviewPrompt}</p>
        <details>
          <summary>Why this review cue appeared</summary>
          <p>Existing simulation rules and recorded lab values supplied the context. The mock model drafted the interpretation.</p>
          <ul>{potassiumFacts.map((fact) => <li key={fact.factId}>
            <strong>{fact.factId}</strong><br />
            {fact.provenance.source} · Observed {fact.provenance.observedAt}<br />
            Imported {fact.provenance.importedAt}
          </li>)}</ul>
          <p>Model: {cue.generatedInterpretation.model}</p>
          <p>Supporting evidence: {cue.provenance.evidenceRefs.join(', ')}</p>
          <p>Session: {cue.provenance.sessionId}</p>
          <p>Source context event: {cue.provenance.contextEventId}</p>
          <p>Signal event: {cue.provenance.signalEventId}</p>
          <p>Generated event: {cue.provenance.generatedEventId}</p>
        </details>
        <h4>Human decision</h4>
        <p>Fictional demo reviewer. Recording a review does not change source facts or start clinical actions.</p>
        {result.status === 'awaiting-human-review' && <>
          <div className="agent-review-actions">
            <button type="button" className="secondary-action" onClick={() => record('accepted')}>Accept review</button>
            <button type="button" className="secondary-action" onClick={() => { setEditedText(generated.interpretation); setEditing(true); }}>Edit review</button>
            <button type="button" className="secondary-action" onClick={() => record('rejected')}>Reject review</button>
          </div>
          {editing && <form onSubmit={(event) => { event.preventDefault(); record('edited'); }}>
            <label htmlFor={`${prefix}-edit`}>Your edited review</label>
            <textarea id={`${prefix}-edit`} value={editedText} maxLength={2000} required
              onChange={(event) => setEditedText(event.target.value)} rows={4} />
            <div className="agent-review-actions">
              <button type="submit" className="primary-action">Save edited review</button>
              <button type="button" className="secondary-action" onClick={() => setEditing(false)}>Cancel edit</button>
            </div>
          </form>}
        </>}
        {cue.humanDecision && <div>
          <p>Decision: {cue.humanDecision.decision} · {cue.humanDecision.reviewedAt}</p>
          {cue.humanDecision.editedText && <p>Human-authored edit: {cue.humanDecision.editedText}</p>}
          <p>The original AI interpretation remains untrusted.</p>
        </div>}
      </>}
      {result && <details>
        <summary>Review session audit ({result.events.length} events)</summary>
        <p>{result.iterations} of {result.maxIterations} permitted steps used.</p>
        {result.errorCode && <p>Stop reason: {result.errorCode}</p>}
        <ol>{result.events.map((event) => <li key={event.eventId}>
          {event.eventType.replaceAll('_', ' ')} · {event.actor.kind}
          <small>{event.eventId} · {event.timestamp}</small>
        </li>)}</ol>
      </details>}
      <p className="risk-support-boundary">This review stays in memory while this patient panel is open. Changing the patient context, reloading, or leaving the panel clears it.</p>
    </section>
  );
}
