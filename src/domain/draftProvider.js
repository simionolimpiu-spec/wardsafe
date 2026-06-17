export const deterministicDraftProvider = {
  id: 'deterministic',
  createSbarDraft({ patient, flag }) {
    return {
      provider: 'deterministic',
      isEditable: true,
      evidenceLinks: ['labs.potassium', 'labs.magnesium', 'medicines', 'symptoms', 'plan'],
      sections: {
        situation: `${patient.id}: concern about possible electrolyte / AKI safety gap in simulated data.`,
        background: `${patient.baseline.join(', ')}. Current context includes ${patient.medicines.join(', ') || 'no relevant medicines visible'}.`,
        assessment: `${flag.reasons.join(' ')} Missing or uncertain information: ${flag.missingInformation.join(' ') || 'none currently visible'}.`,
        recommendation: 'Check latest U&Es/Mg, observations, medicines chart and local escalation route. Ask the medical team to clarify electrolyte plan if no current plan is visible. Document concern, response and outcome.'
      },
      boundary: flag.boundary
    };
  }
};

export function createSbarDraft({ patient, flag, provider = deterministicDraftProvider }) {
  return provider.createSbarDraft({ patient, flag });
}
