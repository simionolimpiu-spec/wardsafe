import { Bell, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, LogOut, Menu, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DemoScenarioSelector } from './DemoScenarioSelector.jsx';
import { SafetyBanner } from './SafetyBanner.jsx';
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
  settings: 'Settings',
  'practice-overview': 'Primary Care Review Board',
  'contact-requests': 'Contact Requests',
  continuity: 'Continuity Review',
  'results-follow-up': 'Results Follow-up',
  referrals: 'Referral Readiness',
  'primary-tasks': 'Review Tasks',
  coordination: 'Care Coordination',
  'primary-reports': 'Primary Care Reports',
  'primary-scenarios': 'Primary Care Scenarios',
  'primary-audit': 'Primary Care Audit Trail',
  'primary-settings': 'Primary Care Settings'
};

function shiftDateLabel(dateLabel, offset) {
  const match = String(dateLabel ?? '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match || offset === 0) return dateLabel;
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
  if (Number.isNaN(date.getTime())) return dateLabel;
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' }).format(date);
}

export function AppShell({
  activeView = 'board',
  carePathway = 'ward-care',
  children,
  currentLocationName = 'Cityview Community Hospital',
  currentWardName,
  dateLabel,
  escalationCount,
  isPresentationMode = false,
  onNavigate = () => {},
  onCarePathwayChange = () => {},
  onScenarioChange = () => {},
  scenarioDescription = '',
  scenarioOptions = [],
  selectedScenarioId,
  taskCount,
  topbarActions = null,
  compactMode = false,
  onSignOut
}) {
  const [dateOffset, setDateOffset] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavButtonRef = useRef(null);
  const mobileNavCloseRef = useRef(null);
  const mobileNavRef = useRef(null);
  const workspaceContentRef = useRef(null);
  const displayDate = useMemo(() => shiftDateLabel(dateLabel, dateOffset), [dateLabel, dateOffset]);
  const displayDateTime = useMemo(() => toDateTimeValue(displayDate), [displayDate]);
  const subtitle = viewSubtitles[activeView] ?? 'Ward workspace';

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;
    mobileNavCloseRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
        window.requestAnimationFrame(() => mobileNavButtonRef.current?.focus());
      }

      if (event.key === 'Tab') {
        const focusable = [...(mobileNavRef.current?.querySelectorAll('button, [href], select, [tabindex]:not([tabindex="-1"])') ?? [])]
          .filter((element) => !element.disabled && element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      workspaceContentRef.current?.focus({ preventScroll: true });
    }
  }, [activeView]);

  function closeMobileNav({ restoreFocus = false } = {}) {
    if (!isMobileNavOpen) return;
    setIsMobileNavOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileNavButtonRef.current?.focus());
    }
  }

  return (
    <div className={`app-shell app-shell-redesign ${compactMode ? 'compact-mode' : ''} ${isPresentationMode ? 'presentation-mode' : ''}`}>
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>
      <WorkspaceNav
        activeView={activeView}
        closeButtonRef={mobileNavCloseRef}
        currentWardName={currentWardName}
        currentLocationName={currentLocationName}
        carePathway={carePathway}
        escalationCount={escalationCount}
        isOpen={isMobileNavOpen}
        navRef={mobileNavRef}
        onClose={() => closeMobileNav({ restoreFocus: true })}
        onNavigate={onNavigate}
        taskCount={taskCount}
      />
      {isMobileNavOpen && (
        <div aria-hidden="true" className="nav-scrim" onClick={() => closeMobileNav({ restoreFocus: true })} />
      )}
      <main className="workspace-main" inert={isMobileNavOpen ? true : undefined}>
        <header className="topbar redesign-topbar">
          <button
            aria-controls="workspace-navigation"
            aria-expanded={isMobileNavOpen}
            aria-label="Open navigation"
            className="mobile-nav-trigger"
            onClick={() => setIsMobileNavOpen(true)}
            ref={mobileNavButtonRef}
            type="button"
          >
            <Menu aria-hidden="true" size={21} />
          </button>
          <div className="shell-brand">
            <span aria-hidden="true" className="brand-mark">SF</span>
            <div>
              <h1 tabIndex="-1">SafeFlow</h1>
              <span>{subtitle}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="notification-control">
              <button
                aria-controls="simulation-notifications"
                aria-expanded={isNotificationsOpen}
                aria-label="Notifications"
                className="notification-button"
                onClick={() => setIsNotificationsOpen((value) => !value)}
                type="button"
              >
                <Bell aria-hidden="true" size={18} />
              </button>
              {isNotificationsOpen && (
                <div aria-live="polite" className="notification-popover" id="simulation-notifications" role="status">
                  <strong>Simulation notifications</strong>
                  <p>No simulation notifications recorded.</p>
                </div>
              )}
            </div>
            {topbarActions && (
              <details className="review-tools-menu">
                <summary><ClipboardCheck aria-hidden="true" size={17} /><span>Review tools</span><ChevronDown aria-hidden="true" size={16} /></summary>
                <div className="review-tools-popover">{topbarActions}</div>
              </details>
            )}
            <details className="user-menu">
              <summary className="user-chip"><UserRound aria-hidden="true" size={17} /><span>Ruth Callaghan</span><small>Charge Nurse</small><ChevronDown aria-hidden="true" size={15} /></summary>
              <div className="user-menu-popover">
                <strong>Prototype session</strong>
                <span>Simulated identity, sample only</span>
                {onSignOut && <button onClick={onSignOut} type="button"><LogOut aria-hidden="true" size={16} /> Sign out</button>}
              </div>
            </details>
          </div>
        </header>
        <section aria-label="Simulation context" className="topbar-context">
          <label className="care-pathway-control">
            <span>Care setting</span>
            <select onChange={(event) => onCarePathwayChange(event.target.value)} value={carePathway}>
              <option value="ward-care">Ward care</option>
              <option value="primary-care">Primary care</option>
            </select>
          </label>
          <DemoScenarioSelector
            description={scenarioDescription}
            onChange={onScenarioChange}
            options={scenarioOptions}
            settingLabel={carePathway === 'primary-care' ? 'Practice' : 'Ward'}
            value={selectedScenarioId}
          />
          <div aria-describedby="simulation-date-note" aria-label="Simulation date" className="date-stepper" role="group">
            <button aria-label="Previous simulation date" onClick={() => setDateOffset((value) => value - 1)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
            <time dateTime={displayDateTime} aria-live="polite">{displayDate}</time>
            <button aria-label="Next simulation date" onClick={() => setDateOffset((value) => value + 1)} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
          </div>
          <p className="sr-only" id="simulation-date-note">
            Illustrative simulation date stepper. It changes the displayed demo date only; it does not change live data.
          </p>
        </section>
        {activeView !== 'hospital-insights' && <SafetyBanner />}
        <div className="workspace-content" id="workspace-content" ref={workspaceContentRef} tabIndex="-1">{children}</div>
      </main>
    </div>
  );
}

function toDateTimeValue(dateLabel) {
  const match = String(dateLabel ?? '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return '2026-06-17';
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
  if (Number.isNaN(date.getTime())) return '2026-06-17';
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, '0'))
    .join('-');
}
