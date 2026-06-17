import { BookOpenCheck, Clock3 } from 'lucide-react';

export function AuditLearningView({ events }) {
  return (
    <section className="audit-view" aria-label="Audit and learning">
      <div className="section-heading">
        <BookOpenCheck aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Learning layer</p>
          <h2>Audit and Learning</h2>
        </div>
      </div>

      <div className="learning-card">
        <strong>Documentation focus</strong>
        <p>Concern, background, assessment, recommendation, who was contacted, response and outcome.</p>
      </div>

      <ol className="timeline">
        {events.map((event) => (
          <li key={event.id}>
            <Clock3 aria-hidden="true" size={16} />
            <div>
              <strong>{event.time} - {event.label}</strong>
              <p>{event.detail}</p>
              <small>{event.actor}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
