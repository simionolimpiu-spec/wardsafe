import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ConnectView } from './ConnectView.jsx';
const patients = [
  { id: 'p-a', name: 'Fictional Alice' },
  { id: 'p-b', name: 'Fictional Ben' }
];
it('keeps the view mounted and announces a refused submission', () => {
  setup();
  const timeline = screen.getByRole('list', { name: 'Thread timeline' });
  const before = timeline.textContent;
  fireEvent.submit(screen.getByLabelText('Message').closest('form'));
  expect(
    screen.getByRole('region', { name: 'Communication' })
  ).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Action refused: body required'
  );
  expect(timeline.textContent).toBe(before);
});
function setup(tasks = []) {
  render(
    <StrictMode>
      <ConnectView patients={patients} tasks={tasks} selectedPatientId="p-a" />
    </StrictMode>
  );
  return userEvent.setup();
}
it('exposes simulation boundaries, current thread, keyboard send and a privacy-safe preview', async () => {
  const user = setup();
  expect(screen.getByText(/Not connected to Teams/)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Fictional Alice/ })
  ).toHaveAttribute('aria-current', 'true');
  screen.getByLabelText('Message').focus();
  await user.keyboard('please escalate urgently');
  await user.tab();
  expect(
    screen.getByRole('button', { name: 'Send message', exact: true })
  ).toHaveFocus();
  await user.keyboard('{Enter}');
  const message = screen
    .getByText('please escalate urgently')
    .closest('article');
  expect(within(message).getByText('Message')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Message sent in simulation'
  );
  const preview = screen.getByRole('region', {
    name: 'Lock-screen preview (simulation)'
  });
  expect(preview).toHaveTextContent('SafeFlow - new message');
  expect(preview.textContent).not.toMatch(/Alice|Ben|p-a|p-b|\d|escalate/);
  expect(
    screen.queryByRole('button', { name: /create task|convert/i })
  ).not.toBeInTheDocument();
});
it('disables sending for an unresolved role, including draft approval and requests', async () => {
  const user = setup();
  await user.type(screen.getByLabelText('Message'), 'Fictional message');
  await user.selectOptions(screen.getByLabelText('Recipient role'), 'on-call');
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  expect(
    screen.getAllByText('No current available assignment').length
  ).toBeGreaterThan(0);
  await user.click(
    screen.getByRole('button', { name: 'Draft reply (simulation)' })
  );
  expect(
    screen.getByRole('button', { name: 'Approve and send' })
  ).toBeDisabled();
  await user.click(screen.getByText('New request', { selector: 'summary' }));
  await user.type(
    screen.getByLabelText('Request summary'),
    'Fictional request'
  );
  expect(screen.getByRole('button', { name: 'Send request' })).toBeDisabled();
});
it('walks the request lifecycle and restores focus when cancellation is dismissed', async () => {
  const user = setup();
  await user.click(screen.getByText('New request', { selector: 'summary' }));
  await user.type(
    screen.getByLabelText('Request summary'),
    'Review fictional documentation'
  );
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  await user.click(screen.getByRole('button', { name: 'Cancel request' }));
  expect(
    screen.getByRole('button', { name: 'Confirm cancellation' })
  ).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'Cancel request' })).toHaveFocus();
  expect(
    screen.queryByRole('button', { name: 'Complete', exact: true })
  ).not.toBeInTheDocument();
  for (const name of ['Simulate delivery', 'Simulate read', 'Acknowledge'])
    await user.click(screen.getByRole('button', { name, exact: true }));
  expect(screen.getByRole('status')).toHaveTextContent('Request acknowledged');
  expect(
    screen.getByRole('button', { name: 'Accept', exact: true })
  ).toBeInTheDocument();
  for (const name of ['Accept', 'Start', 'Complete'])
    await user.click(screen.getByRole('button', { name, exact: true }));
  expect(screen.getByRole('status')).toHaveTextContent('Request completed');
});
it('keeps drafts out of the timeline until human approval and supports edit/discard', async () => {
  const user = setup();
  const timeline = screen.getByRole('list', { name: 'Thread timeline' });
  await user.click(
    screen.getByRole('button', { name: 'Draft reply (simulation)' })
  );
  expect(within(timeline).queryByText('AI draft')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Approve and send' }));
  expect(
    within(timeline).getByText(/Approved by Alex Morgan/)
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Draft reply (simulation)' })
  );
  await user.click(screen.getByRole('button', { name: 'Edit as my message' }));
  expect(screen.getByLabelText('Message')).toHaveFocus();
  expect(screen.getByLabelText('Message').value).not.toBe('');
  await user.click(
    screen.getByRole('button', { name: 'Draft reply (simulation)' })
  );
  await user.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.getByRole('status')).toHaveTextContent('Draft discarded');
});
it('offers only existing tasks for the patient and an explicit empty state', async () => {
  const user = setup([
    { id: 'a-task', patientId: 'p-a', label: 'Alice existing task' },
    { id: 'b-task', patientId: 'p-b', label: 'Ben existing task' }
  ]);
  await user.click(
    screen.getByText('Link an existing task', { selector: 'summary' })
  );
  expect(
    screen.getByRole('option', { name: /Alice existing task/ })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: /Ben existing task/ })
  ).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Existing task'), '0');
  await user.click(screen.getByRole('button', { name: 'Link existing task' }));
  expect(screen.getByText('Existing task: a-task')).toBeInTheDocument();
});
it('shows an empty task state', async () => {
  const user = setup();
  await user.click(
    screen.getByText('Link an existing task', { selector: 'summary' })
  );
  expect(screen.getByText('No existing tasks to link')).toBeInTheDocument();
});
