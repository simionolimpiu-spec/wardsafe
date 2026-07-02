import modelData from '../data/patientJourneyTrendModel.json';

const DEFAULT_TREND_POINT_COUNT = 5;
const DEFAULT_TREND_INTERVAL_MINUTES = 15;

const SIGNAL_CATEGORY_LABELS = {
  documentation: 'Documentation',
  'electrolyte-review': 'Electrolyte review',
  'infection-review': 'Infection review',
  escalation: 'Escalation',
  handover: 'Handover',
  discharge: 'Discharge',
  learning: 'Learning',
  'simulation-fallback': 'Fallback'
};

const SIGNAL_PRIORITY_LABELS = {
  blocker: 'Blocker',
  review: 'Review',
  watch: 'Watch',
  learning: 'Learning'
};

const CLOSING_STATUSES = new Set([
  'accepted',
  'actioned',
  'closed',
  'completed',
  'complete',
  'dismissed',
  'resolved'
]);

const TIER_ORDER = {
  blocker: 0,
  urgent: 1,
  review: 2,
  watch: 3,
  learning: 4
};

const TREND_EASING = {
  watch: [0, 0.35, 0.6, 0.82, 1],
  review: [0, 0.25, 0.5, 0.76, 1],
  urgent: [0, 0.15, 0.4, 0.7, 1]
};

const FALLBACK_RISK_TIER_THRESHOLDS = {
  watchUpper: 0.4,
  reviewUpper: 0.7
};

export function buildWardComparisonChartData(hospitalInsights = {}) {
  const metricRows = Array.isArray(hospitalInsights?.comparisonRows)
    ? hospitalInsights.comparisonRows.filter(isPlainObject).map((row, index) => normaliseComparisonRow(row, index))
    : [];

  const seriesRows = metricRows.flatMap((row) => [
    buildComparisonSeriesRow(row, 'currentWard', 'Current ward', row.currentValue, row.currentLabel, row.deltaFromAverage, 0),
    buildComparisonSeriesRow(row, 'hospitalAverage', 'Hospital average', row.hospitalAverage, row.hospitalAverageLabel, 0, 1)
  ]);

  return {
    title: 'Ward versus hospital average',
    xField: 'metricLabel',
    yField: 'value',
    seriesField: 'seriesLabel',
    metricRows,
    seriesRows,
    seriesLabels: [
      { key: 'currentWard', label: 'Current ward' },
      { key: 'hospitalAverage', label: 'Hospital average' }
    ]
  };
}

