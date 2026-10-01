import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuditEvent, initialAuditEvents } from './workflowEvents.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('workflowEvents', () => {
  it('creates a deterministic audit event shape when the clock is stubbed', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1718000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('09:05');

    const event = createAuditEvent({
      label: 'SBAR draft edited and saved',
      detail: 'Draft text'
    });

    expect(event).toMatchObject({
      id: expect.stringMatching(/^1718000000000-[a-z0-9]+$/),
      time: '09:05',
      actor: 'Leanne Mitchell',
      label: 'SBAR draft edited and saved',
      detail: 'Draft text'
    });
  });

  it('maps valid response history entries into audit events', () => {
    const events = initialAuditEvents({
      id: 'DCU-031',
      responsibleNurse: 'Leanne Mitchell',
      responseHistory: [
        '08:45 escalation activated',
        '09:05 blood cultures taken'
      ]
    });

    expect(events).toEqual([
      {
        id: 'DCU-031-0',
        time: '08:45',
        actor: 'Leanne Mitchell',
        label: 'escalation activated',
        detail: 'Imported from fictional scenario timeline.'
      },
      {
        id: 'DCU-031-1',
        time: '09:05',
        actor: 'Leanne Mitchell',
        label: 'blood cultures taken',
        detail: 'Imported from fictional scenario timeline.'
      }
    ]);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['non-array', '08:45 escalation activated']
  ])('returns an empty audit trail when responseHistory is %s', (_, responseHistory) => {
    expect(initialAuditEvents({
      id: 'DCU-NULL',
      responsibleNurse: 'Leanne Mitchell',
      responseHistory
    })).toEqual([]);
  });
});
