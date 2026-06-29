export class DraftProviderSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DraftProviderSafetyError';
  }
}

const unsafeInstructionPattern = /\b(administer|prescribe|diagnose|treat with|give potassium|replace potassium|start potassium)\b/i;

const sbarDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sections', 'evidenceLinks'],
  properties: {
    sections: {
      type: 'object',
      additionalProperties: false,
      required: ['situation', 'background', 'assessment', 'recommendation'],
      properties: {
        situation: { type: 'string' },
        background: { type: 'string' },
        assessment: { type: 'string' },
        recommendation: { type: 'string' }
      }
    },
    evidenceLinks: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

const instructions = [
  'You draft concise SBAR wording for the SafeFlow Nursing simulation prototype.',
  'Use only the fictional evidence supplied in the request.',
  'The draft is editable and must support nurse-led escalation documentation.',
  'It does not diagnose, prescribe or recommend treatment.',
  'Do not invent observations, medicines, tasks, staff names or plans.',
  'Return only JSON matching the supplied schema.'
].join(' ');

export function createOpenAiDraftProvider({ client, model = 'gpt-5.5' }) {
  return {
    id: 'openai',
    async createSbarDraft({ patient, flag }) {
      const response = await client.responses.create({
        model,
        store: false,
        instructions,
        input: JSON.stringify(createDraftInput({ patient, flag })),
        text: {
          format: {
            type: 'json_schema',
            name: 'safeflow_sbar_draft',
            strict: true,
            schema: sbarDraftSchema
          }
        }
      });
      const parsed = parseStructuredDraft(response);
      ensureSafeSections(parsed.sections);

      return {
        provider: 'openai',
        model,
        isEditable: true,
        evidenceLinks: parsed.evidenceLinks,
        sections: parsed.sections,
        boundary: flag.boundary
      };
    }
  };
}

function createDraftInput({ patient, flag }) {
  return {
    patientId: patient.id,
    fictionalScenario: true,
    risk: patient.risk,
    medicines: patient.medicines,
    symptoms: patient.symptoms,
    baseline: patient.baseline,
    currentState: patient.currentState,
    trajectory: patient.trajectory,
    uncertainty: patient.uncertainty,
    responseHistory: patient.responseHistory,
    labs: patient.labs,
    plan: patient.plan,
    safetyFlag: {
      title: flag.title,
      reasons: flag.reasons,
      missingInformation: flag.missingInformation,
      recommendedNursingActions: flag.recommendedNursingActions,
      boundary: flag.boundary
    }
  };
}

function parseStructuredDraft(response) {
  const outputText = response.output_text;
  if (!outputText) {
    throw new Error('OpenAI response did not include output_text.');
  }
  return JSON.parse(outputText);
}

function ensureSafeSections(sections) {
  const text = Object.values(sections).join(' ');
  if (unsafeInstructionPattern.test(text)) {
    throw new DraftProviderSafetyError('Draft provider returned prescribing, diagnostic or treatment wording.');
  }
}
