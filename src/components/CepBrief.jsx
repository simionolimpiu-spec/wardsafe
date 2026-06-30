import { CheckCircle2, FileBadge2, Shield, Stethoscope } from 'lucide-react';

const briefSections = [
  {
    title: 'Scope',
    summary: 'What SafeFlow is trying to prove in this early-stage preview.',
    items: [
      'A nurse-led workflow can keep readiness, pressure cues, escalation prompts, and audit learning in one place.',
      'Simulation-first product surfaces can be reviewed before any live deployment pathway is considered.',
      'The interface can be prepared for governance review without using patient data.'
    ],
    Icon: Stethoscope
  },
  {
    title: 'Intended assurance pathway',
    summary: 'How the product is framed for pilot planning and governance discussion.',
    items: [
      'Mapped against ward workflow checkpoints rather than marketed as a finished clinical tool.',
      'Prepared for governance review, simulation rehearsal, and pilot pathway planning.',
      'Structured to surface claims boundaries before any integration or validation work.'
    ],
    Icon: FileBadge2
  },
  {
    title: 'Claims boundary',
    summary: 'What the preview does not claim.',
    items: [
      'No NHS approval, endorsement, or current deployment claim.',
      'No clinical validation, diagnosis, prescribing, or clinician replacement claim.',
      'No patient outcome improvement claim until evidence exists.'
    ],
    Icon: Shield
  }
];

const evidenceChecklist = [
  'Simulation-first language maintained across the interface',
  'No patient data shown anywhere in the preview',
  'Escalation prompts remain review-oriented and governance-safe',
  'Audit outputs are positioned for learning, not clinical automation'
];

export function CepBrief() {
  return (
    <div className="cep-layout">
      <div className="cep-card-stack">
        {briefSections.map((section) => {
          const Icon = section.Icon;
          return (
            <article className="cep-card" key={section.title}>
              <div className="cep-card-header">
                <div className="cep-card-title">
                  <span className="cep-icon">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <h3>{section.title}</h3>
                </div>
                <p>{section.summary}</p>
              </div>
              <ul className="cep-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <aside aria-label="CEP evidence checklist" className="cep-aside">
        <div className="cep-aside-header">
          <CheckCircle2 aria-hidden="true" size={18} />
          <strong>Review checklist</strong>
        </div>
        <ul className="cep-list">
          {evidenceChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="muted-note">
          This brief is intended for simulation review, pilot pathway discussion, and governance preparation.
        </p>
      </aside>
    </div>
  );
}
