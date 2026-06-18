export const discoveryScenarios = [
  {
    id: 'scenario-electrolyte-aki',
    title: 'Electrolyte / AKI documentation gap',
    wardContext: 'Day care patient with falling potassium trend, changing renal function and no visible magnesium result.',
    reviewPrompt: 'Can the nurse in charge see what evidence is present, what is missing and who needs to clarify the plan?',
    successSignals: [
      'Risk is visible within one minute',
      'Missing magnesium result is clearly identified',
      'SBAR wording supports escalation documentation without clinical instruction'
    ],
    evidenceExpected: ['Potassium trend', 'Renal function change', 'Medicine context', 'Missing result'],
    hazards: ['Overstating the safety flag', 'Draft note implying treatment advice', 'Missing information hidden behind too many clicks']
  },
  {
    id: 'scenario-sepsis-handover',
    title: 'Sepsis escalation handover',
    wardContext: 'Patient with raised NEWS2, blood cultures completed and active escalation needing clear handover ownership.',
    reviewPrompt: 'Can the outgoing and incoming nurse see current tasks, escalation status and ownership without re-reading the full note?',
    successSignals: [
      'Escalation status is visible on the board',
      'Tasks show owner and due time',
      'Audit trail separates observation, escalation and documentation events'
    ],
    evidenceExpected: ['NEWS2 trend', 'Escalation time', 'Task ownership', 'Latest SBAR note'],
    hazards: ['Out-of-date escalation status', 'Task owner ambiguity', 'Audit trail feeling blame-oriented']
  },
  {
    id: 'scenario-discharge-blocker',
    title: 'Discharge readiness blocker',
    wardContext: 'Patient appears clinically stable but discharge education, BGL check or medicines counselling is not complete.',
    reviewPrompt: 'Can the team distinguish clinically ready from operationally ready and make blockers visible at handover?',
    successSignals: [
      'Readiness state explains the blocker',
      'Handover completion reflects outstanding work',
      'Board supports discharge discussion without hiding safety flags'
    ],
    evidenceExpected: ['Discharge checklist', 'Outstanding task', 'Responsible nurse', 'Education status'],
    hazards: ['Readiness label too vague', 'Operational blocker mistaken for clinical advice', 'Completed tasks not auditable']
  }
];

export const initialHazardControls = [
  'No live patient data in discovery sessions.',
  'No official logo, endorsement or partner identity unless authorised in writing.',
  'All scenarios are fictional and reviewed as workflow simulations.',
  'Safety flags must show visible evidence and missing information.',
  'AI-generated wording is editable draft support only.',
  'Unsafe wording, including diagnosis or treatment instruction, must be rejected or replaced by fallback wording.',
  'Audit trail language is framed for learning, not blame.'
];
