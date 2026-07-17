const HOSPITAL_NAME = 'Cityview Community Hospital';
const SIMULATION_LABEL = 'Simulation-only';
const CLINICAL_USE = 'not for live clinical deployment';
const SOURCE = 'ward simulation database fixture';

const WARD_DEFINITIONS = [
  { id: 'ward-surgical-alpha', name: 'Surgical Ward Alpha', wardType: 'surgical', wardGroup: 'core adult', bedCount: 28, code: 'SURG' },
  { id: 'ward-general-medical-alpha', name: 'General Medical Ward Alpha', wardType: 'general medical', wardGroup: 'core adult', bedCount: 30, code: 'GMED' },
  { id: 'ward-acute-medical-alpha', name: 'Acute Medical Unit Alpha', wardType: 'acute medical', wardGroup: 'core adult', bedCount: 32, code: 'AMU' },
  { id: 'ward-day-care-alpha', name: 'Day Care Unit Alpha', wardType: 'day care', wardGroup: 'core adult', bedCount: 18, code: 'DCU' },
  { id: 'ward-community-frailty-alpha', name: 'Community Frailty Team Alpha', wardType: 'community frailty team', wardGroup: 'community/frailty', bedCount: 0, code: 'CFT' },
  { id: 'ward-rehab-alpha', name: 'Rehab Ward Alpha', wardType: 'rehab', wardGroup: 'community/frailty', bedCount: 24, code: 'REHAB' },
  { id: 'ward-care-of-elderly-alpha', name: 'Care-of-the-Elderly Ward Alpha', wardType: 'care-of-the-elderly', wardGroup: 'community/frailty', bedCount: 26, code: 'COE' },
  { id: 'ward-paediatrics-alpha', name: 'Paediatrics Ward Alpha', wardType: 'paediatrics', wardGroup: 'specialty', bedCount: 20, code: 'PAED' },
  { id: 'ward-maternity-alpha', name: 'Maternity Ward Alpha', wardType: 'maternity', wardGroup: 'specialty', bedCount: 22, code: 'MAT' },
  { id: 'ward-icu-hdu-alpha', name: 'ICU/HDU Alpha', wardType: 'ICU/HDU', wardGroup: 'specialty', bedCount: 16, code: 'ICU' },
  { id: 'ward-ed-alpha', name: 'ED Alpha', wardType: 'ED', wardGroup: 'specialty', bedCount: 34, code: 'ED' }
];

const FLAG_CATEGORY_DEFINITIONS = [
  {
    category: 'documentation',
    label: 'documentation gap',
    severity: 'moderate',
    triggerSignals: ['electrolyte_plan_gap', 'documentation_note_open']
  },
  {
    category: 'electrolyte-review',
    label: 'electrolyte review',
    severity: 'moderate',
    triggerSignals: ['potassium', 'magnesium', 'creatinine_trend', 'electrolyte_plan_gap']
  },
  {
    category: 'infection-review',
    label: 'infection review',
    severity: 'moderate',
    triggerSignals: ['urine_culture', 'NEWS2', 'infection_review_note']
  },
  {
    category: 'sepsis-screen',
    label: 'sepsis-screen',
    severity: 'high',
    triggerSignals: ['sepsis_screen', 'NEWS2']
  },
  {
    category: 'falls-risk',
    label: 'falls-risk',
    severity: 'low',
    triggerSignals: ['falls_risk', 'mobility_note']
  },
  {
    category: 'medication-timing',
    label: 'medication-timing',
    severity: 'moderate',
    triggerSignals: ['medication_timing', 'medicine_chart_time']
  },
  {
    category: 'deteriorating-obs',
    label: 'deteriorating observations',
    severity: 'high',
    triggerSignals: ['deteriorating_obs', 'NEWS2']
  },
  {
    category: 'escalation',
    label: 'escalation readiness',
    severity: 'high',
    triggerSignals: ['NEWS2', 'active_escalation']
  },
  {
    category: 'handover',
    label: 'handover completeness',
    severity: 'moderate',
    triggerSignals: ['handover_completion', 'open_task']
  },
  {
    category: 'discharge',
    label: 'discharge-readiness blocker',
    severity: 'high',
    triggerSignals: ['discharge_blocker', 'discharge_checklist']
  },
  {
    category: 'learning',
    label: 'learning prompt',
    severity: 'low',
    triggerSignals: ['learning_prompt', 'simulation_scenario']
  }
];

