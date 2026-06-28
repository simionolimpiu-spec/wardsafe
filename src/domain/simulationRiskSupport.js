const SIMULATION_RISK_SUPPORT_CONTRACT_VERSION = 'simulation-risk-support-contract-v1';
const SIMULATION_RISK_SUPPORT_VERSION = 'simulation-risk-support-v0';
const DEFAULT_BOUNDARY = 'Simulation-only support for fictional patient journeys; human review required.';
const DEFAULT_SOURCE = 'fictional scenario fixture';
const DEFAULT_CLINICAL_USE = 'not for live clinical deployment';
const STRUCTURED_REVIEW_NOTE = 'Structured review support for fictional scenario fixture.';
const HUMAN_REVIEW_NOTE = 'Human review required before any handover or discharge decision.';

/**
 * @typedef {Object} SimulationRiskSupportSignalContract
 * @property {string} signalId
 * @property {string} signalType
 * @property {string} label
 * @property {string} status
 * @property {string} category
 * @property {number} score
 * @property {string[]} reasons
 * @property {string[]} [sourceFields]
 * @property {string[]} [missingFields]
 * @property {{field: string, note: string}[]} [missingFieldDetails]
 * @property {string[]} [blockers]
 * @property {{field: string, note: string}[]} [blockerDetails]
 */

/**
 * @typedef {Object} SimulationRiskSupportContract
 * @property {string} contractVersion
 * @property {string} contractType
 * @property {string} contractId
 * @property {string} version
 * @property {string|null} patientId
 * @property {string|null} journeyId
 * @property {string|null} syntheticPatientRef
 * @property {string} source
 * @property {boolean} simulationOnly
 * @property {boolean} humanReviewRequired
 * @property {string} generatedBy
 * @property {string} clinicalUse
 * @property {string} boundary
 * @property {{simulationOnly: boolean, source: string, humanReviewRequired: boolean, generatedBy: string, clinicalUse: string}} metadata
 * @property {string[]} reviewNotes
 * @property {{score: number, category: string, reasons: string[]}} summary
 * @property {{signalId: string, signalType: string, label: string, status: string, category: string, score: number, reasons: string[], contributingSignals: string[], reviewNote: string}} overallSignal
 * @property {SimulationRiskSupportSignalContract} documentationQuality
 * @property {SimulationRiskSupportSignalContract} handoverCompleteness
 * @property {SimulationRiskSupportSignalContract} escalationReadiness
 * @property {SimulationRiskSupportSignalContract} dischargeReadiness
 * @property {string[]} missingDocumentationFields
 * @property {SimulationRiskSupportSignalContract[]} signals
 */

/**
 * Build the formal simulation risk-support contract for a fictional patient journey.
 *
 * @param {Object} [options]
 * @param {Object|null} [options.patient]
 * @param {{id?: string}|null} [options.journey]
 * @param {Object|null} [options.safetyFlag]
 * @param {string} [options.source]
 * @returns {SimulationRiskSupportContract}
 */
