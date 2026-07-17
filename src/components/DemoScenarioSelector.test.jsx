import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DemoScenarioSelector } from './DemoScenarioSelector.jsx';

describe('DemoScenarioSelector', () => {
  it('renders two labeled selects, preserves the simulation note, and emits resolved scenario ids', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DemoScenarioSelector
        description="Fictional patient and ward context."
        onChange={onChange}
        value="day-care-treatment-pathway"
      />
    );

    const wardSelect = screen.getByLabelText('Ward');
    const focusSelect = screen.getByLabelText('Review focus');
    expect(wardSelect).toBeInTheDocument();
    expect(focusSelect).toBeInTheDocument();
    expect(wardSelect).toHaveAccessibleDescription('Fictional patient and ward context.');
    expect(focusSelect).toHaveAccessibleDescription('Fictional patient and ward context.');

    await user.selectOptions(wardSelect, 'ward-surgical-alpha');

    expect(focusSelect).toHaveValue('documentation');
    expect(onChange).toHaveBeenLastCalledWith('ward-sim-surgical-01');

    await user.selectOptions(focusSelect, 'medicine-timing');

    expect(onChange).toHaveBeenLastCalledWith('ward-sim-surgical-04');
  });
});
