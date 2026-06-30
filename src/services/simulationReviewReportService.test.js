import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';
import { getSimulationReviewReportSnapshot } from './simulationReviewReportService.js';

describe('simulation review report service', () => {
  it('returns deterministic simulation-only report data', () => {
    const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');
    const hospitalInsights = getHospitalInsightsSnapshot({ currentWardName: 'Day Care Unit' });
    const reviewSignals = [
      {
        id: 'signal-1',
        category: 'documentation',
        priority: 'review',
        title: 'Review suggested: documentation gap',
        explanation: 'Simulation-only cue highlighting a documentation gap.',
        evidence: [{ label: 'Potassium falling' }],
        suggestedHumanReviewAction: 'Human review required: confirm the visible evidence and document the current review status.',
        freshness: { state: 'current', label: 'Latest simulated signal feed' },
        missingDataNotes: ['No clear electrolyte plan documented.']
      },
      {
        id: 'signal-2',
        category: 'handover',
        priority: 'watch',
        title: 'Review suggested: handover completeness',
        explanation: 'Simulation-only cue highlighting handover completeness.',
        evidence: [{ label: 'Handover 50% complete' }],
        suggestedHumanReviewAction: 'Human review required: confirm the handover detail and review the next step.',
        freshness: { state: 'current', label: 'Latest simulated signal feed' },
        missingDataNotes: []
      }
    ];

    const snapshot = getSimulationReviewReportSnapshot({ patient, reviewSignals, hospitalInsights });

    expect(snapshot.title).toBe('SafeFlow Simulation Review Report');
    expect(snapshot.disclaimer).toBe(
      'Simulation data only. This report is not connected to live NHS systems and must not be used for patient care.'
    );
    expect(snapshot.boundaryDetail).toBe(
      'No real NHS data is used. No live NHS systems are connected. No patient-identifiable information is used.'
    );
    expect(snapshot.roadmapLine).toBe(
      'Patient view -> review cues -> ward comparison -> hospital insights -> learning summary'
    );
    expect(snapshot.patientSummaryCards).toHaveLength(5);
    expect(snapshot.activeReviewCues).toHaveLength(2);
    expect(snapshot.wardComparisonSummaryCards).toHaveLength(5);
    expect(snapshot.wardComparisonRows).toHaveLength(4);
    expect(snapshot.learningPoints).toContain(
      'This prototype demonstrates how structured digital documentation and ward-level comparison could support learning, quality improvement, and human-led review.'
    );
    expect(snapshot.humanReviewNote).toMatch(/human review required/i);
    expect(snapshot.sourceStatus).toEqual({
      sourceType: 'simulation',
      connectedToLiveSystems: false,
      containsPatientData: false,
      lastUpdatedLabel: 'Static prototype data'
    });
    expect(getSimulationReviewReportSnapshot({ patient, reviewSignals, hospitalInsights })).toEqual(snapshot);
  });
});
