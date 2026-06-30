import {
  AlertTriangle,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  Stethoscope,
  UserRound,
  Waypoints
} from 'lucide-react';

const navItems = [
  { id: 'board', label: 'Ward Safety Board', icon: LayoutDashboard },
  { id: 'patients', label: 'My Patients', icon: UserRound },
  { id: 'observations', label: 'Observations', icon: Stethoscope },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { id: 'handover', label: 'Handover', icon: Waypoints },
  { id: 'discharges', label: 'Discharges', icon: ClipboardPlus },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'audit', label: 'Audit Trail', icon: ListChecks },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const familySafeNavItemIds = new Set(['board', 'patients', 'settings']);

export function WorkspaceNav({
  activeView = 'board',
  taskCount = 6,
  escalationCount = 2,
  roleMode = 'clinical-staff',
  onNavigate = () => {}
}) {
  const visibleNavItems =
    roleMode === 'family-safe-preview'
      ? navItems.filter((item) => familySafeNavItemIds.has(item.id))
      : navItems;
  const roleLabel =
    roleMode === 'family-safe-preview'
      ? 'Family-safe preview'
      : roleMode === 'educator-simulation'
        ? 'Educator simulation'
        : 'Clinical staff';

  return (
    <aside className="workspace-nav" aria-label="SafeFlow workspace">
      <div className="nav-brand">
        <span className="brand-mark" aria-hidden="true">SF</span>
        <div>
          <strong>SafeFlow</strong>
          <span>Nursing simulation</span>
        </div>
      </div>

      <nav aria-label="SafeFlow workspace">
        {visibleNavItems.map((item) => {
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

      <div className="nav-context">
        <p><strong>Mode</strong><span>{roleLabel}</span></p>
        <p><strong>Ward</strong><span>Day Care Unit</span></p>
        <p><strong>Location</strong><span>Cityview Community Hospital</span></p>
        <small>Simulation version 1.3</small>
      </div>
    </aside>
  );
}
