import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { scanBoundaryAwareSafetyLanguage } from '../domain/safetyLanguage.js';
import { HospitalInsightsView } from './HospitalInsightsView.jsx';
import { PatientJourneyTwin } from './PatientJourneyTwin.jsx';

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

describe('safety language surface scans', () => {
  const patient = simulatedPatients.find((entry) => entry.id === 'DCU-031');

  beforeEach(() => {
    chartMocks.instances.length = 0;
    chartMocks.Chart.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ canvas: {} }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the Patient Journey Twin render strictly boundary-safe', () => {
    const { container } = render(<PatientJourneyTwin patient={patient} />);

    expect(screen.getByRole('heading', { name: /patient journey twin/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Patient Journey Twin render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
  });

  it('keeps the Hospital Insights view render strictly boundary-safe', () => {
    const { container } = render(
      <HospitalInsightsView
        currentWardName="Day Care Unit"
        hospitalName="Cityview Community Hospital"
        patient={patient}
      />
    );

    const view = screen.getByRole('region', { name: /hospital insights/i });

    expect(within(view).getByRole('img', { name: /patient journey twin simulated trend line chart/i })).toBeInTheDocument();

    const result = scanBoundaryAwareSafetyLanguage(container.textContent ?? '', {
      checkedLabel: 'Hospital Insights view render'
    });

    expect(result).toMatchObject({
      passed: true,
      violations: []
    });
    expect(chartMocks.Chart).toHaveBeenCalledTimes(2);
  });
});
