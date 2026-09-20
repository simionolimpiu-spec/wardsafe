import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';

const chartMocks = vi.hoisted(() => {
  const instances = [];
  const Chart = vi.fn().mockImplementation(function ChartMock(context, config) {
    this.context = context;
    this.config = config;
    this.destroy = vi.fn();
    instances.push(this);
  });

  return { Chart, instances };
});

vi.mock('chart.js/auto', () => ({
  default: chartMocks.Chart
}));

import { HospitalInsightsView } from './HospitalInsightsView.jsx';

describe('HospitalInsightsView', () => {
  const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');

  beforeEach(() => {
    chartMocks.instances.length = 0;
    chartMocks.Chart.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ canvas: {} }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the existing safety banner copy and the two Chart.js surfaces', () => {
    render(
      <HospitalInsightsView
        currentWardName="Day Care Unit"
        hospitalName="James Paget University Hospital"
        patient={patient}
      />
    );

    const view = screen.getByRole('region', { name: /hospital insights/i });

    expect(within(view).getByRole('heading', { name: /hospital insights/i })).toBeInTheDocument();
    expect(within(view).getByText(/simulation only/i)).toBeInTheDocument();
    expect(within(view).getByText(/fictional patient data only/i)).toBeInTheDocument();
    expect(within(view).getAllByText(/illustrative model output, not clinically validated/i).length).toBeGreaterThan(0);
    expect(
      within(view).getByRole('img', { name: /ward comparison bar chart/i })
    ).toBeInTheDocument();
    expect(
      within(view).getByRole('img', { name: /patient journey twin simulated trend line chart/i })
    ).toBeInTheDocument();
    expect(within(view).getByText(/current ward versus hospital average across/i)).toBeInTheDocument();
    expect(within(view).getByText(/simulated risk score/i)).toBeInTheDocument();

    expect(chartMocks.Chart).toHaveBeenCalledTimes(2);
    expect(chartMocks.instances[0].config.type).toBe('bar');
    expect(chartMocks.instances[1].config.type).toBe('line');
  });

  it('feeds review cues and safety flags into the simulated trend without rendering holdout metrics', () => {
    const lowSignalPatient = simulatedPatients.find((entry) => entry.id === 'DCU-052');
    const baseline = render(
      <HospitalInsightsView
        currentWardName="Ward 12"
        hospitalName="James Paget University Hospital"
        patient={lowSignalPatient}
      />
    );
    const baselineTrendValue = chartMocks.instances[1].config.data.datasets[0].data.at(-1);

    baseline.unmount();
    chartMocks.instances.length = 0;
    chartMocks.Chart.mockClear();

    render(
      <HospitalInsightsView
        currentWardName="Ward 12"
        hospitalName="James Paget University Hospital"
        heuristicCues={[
          { ruleId: 'escalation-readiness-cue', severity: 'blocker' },
          { ruleId: 'documentation-gap', severity: 'review' }
        ]}
        patient={lowSignalPatient}
        reviewSignals={[
          { category: 'deteriorating-obs', priority: 'blocker' },
          { category: 'documentation', priority: 'review' }
        ]}
        safetyFlag={{ level: 'medium' }}
      />
    );

    const enrichedTrendValue = chartMocks.instances[1].config.data.datasets[0].data.at(-1);
    const view = screen.getByRole('region', { name: /hospital insights/i });

    expect(enrichedTrendValue).toBeGreaterThan(baselineTrendValue);
    expect(within(view).getAllByText(/illustrative model output, not clinically validated/i).length).toBeGreaterThan(0);
    expect(within(view).queryByText(/accuracy|precision|recall/i)).not.toBeInTheDocument();
  });
});

describe('HospitalInsightsView night view (SF-297 prototype)', () => {
  const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');

  beforeEach(() => {
    chartMocks.instances.length = 0;
    chartMocks.Chart.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ canvas: {} }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts in the standard view and switches to the night zone with a pressed toggle', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<HospitalInsightsView patient={patient} />);

    const view = screen.getByRole('region', { name: /hospital insights/i });
    const toggle = within(view).getByRole('button', { name: 'Night view' });
    expect(view).not.toHaveClass('sf-zone-night');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(chartMocks.instances[0].config.options.animation).toBe(false);

    await user.click(toggle);

    expect(view).toHaveClass('sf-zone-night');
    expect(view).toHaveAttribute('data-sf-theme', 'night');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const nightBar = chartMocks.instances.at(-2).config;
    expect(nightBar.data.datasets[0].backgroundColor).toBe('#5fd0d9');
  });

  it('keeps every simulation and validation boundary visible in the night view', () => {
    render(<HospitalInsightsView defaultTheme="night" patient={patient} />);

    const view = screen.getByRole('region', { name: /hospital insights/i });
    expect(view).toHaveClass('sf-zone-night');
    expect(within(view).getByText(/simulation only/i)).toBeInTheDocument();
    expect(within(view).getByText(/fictional patient data only/i)).toBeInTheDocument();
    expect(within(view).getAllByText(/illustrative model output, not clinically validated/i).length).toBeGreaterThan(0);
    expect(within(view).getByText(/live systems: not connected/i)).toBeInTheDocument();
  });

  it('animates night charts once, and not at all when reduced motion is requested', () => {
    const { unmount } = render(<HospitalInsightsView defaultTheme="night" patient={patient} />);
    expect(chartMocks.instances[0].config.options.animation).toMatchObject({ duration: 600 });
    unmount();
    chartMocks.instances.length = 0;

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    render(<HospitalInsightsView defaultTheme="night" patient={patient} />);
    expect(chartMocks.instances[0].config.options.animation).toBe(false);
  });

  it('falls back to the standard view for an unknown theme', () => {
    render(<HospitalInsightsView defaultTheme="neon" patient={patient} />);
    expect(screen.getByRole('region', { name: /hospital insights/i })).toHaveAttribute('data-sf-theme', 'standard');
  });
});
