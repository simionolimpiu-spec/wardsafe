import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafetyBanner } from './SafetyBanner.jsx';
import { WardContextSelector } from './WardContextSelector.jsx';
import { WorkspaceNav } from './WorkspaceNav.jsx';

const viewSubtitles = {
  board: 'Ward Safety Board',
  patients: 'My Patients',
  observations: 'Observations',
  tasks: 'Tasks',
  escalations: 'Escalations',
  handover: 'Handover',
  discharges: 'Discharges',
  reports: 'Reports',
  scenarios: 'Scenarios',
  'hospital-insights': 'Hospital Insights',
  'competency-passport': 'Competency Passport',
  'learning-hub': 'Learning Hub',
  twin: 'Patient Journey Twin',
  'trust-network': 'Trust Network',
  audit: 'Audit Trail',
  settings: 'Settings'
};

function shiftDateLabel(dateLabel, offset) {
  const match = String(dateLabel ?? '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match || offset === 0) return dateLabel;
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateLabel;
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' }).format(date);
}

export function AppShell({
  activeView = 'board',
  children,
  currentWardName,
  dateLabel,
  escalationCount,
  isPresentationMode = false,
  onNavigate = () => {},
  onScenarioChange = () => {},
  scenarioOptions = [],
  selectedScenarioId,
  taskCount,
  topbarActions = null,
  compactMode = false
}) {
  const [dateOffset, setDateOffset] = useState(0);
  const displayDate = useMemo(() => shiftDateLabel(dateLabel, dateOffset), [dateLabel, dateOffset]);
  const subtitle = viewSubtitles[activeView] ?? 'Ward workspace';

  return (
    <main className={`app-shell app-shell-redesign ${compactMode ? 'compact-mode' : ''} ${isPresentationMode ? 'presentation-mode' : ''}`}>
      <WorkspaceNav
        activeView={activeView}
        currentWardName={currentWardName}
        escalationCount={escalationCount}
        onNavigate={onNavigate}
        taskCount={taskCount}
      />
      <div className="workspace-main">
        <header className="topbar redesign-topbar">
          <div className="shell-brand">
            <span aria-hidden="true" className="brand-mark">SF</span>
            <div>
              <h1 aria-label="SafeFlow">SafeFlow Nursing</h1>
              <span>{subtitle}</span>
            </div>
          </div>
          <div className="topbar-context">
            <WardContextSelector onChange={onScenarioChange} options={scenarioOptions} value={selectedScenarioId} />
            <div aria-label="Simulation date" className="date-stepper" role="group">
              <button aria-label="Previous simulation date" onClick={() => setDateOffset((value) => value - 1)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
              <time dateTime="2026-06-17" aria-live="polite">{displayDate}</time>
              <button aria-label="Next simulation date" onClick={() => setDateOffset((value) => value + 1)} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
            </div>
          </div>
          <div className="topbar-actions">
            <button aria-label="Notifications" className="notification-button" type="button"><Bell aria-hidden="true" size={18} /></button>
            <span className="user-chip">Fictional Nurse <small>Charge Nurse</small></span>
            {topbarActions}
          </div>
        </header>
        {activeView !== 'hospital-insights' && <SafetyBanner />}
        <div className="workspace-content">{children}</div>
      </div>
    </main>
  );
}