const SCENARIO_THEMES = [
  {
    suffix: '01',
    focusId: 'documentation',
    focusLabel: 'Documentation',
    title: 'documentation and handover review',
    description: 'Simulation-only ward scenario focused on documentation gaps, handover completeness and human review.',
    categories: ['documentation', 'handover', 'learning']
  },
  {
    suffix: '02',
    focusId: 'escalation-readiness',
    focusLabel: 'Escalation readiness',
    title: 'escalation readiness review',
    description: 'Simulation-only ward scenario focused on escalation readiness cues and visible ownership.',
    categories: ['escalation', 'deteriorating-obs', 'handover']
  },
  {
    suffix: '03',
    focusId: 'discharge-readiness',
    focusLabel: 'Discharge readiness',
    title: 'discharge-readiness review',
    description: 'Simulation-only ward scenario focused on discharge-readiness blockers and documented follow-up ownership.',
    categories: ['discharge', 'documentation', 'handover']
  },
  {
    suffix: '04',
    focusId: 'medicine-timing',
    focusLabel: 'Medicine timing',
    title: 'medicine timing documentation review',
    description: 'Simulation-only ward scenario focused on medicine timing, notes and review ownership.',
    categories: ['medication-timing', 'documentation', 'learning']
  },
  {
    suffix: '05',
    focusId: 'observation-trend',
    focusLabel: 'Observation trend',
    title: 'observation trend review',
    description: 'Simulation-only ward scenario focused on NEWS2 observation sets, trend visibility and structured review support.',
    categories: ['deteriorating-obs', 'escalation', 'documentation']
  }
];

const PRONOUNS = ['she/her', 'he/him', 'they/them'];
const RESPONSIBLE_NURSES = [
  'Fictional Nurse A',
  'Fictional Nurse B',
  'Fictional Nurse C',
  'Fictional Nurse D',
  'Fictional Nurse E',
  'Fictional Nurse F'
];

const WARD_CONTEXTS = {
  surgical: ['post-operative pathway review', 'wound review note open', 'mobility support check'],
  'general medical': ['general medical review', 'nutrition note open', 'observation trend visible'],
  'acute medical': ['acute review bay', 'same-day review queue', 'handover ownership check'],
  'day care': ['day care pathway review', 'short-stay review', 'same-day discharge documentation'],
  'community frailty team': ['home visit follow-up', 'mobility support review', 'community handover'],
  rehab: ['rehab goal review', 'therapy handover', 'falls-risk documentation'],
  'care-of-the-elderly': ['frailty review', 'family update note', 'discharge-readiness blocker'],
  paediatrics: ['paediatric observation review', 'family update note', 'sepsis-screen status'],
  maternity: ['maternity observation review', 'postnatal handover', 'feeding support note'],
  'ICU/HDU': ['high-dependency observation review', 'line review note', 'step-down readiness cue'],
  ED: ['ED streaming review', 'arrival note', 'handover bay ownership']
};

const wards = Object.freeze(buildWards());
const flags = Object.freeze(buildFlags());
const patientJourneys = Object.freeze(buildPatientJourneys(wards, flags));
const scenarios = Object.freeze(buildScenarios(wards, flags, patientJourneys));

export const wardLibrary = Object.freeze({
  hospitalName: HOSPITAL_NAME,
  simulationOnly: true,
  clinicalUse: CLINICAL_USE,
  wards,
  flags,
  scenarios,
  patientJourneys
});

export function getWardLibraryScenarioOptions() {
  return wardLibrary.scenarios.map((scenario) => ({
    id: scenario.id,
    label: scenario.title,
    description: scenario.description
  }));
}

