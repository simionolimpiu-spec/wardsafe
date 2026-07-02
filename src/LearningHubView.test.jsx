import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { microLearningFixtures } from './data/microLearningFixtures.js';
import { LearningHubView } from './LearningHubView.jsx';

describe('LearningHubView', () => {
  it('renders a fictional module picker and the active learning module', () => {
    render(<LearningHubView />);

    expect(screen.getByRole('region', { name: /learning hub/i })).toBeInTheDocument();
    expect(screen.getAllByText(/simulation-only prototype/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('combobox', { name: /module/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /score module/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: microLearningFixtures[0].title })).toBeInTheDocument();
    expect(screen.getByText(microLearningFixtures[0].trust)).toBeInTheDocument();
  });

  it('scores the selected answers and awards the badge for a full set of correct responses', async () => {
    const user = userEvent.setup();
    render(<LearningHubView />);

    const module = microLearningFixtures[0];

    for (const question of module.questions) {
      const questionGroup = screen.getByRole('group', { name: question.prompt });
      await user.click(within(questionGroup).getByLabelText(question.options[question.correctIndex]));
    }

    await user.click(screen.getByRole('button', { name: /score module/i }));

    expect(screen.getByRole('heading', { name: module.title })).toBeInTheDocument();
    expect(screen.getByText(/badge earned/i)).toBeInTheDocument();
    expect(screen.getByText(/points earned/i)).toBeInTheDocument();
  });
});
