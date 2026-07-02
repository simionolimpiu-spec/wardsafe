import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { competencyPassportFixtures } from './data/competencyPassportFixtures.js';
import { CompetencyPassportView } from './CompetencyPassportView.jsx';

describe('CompetencyPassportView', () => {
  it('renders a fictional passport with a student switcher, coverage summary, and local entry form', () => {
    render(<CompetencyPassportView />);

    const passportRegion = screen.getByRole('region', { name: /portable competency passport/i });
    expect(screen.getByRole('region', { name: /portable competency passport/i })).toBeInTheDocument();
    expect(screen.getAllByText(/simulation-only prototype/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not a formal competency assessment/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /student/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
    expect(screen.getByText(/nmc proficiency coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/proactivity/i)).toBeInTheDocument();
    expect(within(passportRegion).getByText(competencyPassportFixtures[0].studentName, { selector: 'strong' })).toBeInTheDocument();
    expect(within(passportRegion).getByText(new RegExp(competencyPassportFixtures[0].programme, 'i'))).toBeInTheDocument();
  });

  it('switches students and appends a verified local entry without persistence', async () => {
    const user = userEvent.setup();
    render(<CompetencyPassportView />);

    const studentSwitcher = screen.getByRole('combobox', { name: /student/i });
    await user.selectOptions(studentSwitcher, competencyPassportFixtures[1].studentId);

    const passportRegion = screen.getByRole('region', { name: /portable competency passport/i });
    expect(within(passportRegion).getByText(competencyPassportFixtures[1].studentName, { selector: 'strong' })).toBeInTheDocument();
    expect(within(passportRegion).getByText(new RegExp(competencyPassportFixtures[1].programme, 'i'))).toBeInTheDocument();

    await user.type(screen.getByLabelText(/procedure/i), 'Wound dressing check');
    await user.selectOptions(screen.getByLabelText(/participation level/i), 'performed-supervised');
    await user.type(screen.getByLabelText(/verifier name/i), 'Mina Patel');
    await user.selectOptions(screen.getByLabelText(/verifier role/i), 'nurse');
    await user.click(screen.getByRole('button', { name: /add entry/i }));

    expect(within(passportRegion).getByText('Wound dressing check')).toBeInTheDocument();
  });
});
