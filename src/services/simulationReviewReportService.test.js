import { describe, expect, it } from 'vitest';
import { getDemoScenarioById } from '../data/demoScenarios.js';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { getHospitalInsightsSnapshot } from './hospitalInsightsService.js';
import {
  buildSimulationReviewReportExportText,
  getSimulationReviewReportSnapshot
} from './simulationReviewReportService.js';

describe('simulation review report service', () => {
  it('returns deterministic simulation-only report data', () => {
    const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');
    const hospitalInsights = getHospitalInsightsSnapshot({ currentWardName: 'Day Care Unit' });
    const selectedScenario = getDemoScenarioById('day-care-treatment-pathway');
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

    const snapshot = getSimulationReviewReportSnapshot({
      patient,
      reviewSignals,
      hospitalInsights,
      selectedScenario
    });
    const exportText = buildSimulationReviewReportExportText(snapshot);

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
    expect(snapshot.selectedScenario).toMatchObject({
      id: 'day-care-treatment-pathway',
      label: 'Day Care treatment pathway review',
      description: 'Current day care treatment pathway with documentation and review cues for the same fictional ward.',
      currentWardName: 'Day Care Unit'
    });
    expect(snapshot.sourceStatus).toEqual({
      sourceType: 'simulation',
      connectedToLiveSystems: false,
      containsPatientData: false,
      lastUpdatedLabel: 'Static prototype data'
    });
    expect(exportText).toContain('SafeFlow Simulation Review Report');
    expect(exportText).toContain('Simulation boundary statement');
    expect(exportText).toContain('Simulation data only. Not connected to live NHS systems. Not for patient care.');
    expect(exportText).toContain(
      'This report does not provide diagnosis, treatment advice, risk prediction, or automated escalation.'
    );
    expect(exportText).toContain('All review cues and comparison signals require human review.');
    expect(exportText).toContain('Selected demo scenario');
    expect(exportText).toContain('Day Care treatment pathway review');
    expect(exportText).toContain('Simulated patient context');
    expect(exportText).toContain('Active patient-level review cues');
    expect(exportText).toContain('Ward comparison / Hospital Insights summary');
    expect(exportText).toContain('Learning and reflection points');
    expect(exportText).toContain('Human review note');
    expect(exportText).toContain('Future roadmap note');
    expect(exportText).toContain('Patient view -> review cues -> ward comparison -> hospital insights -> learning summary');
    expect(exportText).toContain('Documentation completeness');
    expect(
      getSimulationReviewReportSnapshot({ patient, reviewSignals, hospitalInsights, selectedScenario })
    ).toEqual(snapshot);
  });
});