export function getWardOptions() {
  return wardLibrary.wards.map((ward) => ({
    id: ward.id,
    label: wardLabel(ward)
  }));
}

export function getReviewFocusOptions(wardId) {
  const ward = findWard(wardId);
  if (!ward) {
    return [];
  }

  return wardLibrary.scenarios
    .filter((scenario) => scenario.wardType === ward.wardType)
    .map((scenario) => ({
      id: scenario.focusId,
      label: scenario.focusLabel,
      scenarioId: scenario.id
    }));
}

export function resolveScenarioId(wardId, focusId) {
  return getReviewFocusOptions(wardId).find((focus) => focus.id === focusId)?.scenarioId ?? null;
}

export function getWardLibraryDemoScenarioById(scenarioId) {
  const scenario = wardLibrary.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) {
    return null;
  }

  const ward = wardLibrary.wards.find((candidate) => candidate.wardType === scenario.wardType) ?? wardLibrary.wards[0];
  const flagIndex = indexById(wardLibrary.flags);
  const patients = scenario.patientIds
    .map((patientId) => wardLibrary.patientJourneys.find((patient) => patient.patientId === patientId))
    .filter(Boolean)
    .map((patient) => toDemoPatient(patient, flagIndex));

  return {
    id: scenario.id,
    label: scenario.title,
    description: scenario.description,
    hospitalName: wardLibrary.hospitalName,
    currentWardName: ward.name,
    selectedPatientId: patients[0]?.id ?? null,
    wardSummary: createWardSummary(ward, patients),
    patients,
    signalFixtures: [],
    suggestionFixtures: []
  };
}

export function buildWardDatabaseExport(library = wardLibrary) {
  const tables = {
    wards: library.wards.map((ward) => ({
      id: ward.id,
      name: ward.name,
      ward_type: ward.wardType,
      ward_group: ward.wardGroup,
      bed_count: ward.bedCount,
      simulation_only: ward.simulationOnly
    })),
    flags: library.flags.map((flag) => ({
      id: flag.id,
      code: flag.code,
      name: flag.name,
      category: flag.category,
      severity: flag.severity,
      description: flag.description,
      trigger_signals: JSON.stringify(flag.triggerSignals),
      rationale_template: flag.rationaleTemplate,
      applicable_ward_types: JSON.stringify(flag.applicableWardTypes),
      simulation_only: flag.simulationOnly
    })),
    scenarios: library.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      ward_type: scenario.wardType,
      description: scenario.description,
      review_cues: JSON.stringify(scenario.reviewCues),
      simulation_only: scenario.simulationOnly
    })),
    scenario_patients: library.scenarios.flatMap((scenario) =>
      scenario.patientIds.map((patientId, index) => ({
        scenario_id: scenario.id,
        patient_id: patientId,
        sequence: index + 1
      }))
    ),
    patients: library.patientJourneys.map((patient) => ({
      id: patient.patientId,
      ward_id: patient.wardId,
      patient_ref: patient.patientRef,
      fictional_name: patient.patientName,
      age: patient.demographics.age,
      pronouns: patient.demographics.pronouns,
      demographic_context: patient.demographics.context,
      risk_level: patient.risk,
      news2: patient.news2,
      responsible_nurse: patient.responsibleNurse,
      next_action: patient.nextAction,
      escalation: patient.escalation,
      handover_complete: patient.handoverComplete,
      discharge_ready: patient.dischargeReady,
      baseline: JSON.stringify(patient.baseline),
      current_state: JSON.stringify(patient.currentState),
      trajectory: JSON.stringify(patient.trajectory),
      uncertainty: JSON.stringify(patient.uncertainty),
      clinical_use: patient.clinicalUse,
      simulation_only: patient.simulationOnly
    })),
    patient_flags: library.patientJourneys.flatMap((patient) =>
      patient.riskFlags.map((flagId, index) => ({
        patient_id: patient.patientId,
        flag_id: flagId,
        sequence: index + 1
      }))
    ),
    journey_events: library.patientJourneys.flatMap((patient) =>
      patient.timeline.map((event, index) => ({
        id: `${patient.patientId}-event-${String(index + 1).padStart(2, '0')}`,
        patient_id: patient.patientId,
        sequence: index + 1,
        timestamp: event.timestamp,
        type: event.type,
        label: event.label,
        detail: event.detail,
        news2: event.news2 ?? null,
        missing_information: JSON.stringify(event.missingInformation ?? []),
        limitations: JSON.stringify(event.limitations ?? []),
        simulation_label: event.simulationLabel,
        clinical_use: patient.clinicalUse,
        simulation_only: event.simulationOnly
      }))
    )
  };

  return {
    generatedAt: '2026-06-17T09:30:00.000Z',
    source: SOURCE,
    tables,
    counts: Object.fromEntries(Object.entries(tables).map(([tableName, rows]) => [tableName, rows.length]))
  };
}

