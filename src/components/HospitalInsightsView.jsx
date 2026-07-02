import Chart from 'chart.js/auto';
import { AlertTriangle, ArrowDownRight, Award, BarChart3, Building2, ChevronRight, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { scoreSimulatedTrend } from '../domain/patientJourneyTrendModel.js';
import {
  buildSimulatedRiskTrendChartData,
  buildWardComparisonChartData
} from '../services/dashboardChartDataService.js';
import { getHospitalInsightsSnapshot } from '../services/hospitalInsightsService.js';
import { SafetyBanner } from './SafetyBanner.jsx';

const SUMMARY_CARD_ICONS = {
  current: BarChart3,
  average: Building2,
  best: Award,
  lowest: ArrowDownRight,
  cues: AlertTriangle
};

const CHART_COLORS = {
  brand: '#005eb8',
  brandDark: '#003087',
  average: '#617083',
  grid: '#dbe7f5',
  text: '#53657a',
  backdrop: '#eef5ff',
  warning: '#8a5a00'
};

export function HospitalInsightsView({
  currentWardName = 'Day Care Unit',
  hospitalName = 'Cityview Community Hospital',
  patient = null
}) {
  const snapshot = useMemo(
    () => getHospitalInsightsSnapshot({ currentWardName, hospitalName }),
    [currentWardName, hospitalName]
  );
  const wardComparisonData = useMemo(
    () => buildWardComparisonChartData(snapshot),
    [snapshot]
  );
  const trendFeatures = useMemo(
    () => buildPatientJourneyTwinFeatures(patient),
    [patient]
  );
  const trendSuggestion = useMemo(
    () => scoreSimulatedTrend(trendFeatures),
    [trendFeatures]
  );
  const trendChartData = useMemo(
    () => buildSimulatedRiskTrendChartData(trendSuggestion),
    [trendSuggestion]
  );
  const percentageComparisonRows = useMemo(
    () => wardComparisonData.metricRows.filter((row) => row.unit === '%'),
    [wardComparisonData.metricRows]
  );
  const wardChartConfig = useMemo(
    () => buildWardComparisonChartConfig(percentageComparisonRows, wardComparisonData.seriesLabels),
    [percentageComparisonRows, wardComparisonData.seriesLabels]
  );
  const trendChartConfig = useMemo(
    () => buildTrendChartConfig(trendChartData),
    [trendChartData]
  );
  const wardFallbackText = useMemo(
    () => buildWardFallbackText(percentageComparisonRows),
    [percentageComparisonRows]
  );
  const trendFallbackText = useMemo(
    () => buildTrendFallbackText(trendChartData),
    [trendChartData]
  );

  return (
    <section className="operational-view hospital-insights-view" aria-labelledby="hospital-insights-title">
      <header className="view-heading hospital-insights-heading">
        <div>
          <p className="eyebrow">Simulation insight</p>
          <h2 id="hospital-insights-title">Hospital insights</h2>
          <p className="hospital-insights-copy">
            {snapshot.introLine}
          </p>
          <p className="hospital-insights-copy">
            {snapshot.roadmapLine}
          </p>
          <p className="hospital-insights-copy hospital-insights-entity">
            Current ward: <strong>{snapshot.currentWardName}</strong> | Hospital: <strong>{snapshot.hospitalName}</strong>
          </p>
        </div>
        <p className="date-chip">{snapshot.sourceStatus?.lastUpdatedLabel ?? 'Static prototype data'}</p>
      </header>

      <SafetyBanner />

      {snapshot.sourceStatus && (
        <div className="insights-source-note hospital-insights-source-note" role="note" aria-label="Simulation data source status">
          <span className="insights-source-pill">
            {snapshot.sourceStatus.sourceType === 'simulation' ? 'Simulation source' : `${snapshot.sourceStatus.sourceType} source`}
          </span>
          <strong>{snapshot.sourceStatus.lastUpdatedLabel}</strong>
          <small>
            Live systems: {snapshot.sourceStatus.connectedToLiveSystems ? 'connected' : 'not connected'} |{' '}
            Patient data: {snapshot.sourceStatus.containsPatientData ? 'present' : 'not present'}
          </small>
        </div>
      )}

      <div className="insights-summary-grid">
        {snapshot.summaryCards.map((card) => {
          const Icon = SUMMARY_CARD_ICONS[card.variant ?? 'current'] ?? BarChart3;

          return (
            <article className={`insights-summary-card ${card.variant ?? 'current'}`} key={card.label}>
              <div className="insights-summary-card-icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hospital-insights-chart-grid">
        <ChartCard
          ariaLabel="Ward comparison bar chart showing current ward versus hospital average"
          chartConfig={wardChartConfig}
          fallbackText={wardFallbackText}
          heading="Ward comparison bar chart"
          icon={BarChart3}
          note="This ward vs hospital average"
        />

        <ChartCard
          ariaLabel="Patient Journey Twin simulated trend line chart"
          chartConfig={trendChartConfig}
          fallbackText={trendFallbackText}
          heading="Patient Journey Twin"
          icon={TrendingUp}
          note="Illustrative model output, not clinically validated"
          thresholds={trendChartData.thresholds}
          trendSummary={trendChartData.points.at(-1)?.displayValue ?? '0%'}
        />
      </div>
    </section>
  );
}

function ChartCard({
  ariaLabel,
  chartConfig,
  fallbackText,
  heading,
  icon: Icon,
  note,
  thresholds = [],
  trendSummary = ''
}) {
  return (
    <article className="hospital-insights-chart-card">
      <div className="section-heading">
        <ChevronRight aria-hidden="true" size={18} />
        <div>
          <h3>{heading}</h3>
          <p>{note}</p>
        </div>
        <Icon aria-hidden="true" className="hospital-insights-chart-icon" size={18} />
      </div>

      <div className="hospital-insights-chart-stage">
        <ChartCanvas ariaLabel={ariaLabel} config={chartConfig} />
      </div>

      {thresholds.length > 0 && (
        <div className="hospital-insights-chart-thresholds" aria-label="Trend thresholds">
          {thresholds.map((threshold) => (
            <span className="hospital-insights-chart-threshold" key={threshold.key}>
              {threshold.label}: {Math.round(threshold.value * 100)}%
            </span>
          ))}
        </div>
      )}

      {trendSummary && (
        <p className="hospital-insights-chart-summary">Current point: {trendSummary}</p>
      )}

      <p className="hospital-insights-chart-fallback">{fallbackText}</p>
    </article>
  );
}

function ChartCanvas({ ariaLabel, config }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const chart = new Chart(context, config);
    return () => {
      chart.destroy();
    };
  }, [config]);

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />;
}

function buildWardComparisonChartConfig(metricRows, seriesLabels) {
  const labels = metricRows.map((row) => row.metricLabel);
  const currentWardSeries = seriesLabels.find((series) => series.key === 'currentWard')?.label ?? 'Current ward';
  const hospitalAverageSeries = seriesLabels.find((series) => series.key === 'hospitalAverage')?.label ?? 'Hospital average';

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: currentWardSeries,
          data: metricRows.map((row) => row.currentValue),
          backgroundColor: CHART_COLORS.brand,
          borderColor: CHART_COLORS.brandDark,
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 12
        },
        {
          label: hospitalAverageSeries,
          data: metricRows.map((row) => row.hospitalAverage),
          backgroundColor: CHART_COLORS.average,
          borderColor: CHART_COLORS.average,
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 12
        }
      ]
    },
    options: {
      indexAxis: 'y',
      animation: false,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: CHART_COLORS.text,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${Math.round(Number(context.raw))}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: CHART_COLORS.grid
          },
          ticks: {
            color: CHART_COLORS.text,
            callback: (value) => `${value}%`
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: CHART_COLORS.text
          }
        }
      }
    }
  };
}

