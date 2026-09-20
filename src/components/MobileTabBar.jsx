import { ClipboardList, LayoutDashboard, Menu, Stethoscope, UserRound } from 'lucide-react';
import { forwardRef } from 'react';

/**
 * Phone and small tablet navigation (SF-300). Hidden above 860px by CSS.
 * The four most used clinical screens sit in the tab bar. Everything else,
 * including the safety card and ward context, lives in the More sheet,
 * which is the full "SafeFlow workspace" navigation.
 * Spec: docs/design/SAFeflow-DESIGN.md section 17.
 */
export const MOBILE_TABS = Object.freeze([
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: UserRound },
  { id: 'observations', label: 'Obs', icon: Stethoscope },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList }
]);

const TAB_IDS = new Set(MOBILE_TABS.map((tab) => tab.id));

export const MobileTabBar = forwardRef(function MobileTabBar({
  activeView = 'board',
  isMoreOpen = false,
  moreControlsId = 'workspace-nav',
  onNavigate = () => {},
  onToggleMore = () => {},
  taskCount = null
}, moreRef) {
  const moreIsCurrent = !TAB_IDS.has(activeView);

  return (
    <nav aria-label="Quick navigation" className="sf-mobile-tabbar">
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isCurrent = activeView === tab.id && !isMoreOpen;
        return (
          <button
            aria-current={activeView === tab.id ? 'page' : undefined}
            className={`sf-mobile-tab${isCurrent ? ' is-current' : ''}`}
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            type="button"
          >
            <span className="sf-mobile-tab-icon">
              <Icon aria-hidden="true" focusable="false" />
            </span>
            <span className="sf-mobile-tab-label">{tab.label}</span>
            {tab.id === 'tasks' && taskCount !== null && (
              <strong className="sf-mobile-tab-count">{taskCount}</strong>
            )}
          </button>
        );
      })}
      <button
        aria-controls={moreControlsId}
        aria-expanded={isMoreOpen}
        className={`sf-mobile-tab${isMoreOpen || moreIsCurrent ? ' is-current' : ''}`}
        onClick={onToggleMore}
        ref={moreRef}
        type="button"
      >
        <span className="sf-mobile-tab-icon">
          <Menu aria-hidden="true" focusable="false" />
        </span>
        <span className="sf-mobile-tab-label">More</span>
      </button>
    </nav>
  );
});
