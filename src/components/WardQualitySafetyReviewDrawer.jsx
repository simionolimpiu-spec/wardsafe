import { ChevronRight, FileText, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { buildWardQualitySafetyReviewExportText } from '../services/wardQualitySafetyReviewService.js';
import { useModalFocusTrap } from './useModalFocusTrap.js';

const DRAWER_TRANSITION_MS = 220;

export function WardQualitySafetyReviewButton({ isOpen = false, onClick = () => {} }) {
  return (
    <button
      aria-haspopup="dialog"
      aria-controls="ward-quality-safety-review-dialog"
      aria-expanded={isOpen}
      className="secondary-action ward-quality-safety-review-trigger"
      onClick={onClick}
      type="button"
    >
      <FileText aria-hidden="true" size={16} />
      Ward quality & safety review
    </button>
  );
}

export function WardQualitySafetyReviewDrawer({ isOpen = false, onClose = () => {}, snapshot }) {
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
    const exportText = buildWardQualitySafetyReviewExportText(snapshot);
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
        aria-labelledby="ward-quality-safety-review-title"
        aria-modal="true"
        className={`review-report-drawer ${isVisible ? 'is-visible' : ''}`}
        id="ward-quality-safety-review-dialog"
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="review-report-header">
          <div>
            <p className="eyebrow">Structured review support</p>
            <h2 id="ward-quality-safety-review-title">{snapshot.title}</h2>
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
              <p>Simulation-only prototype for human review required.</p>
            </div>
          </div>
          <p className="review-report-boundary">{snapshot.boundaryDetail ?? snapshot.disclaimer}</p>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Ward Safety Board / Hospital Insights context</h3>
              <p>Fictional ward context and selected scenario.</p>
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
              <h3>Heuristic cue engine flags</h3>
              <p>Review cues and risk-support signals for structured review support.</p>
            </div>
          </div>
          <div className="review-report-cue-list">
            {snapshot.heuristicCueCards.map((cue) => (
              <article className={`review-report-cue-card review-report-cue-${slugify(cue.severityLabel || 'Review')}`} key={cue.id}>
                <p className="review-report-cue-meta">
                  <span>{cue.severityLabel}</span>
                  <span>{cue.cue}</span>
                </p>
                <p>{cue.rationale}</p>
                {cue.contributingSignals.length > 0 && (
                  <ul className="review-report-evidence">
                    {cue.contributingSignals.map((label) => (
                      <li key={`${cue.id}-${label}`}>{label}</li>
                    ))}
                  </ul>
                )}
                {cue.threshold && <p className="review-report-cue-action">{cue.threshold}</p>}
              </article>
            ))}
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Simulation-risk trend summary</h3>
              <p>Simulated trend signal for human review.</p>
            </div>
          </div>
          <div className="review-report-summary-grid">
            {snapshot.trendSummaryCards.map((card) => (
              <article className="review-report-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
          <ul className="review-report-learning-list">
            {snapshot.trendLearningPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Competency Passport verified-learning evidence</h3>
              <p>Deterministic summary from the existing fictional fixtures.</p>
            </div>
          </div>
          <div className="review-report-summary-grid">
            {snapshot.competencyPassportCards.map((card) => (
              <article className="review-report-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
          <div className="review-report-interpretation-list" aria-label="Competency Passport learning points">
            {snapshot.competencyLearningPoints.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
          <div className="table-scroll review-report-table-scroll">
            <table aria-label="Competency Passport verified learning evidence" className="review-report-table">
              <thead>
                <tr>
                  <th>Placement</th>
                  <th>Points</th>
                  <th>Verified entries</th>
                  <th>Procedures</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.competencyPassportPlacementCards.map((card) => (
                  <tr key={card.id}>
                    <th scope="row">
                      <span>{card.label}</span>
                      <small>{card.note}</small>
                    </th>
                    <td>{card.value}</td>
                    <td>{card.detail}</td>
                    <td>{card.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Ward-level learning assurance (simulation)</h3>
              <p>Aggregate, non-identifying learning counts. No individual staff names, scores, or ranking.</p>
            </div>
          </div>
          <div className="review-report-summary-grid">
            {(snapshot.wardLearningAssuranceCards ?? []).map((card) => (
              <article className="review-report-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
          <div className="review-report-interpretation-list" aria-label="Ward-level learning assurance">
            {(snapshot.wardLearningAssurancePoints ?? []).map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
        </section>

        <section className="review-report-section">
          <div className="section-heading">
            <ChevronRight aria-hidden="true" size={18} />
            <div>
              <h3>Exportable learning summary</h3>
              <p>Human review required. Simulation-only prototype. Fictional data only.</p>
            </div>
          </div>
          <p className="review-report-boundary">{snapshot.humanReviewNote}</p>
          <p className="review-report-boundary">{snapshot.exportFootnote}</p>
          <div className="review-report-interpretation-list" aria-label="Exportable learning summary">
            {snapshot.reviewCueLearningPoints.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
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