function buildWards() {
  return WARD_DEFINITIONS.map((ward) => ({
    id: ward.id,
    name: ward.name,
    wardType: ward.wardType,
    wardGroup: ward.wardGroup,
    bedCount: ward.bedCount,
    code: ward.code,
    simulationOnly: true
  }));
}

function buildFlags() {
  return WARD_DEFINITIONS.flatMap((ward) =>
    FLAG_CATEGORY_DEFINITIONS.map((definition, index) => {
      const wardSlug = slugify(ward.wardType);
      const categorySlug = slugify(definition.category);
      return {
        id: `flag-${wardSlug}-${categorySlug}`,
        code: `${ward.code}_${categorySlug.replace(/-/g, '_').toUpperCase()}_${String(index + 1).padStart(2, '0')}`,
        name: `${titleCase(ward.wardType)} ${definition.label} cue`,
        category: definition.category,
        severity: severityForWard(definition.severity, ward.wardType, definition.category),
        description: `Simulation-only ${definition.label} cue for ${ward.wardType} workflows. The cue highlights visible evidence and documentation context for structured review support.`,
        triggerSignals: [...definition.triggerSignals],
        rationaleTemplate: `Human review required: check visible ${definition.label} evidence, missing information and ownership before documenting the current simulation status.`,
        applicableWardTypes: [ward.wardType],
        simulationOnly: true
      };
    })
  );
}

