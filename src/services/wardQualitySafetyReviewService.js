import { competencyPassportFixtures } from '../data/competencyPassportFixtures.js';
import { microLearningFixtures } from '../data/microLearningFixtures.js';
import {
  buildCompetencyPassportSummary,
  countVerifiedEntries,
  totalPassportPoints
} from '../domain/competencyPassport.js';
import { buildSimulatedTrendFeatureSnapshot, scoreSimulatedTrend } from '../domain/patientJourneyTrendModel.js';
import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';
import { buildSimulatedRiskTrendChartData } from './dashboardChartDataService.js';

const DEFAULT_TITLE = 'Ward Quality & Safety Review';
const DEFAULT_BOUNDARY =
  'simulation-only prototype. fictional data. no real patient data. not for live clinical deployment. human review required. structured review support.';
const DEFAULT_ROADMAP = 'Ward Safety Board -> Hospital Insights -> exportable learning summary';

function buildCompetencyPassportEntries(passportFixtures = competencyPassportFixtures) {
  return Array.isArray(passportFixtures)
    ? passportFixtures.flatMap((fixture) => (Array.isArray(fixture?.entries) ? fixture.entries : []))
    : [];
}

function buildHeuristicCueCards(heuristicCues = []) {
  return (Array.isArray(heuristicCues) ? heuristicCues : []).map((cue, index) => ({
    id: cue?.ruleId ?? `heuristic-cue-${index + 1}`,
    cue: cleanExportText(cue?.cue) || 'Review cue',
    severityLabel: formatSeverityLabel(cue?.severity),
    rationale: cleanExportText(cue?.rationale),
    contributingSignals: Array.isArray(cue?.contributingSignals) ? cue.contributingSignals.map(cleanExportText).filter(Boolean) : [],
    threshold: cleanExportText(cue?.threshold)
  }));
}

function buildTrendSummaryCards(trendSuggestion, trendChartData) {
  const evidenceCount = Array.isArray(trendSuggestion?.evidence) ? trendSuggestion.evidence.length : 0;
  const missingDataCount = Array.isArray(trendSuggestion?.missingData) ? trendSuggestion.missingData.length : 0;
  const currentPoint = trendChartData?.points?.at(-1);

  return [
    {
      label: 'Trend tier',
      value: trendSuggestion?.riskTier ? humanizeIdentifier(trendSuggestion.riskTier) : 'Review',
      detail: cleanExportText(trendSuggestion?.title) || 'Simulation trend summary'
    },
    {
      label: 'Trend score',
      value: `${Math.round(Number(trendSuggestion?.riskScore ?? 0) * 100)}%`,
      detail: cleanExportText(trendSuggestion?.suggestedFlag) || 'Risk-support signal'
    },
    {
      label: 'Evidence',
      value: `${evidenceCount} items`,
      detail: cleanExportText(currentPoint?.displayValue) || 'Current point'
    },
    {
      label: 'Missing data',
      value: `${missingDataCount} items`,
      detail: trendSuggestion?.requiresHumanReview ? 'Human review required' : 'Simulation-only'
    }
  ];
}

function buildCompetencyPassportCards(summary = {}) {
  return [
    {
      label: 'Verified learning evidence',
      value: `${summary.verifiedEntryCount ?? 0} entries`,
      detail: `${summary.totalPoints ?? 0} points`
    },
    {
      label: 'Placements',
      value: `${summary.placementCount ?? 0}`,
      detail: 'Fictional placement trail'
    },
    {
      label: 'Coverage',
      value: `${summary.nmcCoverage?.coveragePercent ?? 0}%`,
      detail: `${summary.nmcCoverage?.coveredCount ?? 0}/${summary.nmcCoverage?.totalCount ?? 0} tags covered`
    },
    {
      label: 'Proactivity',
      value: `${summary.proactivity?.score ?? 0}/100`,
      detail: cleanExportText(summary.proactivity?.band) || 'Learning band'
    }
  ];
}

function buildPassportPlacementCards(summary = {}) {
  return (Array.isArray(summary.placementGroups) ? summary.placementGroups : []).map((group) => ({
    id: group.placementId,
    label: group.placementLabel,
    value: `${group.verifiedPoints} points`,
    detail: `${group.verifiedEntryCount} verified entries`,
    note: `${group.procedureCount} unique procedures`
  }));
}

