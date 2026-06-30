import { Activity, ClipboardCheck, ShieldCheck, Waypoints } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

const heroSteps = [
  {
    id: 'readiness',
    label: 'Readiness check',
    shortLabel: 'Readiness',
    metric: 'Shift route visible',
    summary:
      'Confirms staffing pressure, review capacity, and escalation visibility before a shift enters live clinical pressure.',
    avoids: 'Hidden workload assumptions and unclear ownership at shift start.',
    captures: 'Review capacity, named escalation route, and huddle readiness prompts.',
    Icon: ShieldCheck
  },
  {
    id: 'signals',
    label: 'Risk signal review',
    shortLabel: 'Signals',
    metric: 'Pressure cues mapped',
    summary:
      'Surfaces pressure points such as delayed review markers, documentation gaps, and unresolved escalation prompts.',
    avoids: 'Static reporting that leaves teams guessing where pressure is building.',
    captures: 'Simulation-only signal clusters, review markers, and calm prioritisation notes.',
    Icon: Activity
  },
  {
    id: 'escalation',
    label: 'Escalation pathway',
    shortLabel: 'Escalation',
    metric: 'Next safe action visible',
    summary:
      'Makes the next safe action visible without replacing clinical judgement.',
    avoids: 'Ambiguous handoffs and escalation prompts that stop at awareness.',
    captures: 'Named route, next review action, and ownership for the team response.',
    Icon: Waypoints
  },
  {
    id: 'audit',
    label: 'Audit learning loop',
    shortLabel: 'Audit',
    metric: 'Learning trace prepared',
    summary:
      'Captures the action trail so teams can turn repeated friction points into learning.',
    avoids: 'Loss of context once the immediate operational pressure has passed.',
    captures: 'Action trace, learning note prompts, and governance-ready exports.',
    Icon: ClipboardCheck
  }
];

export function ProductHeroVisual() {
  const [selectedStepId, setSelectedStepId] = useState(heroSteps[0].id);
  const buttonRefs = useRef([]);
  const groupId = useId();
  const selectedIndex = heroSteps.findIndex((step) => step.id === selectedStepId);
  const selectedStep = heroSteps[selectedIndex] ?? heroSteps[0];
  const connectorDots = useMemo(
    () => heroSteps.map((step, index) => ({ id: step.id, left: 14 + index * 24 })),
    []
  );

  function selectByIndex(nextIndex) {
    const safeIndex = (nextIndex + heroSteps.length) % heroSteps.length;
    const nextStep = heroSteps[safeIndex];
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
      selectByIndex(heroSteps.length - 1);
    }
  }

  return (
    <section aria-labelledby="hero-visual-title" className="hero-visual">
      <div className="visual-heading">
        <div>
          <p className="eyebrow">Workflow preview</p>
          <h2 id="hero-visual-title">Simulation route from pressure check to learning trace</h2>
        </div>
        <span className="surface-tag">Interactive workflow</span>
      </div>

      <div className="hero-track-shell">
        <svg aria-hidden="true" className="signal-connector" viewBox="0 0 100 24" preserveAspectRatio="none">
          <path
            className="signal-connector-path"
            d="M4 12 C 16 12, 20 6, 28 6 S 40 18, 52 18 S 64 8, 76 8 S 88 12, 96 12"
            pathLength="100"
          />
          {connectorDots.map((dot) => (
            <circle cx={dot.left} cy="12" key={dot.id} r="1.6" />
          ))}
        </svg>

        <div aria-label="SafeFlow workflow steps" className="hero-step-grid" role="tablist">
          {heroSteps.map((step, index) => {
            const isSelected = step.id === selectedStep.id;
            const Icon = step.Icon;
            return (
              <button
                aria-controls={`${groupId}-panel-${step.id}`}
                aria-selected={isSelected}
                className={`hero-step-button ${isSelected ? 'is-selected' : ''}`}
                id={`${groupId}-tab-${step.id}`}
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                onFocus={() => setSelectedStepId(step.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(element) => {
                  buttonRefs.current[index] = element;
                }}
                role="tab"
                tabIndex={isSelected ? 0 : -1}
                type="button"
              >
                <span className="step-badge">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-icon">
                  <Icon aria-hidden="true" size={18} />
                </span>
                <span className="step-copy">
                  <strong>{step.shortLabel}</strong>
                  <span>{step.metric}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section
        aria-labelledby={`${groupId}-tab-${selectedStep.id}`}
        className="hero-detail-card"
        id={`${groupId}-panel-${selectedStep.id}`}
        role="tabpanel"
      >
        <div className="hero-detail-header">
          <div>
            <p className="detail-label">Selected step</p>
            <h3>{selectedStep.label}</h3>
          </div>
          <span className="metric-pill">{selectedStep.metric}</span>
        </div>
        <p className="hero-detail-summary">{selectedStep.summary}</p>
        <dl className="detail-grid">
          <div>
            <dt>What it does</dt>
            <dd>{selectedStep.summary}</dd>
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
      </section>
    </section>
  );
}
