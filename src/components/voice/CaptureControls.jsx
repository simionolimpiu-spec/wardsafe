import { VOICE_CAPTURE_TRANSITIONS } from '../../voice/index.js';
import { voiceScriptOptions } from '../../voice/voiceDemoFixtures.js';

export function CaptureControls({ state, status, act, stopRef, newRef, startRef }) {
  const allowed = VOICE_CAPTURE_TRANSITIONS[status];
  return (
    <section className="sf-voice__panel" aria-labelledby="voice-capture-title">
      <h3 id="voice-capture-title">Capture controls</h3>
      <p>Push-to-talk only. Ambient capture is not available.</p>
      <fieldset disabled={status !== 'idle'}>
        <legend>Fictional capture context</legend>
        <label className="sf-voice__field">Location type
          <select value={state.locationType} onChange={(event) => act('context', {
            locationType: event.target.value, sensitiveContext: state.sensitiveContext
          })}>
            <option value="single-room">Single room</option>
            <option value="multi-bed-bay">Multi-bed bay</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="sf-voice__checkbox">
          <input type="checkbox" checked={state.sensitiveContext} onChange={(event) => act('context', {
            locationType: state.locationType, sensitiveContext: event.target.checked
          })} />Sensitive context
        </label>
        <label className="sf-voice__field">Dictation script
          <select value={state.fixture} onChange={(event) => act('script', { fixture: event.target.value })}>
            {voiceScriptOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <p>These are fixed fictional scripts.</p>
      </fieldset>
      <p>Capture state: <strong>{status}</strong></p>
      {status === 'listening' && <p className="sf-voice__notice">Simulated listening. No microphone is in use.</p>}
      <div className="sf-voice__actions">
        {status === 'idle' && <button ref={startRef} type="button" onClick={() => act('start')}>Start listening (simulation)</button>}
        {status === 'listening' && <button ref={stopRef} type="button" onClick={() => act('stop')}>Stop listening</button>}
        {allowed.includes('cancelled') && <button type="button" onClick={() => act('cancel')}>Cancel</button>}
        {allowed.length === 0 && <button ref={newRef} type="button" onClick={() => act('new')}>Start new dictation</button>}
      </div>
      <h4 id="voice-trail-title">State trail</h4>
      <ol aria-labelledby="voice-trail-title" className="sf-voice__trail">
        {state.trail.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
    </section>
  );
}
