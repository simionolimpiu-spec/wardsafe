const SIMULATION_RISK_SUPPORT_VERSION = 'simulation-risk-support-v0';
const DEFAULT_BOUNDARY = 'Simulation-only support for fictional patient journeys; human review required.';

export function createSimulationRiskSupport({ patient, safetyFlag = null } = {}) {
  if (!patient) {
    return {
      patientId: null,
      version: SIMULATION_RISK_SUPPORT_VERSION,
      simulationOnly: true,
      boundary: DEFAULT_BOUNDARY,
      summary: {
        score: 0,
        category: 'review suggested',
        reasons: ['No fictional patient was supplied.']
      },
      signals: []
    };
  }

  const documentationQuality = createDocumentationQualitySignal(patient, safetyFlag);
  const handoverCompleteness = createHandoverCompletenessSignal(patient);
  const escalationReadiness = createEscalationReadinessSignal(patient, safetyFlag);
  const dischargeReadiness = createDischargeReadinessSignal(patient);
  const signals = [
    documentationQuality,
    handoverCompleteness,
    escalationReadiness,
    dischargeReadiness
  ];
  const summaryScore = Math.round(
    signals.reduce((total, signal) => total + signal.score, 0) / signals.length
  );
  const summaryReasons = signals
    .filter((signal) => signal.category !== 'ready')
    .map((signal) => `${signal.label}: ${signal.category}`);

  return {
    patientId: String(patient.id ?? 'unknown'),
    version: SIMULATION_RISK_SUPPORT_VERSION,
    simulationOnly: true,
    boundary: DEFAULT_BOUNDARY,
    summary: {
      score: summaryScore,
      category: categorizeSummaryScore(summaryScore),
      reasons: summaryReasons.length > 0
        ? summaryReasons
        : ['All simulated support signals are ready.']
    },
    signals
  };
}

function createDocumentationQualitySignal(patient, safetyFlag) {
  const reasons = [];
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
  }

  if (recommendation) {
    reasons.push('SBAR recommendation is visible.');
  } else {
    score -= 20;
    reasons.push('Documentation gap: SBAR recommendation is missing.');
  }

  if (currentState.length > 0) {
    reasons.push(describeVisibility(currentState.length, 'current state item', 'current state items'));
  } else {
    score -= 15;
    reasons.push('Documentation gap: current state is not visible.');
  }

  if (auditTrail.length > 0) {
    reasons.push(describeVisibility(auditTrail.length, 'audit trail entry', 'audit trail entries'));
  } else {
    score -= 10;
    reasons.push('Documentation gap: no audit trail entries are visible.');
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
  }

  if (safetyFlag?.level && safetyFlag.level !== 'none') {
    score -= 5;
    reasons.push(`Documentation gap: a simulation safety flag is visible - ${safetyFlag.title}.`);
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
    reasons
  });
}

function createHandoverCompletenessSignal(patient) {
  const completedPercent = clampScore(Number(patient.handoverComplete ?? 0));
  const openTasks = normaliseTasks(patient.tasks);
  const score = clampScore(completedPercent - (openTasks.length * 5));
  const reasons = [
    `Handover is ${completedPercent}% complete.`
  ];

  if (openTasks.length > 0) {
    reasons.push(`Handover cue: ${describeCount(openTasks.length, 'open task', 'open tasks')} remain before transfer of responsibility.`);
  } else {
    reasons.push('Handover cue: no open tasks remain.');
  }

  if (completedPercent === 100 && openTasks.length === 0) {
    reasons.push('Handover summary is fully prepared.');
  } else if (completedPercent >= 75) {
    reasons.push('Handover note needs a little more detail before transfer.');
  } else {
    reasons.push('Handover note still needs work.');
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
    reasons
  });
}

function createEscalationReadinessSignal(patient, safetyFlag) {
  const reasons = [];
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
  }

  if (currentState.length > 0) {
    score += 15;
    reasons.push('Current state is visible for escalation review.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: current state is not visible.');
  }

  if (responseHistory.length > 0) {
    score += 10;
    reasons.push('Response history is visible.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: no response history is visible.');
  }

  if (recommendation) {
    score += 10;
    reasons.push('A clear recommendation is visible.');
  } else {
    score -= 10;
    reasons.push('Escalation cue: a clear recommendation is not visible.');
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
    reasons
  });
}

function createDischargeReadinessSignal(patient) {
  const blockers = normaliseList(patient.dischargeBlockers);
  const openTasks = normaliseTasks(patient.tasks);
  const handoverComplete = clampScore(Number(patient.handoverComplete ?? 0));
  let score = patient.dischargeReady ? 100 : 70;
  const reasons = [];

  if (patient.dischargeReady) {
    reasons.push('Discharge is marked ready in the simulation.');
  } else {
    reasons.push('Discharge is not yet marked ready in the simulation.');
  }

  if (blockers.length > 0) {
    score -= blockers.length * 25;
    reasons.push(`Discharge blocker: ${blockers.join('; ')}.`);
  } else {
    reasons.push('No discharge blockers are listed.');
  }

  if (openTasks.length > 0) {
    score -= Math.min(openTasks.length * 10, 30);
    reasons.push(`Discharge blocker: ${describeCount(openTasks.length, 'open task', 'open tasks')} remain.`);
  }

  if (handoverComplete < 100) {
    score -= 15;
    reasons.push('Discharge blocker: handover is not fully complete.');
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
    blockers
  });
}

function buildSignal({ patient, signalType, label, score, category, reasons, blockers = [] }) {
  return {
    signalId: `${String(patient.id ?? 'unknown').toLowerCase()}-${signalType}`,
    signalType,
    label,
    score: clampScore(score),
    category,
    reasons,
    ...(blockers.length > 0 ? { blockers } : {})
  };
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
