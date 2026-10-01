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

  it('renders the escalation-pathway learning scenarios and scores the RRT SBAR module', async () => {
    const user = userEvent.setup();
    render(<LearningHubView />);

    const escalationPathwayModules = [
      'Recognising deterioration',
      'RRT SBAR practice',
      'Call-for-Concern SBAR note'
    ];

    for (const title of escalationPathwayModules) {
      expect(screen.getByRole('option', { name: new RegExp(title, 'i') })).toBeInTheDocument();
    }

    const module = microLearningFixtures.find((entry) => entry.id === 'escalation-pathway-rrt-sbar');
    expect(module).toBeDefined();

    await user.selectOptions(screen.getByRole('combobox', { name: /module/i }), module.id);

    expect(screen.getByRole('heading', { name: module.title })).toBeInTheDocument();
    expect(screen.getAllByText(/escalation-pathway learning scenario/i).length).toBeGreaterThan(0);

    for (const question of module.questions) {
      const questionGroup = screen.getByRole('group', { name: question.prompt });
      await user.click(within(questionGroup).getByLabelText(question.options[question.correctIndex]));
    }

    await user.click(screen.getByRole('button', { name: /score module/i }));

    expect(screen.getByText(/badge earned/i)).toBeInTheDocument();
    expect(screen.getByText(/points earned/i)).toBeInTheDocument();
  });
});
