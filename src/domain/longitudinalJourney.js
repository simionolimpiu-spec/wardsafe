import { hashSeed } from '../data/trustNetwork/patientTimelines.js';
import { trustNetwork } from '../data/trustNetwork/index.js';
import { ALL_WARDS } from '../data/trustNetwork/trusts.js';

// SafeFlow longitudinal journey data is simulation-only. The engine creates
// fictional, non-identifying observations and review-support cues. It does
// not diagnose, prescribe, score staff, or trigger an automated action.

const CLINICAL_USE = 'not for live clinical deployment';
const PHASE_LABELS = Object.freeze({
  admission: 'Admission - human review required',
  wardMove: 'Ward move - human review required',
  interTrustTransfer: 'Inter-trust transfer - human review required',
  discharge: 'Discharge - human review required',
  community: 'Community period - human review required',
  readmission: 'Possible readmission - human review required'
});

const REVIEW_THEMES = Object.freeze([
  'documentation and handover review',
  'observation trend review',
  'discharge-readiness review',
  'medicine timing documentation review',
  'escalation readiness review'
]);

const OBSERVATION_KEYS = Object.freeze([
  'respRate',
  'spo2',
  'heartRate',
  'systolicBp',
  'tempC',
  'consciousness'
]);

const CONSCIOUSNESS = Object.freeze([
  'Alert',
  'Alert',
  'Alert',
  'Review cue: change in consciousness'
]);

const wardById = new Map(ALL_WARDS.map((ward) => [ward.id, ward]));
const patientById = new Map(trustNetwork.patients.map((patient) => [patient.id, patient]));
const journeys = trustNetwork.journeys;

export function getPatientDay(patientId, dayNumber) {
  const patient = resolvePatient(patientId);
  const day = normaliseDay(dayNumber);
  const schedule = createEpisodeSchedule(patient);
  const episode = findEpisodeAtDay(schedule, day) ?? makeFallbackEpisode(patient, day);
  const location = freezeLocation(episode.location);

  return Object.freeze({
    patientId: patient.id,
    dayNumber: day,
    observations: buildObservations(patient, day, episode),
    location,
    episodePhase: episode.phaseLabel,
    episodePhaseKey: episode.phase,
    reviewThemeCue: `${patient.reviewTheme} cue - structured review support only; human review required.`,
    simulationOnly: true,
    humanReviewRequired: true,
    clinicalUse: CLINICAL_USE
  });
}

export function buildEpisodes(patientId, throughDay = 1) {
  const patient = resolvePatient(patientId);
  const maxDay = normaliseDay(throughDay);
  const schedule = createEpisodeSchedule(patient);
  const visibleEpisodes = [];

  for (const episode of schedule) {
    if (episode.startDay > maxDay) break;

    const endDay = Math.min(episode.endDay ?? maxDay, maxDay);
    if (endDay < episode.startDay) continue;

    visibleEpisodes.push(freezeEpisode({
      ...episode,
      endDay,
      dayRange: Object.freeze([episode.startDay, endDay]),
      location: freezeLocation(episode.location)
    }));
  }

  return Object.freeze(visibleEpisodes);
}

