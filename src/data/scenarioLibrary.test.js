import { describe, expect, it } from 'vitest';
import { scanStrictSafetyLanguage } from '../domain/safetyLanguage.js';
import { discoveryScenarios } from './scenarioLibrary.js';

const DISALLOWED_VISIBLE_WORDING = /\b(action|diagnos(?:is|e|es|ing|tic))\b/i;
const NEW_SCENARIO_IDS = new Set([
  'scenario-respiratory-rate-first',
  'scenario-premet-worried-criterion'
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

  it('keeps the discovery scenario collection complete and uniquely identified', () => {
    const expectedKeys = ['id', 'title', 'wardContext', 'reviewPrompt', 'successSignals', 'evidenceExpected', 'hazards'];

    expect(discoveryScenarios).toHaveLength(12);
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
        const safetyScan = scanStrictSafetyLanguage(formatScenarioCopy(scenario), {
          checkedLabel: scenario.id
        });

        expect(safetyScan).toMatchObject({
          passed: true,
          violations: []
        });
      }
    }
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

function formatScenarioCopy(scenario = {}) {
  return [
    `title: ${scenario.title}`,
    `wardContext: ${scenario.wardContext}`,
    `reviewPrompt: ${scenario.reviewPrompt}`,
    'successSignals:',
    ...(Array.isArray(scenario.successSignals) ? scenario.successSignals : []).map((item) => `- ${item}`),
    'evidenceExpected:',
    ...(Array.isArray(scenario.evidenceExpected) ? scenario.evidenceExpected : []).map((item) => `- ${item}`),
    'hazards:',
    ...(Array.isArray(scenario.hazards) ? scenario.hazards : []).map((item) => `- ${item}`)
  ].join('\n');
}
