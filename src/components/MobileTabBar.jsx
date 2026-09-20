import { ClipboardList, Inbox, LayoutDashboard, ListChecks, Menu, Stethoscope, UserRound } from 'lucide-react';
import { forwardRef } from 'react';

/**
 * Phone and small tablet navigation (SF-300). Hidden above 860px by CSS.
 * The four most used screens for the care setting sit in the tab bar. More
 * opens the full "SafeFlow workspace" navigation drawer, which also holds
 * the safety card and ward or practice context.
 * Spec: docs/design/SAFeflow-DESIGN.md section 17.
 */
export const MOBILE_TABS = Object.freeze([
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: UserRound },
  { id: 'observations', label: 'Obs', icon: Stethoscope },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList }
]);

export const PRIMARY_CARE_MOBILE_TABS = Object.freeze([
  { id: 'practice-overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'contact-requests', label: 'Requests', icon: Inbox },
  { id: 'results-follow-up', label: 'Results', icon: Stethoscope },
  { id: 'primary-tasks', label: 'Tasks', icon: ListChecks }
]);

const TASK_TAB_IDS = new Set(['tasks', 'primary-tasks']);

export const MobileTabBar = forwardRef(function MobileTabBar({
  activeView = 'board',
  carePathway = 'ward-care',
  isMoreOpen = false,
  moreControlsId = 'workspace-navigation',
  onNavigate = () => {},
  onToggleMore = () => {},
  taskCount = null
}, moreRef) {
  const tabs = carePathway === 'primary-care' ? PRIMARY_CARE_MOBILE_TABS : MOBILE_TABS;
  const moreIsCurrent = !tabs.some((tab) => tab.id === activeView);

  return (
    <nav aria-label="Quick navigation" className="sf-mobile-tabbar">
      {tabs.map((tab) => {
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
            {TASK_TAB_IDS.has(tab.id) && taskCount !== null && (
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
