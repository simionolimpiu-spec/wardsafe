import { Inbox } from 'lucide-react';

/** Explicit "nothing here" message. Never leave an empty region silent. */
export function EmptyState({ icon: Icon = Inbox, title, children, action, className = '' }) {
  return (
    <div className={['sf-state', 'sf-state--empty', className].filter(Boolean).join(' ')}>
      <Icon aria-hidden="true" className="sf-state__icon" focusable="false" />
      <div className="sf-state__body">
        {title && <p className="sf-state__title">{title}</p>}
        {children && <div className="sf-state__text">{children}</div>}
        {action && <div className="sf-state__action">{action}</div>}
      </div>
    </div>
  );
}
