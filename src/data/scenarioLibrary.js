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
  },
  // Evidence: Hamada 2025 BMJ Open Qual; see international-comparative-synthesis.md.
  {
    id: 'scenario-respiratory-rate-first',
    title: 'Respiratory-rate-first review',
    wardContext: 'Fictional ward patient with other vital signs recorded, but respiratory rate not counted and auto-filled; a subtle respiratory-rate trend is the earliest review cue.',
    reviewPrompt: 'Can the reviewer see that the respiratory rate is missing or auto-filled rather than actually counted, and that its subtle trend is the key early cue for human review without giving treatment advice?',
    successSignals: [
      'The missing or uncounted respiratory rate is visible within one minute',
      'The respiratory rate trend is shown as a review cue, not a clinical conclusion',
      'SBAR wording supports escalation documentation without clinical instruction'
    ],
    evidenceExpected: ['Respiratory rate trend', 'Missing RR count', 'Other vitals recorded', 'Latest SBAR note'],
    hazards: ['Respiratory rate hidden inside the narrative', 'Auto-filled respiratory rate mistaken for a real count', 'Wording drifting into treatment advice']
  },
  // Evidence: Sprogis 2021 Intensive & Critical Care Nursing; Allen 2017 Journal of Clinical Nursing; see international-comparative-synthesis.md.
  {
    id: 'scenario-premet-worried-criterion',
    title: 'Pre-MET worried/concern escalation criterion',
    wardContext: 'Fictional ward patient whose NEWS2 remains below the escalation threshold while the nurse documents being worried about a change.',
    reviewPrompt: "Does the board make the nurse's documented concern visible and ready for human review and escalation before objective thresholds trigger, without overstating urgency or implying a clinical conclusion?",
    successSignals: [
      "The nurse's documented concern is visible on the board",
      'Escalation on concern is supported even with a sub-threshold NEWS2',
      'The audit trail separates the concern flag from objective observations'
    ],
    evidenceExpected: ['NEWS2 (sub-threshold)', 'Documented nurse concern', 'Escalation status', 'Latest SBAR note'],
    hazards: ['Concern flag buried behind the objective score', 'Hierarchy implied: the nurse cannot escalate without a number', 'Wording implying a clinical conclusion']
  },
  // Evidence: Pan 2026 J Nurs Manag; see international-comparative-synthesis.md.
  {
    id: 'scenario-alarm-fatigue-triage',
    title: 'Alarm-fatigue / tiered-alarm triage',
    wardContext: 'Fictional ward patient on a continuous-monitoring and deterioration-alerting stream where most alerts are non-actionable noise and one genuine early-deterioration cue risks being missed.',
    reviewPrompt: 'Can the reviewer separate the actionable deterioration cue from non-actionable alarm noise and see a tiered/triaged view of which alerts warrant human review, without the tool making the clinical decision or auto-escalating?',
    successSignals: [
      'Non-actionable alarms are visibly distinguished from the actionable cue within one minute',
      'The genuine early cue is not buried by alarm volume',
      'Escalation/review remains a human decision, documented via SBAR without clinical instruction'
    ],
    evidenceExpected: ['Alarm stream', 'Actionable vs non-actionable flag', 'Observation trend behind the alert', 'Latest SBAR note'],
    hazards: ['Genuine cue lost in alarm noise', 'Tool implying it has auto-triaged clinically', 'Alarm count treated as urgency without review']
  },
  // Evidence: Pozzobon 2025 BMJ Open Qual; Chua 2023 Journal of Clinical Nursing; see international-comparative-synthesis.md.
  {
    id: 'scenario-graded-assertiveness-speakup',
    title: 'Graded-assertiveness / speak-up escalation scripting',
    wardContext: 'Fictional ward patient where a more junior nurse needs to escalate a concern up the hierarchy to a senior or doctor, with a structured concern statement available for review.',
    reviewPrompt: 'Can the reviewer see a clear, documentable escalation script ready for human review that lets a nurse voice a concern up the hierarchy without the tool overstating urgency or making a clinical judgement?',
    successSignals: [
      'A graded, structured escalation/SBAR script is visible and editable',
      'Speaking-up is framed as legitimate regardless of grade/hierarchy',
      'The audit trail records the concern being raised and by whom, non-punitively'
    ],
    evidenceExpected: ['Structured escalation/SBAR script', 'Documented concern + owner', 'Escalation status', 'Communication-openness cue'],
    hazards: ['Hierarchy implied: junior nurse must stay silent without a number', 'Script drifting into clinical instruction/diagnosis', 'Audit trail feeling blame-oriented rather than just-culture']
  },
  // Evidence: NHS England Martha's Rule programme data 2024-26; Frontiers in Health Services 2026 awareness evaluation; see evidence-horizon-scan.md.
  {
    id: 'scenario-family-concern-marthas-rule',
    title: "Family concern / Martha's Rule pathway review",
    wardContext: "Fictional ward patient whose relative has raised a concern that the patient is 'not themselves' and may be deteriorating, while observations remain unremarkable; the ward advertises a Martha's-Rule-style patient/family escalation pathway but the family was not initially aware of it.",
    reviewPrompt: "Can the reviewer see the relative's concern as a legitimate, visible escalation trigger alongside staff observations, and see whether the family has been made aware of the patient/family escalation pathway for human review, without overstating urgency or making a clinical judgement?",
    successSignals: [
      'The family-raised concern is visible on the board with the same legitimacy as a staff concern',
      'Awareness of the patient/family escalation pathway is a visible, documentable step',
      'Escalation remains a human decision documented via SBAR without clinical instruction'
    ],
    evidenceExpected: ['Documented family concern', 'Pathway awareness check', 'Observation trend', 'Escalation status'],
    hazards: ['Family concern treated as less credible than a staff observation', 'Pathway advertised but awareness never checked', 'Wording implying a clinical conclusion or automated escalation']
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

export const staffingContextNote = {
  title: 'Staffing & skill-mix context',
  points: [
    'In simulation-only review, the same fictional deterioration may be harder to catch when patient-to-nurse ratios are higher.',
    'A richer professional-nurse skill mix is associated with better recognition-and-response; see the evidence line below.',
    'SafeFlow supplements adequate professional staffing and is never a substitute for it.',
    'This panel makes no staffing-level recommendation and no clinical claim; human review and clinical judgement remain central.'
  ],
  evidence: 'Aiken et al. 2016, BMJ Quality & Safety (6-country skill-mix study); see international-comparative-synthesis.md'
};

export const biasAwarenessCues = {
  title: 'Notice your thinking',
  points: [
    'Anchoring — am I fixed on the first read of this fictional scenario?',
    'Premature closure — have I stopped looking too soon?',
    'Confirmation bias — am I only noticing details that fit my first impression?',
    'Availability bias — am I over-weighting a recent or memorable case?',
    'Framing effect — is the way this scenario is presented shaping what I notice?'
  ],
  evidence: 'Croskerry on cognitive dispositions to respond and cognitive debiasing; see evidence-horizon-scan.md, section 7'
};
