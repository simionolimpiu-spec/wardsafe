import { simulatedPatients } from './simulatedPatients.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createScenario({
  scenarioId,
  scenarioName,
  rationale,
  expectedOverallCategory,
  expectedFlaggedDomains,
  patient,
  journey = null
}) {
  return {
    scenarioId,
    scenarioName,
    rationale,
    expectedOverallCategory,
    expectedFlaggedDomains,
    patient,
    journey: journey ?? {
      id: scenarioId,
      name: scenarioName,
      source: 'fictional scenario fixture'
    }
  };
}

const readyPatient = clone(simulatedPatients[4]);

const documentationGapPatient = {
  id: 'DCU-060',
  name: 'Patient 060',
  age: 68,
  risk: 'Low',
  riskFlags: [],
  news2: 2,
  responsibleNurse: 'Leanne Mitchell',
  nextAction: 'Review documentation',
  escalation: 'None',
  handoverComplete: 100,
  dischargeReady: true,
  medicines: [],
  symptoms: [],
  allergies: [],
  baseline: ['Stable observation only'],
  currentState: [],
  trajectory: ['Documentation is incomplete but fictional'],
  uncertainty: [],
  responseHistory: [],
  labs: {},
  plan: '',
  sbar: {
    situation: 'Fictional note with missing plan and observation detail.',
    background: 'No active clinical concern is being modelled.',
    assessment: '',
    recommendation: ''
  },
  tasks: [],
  auditTrail: [],
  dischargeBlockers: []
};

const incompleteHandoverPatient = {
  id: 'DCU-061',
  name: 'Patient 061',
  age: 73,
  risk: 'Medium',
  riskFlags: ['Falls Risk'],
  news2: 3,
  responsibleNurse: 'Aisha Khan',
  nextAction: 'Finish handover',
  escalation: 'None',
  handoverComplete: 45,
  dischargeReady: false,
  medicines: ['Ramipril 5mg OD'],
  symptoms: ['Mild dizziness'],
  allergies: [],
  baseline: ['Hypertension'],
  currentState: ['Observation stable', 'Mobility note visible'],
  trajectory: ['Waiting for final handover details'],
  uncertainty: [],
  responseHistory: ['09:00 handover started'],
  labs: {},
  plan: 'Handover note in progress with safe fictional context.',
  sbar: {
    situation: 'Transfer of responsibility is not yet complete.',
    background: 'Hypertension.',
    assessment: 'Fictional assessment visible.',
    recommendation: 'Complete the handover note.'
  },
  tasks: [
    { id: 'task-61-1', label: 'Final handover update', status: 'Due', owner: 'Aisha Khan', due: '10:15' }
  ],
  auditTrail: ['Handover note opened in simulation.'],
  dischargeBlockers: ['Handover summary incomplete']
};

const escalationCuePatient = {
  id: 'DCU-062',
  name: 'Patient 062',
  age: 59,
  risk: 'Medium',
  riskFlags: ['Observation review'],
  news2: 4,
  responsibleNurse: 'Tom Hughes',
  nextAction: 'Escalation review',
  escalation: 'None',
  handoverComplete: 100,
  dischargeReady: true,
  medicines: ['Salbutamol inhaler PRN'],
  symptoms: ['Breathless on exertion'],
  allergies: [],
  baseline: ['Asthma'],
  currentState: ['NEWS2 4', 'Review cue visible'],
  trajectory: ['Stable but escalation note is incomplete'],
  uncertainty: [],
  responseHistory: ['09:05 review recorded'],
  labs: {},
  plan: 'Observation plan visible in the simulation.',
  sbar: {
    situation: 'Breathlessness is being reviewed in a fictional scenario.',
    background: 'Asthma.',
    assessment: '',
    recommendation: 'Continue review and document the next step.'
  },
  tasks: [],
  auditTrail: ['Escalation review noted in the simulation.'],
  dischargeBlockers: []
};

const dischargeBlockerPatient = {
  id: 'DCU-063',
  name: 'Patient 063',
  age: 64,
  risk: 'Low',
  riskFlags: [],
  news2: 1,
  responsibleNurse: 'Rachel Lee',
  nextAction: 'Complete discharge paperwork',
  escalation: 'None',
  handoverComplete: 100,
  dischargeReady: false,
  medicines: ['Metformin 500mg BD'],
  symptoms: [],
  allergies: [],
  baseline: ['Type 2 diabetes'],
  currentState: ['Discharge note visible'],
  trajectory: ['Stable enough for discharge discussion'],
  uncertainty: [],
  responseHistory: ['09:10 discharge preparation started'],
  labs: {},
  plan: 'Discharge steps are visible in the simulation.',
  sbar: {
    situation: 'Fictional discharge preparation remains incomplete.',
    background: 'Type 2 diabetes.',
    assessment: 'Stable and ready to review.',
    recommendation: 'Complete the discharge education.'
  },
  tasks: [],
  auditTrail: ['Discharge checklist opened.'],
  dischargeBlockers: ['Discharge education incomplete']
};

