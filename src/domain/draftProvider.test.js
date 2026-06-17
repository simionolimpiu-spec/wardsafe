import { describe, expect, it } from 'vitest';
import { createSbarDraft, deterministicDraftProvider } from './draftProvider.js';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from './safetyRules.js';

describe('deterministicDraftProvider', () => {
  it('creates editable SBAR wording from visible evidence', () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const draft = createSbarDraft({ patient, flag, provider: deterministicDraftProvider });

    expect(draft.isEditable).toBe(true);
    expect(draft.provider).toBe('deterministic');
    expect(draft.sections.situation).toContain('DCU-031');
    expect(draft.sections.assessment).toContain('Potassium has fallen');
    expect(draft.evidenceLinks).toContain('labs.potassium');
  });

  it('never includes prescribing or treatment instructions', () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const draft = createSbarDraft({ patient, flag, provider: deterministicDraftProvider });

    const text = Object.values(draft.sections).join(' ');
    expect(text).not.toMatch(/administer|prescribe|give potassium|replace potassium/i);
    expect(text).toMatch(/clarify electrolyte plan/i);
  });
});
