const DEFAULT_HOSPITAL_NAME = 'Cityview Community Hospital';
const DEFAULT_WARD_NAME = 'Day Care Unit';

const SOURCE_STATUS = {
  sourceType: 'simulation',
  connectedToLiveSystems: false,
  containsPatientData: false,
  lastUpdatedLabel: 'Static prototype data'
};

const metricDefinitions = [
  {
    key: 'documentationCompleteness',
    label: 'Documentation completeness',
    description: 'Assessment, review and plan notes present',
    unit: '%',
    higherIsBetter: true
  },
  {
    key: 'news2EscalationDocumentation',
    label: 'NEWS2 escalation documentation',
    description: 'Escalation cue recorded and traceable',
    unit: '%',
    higherIsBetter: true
  },
  {
    key: 'handoverCompleteness',
    label: 'Handover completeness',
    description: 'Structured handover elements documented',
    unit: '%',
    higherIsBetter: true
  },
  {
    key: 'medicationReviewCueCompletion',
    label: 'Medication review cue completion',
    description: 'Medication review cues closed or assigned',
    unit: '%',
    higherIsBetter: true
  },
  {
    key: 'dischargeReadinessDocumentation',
    label: 'Discharge readiness documentation',
    description: 'Discharge blockers and readiness notes recorded',
    unit: '%',
    higherIsBetter: true
  },
  {
    key: 'outstandingReviewCues',
    label: 'Outstanding review cues',
    description: 'Open cues still requiring human review',
    unit: 'cues',
    higherIsBetter: false
  }
];

const wardBenchmarks = [
  {
    wardName: 'Day Care Unit',
    documentationCompleteness: 77,
    news2EscalationDocumentation: 63,
    handoverCompleteness: 68,
    medicationReviewCueCompletion: 82,
    dischargeReadinessDocumentation: 70,
    outstandingReviewCues: 6
  },
  {
    wardName: 'Acute Assessment Unit',
    documentationCompleteness: 74,
    news2EscalationDocumentation: 71,
    handoverCompleteness: 72,
    medicationReviewCueCompletion: 78,
    dischargeReadinessDocumentation: 69,
    outstandingReviewCues: 5
  },
  {
    wardName: 'Respiratory Short Stay',
    documentationCompleteness: 85,
    news2EscalationDocumentation: 79,
    handoverCompleteness: 84,
    medicationReviewCueCompletion: 87,
    dischargeReadinessDocumentation: 82,
    outstandingReviewCues: 2
  },
  {
    wardName: 'General Medicine',
    documentationCompleteness: 71,
    news2EscalationDocumentation: 60,
    handoverCompleteness: 64,
    medicationReviewCueCompletion: 73,
    dischargeReadinessDocumentation: 61,
    outstandingReviewCues: 8
  },
  {
    wardName: 'Surgical Day Unit',
    documentationCompleteness: 79,
    news2EscalationDocumentation: 74,
    handoverCompleteness: 76,
    medicationReviewCueCompletion: 80,
    dischargeReadinessDocumentation: 75,
    outstandingReviewCues: 4
  },
  {
    wardName: 'Frailty Unit',
    documentationCompleteness: 73,
    news2EscalationDocumentation: 66,
    handoverCompleteness: 67,
    medicationReviewCueCompletion: 75,
    dischargeReadinessDocumentation: 68,
    outstandingReviewCues: 7
  }
];

const reviewAverageMetricKeys = metricDefinitions
  .filter((metric) => metric.unit === '%')
  .map((metric) => metric.key);