function buildPatientJourneys(wards, flags) {
  const flagIndex = flags.reduce((index, flag) => {
    index[`${flag.applicableWardTypes[0]}:${flag.category}`] = flag.id;
    return index;
  }, {});

  return wards.flatMap((ward, wardIndex) =>
    Array.from({ length: 12 }, (_, patientIndex) => {
      const sequence = wardIndex * 12 + patientIndex + 1;
      const wardSequence = patientIndex + 1;
      const patientId = `WS-${ward.code}-${String(wardSequence).padStart(3, '0')}`;
      const categories = patientCategories(patientIndex);
      const riskFlags = categories.map((category) => flagIndex[`${ward.wardType}:${category}`]).filter(Boolean);
      const highestSeverity = highestFlagSeverity(riskFlags, flags);
      const age = ageForWard(ward.wardType, sequence);
      const news2 = news2ForSeverity(highestSeverity, sequence);
      const handoverComplete = Math.max(36, 96 - ((sequence * 7) % 60));
      const dischargeReady = !riskFlags.some((flagId) => flagId.includes('discharge')) && handoverComplete > 78 && news2 < 3;
      const escalation = highestSeverity === 'high' && news2 >= 5 ? 'Active' : highestSeverity === 'high' ? 'Monitoring' : 'None';
      const context = contextForWard(ward.wardType, sequence);
      const missingInformation = missingInformationForCategories(categories);

      return {
        id: patientId,
        patientId,
        patientRef: `${ward.code}-SIM-${String(wardSequence).padStart(3, '0')}`,
        patientName: `Fictional Patient ${ward.code} ${String(wardSequence).padStart(3, '0')}`,
        wardId: ward.id,
        wardName: ward.name,
        wardType: ward.wardType,
        demographics: {
          age,
          pronouns: PRONOUNS[sequence % PRONOUNS.length],
          context
        },
        risk: riskLevelFromSeverity(highestSeverity),
        riskFlags,
        news2,
        responsibleNurse: RESPONSIBLE_NURSES[sequence % RESPONSIBLE_NURSES.length],
        nextAction: nextActionForCategories(categories),
        escalation,
        handoverComplete,
        dischargeReady,
        medicines: medicinesForCategories(categories),
        symptoms: symptomsForWard(ward.wardType, sequence),
        allergies: [],
        baseline: baselineForWard(ward.wardType, context),
        currentState: currentStateForCategories(categories, news2),
        trajectory: trajectoryForSeverity(highestSeverity),
        uncertainty: missingInformation,
        responseHistory: responseHistoryForCategories(categories),
        labs: labsForSequence(sequence),
        plan: categories.includes('documentation') ? '' : 'Structured review note visible in simulation.',
        sbar: sbarForPatient({ ward, categories, context, news2, missingInformation }),
        tasks: tasksForPatient({ patientId, categories, sequence }),
        auditTrail: auditTrailForCategories(categories),
        dischargeBlockers: dischargeBlockersForCategories(categories),
        source: SOURCE,
        clinicalUse: CLINICAL_USE,
        simulationOnly: true,
        simulationLabel: SIMULATION_LABEL,
        missingInformation,
        limitations: [
          'Synthetic timeline only; no live patient data.',
          'No live EPR, pathology, or observations integration.',
          'Simulation-only prototype; human review required.'
        ],
        timeline: timelineForPatient({ ward, patientId, categories, sequence, news2, missingInformation })
      };
    })
  );
}

function buildScenarios(wards, flags, patients) {
  return wards.flatMap((ward) => {
    const wardPatients = patients.filter((patient) => patient.wardId === ward.id);
    const scenarioWardSlug = scenarioSlugForWardType(ward.wardType);

    return SCENARIO_THEMES.map((theme, themeIndex) => {
      const startIndex = themeIndex * 2;
      const scenarioPatients = [
        wardPatients[startIndex % wardPatients.length],
        wardPatients[(startIndex + 1) % wardPatients.length],
        wardPatients[(startIndex + 2) % wardPatients.length],
        wardPatients[(startIndex + 3) % wardPatients.length]
      ];
      const reviewCues = theme.categories
        .map((category) => flags.find((flag) => flag.applicableWardTypes.includes(ward.wardType) && flag.category === category)?.id)
        .filter(Boolean);

      return {
        id: `ward-sim-${scenarioWardSlug}-${theme.suffix}`,
        title: `${titleCase(ward.wardType)} ${theme.title}`,
        focusId: theme.focusId,
        focusLabel: theme.focusLabel,
        wardType: ward.wardType,
        description: `${theme.description} Fictional patients only; human review required and clinical judgement remains central.`,
        patientIds: scenarioPatients.map((patient) => patient.patientId),
        reviewCues,
        simulationOnly: true
      };
    });
  });
}

function toDemoPatient(patient, flagIndex) {
  const flagNames = patient.riskFlags
    .map((flagId) => flagIndex[flagId]?.name)
    .filter(Boolean);

  return {
    id: patient.patientId,
    name: patient.patientName,
    age: patient.demographics.age,
    risk: patient.risk,
    riskFlags: flagNames,
    news2: patient.news2,
    responsibleNurse: patient.responsibleNurse,
    nextAction: patient.nextAction,
    escalation: patient.escalation,
    handoverComplete: patient.handoverComplete,
    dischargeReady: patient.dischargeReady,
    medicines: [...patient.medicines],
    symptoms: [...patient.symptoms],
    allergies: [...patient.allergies],
    baseline: [...patient.baseline],
    currentState: [...patient.currentState],
    trajectory: [...patient.trajectory],
    uncertainty: [...patient.uncertainty],
    responseHistory: [...patient.responseHistory],
    labs: clone(patient.labs),
    plan: patient.plan,
    sbar: clone(patient.sbar),
    tasks: clone(patient.tasks),
    auditTrail: [...patient.auditTrail],
    dischargeBlockers: [...patient.dischargeBlockers],
    observations: patient.timeline
      .filter((event) => event.type === 'vital')
      .map((event, index) => ({
        id: `observation-${patient.patientId}-${index + 1}`,
        time: event.timestamp.slice(11, 16),
        news2: event.news2,
        respiratoryRate: `${18 + (index % 5)}/min`,
        oxygenSaturation: `${95 - (index % 3)}%`
      }))
  };
}