export function compareDays(patientId, dayA, dayB) {
  const thenDay = getPatientDay(patientId, dayA);
  const nowDay = getPatientDay(patientId, dayB);
  const observationChanges = {};

  for (const key of OBSERVATION_KEYS) {
    const thenValue = thenDay.observations[key];
    const nowValue = nowDay.observations[key];
    const rawNumericDelta = typeof thenValue === 'number' && typeof nowValue === 'number'
      ? nowValue - thenValue
      : null;
    const numericDelta = Object.is(rawNumericDelta, -0) ? 0 : rawNumericDelta;

    observationChanges[key] = Object.freeze({
      then: thenValue,
      now: nowValue,
      from: thenValue,
      to: nowValue,
      delta: numericDelta,
      changed: !Object.is(thenValue, nowValue)
    });
  }

  const locationThen = thenDay.location;
  const locationNow = nowDay.location;
  const locationChanged = locationThen.trustId !== locationNow.trustId
    || locationThen.wardId !== locationNow.wardId;
  const phaseChanged = thenDay.episodePhaseKey !== nowDay.episodePhaseKey;
  const observationChanged = Object.values(observationChanges).some((change) => change.changed);
  const changed = observationChanged || locationChanged || phaseChanged;
  const locationChange = Object.freeze({
    then: locationThen,
    now: locationNow,
    from: locationThen,
    to: locationNow,
    changed: locationChanged
  });
  const episodePhaseChange = Object.freeze({
    then: thenDay.episodePhase,
    now: nowDay.episodePhase,
    from: thenDay.episodePhase,
    to: nowDay.episodePhase,
    changed: phaseChanged
  });

  return Object.freeze({
    patientId: thenDay.patientId,
    dayA: thenDay.dayNumber,
    dayB: nowDay.dayNumber,
    observations: Object.freeze(observationChanges),
    observationDelta: Object.freeze(Object.fromEntries(
      OBSERVATION_KEYS.map((key) => [key, observationChanges[key].delta])
    )),
    location: locationChange,
    locationChange,
    episodePhase: episodePhaseChange,
    episodePhaseChange,
    trendNote: changed
      ? 'Changed between the compared fictional days - human review required; review-support cue only.'
      : 'No change identified between the compared fictional days - human review required; review-support cue only.',
    simulationOnly: true,
    humanReviewRequired: true,
    clinicalUse: CLINICAL_USE
  });
}

function resolvePatient(patientId) {
  const id = normalisePatientId(patientId);
  const knownPatient = patientById.get(id);
  if (knownPatient) {
    return {
      id,
      trustId: knownPatient.trustId,
      homeTrustId: knownPatient.homeTrustId,
      wardId: knownPatient.wardId,
      reviewTheme: knownPatient.reviewTheme
    };
  }

  const seed = hashSeed(id);
  const ward = ALL_WARDS[seed % ALL_WARDS.length];
  return {
    id,
    trustId: ward.trustId,
    homeTrustId: ward.trustId,
    wardId: ward.id,
    reviewTheme: REVIEW_THEMES[(seed >>> 3) % REVIEW_THEMES.length]
  };
}

function createEpisodeSchedule(patient) {
  const schedule = [];
  const seed = hashSeed(patient.id);
  let cursor = 1;
  let current = freezeLocation({ trustId: patient.trustId, wardId: patient.wardId });

  cursor = appendEpisode(schedule, {
    patient,
    cursor,
    phase: 'admission',
    duration: 2,
    location: current
  });

  const matchingJourneys = journeys.filter((journey) =>
    journey.subjectPatientId === patient.id && Array.isArray(journey.segments) && journey.segments.length > 0
  );

  if (matchingJourneys.length === 0) {
    const genericPath = buildGenericPath(patient, seed, current);
    for (const step of genericPath) {
      cursor = appendEpisode(schedule, {
        patient,
        cursor,
        phase: step.phase,
        duration: step.duration,
        location: step.location
      });
      current = step.location;
    }
    cursor = appendEpisode(schedule, {
      patient,
      cursor,
      phase: 'discharge',
      duration: 1,
      location: current
    });
  } else {
    for (let journeyIndex = 0; journeyIndex < matchingJourneys.length; journeyIndex += 1) {
      const journey = matchingJourneys[journeyIndex];
      if (journeyIndex > 0) {
        const communityDuration = 8 + ((seed + journeyIndex * 11) % 6);
        cursor = appendEpisode(schedule, {
          patient,
          cursor,
          phase: 'community',
          duration: communityDuration,
          location: current
        });
      }

      let sawDischarge = false;
      const segments = journey.segments.filter((segment) => wardById.has(segment.wardId));
      for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
        const segment = segments[segmentIndex];
        const ward = wardById.get(segment.wardId);
        const location = freezeLocation({ trustId: ward.trustId, wardId: ward.id });
        const phase = classifyJourneySegment(segment, current, segmentIndex === 0);
        cursor = appendEpisode(schedule, {
          patient,
          cursor,
          phase,
          duration: durationForPhase(phase),
          location,
          journeyId: journey.id,
          journeyType: journey.journeyType,
          journeyStage: segment.stage
        });
        current = location;
        sawDischarge = sawDischarge || phase === 'discharge';
      }

      if (!sawDischarge) {
        cursor = appendEpisode(schedule, {
          patient,
          cursor,
          phase: 'discharge',
          duration: 1,
          location: current,
          journeyId: journey.id,
          journeyType: journey.journeyType,
          journeyStage: 'discharge'
        });
      }
    }
  }

  appendPossibleReadmission(schedule, patient, seed, cursor, current);
  return schedule;
}

