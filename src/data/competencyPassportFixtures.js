export const competencyPassportFixtures = [
  {
    studentId: 'SF-CP-001',
    studentName: 'Fictional Student Aisha Bennett',
    programme: 'Adult Nursing BSc',
    year: 2,
    source: 'fictional competency passport fixture',
    simulationOnly: true,
    clinicalUse: 'not for live clinical deployment',
    placements: [
      {
        placementId: 'cp-001-day-care',
        placementLabel: 'Day Care Unit',
        placementWard: 'Day Care Unit',
        placementTrust: 'Cityview Community Trust',
        period: '2026-05-04 to 2026-05-29'
      },
      {
        placementId: 'cp-001-amu',
        placementLabel: 'Acute Medical Unit',
        placementWard: 'Acute Medical Unit',
        placementTrust: 'Cityview Community Trust',
        period: '2026-06-01 to 2026-06-19'
      },
      {
        placementId: 'cp-001-community',
        placementLabel: 'Community Frailty Team',
        placementWard: 'Community Frailty Team',
        placementTrust: 'Riverbank Community Trust',
        period: '2026-06-22 to 2026-07-10'
      }
    ],
    entries: [
      {
        id: 'SF-CP-001-01',
        studentId: 'SF-CP-001',
        placementId: 'cp-001-day-care',
        procedure: 'Observation summary update',
        participationLevel: 'observed',
        date: '2026-05-06',
        verifier: { name: 'Mina Patel', role: 'nurse' },
        verified: true,
        points: 1,
        nmcProficiencies: ['communication', 'documentation-and-recording']
      },
      {
        id: 'SF-CP-001-02',
        studentId: 'SF-CP-001',
        placementId: 'cp-001-day-care',
        procedure: 'Patient comfort check',
        participationLevel: 'assisted',
        date: '2026-05-08',
        verifier: { name: 'Zara Mills', role: 'hca' },
        verified: true,
        points: 2,
        nmcProficiencies: ['person-centred-care']
      },
      {
        id: 'SF-CP-001-03',
        studentId: 'SF-CP-001',
        placementId: 'cp-001-amu',
        procedure: 'SBAR handover note',
        participationLevel: 'performed-supervised',
        date: '2026-06-03',
        verifier: { name: 'Ellis Grant', role: 'supervisor' },
        verified: true,
        points: 3,
        nmcProficiencies: ['communication', 'escalation-and-collaboration']
      },
      {
        id: 'SF-CP-001-04',
        studentId: 'SF-CP-001',
        placementId: 'cp-001-amu',
        procedure: 'Escalation update log',
        participationLevel: 'performed-independent',
        date: '2026-06-05',
        verifier: { name: 'Rowan Pierce', role: 'doctor' },
        verified: true,
        points: 4,
        nmcProficiencies: ['escalation-and-collaboration', 'documentation-and-recording']
      },
      {
        id: 'SF-CP-001-05',
        studentId: 'SF-CP-001',
        placementId: 'cp-001-community',
        procedure: 'Medicine reconciliation checklist',
        participationLevel: 'assisted',
        date: '2026-06-28',
        verifier: { name: 'Leanne Rowe', role: 'nurse' },
        verified: false,
        points: 2,
        nmcProficiencies: ['medicines-safety']
      }
    ]
  },
  {
    studentId: 'SF-CP-002',
    studentName: 'Fictional Student Noah Taylor',
    programme: 'Adult Nursing BSc',
    year: 3,
    source: 'fictional competency passport fixture',
    simulationOnly: true,
    clinicalUse: 'not for live clinical deployment',
    placements: [
      {
        placementId: 'cp-002-surgical',
        placementLabel: 'Surgical Assessment Unit',
        placementWard: 'Surgical Assessment Unit',
        placementTrust: 'Cityview Community Trust',
        period: '2026-05-11 to 2026-06-05'
      },
      {
        placementId: 'cp-002-respiratory',
        placementLabel: 'Respiratory Support Ward',
        placementWard: 'Respiratory Support Ward',
        placementTrust: 'Riverbank Community Trust',
        period: '2026-06-08 to 2026-07-02'
      }
    ],
    entries: [
      {
        id: 'SF-CP-002-01',
        studentId: 'SF-CP-002',
        placementId: 'cp-002-surgical',
        procedure: 'Wound review prep',
        participationLevel: 'observed',
        date: '2026-05-14',
        verifier: { name: 'Laura Chen', role: 'nurse' },
        verified: true,
        points: 1,
        nmcProficiencies: ['assessment-and-observation', 'documentation-and-recording']
      },
      {
        id: 'SF-CP-002-02',
        studentId: 'SF-CP-002',
        placementId: 'cp-002-surgical',
        procedure: 'Equipment safety sweep',
        participationLevel: 'assisted',
        date: '2026-05-18',
        verifier: { name: 'Joel Evans', role: 'hca' },
        verified: true,
        points: 2,
        nmcProficiencies: ['assessment-and-observation']
      },
      {
        id: 'SF-CP-002-03',
        studentId: 'SF-CP-002',
        placementId: 'cp-002-respiratory',
        procedure: 'Oxygen education note',
        participationLevel: 'performed-supervised',
        date: '2026-06-09',
        verifier: { name: 'Priya Nair', role: 'supervisor' },
        verified: true,
        points: 3,
        nmcProficiencies: ['communication', 'person-centred-care']
      },
      {
        id: 'SF-CP-002-04',
        studentId: 'SF-CP-002',
        placementId: 'cp-002-respiratory',
        procedure: 'Deterioration update',
        participationLevel: 'performed-independent',
        date: '2026-06-12',
        verifier: { name: 'Ben Hughes', role: 'doctor' },
        verified: true,
        points: 4,
        nmcProficiencies: ['escalation-and-collaboration', 'communication']
      },
      {
        id: 'SF-CP-002-05',
        studentId: 'SF-CP-002',
        placementId: 'cp-002-respiratory',
        procedure: 'Hand hygiene spot-check',
        participationLevel: 'observed',
        date: '2026-06-15',
        verifier: { name: 'Laura Chen', role: 'nurse' },
        verified: true,
        points: 1,
        nmcProficiencies: ['person-centred-care', 'documentation-and-recording']
      }
    ]
  }
];