function createWardSummary(ward, patients) {
  return {
    unitName: ward.name,
    dateLabel: 'Wednesday 17 June 2026',
    lastUpdated: '09:30',
    metrics: {
      patients: patients.length,
      activeEscalations: patients.filter((patient) => patient.escalation === 'Active').length,
      highNews: patients.filter((patient) => Number(patient.news2) >= 5).length,
      handoverCompletePercent: Math.round(mean(patients.map((patient) => Number(patient.handoverComplete) || 0))),
      dischargeReadyToday: patients.filter((patient) => patient.dischargeReady === true).length
    }
  };
}

function patientCategories(patientIndex) {
  const patterns = [
    ['documentation', 'handover'],
    ['escalation', 'deteriorating-obs'],
    ['discharge', 'documentation'],
    ['medication-timing', 'handover'],
    ['infection-review', 'escalation'],
    ['sepsis-screen', 'documentation'],
    ['falls-risk', 'handover'],
    ['electrolyte-review', 'documentation'],
    ['discharge', 'handover'],
    ['learning', 'documentation'],
    ['deteriorating-obs', 'escalation', 'handover'],
    ['medication-timing', 'discharge']
  ];
  return patterns[patientIndex % patterns.length];
}

function timelineForPatient({ ward, patientId, categories, sequence, news2, missingInformation }) {
  const day = String(10 + (sequence % 10)).padStart(2, '0');
  const baseDate = `2026-06-${day}`;
  const categoryLabel = categories.map((category) => category.replace(/-/g, ' ')).join(' and ');

  return [
    {
      timestamp: `${baseDate}T07:30:00.000Z`,
      type: 'vital',
      label: `NEWS2 ${news2} observation set recorded`,
      detail: `Simulation-only NEWS2 ${news2} observation set recorded for ${ward.name}.`,
      news2,
      missingInformation: [],
      limitations: ['Simulation-only observation entry.'],
      simulationOnly: true,
      simulationLabel: SIMULATION_LABEL
    },
    {
      timestamp: `${baseDate}T07:48:00.000Z`,
      type: 'intervention',
      label: 'Structured review checklist opened',
      detail: `Simulation workflow records that a structured review checklist was opened for ${categoryLabel} cues.`,
      missingInformation: [],
      limitations: ['Simulation-only workflow entry.'],
      simulationOnly: true,
      simulationLabel: SIMULATION_LABEL
    },
    {
      timestamp: `${baseDate}T08:05:00.000Z`,
      type: 'note',
      label: 'Documentation note updated',
      detail: 'Fictional note records visible evidence, missing information and review ownership.',
      missingInformation,
      limitations: ['Simulation-only note entry.'],
      simulationOnly: true,
      simulationLabel: SIMULATION_LABEL
    },
    {
      timestamp: `${baseDate}T08:22:00.000Z`,
      type: 'escalation',
      label: 'Escalation readiness cue logged',
      detail: `Escalation readiness cue recorded for ${patientId}; human review remains required.`,
      missingInformation: categories.includes('escalation') ? ['Escalation ownership confirmation still visible as a cue.'] : [],
      limitations: ['Synthetic escalation event only.'],
      simulationOnly: true,
      simulationLabel: SIMULATION_LABEL
    },
    {
      timestamp: `${baseDate}T08:45:00.000Z`,
      type: 'handover',
      label: 'Handover summary refreshed',
      detail: 'Fictional handover summary refreshed with review cues, missing information and current ownership.',
      missingInformation: categories.includes('handover') ? ['Handover ownership remains incomplete.'] : [],
      limitations: ['Simulation-only handover entry.'],
      simulationOnly: true,
      simulationLabel: SIMULATION_LABEL
    }
  ];
}

