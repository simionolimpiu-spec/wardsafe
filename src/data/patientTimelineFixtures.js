export const patientTimelineFixtures = [
  {
    patientId: 'SF-TL-001',
    patientRef: 'TL-A001',
    patientName: 'Fictional Patient Alpha',
    wardName: 'Day Care Unit',
    simulationOnly: true,
    simulationLabel: 'Simulation-only',
    source: 'fictional timeline fixture',
    clinicalUse: 'not for live clinical deployment',
    missingInformation: [
      'Magnesium result not visible.',
      'Electrolyte plan not fully documented.'
    ],
    limitations: [
      'Synthetic timeline only; no live patient data.',
      'No live EPR, pathology, or observations integration.'
    ],
    timeline: [
      {
        timestamp: '2026-06-11T07:55:00.000Z',
        type: 'vital',
        label: 'Baseline observations recorded',
        detail: 'Simulation-only NEWS2 2 with mild breathlessness and weakness noted.',
        missingInformation: [],
        limitations: ['Simulation-only observation entry.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T08:10:00.000Z',
        type: 'lab',
        label: 'Potassium 3.3 mmol/L',
        detail: 'Synthetic lab result shows a falling potassium trend.',
        missingInformation: ['Magnesium result not visible.'],
        limitations: ['Simulation-only laboratory entry.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T08:18:00.000Z',
        type: 'review_cue',
        label: 'Electrolyte review cue',
        detail: 'Human review requested to confirm the electrolyte plan and document the response.',
        missingInformation: ['Electrolyte plan not fully documented.'],
        limitations: ['Simulation-only review cue; not validated clinical decision support.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T08:27:00.000Z',
        type: 'audit_event',
        label: 'Escalation logged',
        detail: 'Simulation audit records that the review cue was acknowledged by the ward team.',
        missingInformation: ['Exact response time not captured.'],
        limitations: ['Synthetic audit event only.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T08:40:00.000Z',
        type: 'audit_event',
        label: 'Handover note updated',
        detail: 'Fictional handover note updated with the review request and follow-up task.',
        missingInformation: [],
        limitations: ['Simulation-only audit entry.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      }
    ]
  },
  {
    patientId: 'SF-TL-002',
    patientRef: 'TL-B002',
    patientName: 'Fictional Patient Bravo',
    wardName: 'Acute Medical Unit',
    simulationOnly: true,
    simulationLabel: 'Simulation-only',
    source: 'fictional timeline fixture',
    clinicalUse: 'not for live clinical deployment',
    missingInformation: ['Transport booking not yet confirmed.'],
    limitations: [
      'Synthetic timeline only; no live patient data.',
      'No live discharge or transport integration.'
    ],
    timeline: [
      {
        timestamp: '2026-06-11T09:05:00.000Z',
        type: 'vital',
        label: 'NEWS2 1 recorded',
        detail: 'Simulation-only observations remain stable after morning review.',
        missingInformation: [],
        limitations: ['Simulation-only observation entry.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T09:18:00.000Z',
        type: 'lab',
        label: 'U&E panel stable',
        detail: 'Synthetic lab values remain within expected range.',
        missingInformation: [],
        limitations: ['Simulation-only laboratory entry.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T09:30:00.000Z',
        type: 'review_cue',
        label: 'Discharge checklist cue',
        detail: 'Human review requested to confirm medicines, follow-up and transport before discharge.',
        missingInformation: ['Transport booking not yet confirmed.'],
        limitations: ['Simulation-only discharge cue; not validated clinical decision support.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      },
      {
        timestamp: '2026-06-11T09:42:00.000Z',
        type: 'audit_event',
        label: 'Discharge education completed',
        detail: 'Simulation audit records that discharge education and safety-net advice were documented.',
        missingInformation: [],
        limitations: ['Synthetic audit event only.'],
        simulationOnly: true,
        simulationLabel: 'Simulation-only'
      }
    ]
  }
];
