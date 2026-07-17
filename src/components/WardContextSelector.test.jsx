import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getDemoScenarioOptions } from '../data/demoScenarios.js';
import { WardContextSelector, getWardContextOptions } from './WardContextSelector.jsx';

describe('WardContextSelector', () => {
  it('groups scenario data into ward options and changes to the ward context', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = getDemoScenarioOptions();
    const wards = getWardContextOptions(options);

    render(<WardContextSelector onChange={onChange} options={options} value="day-care-treatment-pathway" />);

    expect(wards.some((ward) => ward.label === 'Day Care')).toBe(true);
    expect(screen.getByRole('combobox', { name: 'Ward' })).toHaveValue('day-care');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ward' }), 'acute-medical');
    expect(onChange).toHaveBeenCalledWith('amu-discharge-readiness-review');
  });
});