function sbarForPatient({ ward, categories, context, news2, missingInformation }) {
  const categoryLabel = categories.map((category) => category.replace(/-/g, ' ')).join(' and ');
  return {
    situation: `${ward.name} simulation record shows ${categoryLabel} cues with NEWS2 ${news2}.`,
    background: `Fictional ${context} context with structured review support only.`,
    assessment: `Visible evidence and missing information are presented for human review: ${missingInformation.join(' ') || 'no missing information currently visible.'}`,
    recommendation: 'Document the current review status, owner and follow-up in the simulation record.'
  };
}

function tasksForPatient({ patientId, categories, sequence }) {
  return categories.slice(0, 3).map((category, index) => ({
    id: `task-${patientId}-${index + 1}`,
    label: taskLabelForCategory(category),
    status: index === 0 ? 'Due' : 'In progress',
    owner: RESPONSIBLE_NURSES[(sequence + index) % RESPONSIBLE_NURSES.length],
    due: `${String(9 + index).padStart(2, '0')}:${index === 0 ? '30' : '45'}`
  }));
}

function taskLabelForCategory(category) {
  const labels = {
    documentation: 'Update documentation summary',
    'electrolyte-review': 'Record electrolyte review status',
    'infection-review': 'Record infection review status',
    'sepsis-screen': 'Document sepsis-screen status',
    'falls-risk': 'Update falls-risk assessment note',
    'medication-timing': 'Clarify medicine timing note',
    'deteriorating-obs': 'Record observation trend review',
    escalation: 'Confirm escalation ownership',
    handover: 'Update handover ownership',
    discharge: 'Update discharge-readiness blocker',
    learning: 'Record learning reflection'
  };
  return labels[category] ?? 'Update structured review note';
}

function nextActionForCategories(categories) {
  if (categories.includes('escalation')) return 'Confirm escalation ownership and document review status';
  if (categories.includes('discharge')) return 'Update discharge-readiness blockers';
  if (categories.includes('handover')) return 'Update handover ownership';
  return 'Update structured review note';
}

function missingInformationForCategories(categories) {
  const notes = {
    documentation: 'Current review summary is incomplete.',
    'electrolyte-review': 'Electrolyte review status is not fully documented.',
    'infection-review': 'Infection review ownership is not visible.',
    'sepsis-screen': 'Sepsis-screen status is not documented.',
    'falls-risk': 'Falls-risk assessment note is incomplete.',
    'medication-timing': 'Medicine timing note is incomplete.',
    'deteriorating-obs': 'Observation trend summary is incomplete.',
    escalation: 'Escalation ownership confirmation is incomplete.',
    handover: 'Handover ownership is incomplete.',
    discharge: 'Discharge-readiness blocker is still open.',
    learning: 'Learning reflection note is incomplete.'
  };
  return unique(categories.map((category) => notes[category]).filter(Boolean));
}

function currentStateForCategories(categories, news2) {
  return [
    `NEWS2 ${news2}`,
    ...categories.map((category) => `${category.replace(/-/g, ' ')} cue visible`)
  ];
}

function responseHistoryForCategories(categories) {
  return categories.map((category, index) => `${String(8 + index).padStart(2, '0')}:10 ${category.replace(/-/g, ' ')} cue reviewed in simulation`);
}

function auditTrailForCategories(categories) {
  return categories.map((category) => `${titleCase(category.replace(/-/g, ' '))} reviewed in simulation audit trail.`);
}

function dischargeBlockersForCategories(categories) {
  if (!categories.includes('discharge')) {
    return categories.includes('handover') ? ['Handover ownership incomplete'] : [];
  }
  return ['Discharge-readiness blocker open', 'Follow-up ownership not fully documented'];
}