export function buildSimulationRiskSupportContract({
  patient,
  journey = null,
  safetyFlag = null,
  source = DEFAULT_SOURCE
} = {}) {
  const resolvedPatient = patient ?? null;
  const patientId = resolveIdentifier(resolvedPatient?.id ?? journey?.patientId ?? journey?.id ?? null);
  const journeyId = resolveIdentifier(journey?.id ?? patientId);

  if (!resolvedPatient) {
    return buildEmptySimulationRiskSupportContract({ patientId, journeyId, source });
  }

  const documentationQuality = createDocumentationQualitySignal(resolvedPatient, safetyFlag);
  const handoverCompleteness = createHandoverCompletenessSignal(resolvedPatient);
  const escalationReadiness = createEscalationReadinessSignal(resolvedPatient, safetyFlag);
  const dischargeReadiness = createDischargeReadinessSignal(resolvedPatient);
  const signals = [
    documentationQuality,
    handoverCompleteness,
    escalationReadiness,
    dischargeReadiness
  ];
  const summaryScore = Math.round(
    signals.reduce((total, signal) => total + signal.score, 0) / signals.length
  );
  const summaryCategory = categorizeSummaryScore(summaryScore);
  const summaryReasons = signals
    .filter((signal) => signal.category !== 'ready')
    .map((signal) => `${signal.label}: ${signal.category}`);
  const overallReasons = summaryReasons.length > 0
    ? summaryReasons
    : ['All simulated support signals are ready.'];

  return {
    contractVersion: SIMULATION_RISK_SUPPORT_CONTRACT_VERSION,
    contractType: 'simulation-risk-support-contract',
    contractId: `${slugify(journeyId ?? patientId)}-simulation-risk-support`,
    version: SIMULATION_RISK_SUPPORT_VERSION,
    patientId,
    journeyId,
    syntheticPatientRef: patientId,
    source,
    simulationOnly: true,
    humanReviewRequired: true,
    generatedBy: 'deterministic rules',
    clinicalUse: DEFAULT_CLINICAL_USE,
    boundary: DEFAULT_BOUNDARY,
    metadata: {
      simulationOnly: true,
      source,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: DEFAULT_CLINICAL_USE
    },
    reviewNotes: [
      STRUCTURED_REVIEW_NOTE,
      HUMAN_REVIEW_NOTE,
      DEFAULT_BOUNDARY
    ],
    summary: {
      score: summaryScore,
      category: summaryCategory,
      reasons: overallReasons
    },
    overallSignal: {
      signalId: `${slugify(journeyId ?? patientId)}-overall`,
      signalType: 'overall',
      label: 'Overall risk-support signal',
      status: summaryCategory,
      category: summaryCategory,
      score: summaryScore,
      reasons: overallReasons,
      contributingSignals: signals.map((signal) => signal.signalType),
      reviewNote: HUMAN_REVIEW_NOTE
    },
    documentationQuality,
    handoverCompleteness,
    escalationReadiness,
    dischargeReadiness,
    missingDocumentationFields: documentationQuality.missingFields ?? [],
    signals
  };
}

export function createSimulationRiskSupport(options = {}) {
  return buildSimulationRiskSupportContract(options);
}

function buildEmptySimulationRiskSupportContract({ patientId, journeyId, source }) {
  const overallReasons = ['No fictional patient was supplied.'];

  return {
    contractVersion: SIMULATION_RISK_SUPPORT_CONTRACT_VERSION,
    contractType: 'simulation-risk-support-contract',
    contractId: `${slugify(journeyId ?? patientId)}-simulation-risk-support`,
    version: SIMULATION_RISK_SUPPORT_VERSION,
    patientId,
    journeyId,
    syntheticPatientRef: patientId,
    source,
    simulationOnly: true,
    humanReviewRequired: true,
    generatedBy: 'deterministic rules',
    clinicalUse: DEFAULT_CLINICAL_USE,
    boundary: DEFAULT_BOUNDARY,
    metadata: {
      simulationOnly: true,
      source,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: DEFAULT_CLINICAL_USE
    },
    reviewNotes: [
      STRUCTURED_REVIEW_NOTE,
      HUMAN_REVIEW_NOTE,
      DEFAULT_BOUNDARY
    ],
    summary: {
      score: 0,
      category: 'review suggested',
      reasons: overallReasons
    },
    overallSignal: {
      signalId: `${slugify(journeyId ?? patientId)}-overall`,
      signalType: 'overall',
      label: 'Overall risk-support signal',
      status: 'review suggested',
      category: 'review suggested',
      score: 0,
      reasons: overallReasons,
      contributingSignals: [],
      reviewNote: HUMAN_REVIEW_NOTE
    },
    documentationQuality: emptySignal('documentation_quality', 'Documentation quality review'),
    handoverCompleteness: emptySignal('handover_completeness', 'Handover completeness'),
    escalationReadiness: emptySignal('escalation_readiness', 'Escalation readiness'),
    dischargeReadiness: emptySignal('discharge_readiness', 'Discharge readiness blockers'),
    missingDocumentationFields: [],
    signals: []
  };
}

