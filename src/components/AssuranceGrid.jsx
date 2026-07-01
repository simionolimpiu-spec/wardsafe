import { FileText, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

const assurances = [
  {
    icon: ShieldCheck,
    title: 'Simulation only',
    text: 'The public site and prototype use fictional patients only.'
  },
  {
    icon: UsersRound,
    title: 'Human oversight',
    text: 'SafeFlow supports review and coordination. Clinicians stay accountable.'
  },
  {
    icon: FileText,
    title: 'Governance route',
    text: 'DTAC, DCB0129, DCB0160 and DSPT are on the path.'
  },
  {
    icon: Sparkles,
    title: 'Accessible by default',
    text: 'Keyboard-first, readable and responsive for NHS reviewers.'
  }
];

export function AssuranceGrid() {
  return (
    <section className="assurance-section" aria-labelledby="assurance-title">
      <div className="assurance-section__intro">
        <p className="pitch-eyebrow">Assurance</p>
        <h2 id="assurance-title">Boundaries are part of the design.</h2>
        <p>
          The public page is built to be credible without overclaiming. That keeps the pitch
          usable for mentors, reviewers and clinicians.
        </p>
      </div>

      <div className="assurance-grid">
        {assurances.map((assurance) => {
          const Icon = assurance.icon;

          return (
            <article className="assurance-card" key={assurance.title}>
              <Icon aria-hidden="true" size={22} />
              <div>
                <h3>{assurance.title}</h3>
                <p>{assurance.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
