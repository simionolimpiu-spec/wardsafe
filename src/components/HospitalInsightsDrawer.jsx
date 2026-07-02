import { AlertTriangle, ArrowDownRight, Award, BarChart3, Building2, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useModalFocusTrap } from './useModalFocusTrap.js';

const DRAWER_TRANSITION_MS = 220;

const summaryCardIcons = {
  current: BarChart3,
  average: Building2,
  best: Award,
  lowest: ArrowDownRight,
  cues: AlertTriangle
};

export function HospitalInsightsButton({ isOpen = false, onClick = () => {} }) {
  return (
    <button
      aria-haspopup="dialog"
      aria-controls="hospital-insights-dialog"
      aria-expanded={isOpen}
      className="secondary-action hospital-insights-trigger"
      onClick={onClick}
      type="button"
    >
      <BarChart3 aria-hidden="true" size={16} />
      Hospital insights
    </button>
  );
}

export function HospitalInsightsDrawer({ isOpen = false, onClose = () => {}, snapshot }) {
  const [isRendered, setIsRendered] = useState(Boolean(isOpen && snapshot));
  const [isVisible, setIsVisible] = useState(false);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const shouldAnimate =
    typeof window !== 'undefined' &&
    import.meta.env.MODE !== 'test' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useModalFocusTrap({
    active: isRendered,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose
  });

  useEffect(() => {
    if (isOpen && snapshot) {
      setIsRendered(true);
      if (!shouldAnimate) {
        setIsVisible(true);
        return undefined;
      }
      const scheduleFrame = window.requestAnimationFrame ?? ((callback) => window.setTimeout(callback, 16));
      const cancelFrame = window.cancelAnimationFrame ?? window.clearTimeout;
      const frame = scheduleFrame(() => setIsVisible(true));
      return () => cancelFrame(frame);
    }

    if (!shouldAnimate) {
      setIsVisible(false);
      setIsRendered(false);
      return undefined;
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setIsRendered(false), DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [isOpen, shouldAnimate, snapshot]);

  if (!isRendered || !snapshot) {
    return null;
  }

  return (
    <div className={`hospital-insights-overlay ${isVisible ? 'is-visible' : ''}`}>
      <div aria-hidden="true" className="hospital-insights-backdrop" onClick={onClose} />
      <aside
        aria-labelledby="hospital-insights-title"
        aria-modal="true"
        className={`hospital-insights-drawer ${isVisible ? 'is-visible' : ''}`}
        id="hospital-insights-dialog"
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
      >
        <header className="insights-header">
          <div>
            <p className="eyebrow">Simulation insight</p>
            <h2 id="hospital-insights-title">Hospital insights</h2>
            <p className="insights-subtitle">
              Comparison signals only. Fictional wards. Human review required.
            </p>
            <p className="insights-lede">{snapshot.introLine}</p>
            <p className="insights-roadmap">{snapshot.roadmapLine}</p>
            <p className="insights-hospital">Hospital benchmark: {snapshot.hospitalName}</p>
            <p className="insights-ward">Current ward: {snapshot.currentWardName}</p>
            {snapshot.sourceStatus && (
              <div className="insights-source-note" role="note" aria-label="Simulation data source status">
                <span className="insights-source-pill">
                  {snapshot.sourceStatus.sourceType === 'simulation' ? 'Simulation source' : `${snapshot.sourceStatus.sourceType} source`}
                </span>
                <strong>{snapshot.sourceStatus.lastUpdatedLabel}</strong>
                <small>
                  Live systems: {snapshot.sourceStatus.connectedToLiveSystems ? 'connected' : 'not connected'} ·{' '}
                  Patient data: {snapshot.sourceStatus.containsPatientData ? 'present' : 'not present'}
                </small>
              </div>
            )}
          </div>
          <button ref={closeButtonRef} aria-label="Close insights" className="icon-action" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="insights-summary-grid">
          {snapshot.summaryCards.map((card) => {
            const Icon = summaryCardIcons[card.variant ?? 'current'] ?? Building2;

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

        <section className="insights-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Ward vs hospital comparison</h3>
              <p>Deterministic mock data keeps the comparison stable for review.</p>
            </div>
          </div>
          <WardComparisonChart metrics={snapshot.chartMetrics} />
        </section>

        <section className="insights-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Ward comparison table</h3>
              <p>Best and lowest fictional wards are ranked per metric.</p>
            </div>
          </div>
          <div className="table-scroll insights-table-scroll">
            <table aria-label="Ward comparison" className="insights-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current ward</th>
                  <th>Hospital average</th>
                  <th>Best fictional ward</th>
                  <th>Lowest fictional ward</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.comparisonRows.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row">
                      <span>{metric.label}</span>
                      <small>{metric.description}</small>
                    </th>
                    <td>{metric.currentLabel}</td>
                    <td>{metric.hospitalAverageLabel}</td>
                    <td>
                      {metric.bestWardName}
                      <small>{metric.bestLabel}</small>
                    </td>
                    <td>
                      {metric.lowestWardName}
                      <small>{metric.lowestLabel}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="insights-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Simulation insight cues</h3>
              <p>Short review cues framed for human follow-up.</p>
            </div>
          </div>
          <div className="insight-cue-list">
            {snapshot.insightCues.map((cue) => (
              <InsightCueCard cue={cue} key={cue} />
            ))}
          </div>
          <p className="insights-boundary">{snapshot.boundaryNote}</p>
        </section>
      </aside>
    </div>
  );
}

export function WardComparisonChart({ metrics = [] }) {
  return (
    <div className="comparison-chart" role="img" aria-label="Ward versus hospital comparison chart">
      {metrics.map((metric) => (
        <article className="comparison-row" key={metric.key}>
          <div className="comparison-metric-copy">
            <strong>{metric.label}</strong>
            <small>{metric.description}</small>
          </div>
          <div className="comparison-bars">
            <div className="comparison-band">
              <div className="comparison-band-label">
                <span>Current ward</span>
                <strong>{metric.currentLabel}</strong>
              </div>
              <div className="comparison-track" aria-hidden="true">
                <span
                  className="comparison-fill current"
                  style={{ width: `${Math.max(0, Math.min(100, metric.currentValue))}%` }}
                />
              </div>
            </div>
            <div className="comparison-band">
              <div className="comparison-band-label">
                <span>Hospital average</span>
                <strong>{metric.hospitalAverageLabel}</strong>
              </div>
              <div className="comparison-track" aria-hidden="true">
                <span
                  className="comparison-fill average"
                  style={{ width: `${Math.max(0, Math.min(100, metric.hospitalAverage))}%` }}
                />
              </div>
            </div>
          </div>
          <div className={`comparison-delta ${metric.deltaFromAverage >= 0 ? 'positive' : 'negative'}`}>
            <strong>{metric.deltaFromAverage >= 0 ? '+' : '-'}{Math.abs(Math.round(metric.deltaFromAverage))}</strong>
            <span>vs avg</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function InsightCueCard({ cue }) {
  return (
    <article className="insight-cue-card">
      <strong>Review cue</strong>
      <p>{cue}</p>
    </article>
  );
}
