import { ChevronRight, FileText, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { buildSimulationReviewReportExportText } from '../services/simulationReviewReportService.js';
import { useModalFocusTrap } from './useModalFocusTrap.js';

const DRAWER_TRANSITION_MS = 220;

export function SimulationReviewReportButton({ isOpen = false, onClick = () => {} }) {
  return (
    <button
      aria-haspopup="dialog"
      aria-controls="simulation-review-report-dialog"
      aria-expanded={isOpen}
      className="secondary-action simulation-review-report-trigger"
      onClick={onClick}
      type="button"
    >
      <FileText aria-hidden="true" size={16} />
      Review report
    </button>
  );
}

export function SimulationReviewReportDrawer({ isOpen = false, onClose = () => {}, snapshot }) {
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

  async function handleCopyReport() {
    const exportText = buildSimulationReviewReportExportText(snapshot);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(exportText);
      } catch {
        // Simulation-only export: clipboard failures should not block the demo.
      }
    }
  }

  function handlePrintReport() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

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
    <div className={`review-report-overlay ${isVisible ? 'is-visible' : ''}`}>
      <div aria-hidden="true" className="review-report-backdrop" onClick={onClose} />
      <aside
        aria-labelledby="simulation-review-report-title"
        aria-modal="true"
        className={`review-report-drawer ${isVisible ? 'is-visible' : ''}`}
        id="simulation-review-report-dialog"
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
      >
        <header className="review-report-header">
          <div>
            <p className="eyebrow">Simulation summary</p>
            <h2 id="simulation-review-report-title">{snapshot.title}</h2>
            <p className="review-report-disclaimer">{snapshot.disclaimer}</p>
            <p className="review-report-roadmap">{snapshot.roadmapLine}</p>
            <p className="review-report-prototype-note">{snapshot.prototypeNote}</p>
            {snapshot.sourceStatus && (
              <div className="insights-source-note review-report-source-note" role="note" aria-label="Simulation data source status">
                <span className="insights-source-pill">Simulation source</span>
                <strong>{snapshot.sourceStatus.lastUpdatedLabel}</strong>
                <small>
                  Live systems: {snapshot.sourceStatus.connectedToLiveSystems ? 'connected' : 'not connected'} ·{' '}
                  Patient data: {snapshot.sourceStatus.containsPatientData ? 'present' : 'not present'}
                </small>
              </div>
            )}
          </div>
          <div className="review-report-header-actions">
            <button className="secondary-action review-report-copy-trigger" onClick={handleCopyReport} type="button">
              Copy report
            </button>
            <button className="secondary-action review-report-print-trigger" onClick={handlePrintReport} type="button">
              Print report
            </button>
            <button ref={closeButtonRef} aria-label="Close report" className="icon-action" onClick={onClose} type="button">
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </header>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Simulation boundary</h3>
              <p>Comparison summary for education, quality improvement, and human-led review.</p>
            </div>
          </div>
          <p className="review-report-boundary">{snapshot.boundaryDetail ?? snapshot.disclaimer}</p>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Patient review snapshot</h3>
              <p>Current simulated patient summary from the active ward view.</p>
            </div>
          </div>
          <div className="review-report-summary-grid">
            {snapshot.patientSummaryCards.map((card) => (
              <article className="review-report-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Active review cues</h3>
              <p>Review cues are designed to support discussion, documentation review, education, and human oversight.</p>
            </div>
          </div>
          <div className="review-report-cue-list">
            {snapshot.activeReviewCues.map((cue) => (
              <article className={`review-report-cue-card review-report-cue-${slugify(cue.priorityLabel || 'Review')}`} key={cue.id}>
                <p className="review-report-cue-meta">
                  <span>{cue.categoryLabel}</span>
                  <span>{cue.priorityLabel}</span>
                </p>
                <strong>{cue.title}</strong>
                <p>{cue.explanation}</p>
                {cue.evidenceLabels.length > 0 && (
                  <ul className="review-report-evidence">
                    {cue.evidenceLabels.map((label) => (
                      <li key={`${cue.id}-${label}`}>{label}</li>
                    ))}
                  </ul>
                )}
                {cue.freshnessLabel && <p className="review-report-cue-freshness">{cue.freshnessLabel}</p>}
                {cue.missingDataNotes.length > 0 && (
                  <ul className="review-report-evidence">
                    {cue.missingDataNotes.map((label) => (
                      <li key={`${cue.id}-missing-${label}`}>{label}</li>
                    ))}
                  </ul>
                )}
                <p className="review-report-cue-action">{cue.humanReviewAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Ward comparison snapshot</h3>
              <p>Patient-level cues are shown alongside hospital-level mock benchmarks.</p>
            </div>
          </div>
          <div className="review-report-summary-grid">
            {snapshot.wardComparisonSummaryCards.map((card) => (
              <article className="review-report-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
          <div className="table-scroll review-report-table-scroll">
            <table aria-label="Simulation review comparison" className="review-report-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current ward</th>
                  <th>Hospital average</th>
                  <th>Comparison signal</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.wardComparisonRows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      <span>{row.label}</span>
                      <small>{row.description}</small>
                    </th>
                    <td>{row.currentLabel}</td>
                    <td>{row.hospitalAverageLabel}</td>
                    <td>{row.comparisonSignal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="review-report-interpretation-list" aria-label="Review interpretation cues">
            {snapshot.interpretationCues.map((cue) => (
              <p key={cue}>{cue}</p>
            ))}
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Learning / reflection points</h3>
              <p>Useful for ward managers, clinical educators, nurses, digital safety leads, and innovation teams.</p>
            </div>
          </div>
          <ul className="review-report-learning-list">
            {snapshot.learningPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Human review note</h3>
              <p>All outputs remain simulation-only and require human review.</p>
            </div>
          </div>
          <p className="review-report-boundary">{snapshot.humanReviewNote}</p>
        </section>
      </aside>
    </div>
  );
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