function medicinesForCategories(categories) {
  if (categories.includes('medication-timing')) {
    return ['Medicine chart timing entry'];
  }
  if (categories.includes('electrolyte-review')) {
    return ['Fluid balance review item'];
  }
  return ['Routine medicine chart entry'];
}

function symptomsForWard(wardType, sequence) {
  const base = WARD_CONTEXTS[wardType] ?? ['structured review'];
  return [base[sequence % base.length], sequence % 2 === 0 ? 'reduced confidence with next step' : 'documentation query raised'];
}

function baselineForWard(wardType, context) {
  return [`Fictional ${wardType} context`, context, 'Simulation-only structured review support'];
}

function trajectoryForSeverity(severity) {
  if (severity === 'high') return ['Review cues increasing over the morning', 'Ownership still needs explicit confirmation'];
  if (severity === 'moderate') return ['Documentation remains incomplete', 'Review status still open'];
  return ['Stable simulation context', 'Learning cue remains visible'];
}

function labsForSequence(sequence) {
  return {
    potassium: [
      { time: '07:00', value: Number((4.3 - (sequence % 4) * 0.2).toFixed(1)) },
      { time: '13:00', value: Number((4.1 - (sequence % 3) * 0.2).toFixed(1)) }
    ],
    magnesium: sequence % 5 === 0 ? [] : [{ time: '08:00', value: 0.82 }],
    creatinine: [
      { time: '07:00', value: 70 + (sequence % 20) },
      { time: '13:00', value: 78 + (sequence % 24) }
    ]
  };
}

function contextForWard(wardType, sequence) {
  const contexts = WARD_CONTEXTS[wardType] ?? ['structured review'];
  return contexts[sequence % contexts.length];
}

function ageForWard(wardType, sequence) {
  if (wardType === 'paediatrics') return 4 + (sequence % 13);
  if (wardType === 'maternity') return 22 + (sequence % 19);
  if (['community frailty team', 'care-of-the-elderly', 'rehab'].includes(wardType)) return 70 + (sequence % 22);
  return 31 + (sequence % 58);
}

function news2ForSeverity(severity, sequence) {
  if (severity === 'high') return 5 + (sequence % 3);
  if (severity === 'moderate') return 2 + (sequence % 3);
  return sequence % 2;
}

function riskLevelFromSeverity(severity) {
  if (severity === 'high') return 'High';
  if (severity === 'moderate') return 'Medium';
  return 'Low';
}

function highestFlagSeverity(flagIds, flags) {
  const order = { high: 3, moderate: 2, low: 1 };
  const severities = flagIds
    .map((flagId) => flags.find((flag) => flag.id === flagId)?.severity ?? 'low')
    .sort((left, right) => order[right] - order[left]);
  return severities[0] ?? 'low';
}

function severityForWard(baseSeverity, wardType, category) {
  if (category === 'falls-risk' && ['community frailty team', 'rehab', 'care-of-the-elderly'].includes(wardType)) {
    return 'moderate';
  }
  if (category === 'sepsis-screen' && wardType === 'day care') {
    return 'moderate';
  }
  return baseSeverity;
}

function scenarioSlugForWardType(wardType) {
  return slugify(wardType)
    .replace('icu-hdu', 'icu-hdu')
    .replace('general-medical', 'general-medical');
}

function findWard(wardId) {
  return wardLibrary.wards.find((ward) =>
    ward.id === wardId || ward.wardType === wardId || ward.code === wardId
  );
}

function wardLabel(ward) {
  return ward.name
    .replace(/\s+Alpha$/i, '')
    .replace(/\s+(Ward|Unit|Team)$/i, '');
}

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return String(value ?? '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part === 'ED' || part === 'ICU/HDU' ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function indexById(values) {
  return values.reduce((index, value) => {
    index[value.id] = value;
    return index;
  }, {});
}

function unique(values) {
  return [...new Set(values)];
}

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
