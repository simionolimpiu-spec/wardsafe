import { describe, expect, it } from 'vitest';
import { guardSimulationSignalOutput, guardSimulationSignalOutputs } from './signalOutputGuard.js';

describe('guardSimulationSignalOutput', () => {
  it('replaces unsafe clinical language with safe fallbacks and flags the guard event', () => {
    const guarded = guardSimulationSignalOutput({
      id: 'simulation-signal-dcu-031-electrolyte-review',
      category: 'electrolyte-review',
      priority: 'review',
      title: 'Review suggested: prescribe potassium now',
      explanation: 'AI decided a potassium replacement treatment recommendation for live NHS use.',
      evidence: [
        { label: 'Patient needs potassium' },
        { label: 'Visible blood result' },
        { label: 'Potassium replacement pathway' }
      ],
      suggestedHumanReviewAction: 'Replace potassium immediately',
      simulationOnly: true,
      humanReviewRequired: true
    });

    expect(guarded).toMatchObject({
      id: 'simulation-signal-dcu-031-electrolyte-review',
      category: 'electrolyte-review',
      priority: 'review',
      simulationOnly: true,
      humanReviewRequired: true,
      unsafeClinicalAdvice: false,
      outputGuard: {
        flaggedUnsafeText: true
      }
    });
    expect(JSON.stringify(guarded)).not.toMatch(
      /prescrib|administer potassium|give potassium|patient needs potassium|diagnos|treatment recommendation|autonomous decision|clinical decision engine|live NHS use|replace potassium|potassium replacement/i
    );
  });

  it('guards a list of simulation signals deterministically', () => {
    const signals = [
      {
        id: 'simulation-signal-dcu-031-documentation',
        category: 'documentation',
        priority: 'review',
        title: 'Review suggested: documentation gap',
        explanation: 'Simulation-only cue.',
        evidence: [{ label: 'Missing plan documented in simulation.' }],
        suggestedHumanReviewAction: 'Human review required: confirm the visible record.',
        simulationOnly: true,
        humanReviewRequired: true
      },
      {
        id: 'simulation-signal-dcu-031-escalation',
        category: 'escalation',
        priority: 'watch',
        title: 'Review suggested: autonomous decision',
        explanation: 'clinical decision engine',
        evidence: [{ label: 'Visible escalation' }],
        suggestedHumanReviewAction: 'Review this',
        simulationOnly: true,
        humanReviewRequired: true
      }
    ];

    const first = guardSimulationSignalOutputs(signals);
    const second = guardSimulationSignalOutputs(signals);

    expect(first).toEqual(second);
    expect(first.every((signal) => signal.unsafeClinicalAdvice === false)).toBe(true);
  });
});
