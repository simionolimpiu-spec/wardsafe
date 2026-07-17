import { patientTimelineFixtures } from '../data/patientTimelineFixtures.js';
import { buildEpisodes, getPatientDay } from './longitudinalJourney.js';

const DEFAULT_SOURCE = 'fictional timeline fixture';
const DEFAULT_CLINICAL_USE = 'not for live clinical deployment';
const DEFAULT_SIMULATION_LABEL = 'Simulation-only';
const DEFAULT_PATIENT_LIMITATION = 'Synthetic timeline only; no live patient data.';
const DEFAULT_ENTRY_LIMITATION = 'Synthetic timeline entry contains incomplete information.';
const LONGITUDINAL_DEFAULT_THROUGH_DAY = 14;

export function buildPatientTimelineCollection(fixtures = patientTimelineFixtures) {
  if (!Array.isArray(fixtures)) {
    return [];
  }

  return fixtures.map((fixture, index) => normalisePatientTimelineFixture(fixture, index));
}

// Optional adapter for consumers that want the newer day-indexed source while
// leaving the fixture-backed Patient Journey Twin unchanged by default.
export function buildLongitudinalPatientTimeline(patientId, throughDay = LONGITUDINAL_DEFAULT_THROUGH_DAY) {
  const maxDay = normaliseDay(throughDay);
  const episodes = buildEpisodes(patientId, maxDay);
  const days = [];

  for (let day = 1; day <= maxDay; day += 1) {
    const picture = getPatientDay(patientId, day);
    days.push({
      dayNumber: picture.dayNumber,
      observations: picture.observations,
      location: picture.location,
      episodePhase: picture.episodePhase,
      reviewThemeCue: picture.reviewThemeCue,
      simulationOnly: true,
      humanReviewRequired: true
    });
  }

  return Object.freeze({
    patientId: normalisePatientId(patientId),
    days: Object.freeze(days),
    episodes,
    source: 'fictional longitudinal journey engine',
    simulationOnly: true,
    humanReviewRequired: true,
    clinicalUse: DEFAULT_CLINICAL_USE
  });
}

export function buildPatientTimelineEntries(fixtures = patientTimelineFixtures) {
  return buildPatientTimelineCollection(fixtures)
    .flatMap((patient) => patient.timeline)
    .sort(compareTimelineEntries);
}

function normalisePatientTimelineFixture(fixture = {}, index = 0) {
  const safeFixture = fixture ?? {};
  const patientId = safeText(
    safeFixture.patientId ?? safeFixture.patientRef,
    `SF-TL-${String(index + 1).padStart(3, '0')}`
  );
  const patientRef = safeText(safeFixture.patientRef, patientId);
  const patientName = safeText(
    safeFixture.patientName ?? safeFixture.name,
    `Fictional Patient ${index + 1}`
  );
  const wardName = safeText(safeFixture.wardName, 'Ward Safety Board');
  const source = safeText(safeFixture.source, DEFAULT_SOURCE);
  const clinicalUse = safeText(safeFixture.clinicalUse, DEFAULT_CLINICAL_USE);
  const simulationOnly = safeFixture.simulationOnly !== false;
  const simulationLabel = safeText(safeFixture.simulationLabel, DEFAULT_SIMULATION_LABEL);
  const timeline = Array.isArray(safeFixture.timeline)
    ? safeFixture.timeline
      .map((entry, entryIndex) => normaliseTimelineEntry(entry, {
        patientId,
        patientRef,
        patientName,
        wardName,
        source,
        clinicalUse,
        simulationOnly,
        simulationLabel
      }, entryIndex))
      .sort(compareTimelineEntries)
    : [];

  return {
    patientId,
    patientRef,
    patientName,
    wardName,
    source,
    clinicalUse,
    simulationOnly,
    simulationLabel,
    missingInformation: uniqueStrings([
      ...normaliseList(safeFixture.missingInformation),
      ...timeline.flatMap((entry) => entry.missingInformation)
    ]),
    limitations: uniqueStrings([
      ...normaliseList(safeFixture.limitations),
      ...timeline.flatMap((entry) => entry.limitations),
      DEFAULT_PATIENT_LIMITATION
    ]),
    timeline
  };
}

function normaliseTimelineEntry(entry = {}, context, entryIndex = 0) {
  const safeEntry = entry ?? {};
  const missingInformation = normaliseList(safeEntry.missingInformation);
  const limitations = normaliseList(safeEntry.limitations);
  const timestamp = isValidTimestamp(safeEntry.timestamp) ? new Date(safeEntry.timestamp).toISOString() : null;
  const type = normaliseType(safeEntry.type);
  const label = safeText(safeEntry.label, 'Unlabelled simulation timeline entry');
  const detail = safeText(safeEntry.detail, 'No simulation detail provided.');
  const simulationOnly = safeEntry.simulationOnly !== false && context.simulationOnly !== false;
  const simulationLabel = safeText(safeEntry.simulationLabel, context.simulationLabel);

  if (!timestamp) {
    missingInformation.push('Timeline timestamp is missing or invalid.');
  }

  if (type === 'unknown') {
    missingInformation.push('Timeline type is missing.');
  }

  if (label === 'Unlabelled simulation timeline entry') {
    missingInformation.push('Timeline label is missing.');
  }

  if (detail === 'No simulation detail provided.') {
    missingInformation.push('Timeline detail is missing.');
  }

  if (missingInformation.length > 0 && limitations.length === 0) {
    limitations.push(DEFAULT_ENTRY_LIMITATION);
  }

  return {
    timestamp,
    type,
    label,
    detail,
    missingInformation: uniqueStrings(missingInformation),
    limitations: uniqueStrings(limitations),
    simulationOnly,
    simulationLabel,
    order: entryIndex,
    patientId: context.patientId,
    patientRef: context.patientRef,
    patientName: context.patientName,
    wardName: context.wardName,
    source: safeText(safeEntry.source, context.source),
    clinicalUse: safeText(safeEntry.clinicalUse, context.clinicalUse)
  };
}

function compareTimelineEntries(left, right) {
  const leftTime = sortTimestamp(left.timestamp);
  const rightTime = sortTimestamp(right.timestamp);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  const patientIdComparison = (left.patientId ?? '').localeCompare(right.patientId ?? '');
  if (patientIdComparison !== 0) {
    return patientIdComparison;
  }

  const patientRefComparison = (left.patientRef ?? '').localeCompare(right.patientRef ?? '');
  if (patientRefComparison !== 0) {
    return patientRefComparison;
  }

  const leftOrder = Number.isFinite(Number(left.order)) ? Number(left.order) : 0;
  const rightOrder = Number.isFinite(Number(right.order)) ? Number(right.order) : 0;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  const typeComparison = (left.type ?? '').localeCompare(right.type ?? '');
  if (typeComparison !== 0) {
    return typeComparison;
  }

  return (left.label ?? '').localeCompare(right.label ?? '');
}

function sortTimestamp(timestamp) {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function normaliseType(value) {
  const text = safeText(value, 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return text || 'unknown';
}

function normaliseList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => safeText(item, ''))
    .filter(Boolean);
}

function uniqueStrings(values) {
  return [...new Set(normaliseList(values))];
}

function safeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const text = value.trim();
  return text || fallback;
}

function isValidTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normaliseDay(dayNumber) {
  const value = Number(dayNumber);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalisePatientId(patientId) {
  const value = String(patientId ?? '').trim();
  return value || 'SIM-P-UNKNOWN';
}
