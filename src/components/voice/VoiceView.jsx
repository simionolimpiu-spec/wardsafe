import { useLayoutEffect, useReducer, useRef } from 'react';
import { SimulationLabel } from '../../design-system/index.js';
import { currentUser, staffNames } from '../../connect/demoFixtures.js';
import { createVoiceReviewer } from '../../voice/voiceDemoFixtures.js';
import { createVoiceState, voiceCaptureState, voiceReducer, voiceReviewStatus } from '../../voice/voiceWorkspace.js';
import { CaptureControls } from './CaptureControls.jsx';
import { TranscriptReview } from './TranscriptReview.jsx';
import { SpeechOutputPanel } from './SpeechOutputPanel.jsx';

const initialState = createVoiceState(createVoiceReviewer(currentUser, staffNames));
export function VoiceView() {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const sequence = useRef(0);
  const viewRef = useRef(null);
  const pendingFocus = useRef(null);
  const stopRef = useRef(null);
  const startRef = useRef(null);
  const newRef = useRef(null);
  const headingRef = useRef(null);
  const approveRef = useRef(null);
  const labelRef = useRef(null);
  const modeRef = useRef(null);
  const status = voiceCaptureState(state);
  const review = state.candidate ? voiceReviewStatus(state) : null;
  useLayoutEffect(() => {
    const type = pendingFocus.current;
    pendingFocus.current = null;
    const refused = state.announcement.startsWith('Action refused:');
    const target = type === 'preview-output' && refused ? modeRef
      : refused ? null
        : { start: stopRef, repeat: stopRef, stop: headingRef, approve: newRef,
          cancel: newRef, new: startRef, 'confirm-number': review?.disabledReason ? labelRef : approveRef }[type];
    const active = document.activeElement;
    if (active && active !== document.body && !viewRef.current?.contains(active)) return;
    target?.current?.focus();
  });
  function act(type, payload = {}) {
    sequence.current += 1;
    const now = () => new Date(Date.UTC(2026, 9, 11, 9, sequence.current)).toISOString();
    const createId = () => `voice-action-${sequence.current}`;
    pendingFocus.current = type;
    dispatch({ type, ...payload, at: now(), id: createId() });
  }
  return (
    <section ref={viewRef} className="sf-voice" aria-labelledby="voice-title">
      <header className="sf-voice__heading"><h2 id="voice-title">Voice dictation</h2><SimulationLabel /></header>
      <p className="sf-voice__notice">Simulation only. No microphone is used and no audio is recorded, stored or sent. Dictation uses fixed fictional scripts. Human review required.</p>
      <p role="status" aria-live="polite" aria-atomic="true" className="sf-voice__status">{state.announcement}</p>
      <div className="sf-voice__layout">
        <CaptureControls state={state} status={status} act={act} stopRef={stopRef} newRef={newRef} startRef={startRef} />
        {state.candidate && <TranscriptReview state={state} review={review} act={act}
          headingRef={headingRef} approveRef={approveRef} labelRef={labelRef} />}
        {status === 'saved' && <section className="sf-voice__panel" aria-labelledby="voice-saved-title">
          <h3 id="voice-saved-title">Saved review metadata</h3>
          <p>Saved. Reviewed by {state.reviewer.name} at <time dateTime={state.capture.savedCandidateRef.reviewedAt}>{state.capture.savedCandidateRef.reviewedAt}</time>. {state.capture.confirmedNumericValueCount} confirmed numbers. Transcript text is not stored.</p>
        </section>}
      </div>
      <div className="sf-voice__layout">
        <SpeechOutputPanel state={state} act={act} modeRef={modeRef} />
        <section className="sf-voice__panel" aria-labelledby="voice-activity-title">
          <h3 id="voice-activity-title">Simulation activity</h3>
          <p>In memory only; resets on reload. Events contain references only.</p>
          {state.activity.length ? <ul aria-label="Simulation activity">{state.activity.map((event) => <li key={event.id}>
            {event.type} · {staffNames[event.actor.id] ?? event.actor.id} ({event.actor.kind}) · {event.subjectRef.kind}: {event.subjectRef.id} · <time dateTime={event.at}>{event.at}</time>
          </li>)}</ul> : <p>No activity yet.</p>}
        </section>
      </div>
    </section>
  );
}
