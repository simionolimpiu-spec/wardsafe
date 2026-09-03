export const PRIMARY_CARE_PATHWAY = 'primary-care';
export const WARD_PATHWAY = 'ward-care';

// Simulation-only sample data. All names below are invented for training and
// review demonstration; they are not real people and hold no real patient
// data. The "(sample)" markers and the app's simulation banners keep that
// boundary visible, per the project safety specs (AGENTS.md).
const sharedContacts = [
  {
    id: 'PC-104',
    label: 'Margaret Ellison',
    requestType: 'Appointment request',
    channel: 'Online form',
    receivedAt: '08:12',
    assignedTo: 'Amara Okafor, Care Navigator',
    nextReview: '09:00',
    requestSummaryRecorded: true,
    preferredContactRecorded: true,
    timeframeRecorded: true,
    followUpOwnerRecorded: true,
    continuityRequested: true,
    continuityOwnerRecorded: false,
    resultVisible: false,
    resultAcknowledged: false,
    referralPlanned: false,
    referralBackgroundComplete: false
  },
  {
    id: 'PC-212',
    label: 'David Osei',
    requestType: 'Results query',
    channel: 'Telephone',
    receivedAt: '08:25',
    assignedTo: 'Sian Roberts, Practice Nurse',
    nextReview: '09:10',
    requestSummaryRecorded: true,
    preferredContactRecorded: true,
    timeframeRecorded: true,
    followUpOwnerRecorded: false,
    continuityRequested: false,
    continuityOwnerRecorded: false,
    resultVisible: true,
    resultAcknowledged: false,
    referralPlanned: false,
    referralBackgroundComplete: false
  },
  {
    id: 'PC-087',
    label: 'Joan Whitcombe',
    requestType: 'Care plan coordination',
    channel: 'Walk-in',
    receivedAt: '08:41',
    assignedTo: 'Tom Fielding, Care Coordinator',
    nextReview: '10:15',
    requestSummaryRecorded: true,
    preferredContactRecorded: false,
    timeframeRecorded: true,
    followUpOwnerRecorded: true,
    continuityRequested: true,
    continuityOwnerRecorded: true,
    resultVisible: false,
    resultAcknowledged: false,
    referralPlanned: false,
    referralBackgroundComplete: false
  },
  {
    id: 'PC-331',
    label: 'Ronald Pryce',
    requestType: 'Referral follow-up',
    channel: 'Online form',
    receivedAt: '09:03',
    assignedTo: 'Dr Helen Marsh, GP',
    nextReview: '10:30',
    requestSummaryRecorded: true,
    preferredContactRecorded: true,
    timeframeRecorded: false,
    followUpOwnerRecorded: true,
    continuityRequested: false,
    continuityOwnerRecorded: false,
    resultVisible: false,
    resultAcknowledged: false,
    referralPlanned: true,
    referralBackgroundComplete: false
  },
  {
    id: 'PC-405',
    label: 'Aisha Kadir',
    requestType: 'Administrative request',
    channel: 'Telephone',
    receivedAt: '09:18',
    assignedTo: 'Grace Bello, Practice Administrator',
    nextReview: '11:00',
    requestSummaryRecorded: true,
    preferredContactRecorded: true,
    timeframeRecorded: true,
    followUpOwnerRecorded: true,
    continuityRequested: false,
    continuityOwnerRecorded: false,
    resultVisible: false,
    resultAcknowledged: false,
    referralPlanned: false,
    referralBackgroundComplete: false
  }
];

export const primaryCareScenarios = [
  {
    id: 'primary-care-access-continuity',
    scenarioId: 'primary-care-access-continuity',
    wardId: 'riverside-practice',
    wardLabel: 'Riverside Practice',
    focusId: 'access-continuity',
    focusLabel: 'Access and continuity',
    description: 'Simulated contact requests with structured-information, continuity and follow-up documentation cues.',
    practiceName: 'Riverside Practice',
    networkName: 'Northshire Primary Care Network (sample)',
    dateLabel: 'Monday 29 August 2026',
    contacts: sharedContacts
  },
  {
    id: 'primary-care-referrals-results',
    scenarioId: 'primary-care-referrals-results',
    wardId: 'riverside-practice',
    wardLabel: 'Riverside Practice',
    focusId: 'referrals-results',
    focusLabel: 'Referrals and results',
    description: 'Simulated referral completeness and results follow-up documentation for structured human review.',
    practiceName: 'Riverside Practice',
    networkName: 'Northshire Primary Care Network (sample)',
    dateLabel: 'Monday 29 August 2026',
    contacts: sharedContacts.map((contact) => ({ ...contact }))
  }
];

export function getPrimaryCareScenarioOptions() {
  return primaryCareScenarios.map((scenario) => ({ ...scenario }));
}

export function getPrimaryCareScenario(scenarioId) {
  return primaryCareScenarios.find((scenario) => scenario.id === scenarioId) ?? primaryCareScenarios[0];
}
