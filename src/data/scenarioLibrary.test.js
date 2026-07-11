import { describe, expect, it } from 'vitest';
import { scanStrictSafetyLanguage } from '../domain/safetyLanguage.js';
import { discoveryScenarios } from './scenarioLibrary.js';

const DISALLOWED_VISIBLE_WORDING = /\b(action|escalation|diagnos(?:is|e|es|ing|tic))\b/i;

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
