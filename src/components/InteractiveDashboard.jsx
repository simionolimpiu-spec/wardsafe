import { Activity, ArrowRight, ClipboardList, ShieldCheck, Waypoints } from 'lucide-react';
import { useId, useRef, useState } from 'react';

const dashboardTabs = [
  {
    id: 'readiness',
    label: 'Readiness',
    summary: 'Review capacity visible',
    accent: 'stable'
  },
  {
    id: 'signals',
    label: 'Signals',
    summary: 'Calm pressure cues',
    accent: 'watch'
  },
  {
    id: 'escalation',
    label: 'Escalation',
    summary: 'Named route confirmed',
    accent: 'route'
  },
  {
    id: 'audit',
    label: 'Audit',
    summary: 'Learning trace prepared',
    accent: 'learning'
  }
];

const dashboardProvenance = {
  readiness: 'Source: simulation readiness report',
  signals: 'Source: placeholder provider',
  escalation: 'Source: simulation workflow trace',
  audit: 'Source: simulation audit trail'
};

const dashboardPanels = {
  readiness: {
    heading: 'Shift readiness',
    intro: 'Review capacity is visible before the team moves into higher ward pressure.',
    cards: [
      { title: 'Shift readiness', value: 'Review capacity visible', note: 'Charge nurse cover and senior review window set', tone: 'stable', progress: 84 },
      { title: 'Escalation route', value: 'Named pathway confirmed', note: 'Observe -> review -> escalate ownership clear', tone: 'stable', progress: 78 },
      { title: 'Huddle prompt', value: 'Ready for team review', note: 'Safety huddle prompt drafted for 08:45', tone: 'route', progress: 66 }
    ],
    railTitle: 'Readiness notes',
    railItems: [
      'Simulation-only staffing picture with no patient data shown',
      'Review capacity checks stay visible without alarm-heavy styling',
      'Prompt wording stays operational and governance-safe'
    ]
  },
  signals: {
    heading: 'Risk signal review',
    intro: 'Signals stay calm and review-oriented so teams can prioritise without panic theatre.',
    signals: [
      { label: 'Delayed senior review marker', tone: 'watch', note: 'Observed in fictional afternoon discharge cluster' },
      { label: 'Documentation gap cluster', tone: 'route', note: 'Handover notes incomplete across two simulation tasks' },
      { label: 'Bed capacity pressure', tone: 'stable', note: 'Escalation prompts prepared before the next review round' }
    ],
    railTitle: 'Signal handling',
    railItems: [
      'Source: placeholder provider · mode: simulation · clinical use: false.',
      'Simulation output for preview only. Not clinically validated and not for clinical decision-making.',
      'Signals identify workflow pressure, not patient diagnosis.',
      'Human review remains the decision point for every action.'
    ]
  },
  escalation: {
    heading: 'Escalation pathway',
    intro: 'One selected route makes the next safe action visible without pretending the system has clinical authority.',
    pathway: [
      'Observe -> Review',
      'Prompt -> Escalate',
      'Record -> Learn'
    ],
    nextAction: {
      title: 'Selected escalation item',
      summary: 'Prompt senior review during the next huddle window and record ownership for follow-through.',
      meta: 'Simulation-only next action · no patient data'
    },
    railTitle: 'Route guardrails',
    railItems: [
      'Escalation prompts are nurse-led workflow cues',
      'No prescribing or diagnosis claims are made',
      'Action ownership is visible for governance review'
    ]
  },
  audit: {
    heading: 'Audit learning',
    intro: 'The audit view turns repeat friction points into a traceable learning loop for review teams.',
    timeline: [
      { time: '08:42', title: 'Action trace captured', detail: 'Escalation ownership recorded in the simulation workflow.' },
      { time: '09:05', title: 'Learning note drafted', detail: 'Documentation gap captured for review in the next governance session.' },
      { time: '09:20', title: 'Governance export ready', detail: 'Summary prepared for a fictional pilot-readiness pack.' }
    ],
    railTitle: 'Audit outputs',
    railItems: [
      'Governance-ready wording without clinical overclaiming',
      'Simulation-first evidence trail',
      'Prepared for export review, not live clinical use'
    ]
  }
};

