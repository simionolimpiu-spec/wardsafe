import { useState } from 'react';
import { EmptyState } from '../../design-system/index.js';
export function TaskLinkPicker({ tasks, onLink }) {
  const [selection, setSelection] = useState('');
  if (!tasks.length) return <EmptyState title="No existing tasks to link" />;
  const selectedIndex = tasks.some((_, index) => String(index) === selection)
    ? selection
    : '';
  return (
    <form
      className="sf-connect__form"
      onSubmit={(event) => {
        event.preventDefault();
        if (selectedIndex !== '') onLink(tasks[Number(selectedIndex)].id);
      }}
    >
      <label htmlFor="connect-task">Existing task</label>
      <select
        id="connect-task"
        value={selectedIndex}
        onChange={(event) => setSelection(event.target.value)}
      >
        <option value="">Choose an existing task</option>
        {tasks.map((task, index) => (
          <option key={`${task.patientId}-${task.id}`} value={index}>
            {task.label} · {task.id}
          </option>
        ))}
      </select>
      <button type="submit" disabled={selectedIndex === ''}>
        Link existing task
      </button>
    </form>
  );
}
