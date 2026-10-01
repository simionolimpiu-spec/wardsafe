import { humanLabel } from './RoleRecipientPicker.jsx';
export function ThreadList({ threads, selectedThreadId, onSelect, listRef }) {
  return (
    <section
      className="sf-connect__threads"
      aria-labelledby="connect-threads-title"
    >
      <h3 id="connect-threads-title" tabIndex={-1} ref={listRef}>
        Threads
      </h3>
      <ul>
        {threads.map((thread) => (
          <li key={thread.id}>
            <button
              type="button"
              aria-current={thread.id === selectedThreadId ? 'true' : undefined}
              onClick={() => onSelect(thread.id)}
            >
              <strong>{thread.title}</strong>
              <span>
                {humanLabel(thread.scope)} thread · {thread.unread} unread
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
