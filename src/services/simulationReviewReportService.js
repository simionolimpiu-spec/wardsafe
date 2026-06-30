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

function cleanExportText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatSummaryCard(card) {
  const label = cleanExportText(card?.label);
  const value = cleanExportText(card?.value);
  const detail = cleanExportText(card?.detail);

  if (label && value && detail) {
    return `${label}: ${value} (${detail})`;
  }

  if (label && value) {
    return `${label}: ${value}`;
  }

  if (label && detail) {
    return `${label}: ${detail}`;
  }

  return value || detail || label;
}

function formatCueExportBlock(cue, index) {
  const category = cleanExportText(cue?.categoryLabel);
  const priority = cleanExportText(cue?.priorityLabel);
  const title = cleanExportText(cue?.title) || 'Simulation cue';
  const headerParts = [category, priority].filter(Boolean);
  const lines = [`${index + 1}. ${headerParts.length > 0 ? headerParts.join(' / ') : 'Cue'}: ${title}`];

  const explanation = cleanExportText(cue?.explanation);
  if (explanation) {
    lines.push(`  ${explanation}`);
  }

  const evidenceLabels = Array.isArray(cue?.evidenceLabels) ? cue.evidenceLabels.map(cleanExportText).filter(Boolean) : [];
  if (evidenceLabels.length > 0) {
    lines.push(`  Evidence: ${evidenceLabels.join('; ')}`);
  }

  const freshnessLabel = cleanExportText(cue?.freshnessLabel);
  if (freshnessLabel) {
    lines.push(`  Freshness: ${freshnessLabel}`);
  }

  const missingDataNotes = Array.isArray(cue?.missingDataNotes) ? cue.missingDataNotes.map(cleanExportText).filter(Boolean) : [];
  if (missingDataNotes.length > 0) {
    lines.push(`  Missing data: ${missingDataNotes.join('; ')}`);
  }

  const humanReviewAction = cleanExportText(cue?.humanReviewAction);
  if (humanReviewAction) {
    lines.push(`  Human review required: ${humanReviewAction}`);
  }

  return lines.join('\n');
}

function appendExportSection(blocks, title, entries) {
  const lines = Array.isArray(entries) ? entries.map(cleanExportText).filter(Boolean) : [];

  if (lines.length === 0) {
    return;
  }

  blocks.push(title);

  for (const line of lines) {
    blocks.push(`- ${line}`);
  }

  blocks.push('');
}

export function getSimulationReviewReportSnapshot({
  patient,
  reviewSignals = [],
  hospitalInsights = getHospitalInsightsSnapshot(),
  signalSnapshot = null,
  selectedScenario = null
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
      'Human review required. Clinical judgement remains central. This report is for simulation-only review and must not be used for patient care.',
    selectedScenario: selectedScenario
      ? {
          id: cleanExportText(selectedScenario.id),
          label: cleanExportText(selectedScenario.label),
          description: cleanExportText(selectedScenario.description),
          currentWardName: cleanExportText(selectedScenario.currentWardName)
        }
      : null
  };
}

export function buildSimulationReviewReportExportText(snapshot) {
  if (!snapshot) {
    return '';
  }

  const blocks = [];
  const title = cleanExportText(snapshot.title) || 'SafeFlow Simulation Review Report';
  blocks.push(title, '');

  appendExportSection(blocks, 'Simulation boundary statement', [
    'Simulation data only. Not connected to live NHS systems. Not for patient care.',
    'This report does not provide diagnosis, treatment advice, risk prediction, or automated escalation.',
    'All review cues and comparison signals require human review.',
    'Prepared for ward managers, clinical educators, digital safety leads, and innovation teams.',
    cleanExportText(snapshot.disclaimer),
    cleanExportText(snapshot.boundaryDetail),
    cleanExportText(snapshot.prototypeNote)
  ]);

  appendExportSection(blocks, 'Selected demo scenario', [
    cleanExportText(snapshot.selectedScenario?.label) || 'Demo scenario',
    cleanExportText(snapshot.selectedScenario?.description),
    cleanExportText(snapshot.selectedScenario?.currentWardName)
      ? `Ward context: ${cleanExportText(snapshot.selectedScenario.currentWardName)}`
      : ''
  ]);

  appendExportSection(
    blocks,
    'Simulated patient context',
    Array.isArray(snapshot.patientSummaryCards) ? snapshot.patientSummaryCards.map(formatSummaryCard) : []
  );

  appendExportSection(
    blocks,
    'Active patient-level review cues',
    Array.isArray(snapshot.activeReviewCues) && snapshot.activeReviewCues.length > 0
      ? snapshot.activeReviewCues.map(formatCueExportBlock)
      : ['No active patient-level review cues in this simulation snapshot.']
  );

  appendExportSection(blocks, 'Ward comparison / Hospital Insights summary', [
    ...(Array.isArray(snapshot.wardComparisonSummaryCards) ? snapshot.wardComparisonSummaryCards.map(formatSummaryCard) : []),
    ...(Array.isArray(snapshot.wardComparisonRows)
      ? snapshot.wardComparisonRows.map((row) =>
          `${cleanExportText(row?.label)}: current ward ${cleanExportText(row?.currentLabel)}; hospital average ${cleanExportText(row?.hospitalAverageLabel)}; comparison signal ${cleanExportText(row?.comparisonSignal)}`
        )
      : [])
  ]);

  appendExportSection(
    blocks,
    'Learning and reflection points',
    Array.isArray(snapshot.learningPoints) ? snapshot.learningPoints : []
  );

  appendExportSection(blocks, 'Human review note', [
    cleanExportText(snapshot.humanReviewNote),
    'All review cues and comparison signals require human review.'
  ]);

  appendExportSection(blocks, 'Future roadmap note', [cleanExportText(snapshot.roadmapLine)]);

  return blocks.join('\n').trim();
}
