import { describe, expect, it } from 'vitest';
import { scanStrictSafetyLanguage } from '../domain/safetyLanguage.js';
import { biasAwarenessCues, discoveryScenarios, staffingContextNote } from './scenarioLibrary.js';

const DISALLOWED_VISIBLE_WORDING = /\b(action|diagnos(?:is|e|es|ing|tic))\b/i;
const NEW_SCENARIO_IDS = new Set([
  'scenario-respiratory-rate-first',
  'scenario-premet-worried-criterion',
  'scenario-alarm-fatigue-triage',
  'scenario-graded-assertiveness-speakup',
  'scenario-family-concern-marthas-rule'
]);

describe('deterioration learning scenario copy', () => {
  it('locks the visible copy for scenario-respiratory-rate-trend', () => {
    const scenario = getScenario('scenario-respiratory-rate-trend');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Rising respiratory rate trend
      wardContext: Fictional day care patient with sequential observations showing a rising respiratory rate trend.
      reviewPrompt: Can the nurse in charge see the change, the time stamps, and the missing context clearly enough for human review?
      successSignals:
      - The rising respiratory rate trend is visible in the simulation feed.
      - The cue stays simulation-only and human-review required.
      - The wording stays calm and explainable.
      evidenceExpected:
      - Respiratory rate trend
      - Observation timestamps
      - Human-review wording
      hazards:
      - Overstating the change
      - Hiding the trend in vague wording
      - Using treatment language"
    `);

    assertScenarioCopy(visibleCopy, /rising respiratory rate trend/i, 'scenario-respiratory-rate-trend');
  });

  it('locks the visible copy for scenario-new-onset-confusion', () => {
    const scenario = getScenario('scenario-new-onset-confusion');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: New-onset confusion
      wardContext: Fictional patient with new confusion noted in the simulation observations and otherwise steady workflow.
      reviewPrompt: Can the nurse in charge see what changed, why it flagged, and what human review is needed?
      successSignals:
      - New confusion is visible in the fictional record.
      - The cue stays simulation-only and human-review required.
      - The wording stays calm and explainable.
      evidenceExpected:
      - Confusion note
      - Observation timestamp
      - Human-review wording
      hazards:
      - Treating the note as a live alert
      - Hiding the change behind vague wording
      - Using treatment language"
    `);

    assertScenarioCopy(visibleCopy, /new confusion/i, 'scenario-new-onset-confusion');
  });

  it('locks the visible copy for scenario-falling-oxygen-saturation', () => {
    const scenario = getScenario('scenario-falling-oxygen-saturation');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Falling oxygen saturation
      wardContext: Fictional patient with a falling oxygen saturation trend across sequential observations.
      reviewPrompt: Can the nurse in charge see the trend, the timing, and the context clearly enough for human review?
      successSignals:
      - The falling oxygen saturation trend is visible in the simulation feed.
      - The cue stays simulation-only and human-review required.
      - The wording stays calm and explainable.
      evidenceExpected:
      - Oxygen saturation trend
      - Observation timestamps
      - Human-review wording
      hazards:
      - Overstating the change
      - Hiding the trend in vague wording
      - Using treatment language"
    `);

    assertScenarioCopy(visibleCopy, /falling oxygen saturation/i, 'scenario-falling-oxygen-saturation');
  });

  it('locks the visible copy for scenario-respiratory-rate-first', () => {
    const scenario = getScenario('scenario-respiratory-rate-first');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Respiratory-rate-first review
      wardContext: Fictional ward patient with other vital signs recorded, but respiratory rate not counted and auto-filled; a subtle respiratory-rate trend is the earliest review cue.
      reviewPrompt: Can the reviewer see that the respiratory rate is missing or auto-filled rather than actually counted, and that its subtle trend is the key early cue for human review without giving treatment advice?
      successSignals:
      - The missing or uncounted respiratory rate is visible within one minute
      - The respiratory rate trend is shown as a review cue, not a clinical conclusion
      - SBAR wording supports escalation documentation without clinical instruction
      evidenceExpected:
      - Respiratory rate trend
      - Missing RR count
      - Other vitals recorded
      - Latest SBAR note
      hazards:
      - Respiratory rate hidden inside the narrative
      - Auto-filled respiratory rate mistaken for a real count
      - Wording drifting into treatment advice"
    `);

    assertScenarioCopy(visibleCopy, /respiratory-rate-first|missing.*respiratory rate/i, 'scenario-respiratory-rate-first');
  });

  it('locks the visible copy for scenario-premet-worried-criterion', () => {
    const scenario = getScenario('scenario-premet-worried-criterion');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Pre-MET worried/concern escalation criterion
      wardContext: Fictional ward patient whose NEWS2 remains below the escalation threshold while the nurse documents being worried about a change.
      reviewPrompt: Does the board make the nurse's documented concern visible and ready for human review and escalation before objective thresholds trigger, without overstating urgency or implying a clinical conclusion?
      successSignals:
      - The nurse's documented concern is visible on the board
      - Escalation on concern is supported even with a sub-threshold NEWS2
      - The audit trail separates the concern flag from objective observations
      evidenceExpected:
      - NEWS2 (sub-threshold)
      - Documented nurse concern
      - Escalation status
      - Latest SBAR note
      hazards:
      - Concern flag buried behind the objective score
      - Hierarchy implied: the nurse cannot escalate without a number
      - Wording implying a clinical conclusion"
    `);

    assertScenarioCopy(visibleCopy, /worried|documented concern/i, 'scenario-premet-worried-criterion');
  });

  it('locks the visible copy for scenario-alarm-fatigue-triage', () => {
    const scenario = getScenario('scenario-alarm-fatigue-triage');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Alarm-fatigue / tiered-alarm triage
      wardContext: Fictional ward patient on a continuous-monitoring and deterioration-alerting stream where most alerts are non-actionable noise and one genuine early-deterioration cue risks being missed.
      reviewPrompt: Can the reviewer separate the actionable deterioration cue from non-actionable alarm noise and see a tiered/triaged view of which alerts warrant human review, without the tool making the clinical decision or auto-escalating?
      successSignals:
      - Non-actionable alarms are visibly distinguished from the actionable cue within one minute
      - The genuine early cue is not buried by alarm volume
      - Escalation/review remains a human decision, documented via SBAR without clinical instruction
      evidenceExpected:
      - Alarm stream
      - Actionable vs non-actionable flag
      - Observation trend behind the alert
      - Latest SBAR note
      hazards:
      - Genuine cue lost in alarm noise
      - Tool implying it has auto-triaged clinically
      - Alarm count treated as urgency without review"
    `);

    assertScenarioCopy(
      formatScenarioCopy(scenario, { includeHazards: false }),
      /alarm-fatigue|actionable.*cue/i,
      'scenario-alarm-fatigue-triage'
    );
  });

  it('locks the visible copy for scenario-graded-assertiveness-speakup', () => {
    const scenario = getScenario('scenario-graded-assertiveness-speakup');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Graded-assertiveness / speak-up escalation scripting
      wardContext: Fictional ward patient where a more junior nurse needs to escalate a concern up the hierarchy to a senior or doctor, with a structured concern statement available for review.
      reviewPrompt: Can the reviewer see a clear, documentable escalation script ready for human review that lets a nurse voice a concern up the hierarchy without the tool overstating urgency or making a clinical judgement?
      successSignals:
      - A graded, structured escalation/SBAR script is visible and editable
      - Speaking-up is framed as legitimate regardless of grade/hierarchy
      - The audit trail records the concern being raised and by whom, non-punitively
      evidenceExpected:
      - Structured escalation/SBAR script
      - Documented concern + owner
      - Escalation status
      - Communication-openness cue
      hazards:
      - Hierarchy implied: junior nurse must stay silent without a number
      - Script drifting into clinical instruction/diagnosis
      - Audit trail feeling blame-oriented rather than just-culture"
    `);

    assertScenarioCopy(
      formatScenarioCopy(scenario, { includeHazards: false }),
      /graded-assertiveness|speak-up|escalation script/i,
      'scenario-graded-assertiveness-speakup'
    );
  });

  it("locks the visible copy for scenario-family-concern-marthas-rule", () => {
    const scenario = getScenario('scenario-family-concern-marthas-rule');
    const visibleCopy = formatScenarioCopy(scenario);

    expect(visibleCopy).toMatchInlineSnapshot(`
      "title: Family concern / Martha's Rule pathway review
      wardContext: Fictional ward patient whose relative has raised a concern that the patient is 'not themselves' and may be deteriorating, while observations remain unremarkable; the ward advertises a Martha's-Rule-style patient/family escalation pathway but the family was not initially aware of it.
      reviewPrompt: Can the reviewer see the relative's concern as a legitimate, visible escalation trigger alongside staff observations, and see whether the family has been made aware of the patient/family escalation pathway for human review, without overstating urgency or making a clinical judgement?
      successSignals:
      - The family-raised concern is visible on the board with the same legitimacy as a staff concern
      - Awareness of the patient/family escalation pathway is a visible, documentable step
      - Escalation remains a human decision documented via SBAR without clinical instruction
      evidenceExpected:
      - Documented family concern
      - Pathway awareness check
      - Observation trend
      - Escalation status
      hazards:
      - Family concern treated as less credible than a staff observation
      - Pathway advertised but awareness never checked
      - Wording implying a clinical conclusion or automated escalation"
    `);

    assertScenarioCopy(
      formatScenarioCopy(scenario, { includeHazards: false }),
      /family concern|Martha's Rule|patient\/family escalation pathway/i,
      'scenario-family-concern-marthas-rule'
    );
  });

  it('keeps the discovery scenario collection complete and uniquely identified', () => {
    const expectedKeys = ['id', 'title', 'wardContext', 'reviewPrompt', 'successSignals', 'evidenceExpected', 'hazards'];

    expect(discoveryScenarios).toHaveLength(15);
    expect(new Set(discoveryScenarios.map((scenario) => scenario.id)).size).toBe(discoveryScenarios.length);

    for (const scenario of discoveryScenarios) {
      expect(Object.keys(scenario)).toEqual(expectedKeys);
      expect(scenario.id).toEqual(expect.any(String));
      expect(scenario.title).toEqual(expect.any(String));
      expect(scenario.wardContext).toEqual(expect.any(String));
      expect(scenario.reviewPrompt).toEqual(expect.any(String));
      expect(scenario.successSignals.length).toBeGreaterThan(0);
      expect(scenario.evidenceExpected.length).toBeGreaterThan(0);
      expect(scenario.hazards.length).toBeGreaterThan(0);

      if (NEW_SCENARIO_IDS.has(scenario.id)) {
        const safetyScan = scanStrictSafetyLanguage(formatScenarioCopy(scenario, { includeHazards: false }), {
          checkedLabel: scenario.id
        });

        expect(safetyScan).toMatchObject({
          passed: true,
          violations: []
        });
      }
    }
  });

  it('keeps the staffing context note shaped and strictly boundary-safe', () => {
    expect(staffingContextNote.title).toEqual(expect.any(String));
    expect(staffingContextNote.title.trim()).not.toBe('');
    expect(Array.isArray(staffingContextNote.points)).toBe(true);
    expect(staffingContextNote.points.length).toBeGreaterThan(0);
    for (const point of staffingContextNote.points) {
      expect(point).toEqual(expect.any(String));
      expect(point.trim()).not.toBe('');
    }
    expect(staffingContextNote.evidence).toEqual(expect.any(String));
    expect(staffingContextNote.evidence.trim()).not.toBe('');

    const safetyScan = scanStrictSafetyLanguage([
      staffingContextNote.title,
      ...staffingContextNote.points,
      staffingContextNote.evidence
    ].join('\n'), {
      checkedLabel: 'staffing context note'
    });

    expect(safetyScan).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the bias-awareness cues shaped, named and strictly boundary-safe', () => {
    expect(biasAwarenessCues.title).toBe('Notice your thinking');
    expect(Array.isArray(biasAwarenessCues.points)).toBe(true);
    expect(biasAwarenessCues.points).toEqual([
      'Anchoring — am I fixed on the first read of this fictional scenario?',
      'Premature closure — have I stopped looking too soon?',
      'Confirmation bias — am I only noticing details that fit my first impression?',
      'Availability bias — am I over-weighting a recent or memorable case?',
      'Framing effect — is the way this scenario is presented shaping what I notice?'
    ]);
    expect(biasAwarenessCues.evidence).toMatch(/Croskerry/i);
    expect(biasAwarenessCues.evidence).toMatch(/evidence-horizon-scan\.md/i);

    const safetyScan = scanStrictSafetyLanguage([
      biasAwarenessCues.title,
      ...biasAwarenessCues.points,
      biasAwarenessCues.evidence
    ].join('\n'), {
      checkedLabel: 'bias awareness cues'
    });

    expect(safetyScan).toMatchObject({
      passed: true,
      violations: []
    });
  });
});

function getScenario(id) {
  const scenario = discoveryScenarios.find((item) => item.id === id);

  expect(scenario).toBeDefined();

  return scenario;
}

function assertScenarioCopy(visibleCopy, reasonPattern, checkedLabel) {
  const safetyScan = scanStrictSafetyLanguage(visibleCopy, {
    checkedLabel
  });

  expect(visibleCopy).toMatch(reasonPattern);
  expect(visibleCopy).toMatch(/human review/i);
  expect(visibleCopy).not.toMatch(DISALLOWED_VISIBLE_WORDING);
  expect(safetyScan).toMatchObject({
    passed: true,
    violations: []
  });
}

function formatScenarioCopy(scenario = {}, { includeHazards = true } = {}) {
  const copy = [
    `title: ${scenario.title}`,
    `wardContext: ${scenario.wardContext}`,
    `reviewPrompt: ${scenario.reviewPrompt}`,
    'successSignals:',
    ...(Array.isArray(scenario.successSignals) ? scenario.successSignals : []).map((item) => `- ${item}`),
    'evidenceExpected:',
    ...(Array.isArray(scenario.evidenceExpected) ? scenario.evidenceExpected : []).map((item) => `- ${item}`)
  ];

  if (includeHazards) {
    copy.push(
      'hazards:',
      ...(Array.isArray(scenario.hazards) ? scenario.hazards : []).map((item) => `- ${item}`)
    );
  }

  return copy.join('\n');
}
