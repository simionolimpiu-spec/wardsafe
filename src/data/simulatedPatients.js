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
    dischargeBlockers: ['Medical plan unclear', 'Electrolyte review outstanding']
  },
  {
    id: 'DCU-028',
    name: 'Patient 028',
    age: 71,
    risk: 'Medium',
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
    dischargeBlockers: ['Repeat observations outstanding']
  }
];
