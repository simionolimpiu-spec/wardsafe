import { AlertTriangle, ClipboardCheck, Home, Users } from 'lucide-react';
import { ClinicalValue } from '../design-system/index.js';

const summaryCards = [
  { label: 'Patients in unit', valueKey: 'patients', icon: Users },
  { label: 'Escalations active', valueKey: 'activeEscalations', icon: AlertTriangle },
  { label: 'NEWS2 ≥5', valueKey: 'highNews', icon: AlertTriangle },
  { label: 'Handover % complete', valueKey: 'handoverCompletePercent', icon: ClipboardCheck, suffix: '%' },
  { label: 'Discharge-ready today', valueKey: 'dischargeReadyToday', icon: Home }
];

export function BoardSummaryCards({ summary }) {
  return (
    <section aria-label="Ward summary cards" className="board-summary-cards">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const recorded = summary.metrics?.[card.valueKey];
        const value = recorded === null || recorded === undefined || recorded === ''
          ? null : `${recorded}${card.suffix ?? ''}`;
        return (
          <article className="summary-card" key={card.label}>
            <div aria-hidden="true" className="summary-card-icon"><Icon /></div>
            <ClinicalValue label={card.label} value={value} emphasis="observation" />
          </article>
        );
      })}
    </section>
  );
}
