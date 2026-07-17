import { AlertTriangle, ClipboardCheck, Home, Users } from 'lucide-react';

const summaryCards = [
  { label: 'Patients in unit', valueKey: 'patients', icon: Users, tone: 'neutral' },
  { label: 'Escalations active', valueKey: 'activeEscalations', icon: AlertTriangle, tone: 'danger' },
  { label: 'NEWS2 ≥5', valueKey: 'highNews', icon: AlertTriangle, tone: 'warning' },
  { label: 'Handover % complete', valueKey: 'handoverCompletePercent', icon: ClipboardCheck, tone: 'neutral', suffix: '%' },
  { label: 'Discharge-ready today', valueKey: 'dischargeReadyToday', icon: Home, tone: 'success' }
];

export function BoardSummaryCards({ summary }) {
  return (
    <section aria-label="Ward summary cards" className="board-summary-cards">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const value = `${summary.metrics[card.valueKey]}${card.suffix ?? ''}`;
        return (
          <article className={`summary-card summary-card-${card.tone}`} key={card.label}>
            <div aria-hidden="true" className="summary-card-icon"><Icon size={19} /></div>
            <div>
              <span>{card.label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