export function InteractiveDashboard() {
  const [selectedTabId, setSelectedTabId] = useState(dashboardTabs[0].id);
  const tabRefs = useRef([]);
  const groupId = useId();
  const selectedIndex = dashboardTabs.findIndex((tab) => tab.id === selectedTabId);
  const selectedTab = dashboardTabs[selectedIndex] ?? dashboardTabs[0];
  const panel = dashboardPanels[selectedTab.id];

  function selectByIndex(nextIndex) {
    const safeIndex = (nextIndex + dashboardTabs.length) % dashboardTabs.length;
    const nextTab = dashboardTabs[safeIndex];
    setSelectedTabId(nextTab.id);
    tabRefs.current[safeIndex]?.focus();
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
      selectByIndex(dashboardTabs.length - 1);
    }
  }

  return (
    <section aria-labelledby="interactive-dashboard-title" className="dashboard-surface">
      <div className="dashboard-surface-header">
        <div>
          <p className="eyebrow">Workspace preview</p>
          <h3 id="interactive-dashboard-title">SafeFlow operational preview</h3>
        </div>
        <div className="dashboard-provenance" aria-label="Preview provenance">
          <span className="simulation-label">Simulation view · no patient data</span>
          <span className="simulation-label">{dashboardProvenance[selectedTab.id]}</span>
        </div>
      </div>

      <div aria-label="Dashboard sections" className="dashboard-tabs" role="tablist">
        {dashboardTabs.map((tab, index) => {
          const isSelected = tab.id === selectedTab.id;
          return (
            <button
              aria-controls={`${groupId}-panel-${tab.id}`}
              aria-selected={isSelected}
              className={`dashboard-tab ${isSelected ? 'is-selected' : ''}`}
              id={`${groupId}-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setSelectedTabId(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <span>{tab.label}</span>
              <small>{tab.summary}</small>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`${groupId}-tab-${selectedTab.id}`}
        className="dashboard-panel"
        id={`${groupId}-panel-${selectedTab.id}`}
        role="tabpanel"
      >
        <div className="dashboard-main">
          <div className="dashboard-hero-card">
            <div>
              <p className="detail-label">{selectedTab.label}</p>
              <h4>{panel.heading}</h4>
            </div>
            <span className={`status-pill status-pill-${selectedTab.accent}`}>{selectedTab.summary}</span>
          </div>

          <p className="dashboard-intro">{panel.intro}</p>

          {panel.cards && (
            <div className="dashboard-card-grid">
              {panel.cards.map((card) => (
                <article className="dashboard-card" key={card.title}>
                  <div className="dashboard-card-header">
                    <strong>{card.title}</strong>
                    <span className={`status-pill status-pill-${card.tone}`}>{card.value}</span>
                  </div>
                  <p>{card.note}</p>
                  <div aria-hidden="true" className="progress-track">
                    <span className={`progress-fill progress-fill-${card.tone}`} style={{ width: `${card.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}

          {panel.signals && (
            <div className="dashboard-list">
              {panel.signals.map((signal) => (
                <article className="dashboard-row" key={signal.label}>
                  <div className="dashboard-row-copy">
                    <strong>{signal.label}</strong>
                    <p>{signal.note}</p>
                  </div>
                  <span className={`status-pill status-pill-${signal.tone}`}>{signal.tone === 'watch' ? 'Review' : signal.tone === 'route' ? 'Route' : 'Monitor'}</span>
                </article>
              ))}
            </div>
          )}

          {panel.pathway && (
            <div className="dashboard-escalation">
              <div className="escalation-sequence" role="list" aria-label="Escalation route">
                {panel.pathway.map((step, index) => (
                  <div className="sequence-step" key={step} role="listitem">
                    <span className="sequence-index">{index + 1}</span>
                    <span>{step}</span>
                    {index < panel.pathway.length - 1 && <ArrowRight aria-hidden="true" size={16} />}
                  </div>
                ))}
              </div>
              <article className="selected-action-card">
                <div className="selected-action-header">
                  <Waypoints aria-hidden="true" size={18} />
                  <strong>{panel.nextAction.title}</strong>
                </div>
                <p>{panel.nextAction.summary}</p>
                <span className="muted-note">{panel.nextAction.meta}</span>
              </article>
            </div>
          )}

          {panel.timeline && (
            <ol className="audit-timeline" aria-label="Audit learning timeline">
              {panel.timeline.map((item) => (
                <li className="timeline-row" key={`${item.time}-${item.title}`}>
                  <span className="timeline-time">{item.time}</span>
                  <div className="timeline-card">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="dashboard-rail">
          <div className="rail-header">
            {selectedTab.id === 'readiness' && <ShieldCheck aria-hidden="true" size={18} />}
            {selectedTab.id === 'signals' && <Activity aria-hidden="true" size={18} />}
            {selectedTab.id === 'escalation' && <Waypoints aria-hidden="true" size={18} />}
            {selectedTab.id === 'audit' && <ClipboardList aria-hidden="true" size={18} />}
            <strong>{panel.railTitle}</strong>
          </div>
          <ul className="rail-list">
            {panel.railItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
