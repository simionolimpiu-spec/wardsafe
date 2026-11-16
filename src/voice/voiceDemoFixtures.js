import { assertActor, frozenCopy, isNonEmptyString, requireValue } from '../shared/index.js';

export const voiceScriptOptions = frozenCopy([
  { value: 'clear', label: 'Clear dictation' },
  { value: 'uncertain', label: 'Unclear dictation' },
  { value: 'numeric', label: 'Dictation with a number' }
]);
export const voiceOutputSamples = frozenCopy({
  general: 'Fictional workspace review is ready.',
  patient: 'The fictional patient handover draft is ready for human review.'
});

// The view supplies the existing Connect identity, keeping this pillar independent.
export function createVoiceReviewer(actor, names) {
  assertActor(actor, true);
  requireValue(isNonEmptyString(names?.[actor.id]), 'Fictional reviewer name required');
  return frozenCopy({ actor, name: names[actor.id] });
}