export function buildSimulatedRiskTrendChartData(trendSuggestion = {}, options = {}) {
  const pointCount = normalisePointCount(options.pointCount);
  const intervalMinutes = normaliseIntervalMinutes(options.intervalMinutes);
  const thresholds = normaliseRiskThresholds(modelData?.riskTierThresholds);
  const currentRiskScore = clamp01(toNumber(trendSuggestion?.riskScore, 0));
  const currentRiskTier = classifyRiskTier(currentRiskScore, thresholds);
  const suggestionRiskTier = normaliseRiskTier(trendSuggestion?.riskTier, currentRiskTier);
  const evidenceCount = Array.isArray(trendSuggestion?.evidence) ? trendSuggestion.evidence.length : 0;
  const missingDataCount = Array.isArray(trendSuggestion?.missingData) ? trendSuggestion.missingData.length : 0;
  const anchorTimestamp = parseTimestamp(trendSuggestion?.updatedAt ?? trendSuggestion?.createdAt);
  const trendTitle = safeText(trendSuggestion?.title, 'Simulated trend signal');
  const seriesLabel = 'Simulated risk score';
  const startRiskScore = computeStartingRiskScore(currentRiskScore, suggestionRiskTier, evidenceCount, missingDataCount);
  const ratios = buildTrendRatios(pointCount, suggestionRiskTier);

  const points = ratios.map((ratio, index) => {
    const timeOffsetMinutes = -intervalMinutes * (pointCount - 1 - index);
    const timestamp = anchorTimestamp == null
      ? null
      : new Date(anchorTimestamp + (timeOffsetMinutes * 60_000)).toISOString();
    const riskScore = roundTo(startRiskScore + ((currentRiskScore - startRiskScore) * ratio), 3);
    const pointRiskTier = classifyRiskTier(riskScore, thresholds);

    return {
      index,
      pointKey: `trend-point-${index + 1}`,
      seriesKey: 'simulated-risk',
      seriesLabel,
      timestamp,
      timeOffsetMinutes,
      timeLabel: timestamp ? timestamp.slice(11, 16) : `${Math.abs(timeOffsetMinutes)}m earlier`,
      pointLabel: index === pointCount - 1 ? 'Current' : `${Math.abs(timeOffsetMinutes)}m earlier`,
      riskScore,
      displayValue: `${Math.round(riskScore * 100)}%`,
      riskTier: pointRiskTier,
      riskTierLabel: formatRiskTierLabel(pointRiskTier)
    };
  });

  return {
    title: trendTitle,
    seriesLabel,
    xField: 'timestamp',
    yField: 'riskScore',
    seriesField: 'seriesLabel',
    pointCount: points.length,
    anchor: {
      suggestionId: safeText(trendSuggestion?.suggestionId, ''),
      syntheticPatientRef: safeText(trendSuggestion?.syntheticPatientRef, ''),
      timestamp: anchorTimestamp == null ? null : new Date(anchorTimestamp).toISOString(),
      riskScore: currentRiskScore,
      riskTier: suggestionRiskTier,
      evidenceCount,
      missingDataCount
    },
    thresholds: [
      { key: 'watch', label: 'Watch threshold', value: thresholds.watchUpper },
      { key: 'review', label: 'Review threshold', value: thresholds.reviewUpper }
    ],
    points
  };
}

export function buildOpenReviewCueBreakdown({ signals = [], suggestions = [] } = {}) {
  const openCueRows = [
    ...normaliseOpenSignals(signals),
    ...normaliseOpenSuggestions(suggestions)
  ].sort(compareOpenCueRows);

  const categoryBreakdown = buildBreakdown(openCueRows, 'categoryKey', 'categoryLabel');
  const tierBreakdown = buildBreakdown(openCueRows, 'tierKey', 'tierLabel', compareTierRows);
  const sourceBreakdown = buildBreakdown(openCueRows, 'sourceKey', 'sourceLabel');

  return {
    totalOpenCues: openCueRows.length,
    openCueRows,
    categoryBreakdown,
    tierBreakdown,
    sourceBreakdown
  };
}

function buildComparisonSeriesRow(row, seriesKey, seriesLabel, value, displayValue, deltaFromAverage, seriesIndex) {
  return {
    metricKey: row.metricKey,
    metricLabel: row.metricLabel,
    metricDescription: row.metricDescription,
    seriesKey,
    seriesLabel,
    seriesIndex,
    metricIndex: row.metricIndex,
    value,
    displayValue,
    unit: row.unit,
    higherIsBetter: row.higherIsBetter,
    deltaFromAverage,
    referenceValue: row.hospitalAverage,
    referenceLabel: row.hospitalAverageLabel,
    bestWardName: row.bestWardName,
    bestLabel: row.bestLabel,
    lowestWardName: row.lowestWardName,
    lowestLabel: row.lowestLabel
  };
}