const multipleGapPatient = {
  id: 'DCU-064',
  name: 'Patient 064',
  age: 57,
  risk: 'High',
  riskFlags: ['Sepsis Concern'],
  news2: 6,
  responsibleNurse: 'Leanne Mitchell',
  nextAction: 'Multiple workflow gaps',
  escalation: 'Active',
  handoverComplete: 35,
  dischargeReady: false,
  medicines: ['Furosemide 40mg OD'],
  symptoms: ['Weakness'],
  allergies: ['Penicillin'],
  baseline: ['COPD'],
  currentState: [],
  trajectory: ['Multiple fictional gaps are still open'],
  uncertainty: [],
  responseHistory: [],
  labs: {},
  plan: '',
  sbar: {
    situation: 'Several fictional workflow gaps are visible.',
    background: 'COPD.',
    assessment: '',
    recommendation: 'Medical review requested.'
  },
  tasks: [
    { id: 'task-64-1', label: 'Medication check', status: 'Due', owner: 'Leanne Mitchell', due: '10:30' },
    { id: 'task-64-2', label: 'Escalation update', status: 'Due', owner: 'Dr Ahmed', due: '10:45' }
  ],
  auditTrail: ['Escalation created in simulation.'],
  dischargeBlockers: ['Transport not booked']
};

const partialSafePatient = {
  id: 'DCU-065',
  name: 'Patient 065',
  handoverComplete: 0,
  dischargeReady: false,
  dischargeBlockers: null,
  tasks: null,
  currentState: null,
  auditTrail: null,
  responseHistory: null,
  plan: '',
  sbar: null,
  escalation: 'None',
  news2: 0
};

export const simulationRiskSupportEvaluationScenarios = [
  createScenario({
    scenarioId: 'scenario-low-signal-ready',
    scenarioName: 'Complete documentation, low signal',
    rationale: 'Fictional discharge-ready journey with complete notes and no active workflow gaps.',
    expectedOverallCategory: 'ready',
    expectedFlaggedDomains: [],
    patient: readyPatient
  }),
  createScenario({
    scenarioId: 'scenario-documentation-gap',
    scenarioName: 'Missing observations and incomplete documentation',
    rationale: 'Fictional note leaves the plan, observation history and escalation cues intentionally blank.',
    expectedOverallCategory: 'review suggested',
    expectedFlaggedDomains: ['documentation_quality', 'escalation_readiness'],
    patient: documentationGapPatient
  }),
  createScenario({
    scenarioId: 'scenario-incomplete-handover',
    scenarioName: 'Incomplete handover fields',
    rationale: 'Fictional handover stays open so the harness can check transfer-of-responsibility cues.',
    expectedOverallCategory: 'review suggested',
    expectedFlaggedDomains: ['handover_completeness', 'discharge_readiness'],
    patient: incompleteHandoverPatient
  }),
  createScenario({
    scenarioId: 'scenario-escalation-cue',
    scenarioName: 'Unresolved escalation-readiness cue',
    rationale: 'Fictional review note leaves the SBAR assessment blank while the rest of the journey remains ready.',
    expectedOverallCategory: 'ready',
    expectedFlaggedDomains: ['escalation_readiness'],
    patient: escalationCuePatient
  }),
  createScenario({
    scenarioId: 'scenario-discharge-blocker',
    scenarioName: 'Discharge-readiness blocker',
    rationale: 'Fictional discharge remains blocked even though the rest of the journey is ready for review.',
    expectedOverallCategory: 'ready',
    expectedFlaggedDomains: ['discharge_readiness'],
    patient: dischargeBlockerPatient
  }),
  createScenario({
    scenarioId: 'scenario-multiple-gaps',
    scenarioName: 'Multiple simultaneous gaps',
    rationale: 'Fictional workflow intentionally leaves several related gaps open at once.',
    expectedOverallCategory: 'documentation gap',
    expectedFlaggedDomains: [
      'documentation_quality',
      'handover_completeness',
      'escalation_readiness',
      'discharge_readiness'
    ],
    patient: multipleGapPatient
  }),
  createScenario({
    scenarioId: 'scenario-partial-safe-input',
    scenarioName: 'Partial or malformed but safe fictional input',
    rationale: 'Fictional malformed input confirms the harness stays deterministic and graceful without live data.',
    expectedOverallCategory: 'documentation gap',
    expectedFlaggedDomains: [
      'documentation_quality',
      'handover_completeness',
      'escalation_readiness',
      'discharge_readiness'
    ],
    patient: partialSafePatient
  })
];
