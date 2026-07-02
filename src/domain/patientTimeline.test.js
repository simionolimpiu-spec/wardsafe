import { describe, expect, it } from 'vitest';
import { patientTimelineFixtures } from '../data/patientTimelineFixtures.js';
import {
  buildPatientTimelineCollection,
  buildPatientTimelineEntries
} from './patientTimeline.js';

describe('patient timeline fixtures', () => {
  it('exports simulation-only fictional patients with explicit limitations', () => {
    expect(patientTimelineFixtures).toHaveLength(2);
    expect(patientTimelineFixtures.map((patient) => patient.patientId)).toEqual([
      'SF-TL-001',
      'SF-TL-002'
    ]);
    expect(patientTimelineFixtures.every((patient) => patient.simulationOnly)).toBe(true);
    expect(patientTimelineFixtures.every((patient) => patient.simulationLabel === 'Simulation-only')).toBe(true);
    expect(patientTimelineFixtures.every((patient) => patient.clinicalUse === 'not for live clinical deployment')).toBe(true);
    expect(JSON.stringify(patientTimelineFixtures)).toContain('Simulation-only');
    expect(JSON.stringify(patientTimelineFixtures)).not.toMatch(/\b\d{3}\s?\d{3}\s?\d{4}\b/);
  });
});

describe('patient timeline normalisation', () => {
  it('sorts each patient timeline and preserves explicit missing information', () => {
    const collection = buildPatientTimelineCollection([
      {
        patientId: 'SF-TL-900',
        patientRef: 'TL-Z900',
        patientName: 'Fictional Patient Zeta',
        wardName: 'Ward Test',
        simulationOnly: true,
        missingInformation: ['Transport booking not yet confirmed.'],
        limitations: ['Synthetic timeline only; no live patient data.'],
        timeline: [
          {
            timestamp: '2026-06-11T08:30:00.000Z',
            type: 'audit_event',
            label: 'Audit review recorded',
            detail: 'Simulation audit note logged after the review cue.',
            missingInformation: ['Exact response time not captured.'],
            simulationOnly: true
          },
          {
            timestamp: '2026-06-11T07:50:00.000Z',
            type: 'lab',
            label: 'Potassium 3.4 mmol/L',
            detail: 'Synthetic lab result appears first in the timeline.',
            simulationOnly: true
          },
          {
            timestamp: '2026-06-11T08:10:00.000Z',
            type: 'review cue',
            label: 'Discharge cue',
            detail: 'Human review requested to confirm transport and follow-up.',
            missingInformation: ['Transport booking not yet confirmed.'],
            limitations: ['Simulation-only discharge cue.'],
            simulationOnly: true
          }
        ]
      }
    ]);

    const [patient] = collection;

    expect(patient).toMatchObject({
      patientId: 'SF-TL-900',
      patientRef: 'TL-Z900',
      patientName: 'Fictional Patient Zeta',
      wardName: 'Ward Test',
      simulationOnly: true,
      simulationLabel: 'Simulation-only'
    });
    expect(patient.timeline.map((entry) => entry.timestamp)).toEqual([
      '2026-06-11T07:50:00.000Z',
      '2026-06-11T08:10:00.000Z',
      '2026-06-11T08:30:00.000Z'
    ]);
    expect(patient.timeline[1]).toMatchObject({
      type: 'review_cue',
      missingInformation: expect.arrayContaining([
        'Transport booking not yet confirmed.'
      ]),
      limitations: expect.arrayContaining([
        'Simulation-only discharge cue.'
      ])
    });
    expect(patient.timeline[2]).toMatchObject({
      type: 'audit_event',
      missingInformation: expect.arrayContaining([
        'Exact response time not captured.'
      ]),
      limitations: expect.arrayContaining([
        'Synthetic timeline entry contains incomplete information.'
      ])
    });
    expect(patient.missingInformation).toEqual(expect.arrayContaining([
      'Transport booking not yet confirmed.',
      'Exact response time not captured.'
    ]));
    expect(patient.limitations).toEqual(expect.arrayContaining([
      'Synthetic timeline only; no live patient data.',
      'Synthetic timeline entry contains incomplete information.'
    ]));
  });

  it('flattens the fixtures into a chronological feed with patient context', () => {
    const entries = buildPatientTimelineEntries();

    expect(entries).toHaveLength(9);
    expect(entries[0]).toMatchObject({
      patientId: 'SF-TL-001',
      patientName: 'Fictional Patient Alpha',
      type: 'vital',
      label: 'Baseline observations recorded',
      simulationOnly: true,
      simulationLabel: 'Simulation-only'
    });
    expect(entries[entries.length - 1]).toMatchObject({
      patientId: 'SF-TL-002',
      patientName: 'Fictional Patient Bravo',
      type: 'audit_event',
      label: 'Discharge education completed',
      simulationOnly: true
    });
    expect(entries.every((entry) => Array.isArray(entry.missingInformation))).toBe(true);
    expect(entries.every((entry) => Array.isArray(entry.limitations))).toBe(true);
    expect(entries.map((entry) => entry.timestamp)).toEqual([
      '2026-06-11T07:55:00.000Z',
      '2026-06-11T08:10:00.000Z',
      '2026-06-11T08:18:00.000Z',
      '2026-06-11T08:27:00.000Z',
      '2026-06-11T08:40:00.000Z',
      '2026-06-11T09:05:00.000Z',
      '2026-06-11T09:18:00.000Z',
      '2026-06-11T09:30:00.000Z',
      '2026-06-11T09:42:00.000Z'
    ]);
  });
});
