import { describe, expect, it } from 'vitest';
import modelData from '../data/patientJourneyTrendModel.json';
import { patientTimelineFixtures } from '../data/patientTimelineFixtures.js';
import { simulationRiskSupportEvaluationScenarios } from '../data/simulationRiskSupportEvaluationScenarios.js';
import { buildPatientTimelineCollection, buildPatientTimelineEntries } from './patientTimeline.js';
import {
  SAFETY_BOUNDARY_REQUIRED_CONCEPTS,
  scanBoundaryAwareSafetyLanguage,
  scanStrictSafetyLanguage
} from './safetyLanguage.js';
import { scoreSimulatedTrend } from './patientJourneyTrendModel.js';

const TIMELINE_REQUIRED_CONCEPT_IDS = [
  'simulation-only',
  'fictional-data',
  'no-real-patient-data',
  'not-live-clinical-deployment',
  'human-review-or-judgement'
];

const TIMELINE_REQUIRED_CONCEPTS = SAFETY_BOUNDARY_REQUIRED_CONCEPTS.filter((concept) =>
  TIMELINE_REQUIRED_CONCEPT_IDS.includes(concept.id)
);

describe('safety language regression scans', () => {
  it('keeps the patient timeline fixtures and flattened outputs boundary-safe', () => {
    const fixtureScan = scanBoundaryAwareSafetyLanguage(patientTimelineFixtures, {
      checkedLabel: 'patient timeline fixtures',
      requiredConcepts: TIMELINE_REQUIRED_CONCEPTS
    });
    const collection = buildPatientTimelineCollection();
    const collectionScan = scanBoundaryAwareSafetyLanguage(collection, {
      checkedLabel: 'patient timeline collection',
      requiredConcepts: TIMELINE_REQUIRED_CONCEPTS
    });
    const entryScan = scanStrictSafetyLanguage(buildPatientTimelineEntries(), {
      checkedLabel: 'patient timeline entries'
    });

    expect(fixtureScan).toMatchObject({
      passed: true,
      violations: [],
      missingBoundaryConcepts: []
    });
    expect(collectionScan).toMatchObject({
      passed: true,
      violations: [],
      missingBoundaryConcepts: []
    });
    expect(entryScan).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the trend-model fixture and scenario outputs free of prohibited wording', () => {
    const modelFixtureScan = scanStrictSafetyLanguage(modelData, {
      checkedLabel: 'patient journey trend model fixture'
    });

    expect(modelFixtureScan).toMatchObject({
      passed: true,
      violations: []
    });

    for (const scenario of simulationRiskSupportEvaluationScenarios) {
      const result = scoreSimulatedTrend(buildTrendFeaturesFromPatient(scenario.patient));
      const scan = scanStrictSafetyLanguage(result, {
        checkedLabel: scenario.scenarioId
      });

      expect(result.simulationOnly).toBe(true);
      expect(result.requiresHumanReview).toBe(true);
      expect(scan).toMatchObject({
        passed: true,
        violations: []
      });
    }
  });

  it('catches a planted prohibited phrase in a locally constructed bad fixture', () => {
    const badFixture = buildPatientTimelineCollection([
      {
        patientId: 'SF-TL-BAD',
        patientRef: 'TL-BAD',
        patientName: 'Fictional Patient Bad',
        wardName: 'Day Care Unit',
        simulationOnly: true,
        simulationLabel: 'Simulation-only',
        source: 'fictional timeline fixture',
        clinicalUse: 'not for live clinical deployment',
        timeline: [
          {
            timestamp: '2026-06-11T10:00:00.000Z',
            type: 'review cue',
            label: 'Planted bad cue',
            detail: 'This diagnostic system provides a diagnosis.',
            simulationOnly: true,
            simulationLabel: 'Simulation-only'
          }
        ]
      }
    ]);

    const result = scanStrictSafetyLanguage(badFixture, {
      checkedLabel: 'planted bad fixture'
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'diagnosis'
        })
      ])
    );
  });
});

function buildTrendFeaturesFromPatient(patient = {}) {
  const safePatient = patient ?? {};
  const tasks = Array.isArray(safePatient.tasks) ? safePatient.tasks : [];
  const dischargeBlockers = Array.isArray(safePatient.dischargeBlockers) ? safePatient.dischargeBlockers : [];
  const currentState = Array.isArray(safePatient.currentState) ? safePatient.currentState : [];
  const trajectory = Array.isArray(safePatient.trajectory) ? safePatient.trajectory : [];
  const uncertainty = Array.isArray(safePatient.uncertainty) ? safePatient.uncertainty : [];
  const labs = safePatient.labs && typeof safePatient.labs === 'object' ? safePatient.labs : {};

  return {
    syntheticPatientRef: typeof safePatient.id === 'string' ? safePatient.id : 'unknown',
    news2Normalized: toNormalisedNumber(safePatient.news2, 9),
    potassiumFallingFlag: hasPotassiumFallingCue({ currentState, trajectory, uncertainty, labs }) ? 1 : 0,
    documentationQualityNorm: typeof safePatient.plan === 'string' && safePatient.plan.trim() ? 1 : 0,
    handoverCompleteNorm: toNormalisedNumber(safePatient.handoverComplete, 100),
    openTaskLoadNorm: clamp01(tasks.length / 5),
    escalationStateNorm: /active/i.test(String(safePatient.escalation ?? '')) ? 1 : 0,
    dischargeBlockerNorm: clamp01(dischargeBlockers.length / 4)
  };
}

function hasPotassiumFallingCue({ currentState, trajectory, uncertainty, labs }) {
  const text = [
    ...currentState,
    ...trajectory,
    ...uncertainty,
    ...Object.values(labs).flat().map((entry) => `${entry?.time ?? ''} ${entry?.value ?? ''}`)
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');

  return text.includes('potassium falling') || text.includes('falling potassium') || text.includes('potassium 3.2');
}

function toNormalisedNumber(value, divisor) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return clamp01(number / divisor);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