function buildTrendChartConfig(trendChartData) {
  return {
    type: 'line',
    data: {
      labels: trendChartData.points.map((point) => point.timeLabel),
      datasets: [
        {
          label: trendChartData.seriesLabel,
          data: trendChartData.points.map((point) => Math.round(point.riskScore * 100)),
          borderColor: CHART_COLORS.brand,
          backgroundColor: 'rgba(0, 94, 184, 0.14)',
          pointBackgroundColor: CHART_COLORS.brandDark,
          pointBorderColor: CHART_COLORS.brandDark,
          pointRadius: 4,
          pointHoverRadius: 4,
          tension: 0.32,
          fill: true
        }
      ]
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: CHART_COLORS.text,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${Math.round(Number(context.raw))}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: CHART_COLORS.grid
          },
          ticks: {
            color: CHART_COLORS.text
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: CHART_COLORS.grid
          },
          ticks: {
            color: CHART_COLORS.text,
            callback: (value) => `${value}%`
          }
        }
      }
    }
  };
}

function buildWardFallbackText(metricRows) {
  if (metricRows.length === 0) {
    return 'Current ward vs hospital average is unavailable because there are no percentage-based ward metrics to chart.';
  }

  const metricNames = metricRows.map((row) => row.metricLabel).join(', ');
  return `Current ward versus hospital average across ${metricNames}. Outstanding review cues stay in the KPI row.`;
}

