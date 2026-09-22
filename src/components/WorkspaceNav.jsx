import {
  MessagesSquare,
  AlertTriangle,
  Building2,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
  ListChecks,
  Award,
  Settings,
  Sparkles,
  Stethoscope,
  UserRound,
  Waypoints,
  ShieldAlert,
  X
} from 'lucide-react';

const wardNavGroups = [
  {
    label: 'Ward workflow',
    items: [
      { id: 'hospitals', label: 'Hospitals & Wards', icon: Building2 },
      { id: 'board', label: 'Ward Safety Board', icon: LayoutDashboard },
      { id: 'patients', label: 'My Patients', icon: UserRound },
      { id: 'observations', label: 'Observations', icon: Stethoscope },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList },
      { id: 'escalations', label: 'Escalations', icon: AlertTriangle }
    ]
  },
  {
    label: 'Coordination',
    items: [
      { id: 'hospital-insights', label: 'Hospital insights', icon: BarChart3 },
      { id: 'communication', label: 'Communication', icon: MessagesSquare },
      { id: 'handover', label: 'Handover', icon: Waypoints },
      { id: 'discharges', label: 'Discharges', icon: ClipboardPlus },
      { id: 'reports', label: 'Reports', icon: FileText }
    ]
  },
  {
    label: 'Learning and governance',
    items: [
      { id: 'scenarios', label: 'Scenarios', icon: ClipboardList },
      { id: 'competency-passport', label: 'Competency Passport', icon: Award },
      { id: 'learning-hub', label: 'Learning Hub', icon: BookOpenCheck },
      { id: 'twin', label: 'Patient Journey Twin', icon: Sparkles },
      { id: 'trust-network', label: 'Trust Network', icon: Waypoints },
      { id: 'audit', label: 'Audit Trail', icon: ListChecks },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
];

const primaryCareNavGroups = [
  {
    label: 'Practice workflow',
    items: [
      { id: 'practice-overview', label: 'Practice overview', icon: LayoutDashboard },
      { id: 'contact-requests', label: 'Contact requests', icon: ClipboardList },
      { id: 'continuity', label: 'Continuity review', icon: UserRound },
      { id: 'results-follow-up', label: 'Results follow-up', icon: Stethoscope },
      { id: 'referrals', label: 'Referral readiness', icon: Waypoints }
    ]
  },
  {
    label: 'Coordination',
    items: [
      { id: 'primary-tasks', label: 'Review tasks', icon: ListChecks },
      { id: 'coordination', label: 'Care coordination', icon: ClipboardPlus },
      { id: 'primary-reports', label: 'Reports', icon: FileText }
    ]
  },
  {
    label: 'Learning and governance',
    items: [
      { id: 'primary-scenarios', label: 'Scenarios', icon: BookOpenCheck },
      { id: 'primary-audit', label: 'Audit trail', icon: ShieldAlert },
      { id: 'primary-settings', label: 'Settings', icon: Settings }
    ]
  }
];

export function WorkspaceNav({
  activeView = 'board',
  carePathway = 'ward-care',
  taskCount = 6,
  escalationCount = 2,
  onNavigate = () => {},
  currentWardName = 'Day Care Unit',
  currentLocationName = 'James Paget University Hospital',
  closeButtonRef,
  isOpen = false,
  onClose = () => {},
  navRef
}) {
  const navGroups = carePathway === 'primary-care' ? primaryCareNavGroups : wardNavGroups;
  const isPrimaryCare = carePathway === 'primary-care';
  return (
    <aside
      aria-label="SafeFlow workspace"
      aria-modal={isOpen ? 'true' : undefined}
      className={`workspace-nav ${isOpen ? 'is-open' : ''}`}
      id="workspace-navigation"
      ref={navRef}
      role={isOpen ? 'dialog' : undefined}
    >
      <div className="nav-brand">
        <span className="brand-mark" aria-hidden="true">SF</span>
        <div>
          <strong>{isPrimaryCare ? 'SafeFlow Primary Care' : 'SafeFlow Nursing'}</strong>
          <span>{isPrimaryCare ? 'Simulation-only primary care workspace' : 'Simulation-only ward workspace'}</span>
        </div>
        <button aria-label="Close navigation" className="nav-close" onClick={onClose} ref={closeButtonRef} type="button">
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <nav aria-label="SafeFlow workspace">
        {navGroups.map((group) => (
          <section className="nav-group" key={group.label}>
            <span className="nav-group-title">{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const count = ['tasks', 'primary-tasks'].includes(item.id)
                ? taskCount
                : ['escalations', 'results-follow-up'].includes(item.id) ? escalationCount : null;
              return (
                <button
                  aria-current={activeView === item.id ? 'page' : undefined}
                  className={activeView === item.id ? 'active' : ''}
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                  {count !== null && <strong className="nav-count">{count}</strong>}
                </button>
              );
            })}
          </section>
        ))}
      </nav>

      <section aria-label="Safety first" className="nav-safety-card">
        <ShieldAlert aria-hidden="true" size={18} />
        <div>
          <strong>Safety first</strong>
          <p>See documentation that needs review?</p>
          <button onClick={() => onNavigate(isPrimaryCare ? 'primary-reports' : 'reports')} type="button">Report concern</button>
        </div>
      </section>

      <div className="nav-context">
        <p><strong>{isPrimaryCare ? 'Practice' : 'Ward'}</strong><span>{currentWardName}</span></p>
        <p><strong>{isPrimaryCare ? 'Network' : 'Location'}</strong><span>{currentLocationName}</span></p>
        <small>Simulation version 1.3</small>
      </div>
    </aside>
  );
}
