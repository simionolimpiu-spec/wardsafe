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
  { label: 'Ward Safety Board', icon: LayoutDashboard, active: true },
  { label: 'My Patients', icon: UserRound },
  { label: 'Observations', icon: Stethoscope },
  { label: 'Tasks', icon: ClipboardList, count: 6 },
  { label: 'Escalations', icon: AlertTriangle, count: 2 },
  { label: 'Handover', icon: Waypoints },
  { label: 'Discharges', icon: ClipboardPlus },
  { label: 'Reports', icon: FileText },
  { label: 'Audit Trail', icon: ListChecks },
  { label: 'Settings', icon: Settings }
];

export function WorkspaceNav() {
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
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className={item.active ? 'active' : ''} key={item.label} type="button">
              <Icon aria-hidden="true" size={17} />
              <span>{item.label}</span>
              {item.count && <strong className="nav-count">{item.count}</strong>}
            </button>
          );
        })}
      </nav>

      <div className="nav-context">
        <p><strong>Ward</strong><span>Day Care Unit</span></p>
        <p><strong>Location</strong><span>Cityview Community Hospital</span></p>
        <small>Simulation version 1.3</small>
      </div>
    </aside>
  );
}