function buildTrendLearningPoints(trendSuggestion = {}, heuristicCueCards = []) {
  return [
    'The Ward Safety Board and Hospital Insights surfaces keep the export inside simulation-only review support.',
    `The simulated trend signal is ${cleanExportText(trendSuggestion?.riskTier) || 'review'} with ${Math.round(Number(trendSuggestion?.riskScore ?? 0) * 100)}% score.`,
    `Heuristic cue count: ${Array.isArray(heuristicCueCards) ? heuristicCueCards.length : 0}.`,
    'Human review required before any action outside the simulation-only prototype.'
  ];
}

function buildCompetencyLearningPoints(summary = {}) {
  return [
    `Competency Passport verified learning evidence: ${summary.verifiedEntryCount ?? 0} entries.`,
    `NMC coverage: ${summary.nmcCoverage?.coveragePercent ?? 0}% across ${summary.nmcCoverage?.totalCount ?? 0} tags.`,
    `Proactivity band: ${cleanExportText(summary.proactivity?.band) || 'building'}.`,
    'Exportable learning summary remains fictional data only.'
  ];
}

function buildReviewCueLearningPoints(heuristicCueCards = []) {
  const leadCue = cleanExportText(heuristicCueCards[0]?.cue).toLowerCase() || 'review cue';
  const blockerCount = heuristicCueCards.filter((cue) => cue.severityLabel === 'Blocker').length;

  return [
    `Review cue count: ${heuristicCueCards.length}.`,
    `Blocker review cues: ${blockerCount}.`,
    `Lead cue: ${leadCue}.`,
    'Structured review support remains simulation-only and human review required.'
  ];
}