function cloneWard(ward) {
  return { ...ward };
}

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatMetricValue(metric, value) {
  if (metric.unit === '%') {
    return `${Math.round(value)}%`;
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)} cues`;
}

function getExtremeWard(wards, metric, pickHighest) {
  return wards.reduce((bestWard, ward) => {
    if (!bestWard) return ward;

    const wardValue = ward[metric.key];
    const bestValue = bestWard[metric.key];
    return pickHighest
      ? wardValue > bestValue
        ? ward
        : bestWard
      : wardValue < bestValue
        ? ward
        : bestWard;
  }, null);
}

function getReviewAverage(ward) {
  return mean(reviewAverageMetricKeys.map((key) => ward[key]));
}

function createMetricComparison(metric, wards, currentWard) {
  const values = wards.map((ward) => ward[metric.key]);
  const hospitalAverage = mean(values);
  const bestWard = getExtremeWard(wards, metric, metric.higherIsBetter);
  const lowestWard = getExtremeWard(wards, metric, !metric.higherIsBetter);

  return {
    key: metric.key,
    label: metric.label,
    description: metric.description,
    unit: metric.unit,
    higherIsBetter: metric.higherIsBetter,
    currentValue: currentWard[metric.key],
    hospitalAverage,
    bestWardName: bestWard.wardName,
    bestValue: bestWard[metric.key],
    lowestWardName: lowestWard.wardName,
    lowestValue: lowestWard[metric.key],
    deltaFromAverage: currentWard[metric.key] - hospitalAverage,
    currentLabel: formatMetricValue(metric, currentWard[metric.key]),
    hospitalAverageLabel: formatMetricValue(metric, hospitalAverage),
    bestLabel: formatMetricValue(metric, bestWard[metric.key]),
    lowestLabel: formatMetricValue(metric, lowestWard[metric.key])
  };
}

function buildComparisonRows(currentWard) {
  return metricDefinitions.map((metric) => createMetricComparison(metric, wardBenchmarks, currentWard));
}

function buildReviewSummaries() {
  return wardBenchmarks.map((ward) => ({
    wardName: ward.wardName,
    reviewAverage: getReviewAverage(ward)
  }));
}

function createInsightCues(comparisonMetrics, currentReviewAverage, hospitalReviewAverage, bestReviewAverage) {
  const cues = [];
  const handoverMetric = comparisonMetrics.find((metric) => metric.key === 'handoverCompleteness');
  const medicationMetric = comparisonMetrics.find((metric) => metric.key === 'medicationReviewCueCompletion');
  const dischargeMetric = comparisonMetrics.find((metric) => metric.key === 'dischargeReadinessDocumentation');
  const cuesMetric = comparisonMetrics.find((metric) => metric.key === 'outstandingReviewCues');

  if (handoverMetric && handoverMetric.currentValue < handoverMetric.hospitalAverage) {
    cues.push('Handover completeness is below the hospital simulation average.');
  }

  if (medicationMetric && medicationMetric.currentValue > medicationMetric.hospitalAverage) {
    cues.push('Medication review cue completion is higher than the hospital simulation average.');
  }

  if (dischargeMetric && dischargeMetric.currentValue <= dischargeMetric.hospitalAverage) {
    cues.push('Discharge readiness documentation is close to the hospital simulation average.');
  }

  if (cuesMetric && cuesMetric.currentValue > cuesMetric.hospitalAverage) {
    cues.push('Outstanding review cues are above the hospital simulation average.');
  }

  cues.push(
    `The current ward review average is ${Math.round(currentReviewAverage)}% compared with the hospital simulation average of ${Math.round(hospitalReviewAverage)}%.`
  );
  cues.push(
    `The best fictional ward in this snapshot is ${bestReviewAverage.wardName} at ${Math.round(bestReviewAverage.reviewAverage)}%.`
  );
  cues.push('This is a comparison cue only and requires human review.');

  return cues;
}

export function getHospitalInsightsSourceStatus() {
  return { ...SOURCE_STATUS };
}

export function getWardBenchmarkSnapshot({ currentWardName = DEFAULT_WARD_NAME } = {}) {
  const currentWard = wardBenchmarks.find((ward) => ward.wardName === currentWardName) ?? wardBenchmarks[0];
  const comparisonRows = buildComparisonRows(currentWard);
  const reviewSummaries = buildReviewSummaries();
  const currentReviewAverage = getReviewAverage(currentWard);
  const hospitalReviewAverage = mean(reviewSummaries.map((summary) => summary.reviewAverage));
  const bestReviewAverage = reviewSummaries.reduce((best, summary) =>
    summary.reviewAverage > best.reviewAverage ? summary : best
  );
  const lowestReviewAverage = reviewSummaries.reduce((lowest, summary) =>
    summary.reviewAverage < lowest.reviewAverage ? summary : lowest
  );

  return {
    sourceStatus: getHospitalInsightsSourceStatus(),
    hospitalName: DEFAULT_HOSPITAL_NAME,
    currentWardName: currentWard.wardName,
    wardCount: wardBenchmarks.length,
    currentWard: cloneWard(currentWard),
    wardBenchmarks: wardBenchmarks.map(cloneWard),
    comparisonRows,
    chartMetrics: comparisonRows.filter((metric) => metric.unit === '%'),
    reviewSummaries,
    currentReviewAverage,
    hospitalReviewAverage,
    bestReviewAverage,
    lowestReviewAverage
  };
}

export function getHospitalInsightsSnapshot({
  currentWardName = DEFAULT_WARD_NAME,
  hospitalName = DEFAULT_HOSPITAL_NAME
} = {}) {
  const benchmarkSnapshot = getWardBenchmarkSnapshot({ currentWardName });
  const currentWard = benchmarkSnapshot.currentWard;

  return {
    hospitalName,
    currentWardName: benchmarkSnapshot.currentWardName,
    wardCount: benchmarkSnapshot.wardCount,
    sourceStatus: benchmarkSnapshot.sourceStatus,
    generatedAt: benchmarkSnapshot.sourceStatus.lastUpdatedLabel,
    introLine:
      'Simulation comparison cues for ward-level review. This prototype uses mock data only and is not connected to live NHS systems.',
    roadmapLine: 'Patient view -> review cues -> ward comparison -> hospital insights -> future NHS/AWS integration',
    boundaryNote: 'Simulation only. Fictional ward benchmark data. Human review required.',
    summaryCards: [
      {
        variant: 'current',
        label: 'Current ward review average',
        value: `${Math.round(benchmarkSnapshot.currentReviewAverage)}%`,
        detail: benchmarkSnapshot.currentWardName
      },
      {
        variant: 'average',
        label: 'Hospital simulation average',
        value: `${Math.round(benchmarkSnapshot.hospitalReviewAverage)}%`,
        detail: `${benchmarkSnapshot.wardCount} fictional wards`
      },
      {
        variant: 'best',
        label: 'Best fictional ward',
        value: benchmarkSnapshot.bestReviewAverage.wardName,
        detail: `${Math.round(benchmarkSnapshot.bestReviewAverage.reviewAverage)}% review average`
      },
      {
        variant: 'lowest',
        label: 'Lowest fictional ward',
        value: benchmarkSnapshot.lowestReviewAverage.wardName,
        detail: `${Math.round(benchmarkSnapshot.lowestReviewAverage.reviewAverage)}% review average`
      },
      {
        variant: 'cues',
        label: 'Outstanding review cues',
        value: formatMetricValue(
          metricDefinitions.find((metric) => metric.key === 'outstandingReviewCues'),
          currentWard.outstandingReviewCues
        ),
        detail: 'Current ward open cues'
      }
    ],
    chartMetrics: benchmarkSnapshot.chartMetrics,
    comparisonRows: benchmarkSnapshot.comparisonRows,
    insightCues: createInsightCues(
      benchmarkSnapshot.comparisonRows,
      benchmarkSnapshot.currentReviewAverage,
      benchmarkSnapshot.hospitalReviewAverage,
      benchmarkSnapshot.bestReviewAverage
    )
  };
}
