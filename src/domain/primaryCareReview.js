const COMPLETE_CUE = {
  id: 'record-complete',
  level: 'complete',
  traffic: 'green',
  title: 'Recorded fields complete',
  explanation: 'The explicit fields checked by this simulation contain reviewable entries.'
};

export function buildPrimaryCareReviewCues(record = {}) {
  const cues = [];

  if (!record.requestSummaryRecorded) {
    cues.push({
      id: 'contact-summary-gap',
      level: 'blocker',
      traffic: 'red',
      title: 'Contact summary documentation gap',
      explanation: 'A structured summary is not recorded in this simulated contact.'
    });
  }

  if (record.resultVisible && !record.resultAcknowledged) {
    cues.push({
      id: 'results-follow-up-gap',
      level: 'blocker',
      traffic: 'red',
      title: 'Results follow-up acknowledgement gap',
      explanation: 'The simulated record shows a visible result without a recorded acknowledgement.'
    });
  }

  if (!record.followUpOwnerRecorded) {
    cues.push({
      id: 'follow-up-owner-gap',
      level: 'review',
      traffic: 'amber',
      title: 'Follow-up owner not recorded',
      explanation: 'No named simulated owner is recorded for the next workflow step.'
    });
  }

  if (record.continuityRequested && !record.continuityOwnerRecorded) {
    cues.push({
      id: 'continuity-gap',
      level: 'review',
      traffic: 'amber',
      title: 'Continuity documentation gap',
      explanation: 'Continuity is marked as requested but the simulated continuity contact is not recorded.'
    });
  }

  if (record.referralPlanned && !record.referralBackgroundComplete) {
    cues.push({
      id: 'referral-completeness-gap',
      level: 'review',
      traffic: 'amber',
      title: 'Referral completeness issue',
      explanation: 'The referral background fields in this simulated record are incomplete.'
    });
  }

  if (!record.preferredContactRecorded) {
    cues.push({
      id: 'contact-preference-gap',
      level: 'review',
      traffic: 'amber',
      title: 'Contact preference not recorded',
      explanation: 'The preferred contact method is absent from this simulated record.'
    });
  }

  if (!record.timeframeRecorded) {
    cues.push({
      id: 'timeframe-gap',
      level: 'review',
      traffic: 'amber',
      title: 'Review timeframe not recorded',
      explanation: 'The agreed workflow review timeframe is not recorded.'
    });
  }

  return cues.length > 0 ? cues : [{ ...COMPLETE_CUE }];
}

export function summarisePrimaryCareContacts(records = []) {
  const cueSets = records.map((record) => buildPrimaryCareReviewCues(record));
  return {
    totalContacts: records.length,
    documentationBlockers: cueSets.filter((cues) => cues.some((cue) => cue.traffic === 'red')).length,
    reviewItems: cueSets.filter((cues) => cues.some((cue) => cue.traffic === 'amber')).length,
    completeRecords: cueSets.filter((cues) => cues.every((cue) => cue.traffic === 'green')).length,
    continuityRequests: records.filter((record) => record.continuityRequested).length,
    referralReviews: records.filter((record) => record.referralPlanned).length
  };
}

export function getPrimaryCareTrafficState(record) {
  const cues = buildPrimaryCareReviewCues(record);
  if (cues.some((cue) => cue.traffic === 'red')) return 'red';
  if (cues.some((cue) => cue.traffic === 'amber')) return 'amber';
  return 'green';
}
