import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { trustNetwork } from '../data/trustNetwork/index.js';
import { scanStrictSafetyLanguage } from './safetyLanguage.js';
import { buildLongitudinalPatientTimeline } from './patientTimeline.js';
import { buildEpisodes, compareDays, getPatientDay } from './longitudinalJourney.js';

const patientId = trustNetwork.patients[0].id;
const observationKeys = ['respRate', 'spo2', 'heartRate', 'systolicBp', 'tempC', 'consciousness'];

describe('longitudinal journey engine (simulation)', () => {
  it('returns identical day pictures for the same patient and day, including day 1300', () => {
    expect(getPatientDay(patientId, 1)).toEqual(getPatientDay(patientId, 1));
    expect(getPatientDay(patientId, 1300)).toEqual(getPatientDay(patientId, 1300));

    const day = getPatientDay(patientId, 1300);
    expect(day).toMatchObject({
      patientId,
      dayNumber: 1300,
      location: {
        trustId: expect.any(String),
        wardId: expect.any(String)
      },
      episodePhase: expect.any(String),
      reviewThemeCue: expect.stringMatching(/human review required/i),
      simulationOnly: true,
      humanReviewRequired: true
    });
    expect(day.observations).toEqual(expect.objectContaining({
      respRate: expect.any(Number),
      spo2: expect.any(Number),
      heartRate: expect.any(Number),
      systolicBp: expect.any(Number),
      tempC: expect.any(Number),
      consciousness: expect.any(String)
    }));
  });

  it('keeps episode ranges ordered and non-overlapping while reusing subject journeys', () => {
    const throughDay = 400;
    const episodes = buildEpisodes(patientId, throughDay);
    const subjectJourneyIds = trustNetwork.journeys
      .filter((journey) => journey.subjectPatientId === patientId)
      .map((journey) => journey.id);

    expect(episodes.length).toBeGreaterThan(4);
    expect(episodes.some((episode) => episode.phase === 'admission')).toBe(true);
    expect(episodes.some((episode) => episode.phase === 'interTrustTransfer')).toBe(true);
    expect(episodes.some((episode) => episode.phase === 'discharge')).toBe(true);
    expect(episodes.some((episode) => episode.phase === 'community')).toBe(true);
    for (const journeyId of subjectJourneyIds) {
      expect(episodes.some((episode) => episode.journeyId === journeyId)).toBe(true);
    }
    expect(episodes.every((episode) => episode.startDay <= episode.endDay)).toBe(true);
    expect(episodes.every((episode) => episode.endDay <= throughDay)).toBe(true);

    for (let index = 1; index < episodes.length; index += 1) {
      expect(episodes[index].startDay).toBeGreaterThan(episodes[index - 1].endDay);
    }
  });

  it('returns a symmetric then-versus-now delta', () => {
    const forward = compareDays(patientId, 1, 3);
    const backward = compareDays(patientId, 3, 1);

    for (const key of observationKeys) {
      const forwardChange = forward.observations[key];
      const backwardChange = backward.observations[key];
      expect(backwardChange.then).toBe(forwardChange.now);
      expect(backwardChange.now).toBe(forwardChange.then);
      if (forwardChange.delta === null) {
        expect(backwardChange.delta).toBeNull();
      } else {
        expect(backwardChange.delta).toBeCloseTo(-forwardChange.delta);
      }
    }

    expect(backward.location.from).toEqual(forward.location.to);
    expect(backward.location.to).toEqual(forward.location.from);
    expect(backward.episodePhase.from).toBe(forward.episodePhase.to);
    expect(backward.episodePhase.to).toBe(forward.episodePhase.from);
    expect(forward.trendNote).toMatch(/human review required/i);
    expect(forward.trendNote).toBe(backward.trendNote);
  });

  it('is usable as an optional Patient Journey Twin source without changing fixtures', () => {
    const adapted = buildLongitudinalPatientTimeline(patientId, 3);

    expect(adapted).toMatchObject({
      patientId,
      source: 'fictional longitudinal journey engine',
      simulationOnly: true,
      humanReviewRequired: true
    });
    expect(adapted.days).toHaveLength(3);
    expect(adapted.episodes.length).toBeGreaterThan(0);
  });

  it('keeps generated outputs free of identifying properties and prohibited wording', () => {
    const generated = [
      getPatientDay(patientId, 1300),
      buildEpisodes(patientId, 400),
      compareDays(patientId, 1, 1300),
      buildLongitudinalPatientTimeline(patientId, 3)
    ];

    expect(JSON.stringify(generated)).not.toMatch(/"(?:name|patientName|nhsNumber|dob)"\s*:/i);
    expect(scanStrictSafetyLanguage(generated, {
      checkedLabel: 'longitudinal journey generated labels'
    })).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('generates 1000 arbitrary patient-days well under one second', () => {
    const start = performance.now();
    for (let index = 0; index < 1000; index += 1) {
      getPatientDay(`PERF-${index}`, index + 1);
    }
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(500);
  });
});
