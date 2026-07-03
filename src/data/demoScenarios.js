import { simulatedPatients, wardSummary as dayCareWardSummary } from './simulatedPatients.js';
import {
  getWardLibraryDemoScenarioById,
  getWardLibraryScenarioOptions
} from './wardLibrary/index.js';

export const DEFAULT_DEMO_SCENARIO_ID = 'day-care-treatment-pathway';

const HOSPITAL_NAME = 'Cityview Community Hospital';

const demoScenarioDefinitions = [
  {
    id: 'gastro-documentation-review',
    label: 'Gastro ward documentation review',
    description: 'Simulation comparison cues for a fictional gastro ward documentation review.',
    currentWardName: 'Gastro Ward',
    selectedPatientId: 'DCU-028',
    patientOverrides: {
      'DCU-028': {
        risk: 'Medium',
        riskFlags: ['Documentation gap'],
        nextAction: 'Document gastro review and confirm pathway',
        handoverComplete: 62,
        dischargeReady: false,
        medicines: ['Mesalazine 800mg TDS'],
        symptoms: ['Abdominal discomfort', 'Reduced intake'],
        baseline: ['Ulcerative colitis', 'Pathway review in progress'],
        currentState: ['Documentation gap visible', 'Pathway note still open'],
        trajectory: ['Treatment pathway requires review'],
        uncertainty: ['Gastro review note not visible', 'Medication review cue incomplete'],
        responseHistory: ['08:30 gastro review opened'],
        plan: '',
        sbar: {
          situation: 'Gastro review in progress with documentation still open.',
          background: 'Ulcerative colitis and current flare review.',
          assessment: 'Treatment pathway not fully documented in the simulation record.',
          recommendation: 'Document the review outcome and confirm the next step.'
        },
        tasks: [
          { id: 'task-4', label: 'Document gastro review', status: 'Due', owner: 'Aisha Khan', due: '09:45' },
          { id: 'task-5', label: 'Confirm pathway note', status: 'Due', owner: 'Aisha Khan', due: '10:15' }
        ],
        auditTrail: ['Gastro documentation review opened by Aisha Khan.'],
        dischargeBlockers: ['Documentation incomplete', 'Treatment pathway not signed off']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-028-urine-prelim-1145',
        syntheticPatientRef: 'DCU-028',
        sourceSystem: 'simulation-microbiology',
        sourceType: 'microbiology',
        signalCode: 'urine_culture',
        displayName: 'Urine culture',
        value: 'preliminary growth flagged',
        status: 'preliminary',
        effectiveAt: '2026-06-10T11:45:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      },
      {
        signalId: 'signal-dcu-028-plan-gap-0905',
        syntheticPatientRef: 'DCU-028',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'electrolyte_plan_gap',
        displayName: 'Treatment pathway',
        value: 'unclear',
        status: 'final',
        effectiveAt: '2026-06-10T09:05:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: []
  },
  {
    id: 'amu-discharge-readiness-review',
    label: 'AMU discharge readiness review',
    description: 'Simulation comparison cues for an AMU discharge readiness review.',
    currentWardName: 'Acute Medical Unit',
    selectedPatientId: 'DCU-044',
    patientOverrides: {
      'DCU-044': {
        age: 68,
        risk: 'Medium',
        riskFlags: ['Discharge review'],
        nextAction: 'Document discharge readiness',
        handoverComplete: 68,
        dischargeReady: false,
        medicines: ['Metformin 500mg BD', 'Omeprazole 20mg OD'],
        symptoms: ['Reduced appetite'],
        baseline: ['Type 2 diabetes', 'Recent admission for observation'],
        currentState: ['Discharge note incomplete', 'Follow-up not finalised'],
        trajectory: ['Stable observations but pathway still open'],
        uncertainty: ['Medication reconciliation not visible', 'Transport not booked'],
        responseHistory: ['08:35 discharge checklist opened'],
        plan: '',
        sbar: {
          situation: 'Ready for discharge planning review but documentation is still open.',
          background: 'Type 2 diabetes and monitoring after admission.',
          assessment: 'Observations are stable, but discharge readiness is not fully documented.',
          recommendation: 'Document discharge pathway and confirm the outstanding follow-up.'
        },
        tasks: [
          { id: 'task-6', label: 'Medication reconciliation', status: 'Due', owner: 'Rachel Lee', due: '11:45' },
          { id: 'task-8', label: 'Discharge note', status: 'Due', owner: 'Rachel Lee', due: '12:00' }
        ],
        auditTrail: ['Discharge readiness review opened by Rachel Lee.'],
        dischargeBlockers: ['Medication reconciliation incomplete', 'Follow-up plan not documented']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-044-discharge-1130',
        syntheticPatientRef: 'DCU-044',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'discharge_blocker',
        displayName: 'Discharge checklist',
        value: 'incomplete',
        status: 'final',
        effectiveAt: '2026-06-10T11:30:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: [
      {
        suggestionId: 'suggestion-dcu-044-discharge-review',
        syntheticPatientRef: 'DCU-044',
        riskType: 'missed_action',
        riskTier: 'watch',
        riskScore: 0.54,
        status: 'suggested',
        title: 'Discharge pathway review may be needed',
        suggestedFlag: 'Discharge pathway review may be needed',
        suggestedBlocker: 'Documentation still open',
        suggestedTask: 'Review discharge note and document follow-up',
        evidence: [
          { signalCode: 'discharge_blocker', label: 'Discharge checklist incomplete' }
        ],
        missingData: ['Medication reconciliation not visible'],
        modelVersion: 'simulation-risk-v0',
        featureSetVersion: 'signal-features-v0',
        requiresHumanReview: true,
        createdAt: '2026-06-10T11:35:00.000Z',
        updatedAt: '2026-06-10T11:35:00.000Z',
        actions: [],
        simulationOnly: true
      }
    ]
  },
  {
    id: 'day-care-treatment-pathway',
    label: 'Day Care treatment pathway review',
    description: 'Current day care treatment pathway with documentation and review cues for the same fictional ward.',
    currentWardName: 'Day Care Unit',
    selectedPatientId: 'DCU-031',
    patientOverrides: {},
    signalFixtures: [
      {
        signalId: 'signal-dcu-031-potassium-0910',
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-ice',
        sourceType: 'lab',
        signalCode: 'potassium',
        displayName: 'Potassium',
        value: '3.1',
        unit: 'mmol/L',
        referenceRange: '3.5-5.3',
        status: 'final',
        collectedAt: '2026-06-10T08:55:00.000Z',
        resultedAt: '2026-06-10T09:10:00.000Z',
        receivedAt: '2026-06-10T09:10:30.000Z',
        effectiveAt: '2026-06-10T09:10:00.000Z',
        sourceFreshness: 'current',
        confidence: 0.98,
        provenance: {
          feed: 'simulation',
          messageType: 'ice_pathology_result',
          directCareIdentifiers: false
        },
        simulationOnly: true
      },
      {
        signalId: 'signal-dcu-031-magnesium-missing-0910',
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-ice',
        sourceType: 'lab',
        signalCode: 'magnesium',
        displayName: 'Magnesium',
        value: null,
        unit: 'mmol/L',
        referenceRange: '0.7-1.0',
        status: 'missing',
        collectedAt: null,
        resultedAt: null,
        receivedAt: '2026-06-10T09:10:30.000Z',
        effectiveAt: '2026-06-10T09:10:30.000Z',
        sourceFreshness: 'current',
        confidence: 0.9,
        provenance: {
          feed: 'simulation',
          messageType: 'expected_pathology_result',
          directCareIdentifiers: false
        },
        simulationOnly: true
      },
      {
        signalId: 'signal-dcu-031-news2-0915',
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-observations',
        sourceType: 'observation',
        signalCode: 'NEWS2',
        displayName: 'NEWS2',
        value: '7',
        unit: null,
        referenceRange: null,
        status: 'final',
        collectedAt: '2026-06-10T09:15:00.000Z',
        resultedAt: '2026-06-10T09:15:00.000Z',
        receivedAt: '2026-06-10T09:15:10.000Z',
        effectiveAt: '2026-06-10T09:15:00.000Z',
        sourceFreshness: 'current',
        confidence: 1,
        provenance: {
          feed: 'simulation',
          messageType: 'news2_observation',
          directCareIdentifiers: false
        },
        simulationOnly: true
      },
      {
        signalId: 'signal-dcu-031-plan-gap-0920',
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'electrolyte_plan_gap',
        displayName: 'Electrolyte monitoring plan',
        value: 'unclear',
        unit: null,
        referenceRange: null,
        status: 'final',
        collectedAt: '2026-06-10T09:20:00.000Z',
        resultedAt: '2026-06-10T09:20:00.000Z',
        receivedAt: '2026-06-10T09:20:10.000Z',
        effectiveAt: '2026-06-10T09:20:00.000Z',
        sourceFreshness: 'current',
        confidence: 0.92,
        provenance: {
          feed: 'simulation',
          messageType: 'workflow_gap',
          directCareIdentifiers: false
        },
        simulationOnly: true
      }
    ],
    suggestionFixtures: [
      {
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        syntheticPatientRef: 'DCU-031',
        riskType: 'missed_action',
        riskTier: 'urgent',
        riskScore: 0.86,
        status: 'suggested',
        title: 'Electrolyte result review may be needed',
        suggestedFlag: 'Electrolyte result review may be needed',
        suggestedBlocker: 'Unresolved abnormal blood result',
        suggestedTask: 'Review blood trend and document action',
        evidence: [
          { signalCode: 'potassium', label: 'Potassium 3.1 mmol/L final at 09:10' },
          { signalCode: 'magnesium', label: 'Magnesium result not visible' },
          { signalCode: 'NEWS2', label: 'NEWS2 7 at 09:15' },
          { signalCode: 'electrolyte_plan_gap', label: 'Monitoring plan unclear at 09:20' }
        ],
        missingData: ['Magnesium result not visible'],
        modelVersion: 'simulation-risk-v0',
        featureSetVersion: 'signal-features-v0',
        requiresHumanReview: true,
        createdAt: '2026-06-10T09:12:00.000Z',
        updatedAt: '2026-06-10T09:12:00.000Z',
        actions: [],
        simulationOnly: true
      }
    ]
  },
  {
    id: 'surgical-postop-deterioration-review',
    label: 'Surgical post-op deterioration review',
    description: 'Simulation comparison cues for a fictional surgical ward post-op deterioration review.',
    currentWardName: 'Surgical Ward',
    selectedPatientId: 'DCU-028',
    patientOverrides: {
      'DCU-028': {
        age: 67,
        risk: 'Medium',
        riskFlags: ['Post-op review'],
        nextAction: 'Document post-op review',
        handoverComplete: 58,
        dischargeReady: false,
        medicines: ['Co-codamol 30/500mg PRN', 'Cefuroxime 750mg BD'],
        symptoms: ['Increased pain on movement', 'More drowsy'],
        baseline: ['Day 2 after abdominal surgery', 'Mobilising with assistance'],
        currentState: ['Deteriorating observations cue visible', 'Post-op wound review pending'],
        trajectory: ['Observations trending worse after surgery'],
        uncertainty: ['Observation trend not yet documented', 'Medication timing not fully visible'],
        responseHistory: ['07:45 post-op review opened'],
        plan: '',
        sbar: {
          situation: 'Post-operative review still open with deteriorating observations visible in the simulation record.',
          background: 'Recent abdominal surgery and pain review.',
          assessment: 'Observation trend is worsening and a documentation gap remains visible.',
          recommendation: 'Document the post-op review and confirm the next review step.'
        },
        tasks: [
          { id: 'task-8', label: 'Document post-op review', status: 'Due', owner: 'Aisha Khan', due: '09:45' },
          { id: 'task-9', label: 'Confirm wound review note', status: 'Due', owner: 'Aisha Khan', due: '10:15' }
        ],
        auditTrail: ['Post-op deterioration review opened by Aisha Khan.'],
        dischargeBlockers: ['Observation trend under review', 'Post-op documentation incomplete']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-028-deteriorating-obs-0945',
        syntheticPatientRef: 'DCU-028',
        sourceSystem: 'simulation-observations',
        sourceType: 'observation',
        signalCode: 'deteriorating_obs',
        displayName: 'Observation trend',
        value: 'worsening',
        status: 'final',
        effectiveAt: '2026-06-10T09:45:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: []
  },
  {
    id: 'paediatric-sepsis-screen-review',
    label: 'Paediatric sepsis-screen review',
    description: 'Simulation comparison cues for a fictional paediatric ward sepsis-screen review.',
    currentWardName: 'Paediatric Ward',
    selectedPatientId: 'DCU-031',
    patientOverrides: {
      'DCU-031': {
        age: 8,
        risk: 'High',
        riskFlags: ['Sepsis screen due'],
        nextAction: 'Document sepsis-screen status',
        handoverComplete: 46,
        dischargeReady: false,
        medicines: ['Amoxicillin 250mg TDS', 'Paracetamol PRN'],
        symptoms: ['Fever', 'Poor intake', 'Lethargy'],
        baseline: ['Paediatric infection review', 'Parent present'],
        currentState: ['Sepsis screen overdue', 'Family update note open'],
        trajectory: ['Observations trending worse'],
        uncertainty: ['Sepsis screen not documented', 'Family update not visible'],
        responseHistory: ['08:20 observations recorded', '08:35 parent update documented'],
        plan: '',
        sbar: {
          situation: 'Paediatric review in progress with a sepsis-screen cue visible in the simulation record.',
          background: 'Fever, poor intake and parent update still open.',
          assessment: 'Sepsis-screen status is not yet documented and the review remains open.',
          recommendation: 'Document the visible screening status and confirm the next review step.'
        },
        tasks: [
          { id: 'task-10', label: 'Document sepsis screen', status: 'Due', owner: 'Leanne Mitchell', due: '09:15' },
          { id: 'task-11', label: 'Update family note', status: 'Due', owner: 'Leanne Mitchell', due: '09:45' }
        ],
        auditTrail: ['Paediatric sepsis-screen review opened by Leanne Mitchell.'],
        dischargeBlockers: ['Sepsis-screen documentation incomplete', 'Family update not recorded']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-031-sepsis-screen-0905',
        syntheticPatientRef: 'DCU-031',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'sepsis_screen',
        displayName: 'Sepsis screen',
        value: 'overdue',
        status: 'final',
        effectiveAt: '2026-06-10T09:05:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: []
  },
  {
    id: 'community-falls-risk-review',
    label: 'Community frailty falls-risk review',
    description: 'Simulation comparison cues for a fictional community frailty falls-risk review.',
    currentWardName: 'Community Frailty Team',
    selectedPatientId: 'DCU-044',
    patientOverrides: {
      'DCU-044': {
        age: 84,
        risk: 'Medium',
        riskFlags: ['Falls assessment overdue'],
        nextAction: 'Document falls assessment',
        handoverComplete: 64,
        dischargeReady: false,
        medicines: ['Metformin 500mg BD'],
        symptoms: ['Unsteady on standing', 'Reduced appetite'],
        baseline: ['Lives alone', 'Uses frame', 'Community frailty follow-up'],
        currentState: ['Falls assessment overdue', 'Mobility support note open'],
        trajectory: ['Moving more slowly this week'],
        uncertainty: ['Falls prevention plan not visible'],
        responseHistory: ['08:35 home visit opened'],
        plan: '',
        sbar: {
          situation: 'Community frailty follow-up with a falls-risk cue visible in the simulation record.',
          background: 'Lives alone and uses a frame for mobility.',
          assessment: 'Falls assessment is not yet documented and the review remains open.',
          recommendation: 'Document the visible falls assessment and confirm the next review step.'
        },
        tasks: [
          { id: 'task-12', label: 'Document falls assessment', status: 'Due', owner: 'Rachel Lee', due: '10:00' },
          { id: 'task-13', label: 'Update mobility note', status: 'Due', owner: 'Rachel Lee', due: '10:30' }
        ],
        auditTrail: ['Community falls-risk review opened by Rachel Lee.'],
        dischargeBlockers: ['Falls assessment incomplete', 'Mobility support note incomplete']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-044-falls-risk-0915',
        syntheticPatientRef: 'DCU-044',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'falls_risk',
        displayName: 'Falls assessment',
        value: 'overdue',
        status: 'final',
        effectiveAt: '2026-06-10T09:15:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: []
  },
  {
    id: 'community-medication-timing-review',
    label: 'Community medication-timing review',
    description: 'Simulation comparison cues for a fictional community follow-up with medication-timing review cues.',
    currentWardName: 'Community Frailty Team',
    selectedPatientId: 'DCU-052',
    patientOverrides: {
      'DCU-052': {
        age: 78,
        risk: 'Low',
        riskFlags: ['Medication timing review'],
        nextAction: 'Document medication timing',
        handoverComplete: 72,
        dischargeReady: false,
        medicines: ['Apixaban 5mg BD'],
        symptoms: ['Needs dose support'],
        baseline: ['Atrial fibrillation', 'Community medicines support'],
        currentState: ['Medication timing overdue', 'Reconciliation note incomplete'],
        trajectory: ['Timing note still open'],
        uncertainty: ['Last dose time not visible'],
        responseHistory: ['09:00 medication review opened'],
        plan: '',
        sbar: {
          situation: 'Community follow-up with a medication-timing cue visible in the simulation record.',
          background: 'Atrial fibrillation and medicines support follow-up.',
          assessment: 'Medication timing is not yet documented and the review remains open.',
          recommendation: 'Document the visible timing issue and confirm the follow-up step.'
        },
        tasks: [
          { id: 'task-14', label: 'Document medication timing', status: 'Due', owner: 'Mark Davies', due: '09:30' },
          { id: 'task-15', label: 'Complete reconciliation note', status: 'Due', owner: 'Mark Davies', due: '10:00' }
        ],
        auditTrail: ['Community medication-timing review opened by Mark Davies.'],
        dischargeBlockers: ['Medication timing note incomplete']
      }
    },
    signalFixtures: [
      {
        signalId: 'signal-dcu-052-medication-timing-0905',
        syntheticPatientRef: 'DCU-052',
        sourceSystem: 'simulation-workflow',
        sourceType: 'workflow',
        signalCode: 'medication_timing',
        displayName: 'Medication timing',
        value: 'overdue',
        status: 'final',
        effectiveAt: '2026-06-10T09:05:00.000Z',
        sourceFreshness: 'current',
        simulationOnly: true
      }
    ],
    suggestionFixtures: []
  }
];

export function getDefaultDemoScenario() {
  return getDemoScenarioById(DEFAULT_DEMO_SCENARIO_ID);
}

export function getDemoScenarioById(scenarioId = DEFAULT_DEMO_SCENARIO_ID) {
  const definition = demoScenarioDefinitions.find((scenario) => scenario.id === scenarioId);
  if (!definition) {
    return getWardLibraryDemoScenarioById(scenarioId) ?? getDemoScenarioById(DEFAULT_DEMO_SCENARIO_ID);
  }

  const patients = buildScenarioPatients(definition);

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    hospitalName: HOSPITAL_NAME,
    currentWardName: definition.currentWardName,
    selectedPatientId: definition.selectedPatientId,
    wardSummary: createWardSummary(definition.currentWardName, patients, definition.wardSummaryMeta),
    patients,
    signalFixtures: clone(definition.signalFixtures),
    suggestionFixtures: clone(definition.suggestionFixtures)
  };
}

export function getDemoScenarioOptions() {
  return [
    ...demoScenarioDefinitions.map(({ id, label, description }) => ({ id, label, description })),
    ...getWardLibraryScenarioOptions()
  ];
}

export function getDemoSignalFixtures() {
  return demoScenarioDefinitions.flatMap((scenario) => clone(scenario.signalFixtures));
}

export function getDemoSuggestionFixtures() {
  return demoScenarioDefinitions.flatMap((scenario) => clone(scenario.suggestionFixtures));
}

function buildScenarioPatients(definition) {
  const overrides = definition.patientOverrides ?? {};
  return simulatedPatients.map((patient) => ({
    ...clone(patient),
    ...(overrides[patient.id] ? clone(overrides[patient.id]) : {})
  }));
}

function createWardSummary(unitName, patients, meta = {}) {
  const metrics = {
    patients: patients.length,
    activeEscalations: patients.filter((patient) => patient.escalation === 'Active').length,
    highNews: patients.filter((patient) => Number(patient.news2) >= 5).length,
    handoverCompletePercent: Math.round(mean(patients.map((patient) => Number(patient.handoverComplete) || 0))),
    dischargeReadyToday: patients.filter((patient) => patient.dischargeReady === true).length
  };

  return {
    unitName,
    dateLabel: meta.dateLabel ?? dayCareWardSummary.dateLabel,
    lastUpdated: meta.lastUpdated ?? dayCareWardSummary.lastUpdated,
    metrics
  };
}

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
