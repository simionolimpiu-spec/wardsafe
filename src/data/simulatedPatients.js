export const wardSummary = {
  unitName: 'Day Care Unit',
  dateLabel: 'Wednesday 17 June 2026',
  lastUpdated: '09:32',
  metrics: {
    patients: 11,
    activeEscalations: 2,
    highNews: 2,
    handoverCompletePercent: 73,
    dischargeReadyToday: 3
  }
};

export const simulatedPatients = [
  {
    id: 'DCU-031',
    name: 'Patient 031',
    age: 57,
    risk: 'High',
    riskFlags: ['Allergy (Penicillin)', 'Sepsis Concern', 'Electrolyte / AKI safety gap'],
    news2: 6,
    responsibleNurse: 'Leanne Mitchell',
    nextAction: 'Medical review documented',
    escalation: 'Active',
    handoverComplete: 50,
    dischargeReady: false,
    medicines: ['Furosemide 40mg OD'],
    symptoms: ['Weakness', 'Poor oral intake', 'Falls risk'],
    allergies: ['Penicillin', 'Latex'],
    baseline: ['Type 2 diabetes', 'COPD', 'Usually mobile with stick'],
    currentState: ['NEWS2 6', 'Potassium falling', 'No magnesium result visible'],
    trajectory: ['Increasing weakness over 24 hours', 'Renal function changed since morning bloods'],
    uncertainty: ['Magnesium result not visible', 'No clear electrolyte plan documented'],
    responseHistory: ['08:45 escalation activated', '09:05 blood cultures taken', '09:28 NEWS2 recorded = 6'],
    labs: {
      potassium: [
        { time: '07:00', value: 3.8 },
        { time: '13:00', value: 3.2 }
      ],
      magnesium: [],
      creatinine: [
        { time: '07:00', value: 82 },
        { time: '13:00', value: 108 }
      ]
    },
    plan: '',
    sbar: {
      situation: 'Increased breathlessness, weakness and concern about falling potassium trend.',
      background: 'Type 2 diabetes, COPD, diuretic therapy and poor oral intake.',
      assessment: 'NEWS2 6, potassium 3.2 mmol/L, renal function changed, magnesium result not visible.',
      recommendation: 'Medical review requested; clarify electrolyte plan and document response.'
    },
    tasks: [
      { id: 'task-1', label: 'Medical review', status: 'Due', owner: 'Dr Ahmed', due: '10:00' },
      { id: 'task-2', label: 'Blood cultures', status: 'Done', owner: 'Aisha Khan', due: '09:05' },
      { id: 'task-3', label: 'Clarify electrolyte plan', status: 'Due', owner: 'Leanne Mitchell', due: '09:45' }
    ],
    auditTrail: [
      'Escalation created by Leanne Mitchell. Reason: NEWS2 6 and sepsis concern.',
      'NEWS2 recorded: 6 by Leanne Mitchell.',
      'SBAR draft reviewed in simulation.'
    ],
    dischargeBlockers: ['Medical plan unclear', 'Electrolyte review outstanding']
  },
  {
    id: 'DCU-028',
    name: 'Patient 028',
    age: 71,
    risk: 'Medium',
    riskFlags: ['Falls Risk'],
    news2: 4,
    responsibleNurse: 'Aisha Khan',
    nextAction: 'Repeat NEWS2 15:00',
    escalation: 'Monitoring',
    handoverComplete: 75,
    dischargeReady: false,
    medicines: ['Ramipril 5mg OD'],
    symptoms: ['Mild breathlessness'],
    allergies: [],
    baseline: ['Hypertension'],
    currentState: ['NEWS2 4'],
    trajectory: ['Stable observations'],
    uncertainty: ['Awaiting repeat observations'],
    responseHistory: ['08:30 observations recorded'],
    labs: {
      potassium: [{ time: '08:00', value: 4.2 }],
      magnesium: [{ time: '08:00', value: 0.86 }],
      creatinine: [{ time: '08:00', value: 76 }]
    },
    plan: 'Repeat observations and review if NEWS2 rises.',
    sbar: {
      situation: 'Monitoring after mild breathlessness.',
      background: 'Hypertension.',
      assessment: 'NEWS2 4, currently stable.',
      recommendation: 'Repeat NEWS2 at 15:00.'
    },
    tasks: [{ id: 'task-4', label: 'Repeat NEWS2', status: 'Due', owner: 'Aisha Khan', due: '15:00' }],
    auditTrail: ['Observation review created by Aisha Khan.'],
    dischargeBlockers: ['Repeat observations outstanding']
  },
  {
    id: 'DCU-017',
    name: 'Patient 017',
    age: 54,
    risk: 'Low',
    riskFlags: [],
    news2: 1,
    responsibleNurse: 'Tom Hughes',
    nextAction: 'Observe and monitor',
    escalation: 'None',
    handoverComplete: 25,
    dischargeReady: true,
    medicines: ['Salbutamol inhaler PRN'],
    symptoms: ['Mild cough'],
    allergies: [],
    baseline: ['Asthma'],
    currentState: ['NEWS2 1', 'Comfortable at rest'],
    trajectory: ['Improving symptoms'],
    uncertainty: ['Review observations at 12:00'],
    responseHistory: ['08:20 observations recorded'],
    labs: {
      potassium: [{ time: '08:00', value: 4.3 }],
      magnesium: [{ time: '08:00', value: 0.84 }],
      creatinine: [{ time: '08:00', value: 67 }]
    },
    plan: 'Continue observation and prepare discharge checklist if stable.',
    sbar: {
      situation: 'Stable after mild respiratory symptoms.',
      background: 'Asthma, usually independent.',
      assessment: 'NEWS2 1, improving and comfortable at rest.',
      recommendation: 'Review observations and continue discharge preparation if stable.'
    },
    tasks: [{ id: 'task-5', label: 'Observation review', status: 'Due', owner: 'Tom Hughes', due: '12:00' }],
    auditTrail: ['Observation review added by Tom Hughes.'],
    dischargeBlockers: []
  },
  {
    id: 'DCU-044',
    name: 'Patient 044',
    age: 71,
    risk: 'Low',
    riskFlags: ['Falls Risk', 'Diabetes'],
    news2: 2,
    responsibleNurse: 'Rachel Lee',
    nextAction: 'Check BGL before lunch',
    escalation: 'None',
    handoverComplete: 0,
    dischargeReady: false,
    medicines: ['Metformin 500mg BD'],
    symptoms: ['Reduced appetite'],
    allergies: [],
    baseline: ['Type 2 diabetes', 'Uses frame'],
    currentState: ['NEWS2 2', 'BGL check due'],
    trajectory: ['Stable observations'],
    uncertainty: ['Awaiting BGL'],
    responseHistory: ['08:35 discharge checklist opened'],
    labs: {
      potassium: [{ time: '08:00', value: 4.0 }],
      magnesium: [{ time: '08:00', value: 0.81 }],
      creatinine: [{ time: '08:00', value: 74 }]
    },
    plan: 'Check BGL before lunch and update discharge checklist.',
    sbar: {
      situation: 'Stable but BGL check outstanding.',
      background: 'Type 2 diabetes and falls risk.',
      assessment: 'NEWS2 2, observations stable.',
      recommendation: 'Check BGL and update discharge plan.'
    },
    tasks: [{ id: 'task-6', label: 'BGL check', status: 'Due', owner: 'Rachel Lee', due: '11:45' }],
    auditTrail: ['Discharge checklist opened by Rachel Lee.'],
    dischargeBlockers: ['BGL check outstanding']
  },
  {
    id: 'DCU-052',
    name: 'Patient 052',
    age: 62,
    risk: 'Low',
    riskFlags: ['Anticoagulant'],
    news2: 0,
    responsibleNurse: 'Mark Davies',
    nextAction: 'Discharge education',
    escalation: 'None',
    handoverComplete: 100,
    dischargeReady: true,
    medicines: ['Apixaban 5mg BD'],
    symptoms: [],
    allergies: [],
    baseline: ['Atrial fibrillation'],
    currentState: ['NEWS2 0', 'Discharge pack complete'],
    trajectory: ['Ready for discharge education'],
    uncertainty: [],
    responseHistory: ['08:50 discharge pack completed'],
    labs: {
      potassium: [{ time: '08:00', value: 4.4 }],
      magnesium: [{ time: '08:00', value: 0.88 }],
      creatinine: [{ time: '08:00', value: 70 }]
    },
    plan: 'Discharge education and anticoagulant advice documented in simulation.',
    sbar: {
      situation: 'Ready for discharge education.',
      background: 'Atrial fibrillation on anticoagulant therapy.',
      assessment: 'NEWS2 0, discharge pack complete.',
      recommendation: 'Complete discharge education and document understanding.'
    },
    tasks: [{ id: 'task-7', label: 'Discharge education', status: 'Done', owner: 'Mark Davies', due: '10:30' }],
    auditTrail: ['Discharge pack marked complete by Mark Davies.'],
    dischargeBlockers: []
  }
];
