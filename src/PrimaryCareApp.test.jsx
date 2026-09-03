import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryCareApp } from './PrimaryCareApp.jsx';

describe('SafeFlow primary-care pathway', () => {
  it('renders a fictional primary-care review board with explicit workflow semantics', () => {
    render(<PrimaryCareApp />);

    expect(screen.getByRole('heading', { name: 'SafeFlow' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primary Care Review Board' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Care setting' })).toHaveValue('primary-care');
    expect(screen.getByRole('combobox', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Primary care contact review list' })).toBeInTheDocument();
    expect(screen.getByText(/documentation status, not clinical severity/i)).toBeInTheDocument();
    expect(screen.getByText(/not for live clinical use/i)).toBeInTheDocument();
    expect(screen.getAllByText(/human review required/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^NHS$/)).not.toBeInTheDocument();
  });

  it('navigates primary-care workflow views and saves a browser-local review note', async () => {
    const user = userEvent.setup();
    render(<PrimaryCareApp />);

    const navigation = screen.getByRole('navigation', { name: 'SafeFlow workspace' });
    await user.click(within(navigation).getByRole('button', { name: /Results follow-up/i }));

    expect(screen.getByRole('heading', { name: 'Results Follow-up' })).toBeInTheDocument();
    expect(screen.getAllByText('PC-212').length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText(/Human review note/i), 'Fictional review completed.');
    await user.click(screen.getByRole('button', { name: /Save review note/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Review note saved for PC-212/i);
  });
});
