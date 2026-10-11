import { SPEECH_OUTPUT_MODES } from '../../voice/index.js';
import { voiceOutputSamples } from '../../voice/voiceDemoFixtures.js';

const modeLabels = { private: 'Private', headset: 'Headset', device: 'Device speaker', disabled: 'Disabled' };
export function SpeechOutputPanel({ state, act, modeRef }) {
  const result = state.outputResult;
  return (
    <section className="sf-voice__panel" aria-labelledby="voice-output-title">
      <h3 id="voice-output-title">Speech output (simulation)</h3>
      <p>No confidential open-speaker announcement. No audio is produced.</p>
      <label className="sf-voice__field">Output mode
        <select ref={modeRef} value={state.outputMode} onChange={(event) => act('output-settings', {
          mode: event.target.value, containsPatientInformation: state.containsPatientInformation
        })}>
          {SPEECH_OUTPUT_MODES.map((mode) => <option key={mode} value={mode}>{modeLabels[mode]}</option>)}
        </select>
      </label>
      <label className="sf-voice__field">Output content
        <select value={state.containsPatientInformation ? 'patient' : 'general'} onChange={(event) => act('output-settings', {
          mode: state.outputMode, containsPatientInformation: event.target.value === 'patient'
        })}>
          <option value="general">General message, no patient information</option>
          <option value="patient">Message with patient information</option>
        </select>
      </label>
      <p>Fixed fictional sample: {voiceOutputSamples[state.containsPatientInformation ? 'patient' : 'general']}</p>
      <p>Device speaker mode cannot carry patient information.</p>
      <button type="button" onClick={() => act('preview-output')}>Preview speech output</button>
      {result && <div className="sf-voice__notice">
        <p>No audio is produced. Mode: {result.mode}. Simulation only.</p>
        {result.disabled && <p>Speech output is disabled</p>}
      </div>}
    </section>
  );
}
