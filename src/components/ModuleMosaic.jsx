import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  Sparkles,
  Waypoints
} from 'lucide-react';

const modules = [
  {
    icon: ClipboardCheck,
    title: 'Readiness checks',
    text: 'Simple prompts before escalation or transfer.',
    accent: '#005eb8',
    span: 'wide'
  },
  {
    icon: Waypoints,
    title: 'Risk signals',
    text: 'Surface what changed and what needs review.',
    accent: '#007f3b'
  },
  {
    icon: GitBranch,
    title: 'Handover rail',
    text: 'Carry the next action into the next shift.',
    accent: '#e51b72'
  },
  {
    icon: FileCheck2,
    title: 'Audit learning',
    text: 'Keep a trail of what was seen and what moved.',
    accent: '#005eb8'
  },
  {
    icon: BarChart3,
    title: 'Pilot measures',
    text: 'Keep the first evidence set small and useful.',
    accent: '#007f3b'
  },
  {
    icon: Sparkles,
    title: 'Scenario library',
    text: 'Use fictional cases for review and training.',
    accent: '#f59e0b'
  }
];

export function ModuleMosaic() {
  return (
    <section className="module-mosaic" aria-label="SafeFlow modules">
      {modules.map((module) => {
        const Icon = module.icon;

        return (
          <article
            className={`module-tile${module.span ? ` module-tile--${module.span}` : ''}`}
            key={module.title}
            style={{ '--module-accent': module.accent }}
          >
            <Icon aria-hidden="true" size={22} />
            <div>
              <p className="module-tile__eyebrow">Module</p>
              <h3>{module.title}</h3>
              <p>{module.text}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