function normaliseComparisonRow(row, index) {
  return {
    metricIndex: index,
    metricKey: safeText(row.key, `metric-${index + 1}`),
    metricLabel: safeText(row.label, `Metric ${index + 1}`),
    metricDescription: safeText(row.description, ''),
    unit: safeText(row.unit, ''),
    higherIsBetter: row.higherIsBetter !== false,
    currentValue: toNumber(row.currentValue, 0),
    hospitalAverage: toNumber(row.hospitalAverage, 0),
    deltaFromAverage: toNumber(row.deltaFromAverage, 0),
    currentLabel: safeText(row.currentLabel, ''),
    hospitalAverageLabel: safeText(row.hospitalAverageLabel, ''),
    bestWardName: safeText(row.bestWardName, ''),
    bestLabel: safeText(row.bestLabel, ''),
    lowestWardName: safeText(row.lowestWardName, ''),
    lowestLabel: safeText(row.lowestLabel, '')
  };
}

function normaliseOpenSignals(signals) {
  if (!Array.isArray(signals)) {
    return [];
  }

  return signals
    .filter((signal) => isPlainObject(signal) && signal.simulationOnly === true && signal.humanReviewRequired !== false && !isClosingStatus(signal.status))
    .map((signal) => ({
      id: safeText(signal.id ?? signal.signalId, ''),
      sourceKey: 'signal',
      sourceLabel: 'Signal',
      categoryKey: safeText(signal.category, 'signal'),
      categoryLabel: formatSignalCategory(signal.category),
      tierKey: safeText(signal.priority, 'review'),
      tierLabel: formatSignalPriority(signal.priority),
      title: safeText(signal.title, ''),
      status: safeText(signal.status, ''),
      valueLabel: safeText(signal.explanation, ''),
      evidenceCount: Array.isArray(signal.evidence) ? signal.evidence.length : 0,
      humanReviewRequired: signal.humanReviewRequired === true
    }));
}

function normaliseOpenSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions
    .filter((suggestion) => isPlainObject(suggestion) && suggestion.simulationOnly === true && suggestion.requiresHumanReview === true && !isClosingStatus(suggestion.status))
    .map((suggestion) => {
      const riskType = safeText(suggestion.riskType ?? suggestion.category, 'suggestion');
      const riskTier = safeText(suggestion.riskTier, 'review');

      return {
        id: safeText(suggestion.id ?? suggestion.suggestionId, ''),
        sourceKey: 'suggestion',
        sourceLabel: 'Suggestion',
        categoryKey: riskType,
        categoryLabel: humanizeIdentifier(riskType),
        tierKey: riskTier,
        tierLabel: formatRiskTierLabel(riskTier),
        title: safeText(suggestion.title, ''),
        status: safeText(suggestion.status, ''),
        valueLabel: safeText(suggestion.suggestedFlag, ''),
        evidenceCount: Array.isArray(suggestion.evidence) ? suggestion.evidence.length : 0,
        humanReviewRequired: suggestion.requiresHumanReview === true
      };
    });
}

