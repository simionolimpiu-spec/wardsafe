import {
  approveSpeechCandidate, confirmNumericValue, createVoiceCapture,
  createSimulationSpeechRecognitionProvider, createSimulationSpeechSynthesisProvider,
  detectNumericContent, transitionVoiceCapture, VOICE_CAPTURE_TRANSITIONS
} from './index.js';
import {
  assertActor, createCaptureProvenance, createPlatformEvent,
  FoundationValidationError, isNonEmptyString, requireValue
} from '../shared/index.js';

const systemActor = { kind: 'system', id: 'fictional-system' };
export function createVoiceState(reviewer) {
  assertActor(reviewer?.actor, true);
  return {
    reviewer, locationType: 'multi-bed-bay', sensitiveContext: false, fixture: 'clear',
    capture: null, trail: ['idle'], candidate: null, editedText: null,
    confirmedNumericValues: [], activity: [], announcement: '',
    outputMode: 'private', containsPatientInformation: false, outputResult: null
  };
}

export function voiceCaptureState(state) { return state.capture?.state ?? 'idle'; }

function reviewedCapture(state, at) {
  const approvedCandidate = approveSpeechCandidate(state.candidate, {
    reviewedBy: state.reviewer.actor.id, reviewedAt: at,
    ...(state.editedText === null ? {} : { editedText: state.editedText })
  });
  return transitionVoiceCapture(state.capture, {
    to: 'saved', action: 'approve', actor: state.reviewer.actor, at,
    approvedCandidate, confirmedNumericValues: state.confirmedNumericValues
  });
}

// Dry-run the immutable Phase 1 functions for the button's reason. No separate UI gate.
export function voiceReviewStatus(state) {
  const numericSafety = state.candidate ? detectNumericContent(
    `${state.candidate.rawText} ${state.candidate.normalisedText} ${state.editedText ?? ''}`
  ) : null;
  try {
    reviewedCapture(state, state.capture?.updatedAt);
    return { numericSafety, disabledReason: '' };
  } catch (error) {
    if (!(error instanceof FoundationValidationError)) throw error;
    return { numericSafety, disabledReason: error.message };
  }
}

export function voiceReducer(state, action) {
  try { return reduceVoiceAction(state, action); }
  catch (error) {
    if (!(error instanceof FoundationValidationError)) throw error;
    return { ...state, announcement: `Action refused: ${error.message}` };
  }
}

function reduceVoiceAction(state, action) {
  const { type, at } = action;
  let sequence = 0;
  const deps = { now: () => at, createId: () => `${action.id}-${++sequence}` };
  const status = voiceCaptureState(state);
  const actor = state.reviewer.actor;
  const freshCapture = () => createVoiceCapture({
    mode: 'push-to-talk', location: { type: state.locationType },
    policy: { ambientPermitted: false }, sensitiveContext: state.sensitiveContext
  }, deps);
  const record = (eventType, capture, eventActor = actor) => createPlatformEvent({
    type: eventType, actor: eventActor, subjectRef: { kind: 'voice-capture', id: capture.id },
    provenance: createCaptureProvenance({ type: 'simulation-fixture', provider: 'simulation-voice', capturedAt: at })
  }, deps);
  const move = (capture, to, actionName, by = systemActor) => transitionVoiceCapture(capture, {
    to, action: actionName, actor: by, at
  });

  if (type === 'context') {
    requireValue(status === 'idle', 'Capture context is fixed after starting');
    const next = { ...state, locationType: action.locationType, sensitiveContext: action.sensitiveContext };
    createVoiceCapture({ mode: 'push-to-talk', location: { type: next.locationType },
      sensitiveContext: next.sensitiveContext, policy: { ambientPermitted: false } }, deps);
    return next;
  }
  if (type === 'script') {
    requireValue(status === 'idle', 'Script is fixed after starting');
    createSimulationSpeechRecognitionProvider(deps).recognise({ fixture: action.fixture });
    return { ...state, fixture: action.fixture };
  }
  if (type === 'new') {
    requireValue(VOICE_CAPTURE_TRANSITIONS[status]?.length === 0, 'Finish or cancel this dictation first');
    return { ...state, capture: null, trail: ['idle'], candidate: null, editedText: null,
      confirmedNumericValues: [], announcement: 'Ready for new dictation' };
  }
  if (type === 'start') {
    const capture = move(state.capture ?? freshCapture(), 'listening', 'start', actor);
    return { ...state, capture, trail: [...state.trail, 'listening'],
      activity: [...state.activity, record('voice.captureStarted', capture)], announcement: 'Listening started' };
  }
  if (type === 'stop') {
    let capture = move(state.capture, 'processing', 'stop', actor);
    const candidate = createSimulationSpeechRecognitionProvider(deps).recognise({ fixture: state.fixture });
    const steps = ['processing', 'transcript', 'draft-ready', 'review-required'];
    for (const to of steps.slice(1)) capture = move(capture, to, 'advance');
    return { ...state, capture, candidate, editedText: null, confirmedNumericValues: [],
      trail: [...state.trail, ...steps], activity: [...state.activity,
        record('voice.captureStopped', capture), record('voice.transcriptionCreated', capture, systemActor)],
      announcement: candidate.safeFailureMessage ?? 'Transcript ready for review' };
  }
  if (type === 'cancel' || type === 'repeat') {
    const capture = move(state.capture ?? freshCapture(), 'cancelled', 'cancel', actor);
    const cancelled = { ...state, capture, candidate: null, editedText: null, confirmedNumericValues: [],
      trail: [...state.trail, 'cancelled'], activity: [...state.activity, record('voice.captureStopped', capture)],
      announcement: 'Dictation cancelled. Nothing saved.' };
    if (type === 'cancel') return cancelled;
    // A repeat always cancels first and creates a distinct capture reference.
    return reduceVoiceAction({ ...cancelled, capture: null, trail: ['idle'] },
      { ...action, type: 'start', id: `${action.id}-repeat` });
  }
  if (type === 'edit') {
    requireValue(status === 'review-required' && state.candidate, 'Transcript required for editing');
    requireValue(isNonEmptyString(action.text), 'Edit must be non-empty text');
    return { ...state, editedText: action.text, confirmedNumericValues: [],
      announcement: 'Edit updated. Any numbers need separate confirmation again.' };
  }
  if (type === 'confirm-number') {
    requireValue(status === 'review-required' && state.candidate, 'Transcript required for confirmation');
    const confirmed = confirmNumericValue(action.value, { reviewedBy: actor.id, reviewedAt: at });
    return { ...state, confirmedNumericValues: [...state.confirmedNumericValues, confirmed], announcement: 'Value confirmed separately' };
  }
  if (type === 'approve') {
    const capture = reviewedCapture(state, at);
    return { ...state, capture, candidate: null, editedText: null, confirmedNumericValues: [],
      trail: [...state.trail, 'saved'], activity: [...state.activity, record('voice.draftReviewed', capture)],
      announcement: 'Review saved in simulation. Transcript text is not stored.' };
  }
  if (type === 'output-settings') {
    return { ...state, outputMode: action.mode, containsPatientInformation: action.containsPatientInformation, outputResult: null };
  }
  if (type === 'preview-output') {
    const outputResult = createSimulationSpeechSynthesisProvider().synthesise({
      mode: state.outputMode, containsPatientInformation: state.containsPatientInformation
    });
    return { ...state, outputResult, announcement: outputResult.disabled
      ? 'Speech output is disabled. No audio is produced.'
      : `No audio is produced. Mode: ${outputResult.mode}. Simulation only.` };
  }
  return state;
}
