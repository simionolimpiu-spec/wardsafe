import { Activity, ClipboardCheck, HousePlus, ShieldCheck, Users } from 'lucide-react';
import { useRef, useState } from 'react';

const pathwaySteps = [
  {
    id: 'observation',
    title: 'Bedside observation',
    shortLabel: 'Observe',
    detail: 'Captures fictional ward observations and readiness cues before pressure becomes hidden.',
    avoids: 'Starting escalation without a visible view of the operational context.',
    captures: 'Simulation notes, staffing awareness, and handover readiness.',
    Icon: HousePlus
  },
  {
    id: 'signal',
    title: 'Risk signal',
    shortLabel: 'Signal',
    detail: 'Groups delayed review markers, documentation gaps, and workflow pressure into reviewable signals.',
    avoids: 'Scattered pressure cues that sit in separate lists and never join up.',
    captures: 'Calm signal clusters with review-oriented wording.',
    Icon: Activity
  },
  {
    id: 'review',
    title: 'Team review',
    shortLabel: 'Review',
    detail: 'Supports a team check of the signal picture before any escalation step is chosen.',
    avoids: 'Single-user interpretation becoming a proxy for team decision-making.',
    captures: 'Shared review prompts and named ownership.',
    Icon: Users
  },
  {
    id: 'pathway',
    title: 'Escalation pathway',
    shortLabel: 'Escalate',
    detail: 'Makes the next safe workflow action visible without claiming autonomous clinical judgement.',
    avoids: 'Ambiguous next steps once a risk marker is visible.',
    captures: 'Named route, next review action, and escalation ownership.',
    Icon: ShieldCheck
  },
  {
    id: 'audit',
    title: 'Audit learning',
    shortLabel: 'Learn',
    detail: 'Turns repeated workflow friction into learning notes for governance review.',
    avoids: 'Loss of context once the shift pressure has passed.',
    captures: 'Audit trace, learning note, and export-ready summary.',
    Icon: ClipboardCheck
  }
];

export function ClinicalPathwayVisual() {
  const [selectedStepId, setSelectedStepId] = useState(pathwaySteps[0].id);
  const buttonRefs = useRef([]);
  const selectedIndex = pathwaySteps.findIndex((step) => step.id === selectedStepId);
  const selectedStep = pathwaySteps[selectedIndex] ?? pathwaySteps[0];

  function selectByIndex(nextIndex) {
    const safeIndex = (nextIndex + pathwaySteps.length) % pathwaySteps.length;
    const nextStep = pathwaySteps[safeIndex];
    setSelectedStepId(nextStep.id);
    buttonRefs.current[safeIndex]?.focus();
  }

  function handleKeyDown(event, index) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectByIndex(index + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectByIndex(index - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectByIndex(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectByIndex(pathwaySteps.length - 1);
    }
  }

  return (
    <section aria-labelledby="clinical-pathway-title" className="pathway-surface">
      <div className="visual-heading">
        <div>
          <p className="eyebrow">Responsive pathway</p>
          <h3 id="clinical-pathway-title">Operational route from observation to governance learning</h3>
        </div>
        <span className="surface-tag">Interactive pathway</span>
      </div>

      <div className="pathway-diagram-shell">
        <svg aria-hidden="true" className="pathway-connector" viewBox="0 0 100 18" preserveAspectRatio="none">
          <path d="M4 9 H 96" />
        </svg>
        <ol className="pathway-step-list">
          {pathwaySteps.map((step, index) => {
            const Icon = step.Icon;
            const isSelected = step.id === selectedStep.id;
            return (
              <li key={step.id}>
                <button
                  aria-pressed={isSelected}
                  className={`pathway-step-button ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedStepId(step.id)}
                  onFocus={() => setSelectedStepId(step.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  ref={(element) => {
                    buttonRefs.current[index] = element;
                  }}
                  type="button"
                >
                  <span className="pathway-step-icon">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className="pathway-step-copy">
                    <strong>{step.title}</strong>
                    <span>{step.shortLabel}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <article className="pathway-detail-card">
        <div className="hero-detail-header">
          <div>
            <p className="detail-label">Selected pathway step</p>
            <h4>{selectedStep.title}</h4>
          </div>
          <span className="metric-pill">{selectedStep.shortLabel}</span>
        </div>
        <p className="hero-detail-summary">{selectedStep.detail}</p>
        <dl className="detail-grid">
          <div>
            <dt>What it does</dt>
            <dd>{selectedStep.detail}</dd>
          </div>
          <div>
            <dt>What it avoids</dt>
            <dd>{selectedStep.avoids}</dd>
          </div>
          <div>
            <dt>What gets captured</dt>
            <dd>{selectedStep.captures}</dd>
          </div>
        </dl>
      </article>

      <aside className="principle-card">
        <strong>Principle: support clinical judgement, do not replace it.</strong>
        <p>
          SafeFlow is designed for simulation, governance review, and workflow validation before
          any live deployment.
        </p>
      </aside>
    </section>
  );
}
