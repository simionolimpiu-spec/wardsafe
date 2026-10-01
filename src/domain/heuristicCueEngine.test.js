import { describe, expect, it } from 'vitest';
import {
  buildHeuristicCues,
  evaluateDischargeReadinessBlockerCue,
  evaluateDocumentationGapCue,
  evaluateEscalationReadinessCue,
  evaluateHandoverCompletenessCue,
  evaluateMultipleSimultaneousGapsCue
} from './heuristicCueEngine.js';

const unresolvedFlag = {
  level: 'medium',
  title: 'Potassium review suggested'
};

describe('heuristicCueEngine', () => {
  it('raises a documentation gap cue when documentation and an unresolved flag coincide', () => {
    const cue = evaluateDocumentationGapCue({
      signals: [
        { id: 'signal-dcu-031-documentation', category: 'documentation' },
        { id: 'signal-dcu-031-electrolyte-review', category: 'electrolyte-review' }
      ],
      flag: unresolvedFlag
    });

    expect(cue).toMatchObject({
      ruleId: 'documentation-gap',
      cue: 'Documentation gap',
      severity: 'review',
      threshold: '1 documentation cue plus an unresolved safety flag'
    });
    expect(cue.contributingSignals).toEqual([
      'signal-dcu-031-documentation',
      'signal-dcu-031-electrolyte-review',
      'flag:medium'
    ]);
    expect(cue.rationale).toMatch(/documentation cue appears alongside an unresolved safety flag/i);
  });

  it('raises a handover completeness issue when handover and escalation cues are both visible', () => {
    const cue = evaluateHandoverCompletenessCue({
      signals: [
        { id: 'signal-ward-001-handover', category: 'handover' },
        { id: 'signal-ward-001-escalation', category: 'escalation' }
      ]
    });

    expect(cue).toMatchObject({
      ruleId: 'handover-completeness-issue',
      cue: 'Handover completeness issue',
      severity: 'review',
      threshold: '1 handover cue plus 1 escalation cue'
    });
    expect(cue.contributingSignals).toEqual([
      'signal-ward-001-handover',
      'signal-ward-001-escalation'
    ]);
    expect(cue.rationale).toMatch(/responsibility and next-step ownership/i);
  });

  it('raises an escalation readiness cue when escalation and deterioration cues align', () => {
    const cue = evaluateEscalationReadinessCue({
      signals: [
        { id: 'signal-ward-001-escalation', category: 'escalation' },
        { id: 'signal-ward-001-deteriorating-obs', category: 'deteriorating-obs' }
      ]
    });

    expect(cue).toMatchObject({
      ruleId: 'escalation-readiness-cue',
      cue: 'Escalation readiness cue',
      severity: 'blocker',
      threshold: '1 escalation cue plus 1 deterioration or sepsis-screen cue'
    });
    expect(cue.contributingSignals).toEqual([
      'signal-ward-001-escalation',
      'signal-ward-001-deteriorating-obs'
    ]);
    expect(cue.rationale).toMatch(/explicit human confirmation/i);
  });

  it('raises a discharge-readiness blocker when discharge and transfer cues remain open', () => {
    const cue = evaluateDischargeReadinessBlockerCue({
      signals: [
        { id: 'signal-ward-001-discharge', category: 'discharge' },
        { id: 'signal-ward-001-handover', category: 'handover' }
      ]
    });

    expect(cue).toMatchObject({
      ruleId: 'discharge-readiness-blocker',
      cue: 'Discharge-readiness blocker',
      severity: 'blocker',
      threshold: '1 discharge cue plus 1 handover or escalation cue'
    });
    expect(cue.contributingSignals).toEqual([
      'signal-ward-001-discharge',
      'signal-ward-001-handover'
    ]);
    expect(cue.rationale).toMatch(/discharge readiness is not settled/i);
  });

  it('raises a multiple simultaneous gaps cue when three workflow domains are open', () => {
    const cue = evaluateMultipleSimultaneousGapsCue({
      signals: [
        { id: 'signal-ward-001-documentation', category: 'documentation' },
        { id: 'signal-ward-001-handover', category: 'handover' },
        { id: 'signal-ward-001-discharge', category: 'discharge' }
      ]
    });

    expect(cue).toMatchObject({
      ruleId: 'multiple-simultaneous-gaps',
      cue: 'Multiple simultaneous gaps',
      severity: 'blocker',
      threshold: 'At least 3 distinct workflow cues'
    });
    expect(cue.contributingSignals).toEqual([
      'signal-ward-001-documentation',
      'signal-ward-001-handover',
      'signal-ward-001-discharge'
    ]);
    expect(cue.rationale).toMatch(/broader human review/i);
  });

  it('returns cues in a stable severity and rule order', () => {
    const signals = [
      { id: 'signal-dcu-031-documentation', category: 'documentation' },
      { id: 'signal-dcu-031-electrolyte-review', category: 'electrolyte-review' },
      { id: 'signal-dcu-031-handover', category: 'handover' },
      { id: 'signal-dcu-031-escalation', category: 'escalation' },
      { id: 'signal-dcu-031-deteriorating-obs', category: 'deteriorating-obs' },
      { id: 'signal-dcu-031-discharge', category: 'discharge' }
    ];
    const first = buildHeuristicCues({ signals, flag: unresolvedFlag });
    const second = buildHeuristicCues({
      signals: JSON.parse(JSON.stringify(signals)),
      flag: { ...unresolvedFlag }
    });

    expect(first).toEqual(second);
    expect(first.map((cue) => cue.ruleId)).toEqual([
      'multiple-simultaneous-gaps',
      'discharge-readiness-blocker',
      'escalation-readiness-cue',
      'documentation-gap',
      'handover-completeness-issue'
    ]);
  });
});
