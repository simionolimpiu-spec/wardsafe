import { Cloud, Database, FileArchive, GitBranch, KeyRound, LockKeyhole, Route, ServerCog } from 'lucide-react';

const architectureSteps = [
  ['Identity', 'Secure sign-in and MFA-ready roles', LockKeyhole],
  ['API layer', 'REST APIs for SafeFlow services', Route],
  ['Workflow', 'Clinical workflow orchestration', GitBranch],
  ['Events', 'Escalations, alerts and tasks', ServerCog],
  ['Services', 'Rules, draft provider and audit', Cloud],
  ['Database', 'Relational workflow data', Database],
  ['Documents', 'Exports and attachments', FileArchive],
  ['Key control', 'Encryption and secrets boundary', KeyRound]
];

export function ArchitectureStrip() {
  return (
    <section className="architecture-strip" aria-label="Simplified cloud architecture">
      <h2>SafeFlow - Simplified cloud architecture</h2>
      <ol>
        {architectureSteps.map(([title, description, Icon]) => (
          <li key={title}>
            <span className="architecture-icon"><Icon aria-hidden="true" size={22} /></span>
            <strong>{title}</strong>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
