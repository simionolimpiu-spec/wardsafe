import { describe, expect, it } from 'vitest';
import { getDemoScenarioById } from '../data/demoScenarios.js';
import { competencyPassportFixtures } from '../data/competencyPassportFixtures.js';
import { buildHeuristicCues } from '../domain/heuristicCueEngine.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';
import {
  buildWardQualitySafetyReviewExportText,
  getWardQualitySafetyReviewSnapshot
} from './wardQualitySafetyReviewService.js';

describe('ward quality and safety review service', () => {
  it('assembles heuristic cue engine flags, simulated trend summary, and competency passport evidence', () => {
    const scenario = getDemoScenarioById('day-care-treatment-pathway');
    const patient = scenario.patients.find((entry) => entry.id === scenario.selectedPatientId);
    const hospitalInsights = getHospitalInsightsSnapshot({
      currentWardName: scenario.currentWardName,
      hospitalName: scenario.hospitalName
    });
    const safetyFlag = evaluatePotassiumSafetyGap(patient);
    const reviewSignals = buildReviewSignals();
    const heuristicCues = buildHeuristicCues({ signals: reviewSignals, flag: safetyFlag });

    const snapshot = getWardQualitySafetyReviewSnapshot({
      patient,
      reviewSignals,
      heuristicCues,
      safetyFlag,
      hospitalInsights,
      selectedScenario: scenario
    });

    const exportText = buildWardQualitySafetyReviewExportText(snapshot);

    expect(snapshot.title).toBe('Ward Quality & Safety Review');
    expect(snapshot.disclaimer).toContain('simulation-only prototype');
    expect(snapshot.roadmapLine).toContain('Ward Safety Board');
    expect(snapshot.roadmapLine).toContain('Hospital Insights');
    expect(snapshot.heuristicCueCards).toHaveLength(5);
    expect(snapshot.heuristicCueCards[0]).toMatchObject({
      cue: 'Multiple simultaneous gaps',
      severityLabel: 'Blocker'
    });
    expect(snapshot.trendSummary).toMatchObject({
      simulationOnly: true,
      requiresHumanReview: true
    });
    expect(snapshot.competencyPassportSummary).toMatchObject({
      totalPoints: 21,
      verifiedEntryCount: 9,
      placementCount: 5
    });
    expect(snapshot.competencyPassportSummary.nmcCoverage).toMatchObject({
      coveredCount: 5,
      totalCount: 6,
      coveragePercent: 83
    });
    expect(exportText).toContain('Ward Quality & Safety Review');
    expect(exportText).toContain('simulation-only prototype');
    expect(exportText).toContain('fictional data');
    expect(exportText).toContain('human review required');
    expect(exportText).toContain('structured review support');
    expect(exportText).toContain('review cue');
    expect(exportText).toContain('risk-support signal');
    expect(exportText).toContain('documentation gap');
    expect(exportText).toContain('handover completeness issue');
    expect(exportText).toContain('discharge-readiness blocker');
    expect(exportText).toContain('escalation readiness cue');
    expect(exportText).toContain('exportable learning summary');
    expect(exportText).not.toMatch(
      /diagnosis|prescrib|treatment recommendation|AI decision|clinical decision engine|autonomous care|live NHS deployment|potassium recommendation|patient needs potassium|give potassium/i
    );
  });
});

function buildReviewSignals() {
  return [
    {
      id: 'signal-documentation-1',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap',
      explanation: 'Documentation gap visible in the simulation record.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-documentation-2',
      category: 'documentation',
      priority: 'review',
      title: 'Documentation gap follow-up',
      explanation: 'A second documentation gap remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-handover-1',
      category: 'handover',
      priority: 'watch',
      title: 'Handover completeness issue',
      explanation: 'Handover completeness issue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-escalation-1',
      category: 'escalation',
      priority: 'blocker',
      title: 'Escalation readiness cue',
      explanation: 'Escalation readiness cue remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-discharge-1',
      category: 'discharge',
      priority: 'blocker',
      title: 'Discharge-readiness blocker',
      explanation: 'Discharge-readiness blocker remains open.',
      simulationOnly: true,
      humanReviewRequired: true
    },
    {
      id: 'signal-deteriorating-obs-1',
      category: 'deteriorating-obs',
      priority: 'blocker',
      title: 'Deteriorating observations cue',
      explanation: 'Deteriorating observations cue remains visible.',
      simulationOnly: true,
      humanReviewRequired: true
    }
  ];
}