function createDocumentationQualitySignal(patient, safetyFlag) {
  const reasons = [];
  const missingFields = [];
  const missingFieldDetails = [];
  const sourceFields = [
    'plan',
    'sbar.recommendation',
    'currentState',
    'auditTrail',
    'uncertainty',
    'responseHistory'
  ];
  let score = 100;
  const plan = normaliseText(patient.plan);
  const recommendation = normaliseText(patient.sbar?.recommendation);
  const currentState = normaliseList(patient.currentState);
  const auditTrail = normaliseList(patient.auditTrail);
  const uncertainty = normaliseList(patient.uncertainty);
  const responseHistory = normaliseList(patient.responseHistory);

  if (plan) {
    reasons.push('Plan is visible in the simulation.');
  } else {
    score -= 30;
    reasons.push('Documentation gap: plan field is blank.');
    addMissingField(missingFields, missingFieldDetails, 'plan', 'Documentation gap: plan field is blank.');
  }

  if (recommendation) {
    reasons.push('SBAR recommendation is visible.');
  } else {
    score -= 20;
    reasons.push('Documentation gap: SBAR recommendation is missing.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'sbar.recommendation',
      'Documentation gap: SBAR recommendation is missing.'
    );
  }

  if (currentState.length > 0) {
    reasons.push(describeVisibility(currentState.length, 'current state item', 'current state items'));
  } else {
    score -= 15;
    reasons.push('Documentation gap: current state is not visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'currentState',
      'Documentation gap: current state is not visible.'
    );
  }

  if (auditTrail.length > 0) {
    reasons.push(describeVisibility(auditTrail.length, 'audit trail entry', 'audit trail entries'));
  } else {
    score -= 10;
    reasons.push('Documentation gap: no audit trail entries are visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'auditTrail',
      'Documentation gap: no audit trail entries are visible.'
    );
  }

  if (uncertainty.length > 0) {
    score -= 10;
    reasons.push(`Documentation gap: open uncertainty is noted - ${uncertainty[0]}.`);
  }

  if (responseHistory.length > 0) {
    reasons.push('Response history is visible.');
  } else {
    score -= 5;
    reasons.push('Documentation gap: no response history is visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'responseHistory',
      'Documentation gap: no response history is visible.'
    );
  }

  if (safetyFlag?.level && safetyFlag.level !== 'none') {
    score -= 5;
    reasons.push(`Documentation gap: a simulation safety flag is visible - ${safetyFlag.title}.`);
    sourceFields.push('safetyFlag.level');
  }

  return buildSignal({
    patient,
    signalType: 'documentation_quality',
    label: 'Documentation quality review',
    score,
    category: categorizeScore(score, {
      readyLabel: 'ready',
      reviewLabel: 'review suggested',
      gapLabel: 'documentation gap',
      readyThreshold: 85,
      reviewThreshold: 60
    }),
    reasons,
    sourceFields,
    missingFields,
    missingFieldDetails
  });
}

function createHandoverCompletenessSignal(patient) {
  const completedPercent = clampScore(Number(patient.handoverComplete ?? 0));
  const openTasks = normaliseTasks(patient.tasks);
  const sourceFields = ['handoverComplete', 'tasks'];
  const blockerDetails = [];
  const blockers = [];
  const score = clampScore(completedPercent - (openTasks.length * 5));
  const reasons = [
    `Handover is ${completedPercent}% complete.`
  ];

  if (openTasks.length > 0) {
    const openTaskReason = `Handover cue: ${describeCount(openTasks.length, 'open task', 'open tasks')} remain before transfer of responsibility.`;
    reasons.push(openTaskReason);
    blockers.push(openTaskReason);
    blockerDetails.push({
      field: 'tasks',
      note: openTaskReason
    });
  } else {
    reasons.push('Handover cue: no open tasks remain.');
  }

  if (completedPercent === 100 && openTasks.length === 0) {
    reasons.push('Handover summary is fully prepared.');
  } else if (completedPercent >= 75) {
    reasons.push('Handover note needs a little more detail before transfer.');
    blockers.push('Handover note needs a little more detail before transfer.');
    blockerDetails.push({
      field: 'handoverComplete',
      note: 'Handover note needs a little more detail before transfer.'
    });
  } else {
    reasons.push('Handover note still needs work.');
    blockers.push('Handover note still needs work.');
    blockerDetails.push({
      field: 'handoverComplete',
      note: 'Handover note still needs work.'
    });
  }

  if (completedPercent < 100) {
    blockerDetails.unshift({
      field: 'handoverComplete',
      note: `Handover is ${completedPercent}% complete.`
    });
    blockers.unshift(`Handover is ${completedPercent}% complete.`);
  }

  return buildSignal({
    patient,
    signalType: 'handover_completeness',
    label: 'Handover completeness',
    score,
    category: categorizeScore(score, {
      readyLabel: 'ready',
      reviewLabel: 'handover cue',
      gapLabel: 'handover cue',
      readyThreshold: 95,
      reviewThreshold: 70
    }),
    reasons,
    sourceFields,
    blockers,
    blockerDetails
  });
}

