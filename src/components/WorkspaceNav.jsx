import {
  AlertTriangle,
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
import { forwardRef } from 'react';

export const navItems = [
  { id: 'board', label: 'Ward Safety Board', icon: LayoutDashboard },
  { id: 'patients', label: 'My Patients', icon: UserRound },
  { id: 'observations', label: 'Observations', icon: Stethoscope },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { id: 'hospital-insights', label: 'Hospital insights', icon: BarChart3 },
  { id: 'handover', label: 'Handover', icon: Waypoints },
  { id: 'discharges', label: 'Discharges', icon: ClipboardPlus },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'scenarios', label: 'Scenarios', icon: ClipboardList },
  { id: 'competency-passport', label: 'Competency Passport', icon: Award },
  { id: 'learning-hub', label: 'Learning Hub', icon: BookOpenCheck },
  { id: 'twin', label: 'Patient Journey Twin', icon: Sparkles },
  { id: 'trust-network', label: 'Trust Network', icon: Waypoints },
  { id: 'audit', label: 'Audit Trail', icon: ListChecks },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const WorkspaceNav = forwardRef(function WorkspaceNav({
  activeView = 'board',
  taskCount = 6,
  escalationCount = 2,
  onNavigate = () => {},
  currentWardName = 'Day Care Unit',
  id = 'workspace-nav',
  isMobileOpen = false,
  onMobileClose = () => {}
}, ref) {
  function handleKeyDown(event) {
    if (isMobileOpen && event.key === 'Escape') {
      event.stopPropagation();
      onMobileClose();
    }
  }

  return (
    <aside
      aria-label="SafeFlow workspace"
      className={`workspace-nav${isMobileOpen ? ' is-mobile-open' : ''}`}
      id={id}
      onKeyDown={handleKeyDown}
      ref={ref}
    >
      <div className="nav-brand">
        <span className="brand-mark" aria-hidden="true">SF</span>
        <div>
          <strong>SafeFlow Nursing</strong>
          <span>Simulation-only ward workspace</span>
        </div>
      </div>

      <div className="sf-mobile-sheet-head">
        <strong>All screens</strong>
        <button className="sf-mobile-sheet-close" onClick={onMobileClose} type="button">
          <X aria-hidden="true" size={18} />
          Close menu
        </button>
      </div>

      <nav aria-label="SafeFlow workspace">
        {navItems.map((item) => {
          const Icon = item.icon;
          const count = item.id === 'tasks'
            ? taskCount
            : item.id === 'escalations' ? escalationCount : null;
          return (
            <button
              aria-current={activeView === item.id ? 'page' : undefined}
              className={activeView === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={17} />
              <span>{item.label}</span>
              {count !== null && <strong className="nav-count">{count}</strong>}
            </button>
          );
        })}
      </nav>

      <section aria-label="Safety first" className="nav-safety-card">
        <ShieldAlert aria-hidden="true" size={18} />
        <div>
          <strong>Safety first</strong>
          <p>See something that needs review?</p>
          <button onClick={() => onNavigate('reports')} type="button">Report concern</button>
        </div>
      </section>

      <div className="nav-context">
        <p><strong>Ward</strong><span>{currentWardName}</span></p>
        <p><strong>Location</strong><span>Cityview Community Hospital</span></p>
        <small>Simulation version 1.3</small>
      </div>
    </aside>
  );
});
