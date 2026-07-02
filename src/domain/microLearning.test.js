import { describe, expect, it } from 'vitest';
import {
  scoreMicroLearningModule,
  summariseMicroLearningModule
} from './microLearning.js';

describe('micro learning domain', () => {
  const module = {
    id: 'ward-communication-1',
    title: 'Ward communication check-in',
    ward: 'Day Care Unit',
    trust: 'Cityview Community Hospital',
    professions: ['nursing', 'physiotherapy'],
    topic: 'handover',
    format: 'micro',
    questions: [
      {
        id: 'q1',
        prompt: 'Which note best supports a clear handover?',
        options: ['Short room number only', 'Concern, action, outcome', 'No note needed'],
        correctIndex: 1,
        points: 2
      },
      {
        id: 'q2',
        prompt: 'What should be escalated to the registered nurse?',
        options: ['Missing follow-up detail', 'Ward coffee order', 'Door code'],
        correctIndex: 0,
        points: 3
      }
    ]
  };

  it('scores answered questions and returns a badge when the threshold is reached', () => {
    const result = scoreMicroLearningModule(module, {
      q1: 1,
      q2: 0
    });

    expect(result).toMatchObject({
      score: 5,
      maxScore: 5,
      badgeEarned: true
    });
    expect(result.pointsEarned).toBe(5);
    expect(result.correctAnswers).toBe(2);
  });

  it('summarises module metadata with a stable question list', () => {
    const summary = summariseMicroLearningModule(module);

    expect(summary).toMatchObject({
      id: 'ward-communication-1',
      title: 'Ward communication check-in',
      ward: 'Day Care Unit',
      trust: 'Cityview Community Hospital',
      topic: 'handover',
      format: 'micro',
      questionCount: 2
    });
    expect(summary.professions).toEqual(['nursing', 'physiotherapy']);
  });
});