function buildBreakdown(rows, keyField, labelField, sortFn = compareBreakdownRows) {
  const buckets = new Map();

  for (const row of rows) {
    const key = safeText(row?.[keyField], '');
    if (!key) {
      continue;
    }

    const bucket = buckets.get(key) ?? {
      key,
      label: safeText(row?.[labelField], humanizeIdentifier(key)),
      count: 0,
      signalCount: 0,
      suggestionCount: 0
    };

    bucket.count += 1;
    if (row.sourceKey === 'signal') {
      bucket.signalCount += 1;
    }
    if (row.sourceKey === 'suggestion') {
      bucket.suggestionCount += 1;
    }

    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort(sortFn);
}

function compareBreakdownRows(left, right) {
  const countDelta = right.count - left.count;
  if (countDelta !== 0) {
    return countDelta;
  }

  return String(left.label).localeCompare(String(right.label));
}

function compareTierRows(left, right) {
  const tierDelta = tierOrder(left.key) - tierOrder(right.key);
  if (tierDelta !== 0) {
    return tierDelta;
  }

  const countDelta = right.count - left.count;
  if (countDelta !== 0) {
    return countDelta;
  }

  return String(left.label).localeCompare(String(right.label));
}

function compareOpenCueRows(left, right) {
  const sourceDelta = sourceOrder(left.sourceKey) - sourceOrder(right.sourceKey);
  if (sourceDelta !== 0) {
    return sourceDelta;
  }

  const categoryDelta = String(left.categoryLabel).localeCompare(String(right.categoryLabel));
  if (categoryDelta !== 0) {
    return categoryDelta;
  }

  const tierDelta = tierOrder(left.tierKey) - tierOrder(right.tierKey);
  if (tierDelta !== 0) {
    return tierDelta;
  }

  return String(left.id).localeCompare(String(right.id));
}

function formatSignalCategory(category) {
  return SIGNAL_CATEGORY_LABELS[safeText(category, '')] ?? humanizeIdentifier(category);
}

function formatSignalPriority(priority) {
  return SIGNAL_PRIORITY_LABELS[safeText(priority, '')] ?? humanizeIdentifier(priority);
}

function formatRiskTierLabel(riskTier) {
  const text = safeText(riskTier, 'review');
  return humanizeIdentifier(text);
}

function normaliseRiskTier(riskTier, fallback = 'review') {
  const text = safeText(riskTier, fallback).toLowerCase();
  if (text === 'blocker' || text === 'urgent' || text === 'review' || text === 'watch' || text === 'learning') {
    return text;
  }

  return fallback;
}

function normaliseRiskThresholds(thresholds = {}) {
  return {
    watchUpper: toBoundedThreshold(thresholds.watchUpper, FALLBACK_RISK_TIER_THRESHOLDS.watchUpper),
    reviewUpper: toBoundedThreshold(thresholds.reviewUpper, FALLBACK_RISK_TIER_THRESHOLDS.reviewUpper)
  };
}

function classifyRiskTier(score, thresholds) {
  if (score < thresholds.watchUpper) {
    return 'watch';
  }

  if (score <= thresholds.reviewUpper) {
    return 'review';
  }

  return 'urgent';
}

function computeStartingRiskScore(currentRiskScore, riskTier, evidenceCount, missingDataCount) {
  const tierLeadDrops = {
    watch: 0.05,
    review: 0.12,
    urgent: 0.22
  };
  const evidenceBoost = Math.min(0.08, evidenceCount * 0.012);
  const missingBoost = Math.min(0.06, missingDataCount * 0.01);
  const startScore = currentRiskScore - (tierLeadDrops[riskTier] ?? 0.1) - evidenceBoost - missingBoost;

  return clamp01(startScore);
}

function buildTrendRatios(pointCount, riskTier) {
  if (pointCount === DEFAULT_TREND_POINT_COUNT && Array.isArray(TREND_EASING[riskTier])) {
    return [...TREND_EASING[riskTier]];
  }

  if (pointCount <= 1) {
    return [1];
  }

  return Array.from({ length: pointCount }, (_, index) => index / (pointCount - 1));
}

function normalisePointCount(value) {
  const numeric = Math.trunc(toNumber(value, DEFAULT_TREND_POINT_COUNT));
  return Math.max(2, numeric || DEFAULT_TREND_POINT_COUNT);
}

function normaliseIntervalMinutes(value) {
  const numeric = Math.trunc(toNumber(value, DEFAULT_TREND_INTERVAL_MINUTES));
  return Math.max(1, numeric || DEFAULT_TREND_INTERVAL_MINUTES);
}

function toBoundedThreshold(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return clamp01(numeric);
}

function parseTimestamp(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function tierOrder(key) {
  return TIER_ORDER[safeText(key, '').toLowerCase()] ?? TIER_ORDER.learning;
}

function sourceOrder(sourceKey) {
  return sourceKey === 'signal' ? 0 : 1;
}

function isClosingStatus(status) {
  const text = safeText(status, '').toLowerCase();
  return text ? CLOSING_STATUSES.has(text) : false;
}

function humanizeIdentifier(value) {
  const text = safeText(value, '');
  if (!text) {
    return '';
  }

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function roundTo(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}