function humanizeIdentifier(value) {
  const text = cleanExportText(value);
  if (!text) {
    return '';
  }

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function formatSeverityLabel(severity) {
  const labels = {
    blocker: 'Blocker',
    review: 'Review',
    watch: 'Watch',
    learning: 'Learning'
  };

  return labels[cleanExportText(severity)] ?? 'Review';
}

function cleanExportText(value) {
  return typeof value === 'string' ? value.trim() : '';
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

function formatHeuristicCueExportBlock(cue, index) {
  const headerParts = [cleanExportText(cue?.severityLabel), cleanExportText(cue?.cue).toLowerCase()].filter(Boolean);
  const lines = [`${index + 1}. ${headerParts.length > 0 ? headerParts.join(' / ') : 'Review cue'}`];

  if (cleanExportText(cue?.rationale)) {
    lines.push(`  ${cleanExportText(cue.rationale)}`);
  }

  if (Array.isArray(cue?.contributingSignals) && cue.contributingSignals.length > 0) {
    lines.push(`  Risk-support signal evidence: ${cue.contributingSignals.join('; ')}`);
  }

  if (cleanExportText(cue?.threshold)) {
    lines.push(`  Threshold: ${cleanExportText(cue.threshold)}`);
  }

  return lines.join('\n');
}

function formatPassportPlacementBlock(card, index) {
  const lines = [`${index + 1}. ${cleanExportText(card?.label) || 'Placement'}`];

  if (cleanExportText(card?.value)) {
    lines.push(`  ${cleanExportText(card.value)}`);
  }

  if (cleanExportText(card?.detail)) {
    lines.push(`  ${cleanExportText(card.detail)}`);
  }

  if (cleanExportText(card?.note)) {
    lines.push(`  ${cleanExportText(card.note)}`);
  }

  return lines.join('\n');
}

function buildWardLearningAssurance({
  passportEntries = [],
  learningModules = microLearningFixtures,
  wardName = ''
} = {}) {
  const modules = Array.isArray(learningModules) ? learningModules : [];
  const cleanWard = cleanExportText(wardName);
  const wardModuleCount = cleanWard
    ? modules.filter((module) => cleanExportText(module?.ward).toLowerCase() === cleanWard.toLowerCase()).length
    : 0;

  return {
    wardName: cleanWard,
    verifiedCreditCount: countVerifiedEntries(passportEntries),
    totalPoints: totalPassportPoints(passportEntries),
    simulationModuleCount: modules.length,
    wardModuleCount,
    statement:
      'ward-level learning assurance (simulation): aggregate, non-identifying counts only. no individual staff names, scores, or ranking.'
  };
}

function buildWardLearningAssuranceCards(assurance = {}) {
  return [
    {
      label: 'Verified learning evidence',
      value: `${assurance.verifiedCreditCount ?? 0} credits`,
      detail: `${assurance.totalPoints ?? 0} points (aggregate)`
    },
    {
      label: 'Simulation learning modules',
      value: `${assurance.simulationModuleCount ?? 0}`,
      detail: assurance.wardName
        ? `${assurance.wardModuleCount ?? 0} for ${assurance.wardName}`
        : 'ward-level catalogue'
    },
    {
      label: 'Basis',
      value: 'Ward-level',
      detail: 'aggregate, non-identifying (simulation)'
    }
  ];
}

function buildWardLearningAssurancePoints(assurance = {}) {
  return [
    `Ward-level learning assurance (simulation): ${assurance.verifiedCreditCount ?? 0} verified learning credits, aggregate only.`,
    `Simulation learning modules available: ${assurance.simulationModuleCount ?? 0}.`,
    'Aggregate and non-identifying: no individual staff names, scores, ranking, or league table.',
    'Human review required. Simulation-only prototype.'
  ];
}

export function getWardQualitySafetyReviewSnapshot({
  patient,
  reviewSignals = [],
  heuristicCues = [],
  safetyFlag = null,
  hospitalInsights = getHospitalInsightsSnapshot(),
  selectedScenario = null,
  competencyPassportEntries = buildCompetencyPassportEntries()
} = {}) {
  if (!patient) {
    return null;
  }

  const safeHospitalInsights = hospitalInsights ?? getHospitalInsightsSnapshot();
  const trendFeatures = buildSimulatedTrendFeatureSnapshot({
    patient,
    safetyFlag,
    heuristicCues,
    reviewSignals
  });
  const trendSuggestion = scoreSimulatedTrend(trendFeatures);
  const trendChartData = buildSimulatedRiskTrendChartData(trendSuggestion);
  const heuristicCueCards = buildHeuristicCueCards(heuristicCues);
  const competencyPassportSummary = buildCompetencyPassportSummary(competencyPassportEntries);
  const wardLearningAssurance = buildWardLearningAssurance({
    passportEntries: competencyPassportEntries,
    wardName: safeHospitalInsights.currentWardName
  });

  return {
    title: DEFAULT_TITLE,
    disclaimer: 'simulation-only prototype. fictional data only. human review required.',
    boundaryDetail: DEFAULT_BOUNDARY,
    roadmapLine: DEFAULT_ROADMAP,
    prototypeNote:
      'structured review support from the Ward Safety Board and Hospital Insights with exportable learning summary.',
    sourceStatus: safeHospitalInsights.sourceStatus ?? getHospitalInsightsSnapshot().sourceStatus,
    sourceLabel: trendSuggestion?.suggestedFlag ?? 'Simulation trend signal',
    selectedScenario: selectedScenario
      ? {
          id: cleanExportText(selectedScenario.id),
          label: cleanExportText(selectedScenario.label),
          description: cleanExportText(selectedScenario.description),
          currentWardName: cleanExportText(selectedScenario.currentWardName)
        }
      : null,
    patientSummaryCards: [
      {
        label: 'Selected patient',
        value: cleanExportText(patient.id),
        detail: cleanExportText(patient.name)
      },
      {
        label: 'Ward context',
        value: cleanExportText(safeHospitalInsights.currentWardName),
        detail: cleanExportText(safeHospitalInsights.hospitalName)
      },
      {
        label: 'Ward Safety Board',
        value: `${Array.isArray(heuristicCueCards) ? heuristicCueCards.length : 0} review cue${heuristicCueCards.length === 1 ? '' : 's'}`,
        detail: 'Structured review support'
      },
      {
        label: 'Hospital Insights',
        value: `${safeHospitalInsights.wardCount ?? 0} fictional wards`,
        detail: 'Ward comparison'
      }
    ],
    heuristicCueCards,
    trendSummary: {
      ...trendSuggestion,
      trendFeatures,
      trendChartData
    },
    trendSummaryCards: buildTrendSummaryCards(trendSuggestion, trendChartData),
    trendLearningPoints: buildTrendLearningPoints(trendSuggestion, heuristicCueCards),
    competencyPassportSummary,
    competencyPassportCards: buildCompetencyPassportCards(competencyPassportSummary),
    competencyPassportPlacementCards: buildPassportPlacementCards(competencyPassportSummary),
    competencyLearningPoints: buildCompetencyLearningPoints(competencyPassportSummary),
    wardLearningAssurance,
    wardLearningAssuranceCards: buildWardLearningAssuranceCards(wardLearningAssurance),
    wardLearningAssurancePoints: buildWardLearningAssurancePoints(wardLearningAssurance),
    reviewCueLearningPoints: buildReviewCueLearningPoints(heuristicCueCards),
    humanReviewNote:
      'human review required. simulation-only prototype. structured review support. exportable learning summary.',
    exportFootnote:
      'SafeFlow simulation-only prototype keeps review cues, risk-support signals, and learning evidence inside fictional data.'
  };
}

export function buildWardQualitySafetyReviewExportText(snapshot) {
  if (!snapshot) {
    return '';
  }

  const blocks = [];
  const title = cleanExportText(snapshot.title) || DEFAULT_TITLE;
  blocks.push(title, '');

  appendExportSection(blocks, 'Simulation boundary statement', [
    cleanExportText(snapshot.disclaimer),
    cleanExportText(snapshot.boundaryDetail),
    cleanExportText(snapshot.prototypeNote),
    cleanExportText(snapshot.humanReviewNote)
  ]);

  appendExportSection(blocks, 'Ward Safety Board / Hospital Insights context', [
    cleanExportText(snapshot.roadmapLine),
    cleanExportText(snapshot.selectedScenario?.label) || 'Fictional scenario',
    cleanExportText(snapshot.selectedScenario?.description),
    cleanExportText(snapshot.selectedScenario?.currentWardName)
      ? `Ward context: ${cleanExportText(snapshot.selectedScenario.currentWardName)}`
      : ''
  ]);

  appendExportSection(
    blocks,
    'Heuristic cue engine flags',
    Array.isArray(snapshot.heuristicCueCards) && snapshot.heuristicCueCards.length > 0
      ? snapshot.heuristicCueCards.map(formatHeuristicCueExportBlock)
      : ['No review cue was generated in this simulation-only prototype.']
  );

  appendExportSection(blocks, 'Simulation-risk trend summary', [
    ...(
      Array.isArray(snapshot.trendSummaryCards)
        ? snapshot.trendSummaryCards.map(formatSummaryCard)
        : []
    ),
    ...(
      Array.isArray(snapshot.trendLearningPoints)
        ? snapshot.trendLearningPoints
        : []
    )
  ]);

  appendExportSection(blocks, 'Competency Passport verified-learning evidence', [
    ...(
      Array.isArray(snapshot.competencyPassportCards)
        ? snapshot.competencyPassportCards.map(formatSummaryCard)
        : []
    ),
    ...(
      Array.isArray(snapshot.competencyLearningPoints)
        ? snapshot.competencyLearningPoints
        : []
    )
  ]);

  appendExportSection(
    blocks,
    'Placement evidence',
    Array.isArray(snapshot.competencyPassportPlacementCards) && snapshot.competencyPassportPlacementCards.length > 0
      ? snapshot.competencyPassportPlacementCards.map(formatPassportPlacementBlock)
      : ['No placement evidence is available in this simulation-only prototype.']
  );

  appendExportSection(blocks, 'Ward-level learning assurance (simulation)', [
    ...(
      Array.isArray(snapshot.wardLearningAssuranceCards)
        ? snapshot.wardLearningAssuranceCards.map(formatSummaryCard)
        : []
    ),
    ...(
      Array.isArray(snapshot.wardLearningAssurancePoints)
        ? snapshot.wardLearningAssurancePoints
        : []
    )
  ]);

  appendExportSection(blocks, 'Exportable learning summary', [
    cleanExportText(snapshot.exportFootnote),
    ...(
      Array.isArray(snapshot.reviewCueLearningPoints)
        ? snapshot.reviewCueLearningPoints
        : []
    )
  ]);

  return blocks.join('\n').trim();
}