function buildGenericPath(patient, seed, current) {
  const path = [];
  const sameTrustWards = ALL_WARDS.filter((ward) => ward.trustId === current.trustId);
  const firstWard = chooseWard(sameTrustWards, seed >>> 4, current.wardId);
  const secondWard = chooseWard(sameTrustWards, seed >>> 9, firstWard.wardId);
  const otherTrustWards = ALL_WARDS.filter((ward) => ward.trustId !== current.trustId);
  const transferWard = chooseWard(otherTrustWards, seed >>> 14, current.wardId);
  const receivingWard = chooseWard(
    ALL_WARDS.filter((ward) => ward.trustId === transferWard.trustId),
    seed >>> 19,
    transferWard.wardId
  );

  path.push({ phase: 'wardMove', duration: 2, location: locationFromWard(firstWard, current) });
  path.push({ phase: 'wardMove', duration: 2, location: locationFromWard(secondWard, firstWard) });
  path.push({ phase: 'interTrustTransfer', duration: 1, location: locationFromWard(transferWard, secondWard) });
  path.push({ phase: 'wardMove', duration: 2, location: locationFromWard(receivingWard, transferWard) });
  return path;
}

function appendPossibleReadmission(schedule, patient, seed, cursor, current) {
  const readmissionPossible = seed % 4 !== 0;
  if (!readmissionPossible) {
    appendOpenEpisode(schedule, {
      patient,
      cursor,
      phase: 'community',
      location: current
    });
    return;
  }

  const communityDuration = 14 + (seed % 12);
  cursor = appendEpisode(schedule, {
    patient,
    cursor,
    phase: 'community',
    duration: communityDuration,
    location: current
  });

  const homeTrustWards = ALL_WARDS.filter((ward) => ward.trustId === patient.homeTrustId);
  const readmissionWard = chooseWard(homeTrustWards, seed >>> 7, current.wardId);
  cursor = appendEpisode(schedule, {
    patient,
    cursor,
    phase: 'readmission',
    duration: 2,
    location: locationFromWard(readmissionWard, current)
  });
  cursor = appendEpisode(schedule, {
    patient,
    cursor,
    phase: 'wardMove',
    duration: 2,
    location: current
  });
  cursor = appendEpisode(schedule, {
    patient,
    cursor,
    phase: 'discharge',
    duration: 1,
    location: current
  });
  appendOpenEpisode(schedule, {
    patient,
    cursor,
    phase: 'community',
    location: current
  });
}

function appendEpisode(schedule, {
  patient,
  cursor,
  phase,
  duration,
  location,
  journeyId,
  journeyType,
  journeyStage
}) {
  const startDay = cursor;
  const endDay = startDay + duration - 1;
  schedule.push({
    episodeId: `${patient.id}-episode-${schedule.length + 1}`,
    startDay,
    endDay,
    dayRange: [startDay, endDay],
    phase,
    phaseLabel: PHASE_LABELS[phase],
    trustId: location.trustId,
    wardId: location.wardId,
    location,
    ...(journeyId ? { journeyId } : {}),
    ...(journeyType ? { journeyType } : {}),
    ...(journeyStage ? { journeyStage } : {}),
    simulationOnly: true,
    humanReviewRequired: true,
    clinicalUse: CLINICAL_USE
  });
  return endDay + 1;
}

function appendOpenEpisode(schedule, { patient, cursor, phase, location }) {
  schedule.push({
    episodeId: `${patient.id}-episode-${schedule.length + 1}`,
    startDay: cursor,
    endDay: null,
    dayRange: [cursor, null],
    phase,
    phaseLabel: PHASE_LABELS[phase],
    trustId: location.trustId,
    wardId: location.wardId,
    location,
    simulationOnly: true,
    humanReviewRequired: true,
    clinicalUse: CLINICAL_USE
  });
}

