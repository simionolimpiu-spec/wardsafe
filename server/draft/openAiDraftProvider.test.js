import { describe, expect, it, vi } from 'vitest';
import { simulatedPatients } from '../../src/data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from '../../src/domain/safetyRules.js';
import { DraftProviderSafetyError, createOpenAiDraftProvider } from './openAiDraftProvider.js';

describe('createOpenAiDraftProvider', () => {
  it('requests a stateless structured SBAR draft from the Responses API', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        sections: {
          situation: 'DCU-031 has a simulated electrolyte safety concern.',
          background: 'Visible context includes COPD and diuretic therapy.',
          assessment: 'Potassium trend and missing magnesium are visible.',
          recommendation: 'Clarify the plan with the medical team and document the response.'
        },
        evidenceLinks: ['labs.potassium', 'labs.magnesium', 'plan']
      })
    });
    const provider = createOpenAiDraftProvider({
      client: { responses: { create } },
      model: 'gpt-5.5'
    });

    const draft = await provider.createSbarDraft({ patient, flag });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5.5',
      store: false,
      text: expect.objectContaining({
        format: expect.objectContaining({
          type: 'json_schema',
          strict: true
        })
      })
    }));
    expect(create.mock.calls[0][0].instructions).toMatch(/does not diagnose, prescribe or recommend treatment/i);
    expect(create.mock.calls[0][0].input).toContain(patient.id);
    expect(draft.provider).toBe('openai');
    expect(draft.model).toBe('gpt-5.5');
    expect(draft.isEditable).toBe(true);
    expect(draft.sections.recommendation).toMatch(/clarify the plan/i);
    expect(draft.evidenceLinks).toContain('labs.potassium');
  });

  it('rejects prescribing or treatment instructions from provider output', async () => {
    const patient = simulatedPatients[0];
    const flag = evaluatePotassiumSafetyGap(patient);
    const provider = createOpenAiDraftProvider({
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            output_text: JSON.stringify({
              sections: {
                situation: 'Concern',
                background: 'Background',
                assessment: 'Assessment',
                recommendation: 'Give potassium now.'
              },
              evidenceLinks: ['labs.potassium']
            })
          })
        }
      }
    });

    await expect(provider.createSbarDraft({ patient, flag })).rejects.toBeInstanceOf(DraftProviderSafetyError);
  });
});
