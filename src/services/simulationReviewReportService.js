import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';

const SUMMARY_ROW_KEYS = [
  'documentationCompleteness',
  'handoverCompleteness',
  'medicationReviewCueCompletion',
  'outstandingReviewCues'
];

function formatPercentageValue(value) {
  return `${Math.round(value)}%`;
}

function formatSignalCategory(category) {
  const labels = {
    documentation: 'Documentation',
    'electrolyte-review': 'Electrolyte review',
    'infection-review': 'Infection review',
    escalation: 'Escalation',
    handover: 'Handover',
    discharge: 'Discharge',
    learning: 'Learning',
    'simulation-fallback': 'Fallback'
  };

  return labels[category] ?? 'Simulation cue';
}

function formatSignalPriority(priority) {
  const labels = {
    blocker: 'Blocker',
    review: 'Review',
    watch: 'Watch',
    learning: 'Learning'
  };

  return labels[priority] ?? 'Review';
}

function describeComparisonSignal(row) {
  const delta = row.deltaFromAverage ?? 0;
  if (Math.abs(delta) < 0.5) {
    return 'Close to the hospital average';
  }

  if (row.higherIsBetter) {
    return delta > 0 ? 'Above the hospital average' : 'Below the hospital average';
  }

  return delta > 0 ? 'More open cues than the hospital average' : 'Fewer open cues than the hospital average';
}

function buildPatientSummaryCards(patient, reviewSignals) {
  const cueCount = Array.isArray(reviewSignals) ? reviewSignals.length : 0;

  return [
    {
      label: 'Current patient',
      value: patient.id,
      detail: `${patient.name} · ${patient.age} years`
    },
    {
      label: 'Risk context',
      value: `${patient.risk} risk`,
      detail: patient.escalation === 'Active' ? 'Active escalation' : 'No active escalation'
    },
    {
      label: 'Clinical snapshot',
      value: `NEWS2 ${patient.news2}`,
      detail: patient.nextAction || 'Simulation review cue'
    },
    {
      label: 'Documentation snapshot',
      value: `${formatPercentageValue(patient.handoverComplete)} handover`,
      detail: patient.dischargeReady ? 'Discharge ready' : 'Review required'
    },
    {
      label: 'Active review cues',
      value: `${cueCount} cues`,
      detail: 'Human review required'
    }
  ];
}

function buildActiveReviewCueCards(reviewSignals) {
  return (Array.isArray(reviewSignals) ? reviewSignals : []).map((signal) => ({
    id: signal.id,
    categoryLabel: formatSignalCategory(signal.category),
    priorityLabel: formatSignalPriority(signal.priority),
    title: signal.title,
    explanation: signal.explanation,
    evidenceLabels: Array.isArray(signal.evidence)
      ? signal.evidence
          .map((entry) => (typeof entry?.label === 'string' ? entry.label.trim() : String(entry ?? '').trim()))
          .filter(Boolean)
      : [],
    humanReviewAction: signal.suggestedHumanReviewAction || 'Human review required.',
    freshnessLabel: signal.freshness?.label ?? '',
    missingDataNotes: Array.isArray(signal.missingDataNotes) ? signal.missingDataNotes : []
  }));
}

function buildWardComparisonRows(hospitalInsights) {
  return hospitalInsights.comparisonRows
    .filter((row) => SUMMARY_ROW_KEYS.includes(row.key))
    .map((row) => ({
      key: row.key,
      label: row.label,
      description: row.description,
      currentLabel: row.currentLabel,
      hospitalAverageLabel: row.hospitalAverageLabel,
      comparisonSignal: describeComparisonSignal(row)
    }));
}

function buildLearningPoints(reviewSignals, hospitalInsights) {
  const cueCount = Array.isArray(reviewSignals) ? reviewSignals.length : 0;
  const firstCueLabel = cueCount > 0 ? `The report starts with ${cueCount} review cue${cueCount === 1 ? '' : 's'} from the patient view.` : 'The report starts with the patient view so reviewers can see the current simulation state.';

  return [
    'This prototype demonstrates how structured digital documentation and ward-level comparison could support learning, quality improvement, and human-led review.',
    firstCueLabel,
    'Use the ward comparison snapshot to discuss pattern, context, and documentation quality rather than to make clinical decisions.',
    hospitalInsights.insightCues[0] ?? 'Comparison cues remain simulation-only and require human review.'
  ];
}

function buildInterpretationCues(reviewSignals, hospitalInsights) {
  const cueCount = Array.isArray(reviewSignals) ? reviewSignals.length : 0;
  const leadCue = cueCount > 0
    ? `The current patient view shows ${cueCount} active review cue${cueCount === 1 ? '' : 's'} for human discussion.`
    : 'The current patient view shows no active review cues in the simulation snapshot.';

  return [
    leadCue,
    ...hospitalInsights.insightCues.slice(0, 3)
  ];
}

export function getSimulationReviewReportSnapshot({
  patient,
  reviewSignals = [],
  hospitalInsights = getHospitalInsightsSnapshot(),
  signalSnapshot = null
} = {}) {
  if (!patient) {
    return null;
  }

  const safeHospitalInsights = hospitalInsights ?? getHospitalInsightsSnapshot();
  const sourceStatus = safeHospitalInsights.sourceStatus ?? getHospitalInsightsSnapshot().sourceStatus;
  const patientSummaryCards = buildPatientSummaryCards(patient, reviewSignals);
  const activeReviewCues = buildActiveReviewCueCards(reviewSignals);
  const wardComparisonSummaryCards = safeHospitalInsights.summaryCards ?? [];
  const wardComparisonRows = buildWardComparisonRows(safeHospitalInsights);
  const interpretationCues = buildInterpretationCues(reviewSignals, safeHospitalInsights);
  const learningPoints = buildLearningPoints(reviewSignals, safeHospitalInsights);

  return {
    title: 'SafeFlow Simulation Review Report',
    disclaimer:
      'Simulation data only. This report is not connected to live NHS systems and must not be used for patient care.',
    boundaryDetail:
      'No real NHS data is used. No live NHS systems are connected. No patient-identifiable information is used.',
    roadmapLine: 'Patient view -> review cues -> ward comparison -> hospital insights -> learning summary',
    prototypeNote:
      'This prototype demonstrates how structured digital documentation and ward-level comparison could support learning, quality improvement, and human-led review.',
    sourceStatus,
    sourceLabel: signalSnapshot?.sourceFreshness?.label ?? 'Simulation source only',
    patientSummaryCards,
    activeReviewCues,
    wardComparisonSummaryCards,
    wardComparisonRows,
    interpretationCues,
    learningPoints,
    humanReviewNote:
      'Human review required. Clinical judgement remains central. This report is for simulation-only review and must not be used for patient care.'
  };
}
