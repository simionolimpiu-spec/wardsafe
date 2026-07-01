import { ArrowRight, PlayCircle } from 'lucide-react';

const pilotSteps = [
  {
    title: 'Discover',
    text: 'Map the current ward flow and what gets missed.'
  },
  {
    title: 'Shadow',
    text: 'Use fictional cases and watch the workflow in real time.'
  },
  {
    title: 'Pilot',
    text: 'Approve one ward and one pathway at a time.'
  },
  {
    title: 'Review',
    text: 'Measure what changed and what to refine next.'
  }
];

export function PilotStepper({ onOpenPrototype }) {
  return (
    <section className="pilot-stepper" aria-label="SafeFlow pilot pathway">
      <div className="pilot-stepper__intro">
        <p className="pitch-eyebrow">Pilot pathway</p>
        <h2>A small, governed route from prototype to ward pilot.</h2>
        <p>
          The plan is intentionally narrow: simulation first, then a single-ward pilot only when
          the safety, governance and workflow evidence are ready.
        </p>
      </div>

      <ol className="pilot-stepper__steps">
        {pilotSteps.map((step, index) => (
          <li key={step.title}>
            <span className="pilot-stepper__index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="pilot-stepper__actions">
        <button className="pitch-primary-action" onClick={onOpenPrototype} type="button">
          <PlayCircle aria-hidden="true" size={19} />
          Open interactive prototype
        </button>
        <a className="pitch-secondary-action light" href="#cep-brief">
          Open brief
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
