import { buildPrimaryCareReviewCues, getPrimaryCareTrafficState, summarisePrimaryCareContacts } from './primaryCareReview.js';

describe('primary-care structured review cues', () => {
  it('flags only explicit documentation and workflow gaps', () => {
    const cues = buildPrimaryCareReviewCues({
      requestSummaryRecorded: true,
      preferredContactRecorded: true,
      timeframeRecorded: true,
      followUpOwnerRecorded: false,
      continuityRequested: true,
      continuityOwnerRecorded: false,
      resultVisible: true,
      resultAcknowledged: false,
      referralPlanned: true,
      referralBackgroundComplete: false
    });

    expect(cues.map((cue) => cue.id)).toEqual(expect.arrayContaining([
      'results-follow-up-gap',
      'follow-up-owner-gap',
      'continuity-gap',
      'referral-completeness-gap'
    ]));
    expect(cues.every((cue) => /record|documentation|workflow|referral|continuity|follow-up/i.test(`${cue.title} ${cue.explanation}`))).toBe(true);
  });

  it('uses red amber and green as workflow completeness states', () => {
    expect(getPrimaryCareTrafficState({ requestSummaryRecorded: false })).toBe('red');
    expect(getPrimaryCareTrafficState({
      requestSummaryRecorded: true,
      preferredContactRecorded: false,
      timeframeRecorded: true,
      followUpOwnerRecorded: true
    })).toBe('amber');
    expect(getPrimaryCareTrafficState({
      requestSummaryRecorded: true,
      preferredContactRecorded: true,
      timeframeRecorded: true,
      followUpOwnerRecorded: true
    })).toBe('green');
  });

  it('summarises fictional workflow records without clinical recommendations', () => {
    const summary = summarisePrimaryCareContacts([
      { requestSummaryRecorded: false },
      { requestSummaryRecorded: true, preferredContactRecorded: false, timeframeRecorded: true, followUpOwnerRecorded: true },
      { requestSummaryRecorded: true, preferredContactRecorded: true, timeframeRecorded: true, followUpOwnerRecorded: true }
    ]);

    expect(summary).toMatchObject({ totalContacts: 3, documentationBlockers: 1, reviewItems: 2, completeRecords: 1 });
    expect(JSON.stringify(summary)).not.toMatch(/diagnos|prescrib|treatment recommendation|patient needs potassium|give potassium/i);
  });
});