function buildTrendFallbackText(trendChartData) {
  const firstPoint = trendChartData.points[0];
  const currentPoint = trendChartData.points.at(-1);

  if (!firstPoint || !currentPoint) {
    return 'Illustrative model output, not clinically validated. The simulated trend chart is unavailable.';
  }

  const direction = currentPoint.riskScore >= firstPoint.riskScore ? 'rises' : 'falls';
  return `Illustrative model output, not clinically validated. The simulated risk score ${direction} from ${firstPoint.displayValue} to ${currentPoint.displayValue} across ${trendChartData.points.length} points.`;
}

function buildPatientJourneyTwinFeatures(patient) {
  const safePatient = isPlainObject(patient) ? patient : {};
  const openTasks = Array.isArray(safePatient.tasks)
    ? safePatient.tasks.filter((task) => isPlainObject(task) && task.status !== 'Done')
    : [];
  const dischargeBlockers = Array.isArray(safePatient.dischargeBlockers) ? safePatient.dischargeBlockers : [];

  return {
    syntheticPatientRef: safeText(safePatient.id, 'unknown'),
    news2Normalized: clamp01(toNumber(safePatient.news2, 0) / 10),
    potassiumFallingFlag: hasPotassiumTrendDown(safePatient) ? 1 : 0,
    documentationQualityNorm: buildDocumentationQualityScore(safePatient),
    handoverCompleteNorm: clamp01(toNumber(safePatient.handoverComplete, 0) / 100),
    openTaskLoadNorm: clamp01(openTasks.length / 5),
    escalationStateNorm: buildEscalationStateScore(safePatient.escalation),
    dischargeBlockerNorm: clamp01(dischargeBlockers.length / 4)
  };
}

function buildDocumentationQualityScore(patient) {
  const checks = [
    hasText(patient.plan),
    hasText(patient.sbar?.recommendation),
    Array.isArray(patient.currentState) && patient.currentState.length > 0,
    Array.isArray(patient.auditTrail) && patient.auditTrail.length > 0,
    Array.isArray(patient.responseHistory) && patient.responseHistory.length > 0
  ];

  return Number(
    checks.reduce((total, present) => total + (present ? 0.2 : 0), 0).toFixed(2)
  );
}

function buildEscalationStateScore(value) {
  if (value === 'Active') {
    return 1;
  }

  if (value === 'Monitoring') {
    return 0.55;
  }

  if (value === 'None') {
    return 0.1;
  }

  return 0;
}

function hasPotassiumTrendDown(patient) {
  const potassiumSeries = Array.isArray(patient.labs?.potassium) ? patient.labs.potassium : [];
  if (potassiumSeries.length > 1) {
    const firstValue = toNumber(potassiumSeries[0]?.value, NaN);
    const lastValue = toNumber(potassiumSeries.at(-1)?.value, NaN);
    if (Number.isFinite(firstValue) && Number.isFinite(lastValue)) {
      return lastValue < firstValue;
    }
  }

  const currentState = Array.isArray(patient.currentState) ? patient.currentState : [];
  return currentState.some((entry) => String(entry ?? '').toLowerCase().includes('potassium falling'));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
