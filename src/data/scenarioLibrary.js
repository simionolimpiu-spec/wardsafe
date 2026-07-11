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
  },
  {
    id: 'scenario-surgical-postop-deterioration',
    title: 'Surgical post-op deterioration review',
    wardContext: 'Post-operative surgical patient with a deteriorating observations cue and a medication-timing note still open.',
    reviewPrompt: 'Can the surgical team see the observation trend, the medication timing note and the documentation gap without turning it into treatment advice?',
    successSignals: [
      'The deteriorating observations cue is visible at a glance',
      'Medication timing is explicit but non-prescriptive',
      'Human review wording stays clear and editable'
    ],
    evidenceExpected: ['Observation trend', 'Medication timing', 'Post-op review', 'Open task'],
    hazards: ['Treatment advice language creeping in', 'Observation trend hidden inside the narrative', 'Ownership of the review is unclear']
  },
  {
    id: 'scenario-paediatric-sepsis-screen',
    title: 'Paediatric sepsis-screen review',
    wardContext: 'Paediatric ward patient with a sepsis-screen cue, a family update note and a medication timing check still open.',
    reviewPrompt: 'Can the reviewer spot the sepsis-screen cue and the missing documentation while keeping the wording simulation-only?',
    successSignals: [
      'The sepsis-screen cue is explicit',
      'Medication timing is visible without implying prescribing',
      'Family communication remains a documentation task'
    ],
    evidenceExpected: ['Sepsis screen', 'Medication timing', 'Observation trend', 'Family update'],
    hazards: ['Diagnosis wording', 'Overstated urgency', 'Missing human-review framing']
  },
  {
    id: 'scenario-community-falls-risk',
    title: 'Community frailty falls-risk review',
    wardContext: 'Community frailty follow-up with an overdue falls assessment and mobility support note that still needs review.',
    reviewPrompt: 'Can the team see the falls-risk cue, the mobility context and the open task without blending it into clinical advice?',
    successSignals: [
      'The falls-risk cue is visible on the card',
      'Mobility support context is easy to find',
      'The review language stays operational and human-led'
    ],
    evidenceExpected: ['Falls assessment', 'Mobility support', 'Home visit note', 'Open task'],
    hazards: ['Falls risk hidden in narrative text', 'Operational steps mixed with advice', 'Review ownership is not obvious']
  },
  {
    id: 'scenario-community-medication-timing',
    title: 'Community medication-timing review',
    wardContext: 'Community follow-up with a medication-timing cue and a reconciliation note that is not yet complete.',
    reviewPrompt: 'Can the reviewer see the timing issue, the medicines context and the documentation gap without drifting into prescribing language?',
    successSignals: [
      'Medication timing cue is visible',
      'Medicines context stays explicit',
      'Human review wording remains intact'
    ],
    evidenceExpected: ['Medication timing', 'Medicines list', 'Open task', 'Documentation gap'],
    hazards: ['Prescribing language appears', 'Timing issue hidden in the note', 'Ownership of the follow-up is unclear']
  },
  {
    id: 'scenario-respiratory-rate-trend',
    title: 'Rising respiratory rate trend',
    wardContext: 'Fictional day care patient with sequential observations showing a rising respiratory rate trend.',
    reviewPrompt: 'Can the nurse in charge see the change, the time stamps, and the missing context clearly enough for human review?',
    successSignals: [
      'The rising respiratory rate trend is visible in the simulation feed.',
      'The cue stays simulation-only and human-review required.',
      'The wording stays calm and explainable.'
    ],
    evidenceExpected: ['Respiratory rate trend', 'Observation timestamps', 'Human-review wording'],
    hazards: ['Overstating the change', 'Hiding the trend in vague wording', 'Using treatment language']
  },
  {
    id: 'scenario-new-onset-confusion',
    title: 'New-onset confusion',
    wardContext: 'Fictional patient with new confusion noted in the simulation observations and otherwise steady workflow.',
    reviewPrompt: 'Can the nurse in charge see what changed, why it flagged, and what human review is needed?',
    successSignals: [
      'New confusion is visible in the fictional record.',
      'The cue stays simulation-only and human-review required.',
      'The wording stays calm and explainable.'
    ],
    evidenceExpected: ['Confusion note', 'Observation timestamp', 'Human-review wording'],
    hazards: ['Treating the note as a live alert', 'Hiding the change behind vague wording', 'Using treatment language']
  },
  {
    id: 'scenario-falling-oxygen-saturation',
    title: 'Falling oxygen saturation',
    wardContext: 'Fictional patient with a falling oxygen saturation trend across sequential observations.',
    reviewPrompt: 'Can the nurse in charge see the trend, the timing, and the context clearly enough for human review?',
    successSignals: [
      'The falling oxygen saturation trend is visible in the simulation feed.',
      'The cue stays simulation-only and human-review required.',
      'The wording stays calm and explainable.'
    ],
    evidenceExpected: ['Oxygen saturation trend', 'Observation timestamps', 'Human-review wording'],
    hazards: ['Overstating the change', 'Hiding the trend in vague wording', 'Using treatment language']
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