function classifyJourneySegment(segment, current, firstSegment) {
  const stage = String(segment.stage ?? '').toLowerCase();
  if (/discharge|packages-of-care/.test(stage)) return 'discharge';
  if (segment.trustId !== current.trustId) return 'interTrustTransfer';
  if (firstSegment) return 'admission';
  return 'wardMove';
}

function durationForPhase(phase) {
  if (phase === 'interTrustTransfer' || phase === 'discharge') return 1;
  return phase === 'admission' ? 2 : 2;
}

function findEpisodeAtDay(schedule, day) {
  return schedule.find((episode) =>
    episode.startDay <= day && (episode.endDay === null || day <= episode.endDay)
  );
}

function makeFallbackEpisode(patient, day) {
  return {
    phase: 'community',
    phaseLabel: PHASE_LABELS.community,
    location: freezeLocation({ trustId: patient.trustId, wardId: patient.wardId }),
    startDay: day,
    endDay: day
  };
}

function buildObservations(patient, day, episode) {
  const seed = hashSeed(patient.id);
  const daySeed = mixSeed(seed, day);
  const baseResp = pick(seed, 14, 18);
  const baseSpo2 = pick(seed >>> 2, 95, 99);
  const baseHeartRate = pick(seed >>> 3, 66, 88);
  const baseSystolicBp = pick(seed >>> 4, 112, 134);
  const baseTempTenths = 366 + (seed % 8);
  const themeDrift = /observation trend|escalation readiness/i.test(patient.reviewTheme)
    ? Math.floor((day - 1) / 7) % 5
    : 0;
  const phaseBias = episode.phase === 'interTrustTransfer' ? 1 : episode.phase === 'discharge' ? -1 : 0;
  const respRate = clamp(baseResp + signedOffset(daySeed, 2) + themeDrift + phaseBias, 10, 30);
  const spo2 = clamp(baseSpo2 + signedOffset(daySeed >>> 4, 2) - themeDrift, 88, 100);
  const heartRate = clamp(baseHeartRate + signedOffset(daySeed >>> 7, 6) + (themeDrift * 3) + phaseBias, 40, 150);
  const systolicBp = clamp(baseSystolicBp + signedOffset(daySeed >>> 10, 6) - (themeDrift * 2), 80, 190);
  const tempTenths = clamp(baseTempTenths + signedOffset(daySeed >>> 13, 2) + themeDrift + phaseBias, 350, 410);
  const consciousnessIndex = /observation trend|escalation readiness/i.test(patient.reviewTheme)
    ? Math.min(CONSCIOUSNESS.length - 1, Math.floor((themeDrift + (daySeed % 3)) / 2))
    : (daySeed % 11 === 0 ? 1 : 0);

  return Object.freeze({
    respRate,
    spo2,
    heartRate,
    systolicBp,
    tempC: Number((tempTenths / 10).toFixed(1)),
    consciousness: CONSCIOUSNESS[consciousnessIndex]
  });
}

function chooseWard(wards, seed, avoidWardId) {
  if (!wards.length) return null;
  const startIndex = seed % wards.length;
  for (let offset = 0; offset < wards.length; offset += 1) {
    const ward = wards[(startIndex + offset) % wards.length];
    if (ward.id !== avoidWardId || wards.length === 1) return ward;
  }
  return wards[startIndex];
}

function locationFromWard(ward, fallback) {
  return freezeLocation({
    trustId: ward?.trustId ?? fallback.trustId,
    wardId: ward?.id ?? fallback.wardId
  });
}

function freezeEpisode(episode) {
  return Object.freeze({
    ...episode,
    dayRange: Object.freeze([...episode.dayRange])
  });
}

function freezeLocation(location) {
  return Object.freeze({
    trustId: location.trustId,
    wardId: location.wardId
  });
}

function mixSeed(seed, day) {
  let mixed = (seed ^ Math.imul(day >>> 0, 0x9e3779b9)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b);
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

function pick(seed, lo, hi) {
  return lo + (seed % (hi - lo + 1));
}

function signedOffset(seed, magnitude) {
  return (seed % ((magnitude * 2) + 1)) - magnitude;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function normalisePatientId(patientId) {
  const value = String(patientId ?? '').trim();
  return value || 'SIM-P-UNKNOWN';
}

function normaliseDay(dayNumber) {
  const value = Number(dayNumber);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}