function createEscalationReadinessSignal(patient, safetyFlag) {
  const reasons = [];
  const missingFields = [];
  const missingFieldDetails = [];
  const sourceFields = [
    'sbar.assessment',
    'sbar.recommendation',
    'currentState',
    'responseHistory',
    'news2',
    'escalation',
    'safetyFlag.level'
  ];
  let score = 45;
  const assessment = normaliseText(patient.sbar?.assessment);
  const recommendation = normaliseText(patient.sbar?.recommendation);
  const currentState = normaliseList(patient.currentState);
  const responseHistory = normaliseList(patient.responseHistory);

  if (assessment) {
    score += 15;
    reasons.push('Assessment is visible in SBAR.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: assessment is not visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'sbar.assessment',
      'Escalation cue: assessment is not visible.'
    );
  }

  if (currentState.length > 0) {
    score += 15;
    reasons.push('Current state is visible for escalation review.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: current state is not visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'currentState',
      'Escalation cue: current state is not visible.'
    );
  }

  if (responseHistory.length > 0) {
    score += 10;
    reasons.push('Response history is visible.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: no response history is visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'responseHistory',
      'Escalation cue: no response history is visible.'
    );
  }

  if (recommendation) {
    score += 10;
    reasons.push('A clear recommendation is visible.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: a clear recommendation is not visible.');
    addMissingField(
      missingFields,
      missingFieldDetails,
      'sbar.recommendation',
      'Escalation cue: a clear recommendation is not visible.'
    );
  }

  if (Number(patient.news2 ?? 0) >= 5) {
    score += 10;
    reasons.push(`Escalation cue: NEWS2 ${Number(patient.news2)} is visible.`);
  }

  if (patient.escalation === 'Monitoring') {
    score += 10;
    reasons.push('Escalation is already under monitoring in the simulation.');
  } else if (patient.escalation === 'Active') {
    score += 20;
    reasons.push('Escalation is already active in the simulation.');
  }

  if (safetyFlag?.level && safetyFlag.level !== 'none') {
    score += 5;
    reasons.push('Escalation readiness is strengthened by the visible safety flag.');
  }

  return buildSignal({
    patient,
    signalType: 'escalation_readiness',
    label: 'Escalation readiness',
    score,
    category: categorizeScore(score, {
      readyLabel: 'escalation readiness',
      reviewLabel: 'review suggested',
      gapLabel: 'documentation gap',
      readyThreshold: 80,
      reviewThreshold: 55
    }),
    reasons,
    sourceFields,
    missingFields,
    missingFieldDetails
  });
}

