import { BookOpenCheck, Clock3, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

export function AuditLearningView({
  events,
  backendEvents = [],
  backendAuditStatus = '',
  isLoadingBackendAudit = false,
  onRefreshBackendAudit = () => {}
}) {
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState('All');
  const actors = [...new Set(events.map((event) => event.actor))].sort();
  const visibleEvents = useMemo(() => events.filter((event) => {
    const text = `${event.label} ${event.detail} ${event.patientId ?? ''}`.toLowerCase();
    return (actor === 'All' || event.actor === actor) && text.includes(query.toLowerCase());
  }), [actor, events, query]);

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

      <div className="audit-backend-panel">
        <div>
          <strong>Backend audit mirror</strong>
          {backendAuditStatus && <p>{backendAuditStatus}</p>}
          {!backendAuditStatus && <p>Read server-side simulation audit events on demand.</p>}
        </div>
        <button
          className="secondary-action"
          disabled={isLoadingBackendAudit}
          onClick={onRefreshBackendAudit}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          {isLoadingBackendAudit ? 'Refreshing audit' : 'Refresh backend audit'}
        </button>
      </div>

      {backendEvents.length > 0 && (
        <ol className="timeline backend-audit-list" aria-label="Backend audit events">
          {backendEvents.map((event) => (
            <li key={`${event.source}-${event.id}`}>
              <Clock3 aria-hidden="true" size={16} />
              <div>
                <strong>{event.syntheticPatientRef} - {event.eventType}</strong>
                <p>{event.eventSummary}</p>
                <small>{event.source}</small>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="toolbar">
        <label htmlFor="audit-search">Search audit<input id="audit-search" onChange={(event) => setQuery(event.target.value)} type="search" value={query} /></label>
        <label htmlFor="audit-actor">Actor<select id="audit-actor" onChange={(event) => setActor(event.target.value)} value={actor}><option>All</option>{actors.map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>

      <ol className="timeline">
        {visibleEvents.map((event) => (
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
      {visibleEvents.length === 0 && <p className="empty-state">No audit events match these filters.</p>}
    </section>
  );
}