function createDischargeReadinessSignal(patient) {
  const blockers = normaliseList(patient.dischargeBlockers);
  const openTasks = normaliseTasks(patient.tasks);
  const handoverComplete = clampScore(Number(patient.handoverComplete ?? 0));
  const sourceFields = ['dischargeReady', 'dischargeBlockers', 'tasks', 'handoverComplete'];
  const blockerDetails = [];
  const reasons = [];
  let score = patient.dischargeReady ? 100 : 70;

  if (patient.dischargeReady) {
    reasons.push('Discharge is marked ready in the simulation.');
  } else {
    reasons.push('Discharge is not yet marked ready in the simulation.');
  }

  if (blockers.length > 0) {
    score -= blockers.length * 25;
    const blockerText = `Discharge blocker: ${blockers.join('; ')}.`;
    reasons.push(blockerText);
    blockers.forEach((blocker, index) => {
      blockerDetails.push({
        field: `dischargeBlockers[${index}]`,
        note: blocker
      });
    });
  } else {
    reasons.push('No discharge blockers are listed.');
  }

  if (openTasks.length > 0) {
    const openTaskText = `Discharge blocker: ${describeCount(openTasks.length, 'open task', 'open tasks')} remain.`;
    score -= Math.min(openTasks.length * 10, 30);
    reasons.push(openTaskText);
    blockers.push(openTaskText);
    blockerDetails.push({
      field: 'tasks',
      note: openTaskText
    });
  }

  if (handoverComplete < 100) {
    score -= 15;
    const handoverText = 'Discharge blocker: handover is not fully complete.';
    reasons.push(handoverText);
    blockers.push(handoverText);
    blockerDetails.push({
      field: 'handoverComplete',
      note: 'Handover is not fully complete.'
    });
  }

  return buildSignal({
    patient,
    signalType: 'discharge_readiness',
    label: 'Discharge readiness blockers',
    score,
    category: categorizeScore(score, {
      readyLabel: 'ready',
      reviewLabel: 'review suggested',
      gapLabel: 'discharge blocker',
      readyThreshold: 90,
      reviewThreshold: 60
    }),
    reasons,
    sourceFields,
    blockers,
    blockerDetails
  });
}

function buildSignal({
  patient,
  signalType,
  label,
  score,
  category,
  reasons,
  sourceFields = [],
  missingFields = [],
  missingFieldDetails = [],
  blockers = [],
  blockerDetails = []
}) {
  const signal = {
    signalId: `${slugify(patient.id ?? 'unknown')}-${signalType}`,
    signalType,
    label,
    score: clampScore(score),
    status: category,
    category,
    reasons: [...reasons]
  };

  if (sourceFields.length > 0) {
    signal.sourceFields = [...sourceFields];
  }
  if (missingFields.length > 0) {
    signal.missingFields = [...missingFields];
  }
  if (missingFieldDetails.length > 0) {
    signal.missingFieldDetails = [...missingFieldDetails];
  }
  if (blockers.length > 0) {
    signal.blockers = [...blockers];
  }
  if (blockerDetails.length > 0) {
    signal.blockerDetails = [...blockerDetails];
  }

  return signal;
}

function emptySignal(signalType, label) {
  return {
    signalId: `unknown-${signalType}`,
    signalType,
    label,
    status: 'review suggested',
    category: 'review suggested',
    score: 0,
    reasons: ['No fictional patient was supplied.'],
    sourceFields: []
  };
}

function addMissingField(missingFields, missingFieldDetails, field, note) {
  missingFields.push(field);
  missingFieldDetails.push({ field, note });
}

function categorizeSummaryScore(score) {
  if (score >= 80) return 'ready';
  if (score >= 45) return 'review suggested';
  return 'documentation gap';
}

function categorizeScore(score, {
  readyLabel,
  reviewLabel,
  gapLabel,
  readyThreshold,
  reviewThreshold
}) {
  if (score >= readyThreshold) return readyLabel;
  if (score >= reviewThreshold) return reviewLabel;
  return gapLabel;
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normaliseText(value) {
  return String(value ?? '').trim();
}

function normaliseList(value) {
  return Array.isArray(value) ? value.filter((item) => String(item ?? '').trim() !== '') : [];
}

function normaliseTasks(tasks) {
  return normaliseList(tasks).filter((task) => task?.status !== 'Done');
}

function describeCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function describeVisibility(count, singular, plural = `${singular}s`) {
  return `${describeCount(count, singular, plural)} ${count === 1 ? 'is' : 'are'} visible.`;
}

function resolveIdentifier(value) {
  if (value == null || value === '') return null;
  return String(value);
}

function slugify(value) {
  return String(value ?? 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}
