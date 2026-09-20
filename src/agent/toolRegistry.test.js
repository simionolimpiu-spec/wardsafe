import { describe, expect, it, vi } from 'vitest';
import { createAgentSession, createToolRegistry, ToolInvocationError } from './index.js';

const now = () => '2026-06-17T14:00:00.000Z';
const schema = { type: 'object', properties: { value: { type: 'string', enum: ['simulation'] } }, required: ['value'], additionalProperties: false };
const tool = () => ({ name: 'getExample', description: 'Read simulation data.', permissions: ['read:simulation'], inputSchema: schema, outputSchema: schema, handler: vi.fn((input) => input) });
function session() {
  let id = 0;
  return createAgentSession({ patientId: 'DCU-031', workspaceId: 'simulation' }, { now, createId: () => `id-${++id}` });
}
const args = () => ({ name: 'getExample', input: { value: 'simulation' }, session: session(), correlationId: 'call-1', allowedTools: ['getExample'], grantedPermissions: ['read:simulation'] });

describe('read tool registry', () => {
  it.each(['executeSQL', 'runAnything', 'runShell', 'eval', 'query', 'fetch', 'createReviewCue'])('rejects %s at registration', (name) => {
    expect(() => createToolRegistry([{ ...tool(), name }])).toThrow();
  });
  it.each([{ permissions: [] }, { permissions: ['write:simulation'] }, { description: ' ' }, { handler: null }, { inputSchema: { type: 'string', format: 'date' } }, { outputSchema: { type: 'object', properties: { nested: { type: 'string', format: 'date' } } } }])('rejects invalid definition %j', (change) => {
    expect(() => createToolRegistry([{ ...tool(), ...change }])).toThrow();
  });
  it('rejects duplicate names', () => expect(() => createToolRegistry([tool(), tool()])).toThrow());
  it.each([
    ['UNKNOWN_TOOL', { name: 'getMissing' }],
    ['TOOL_NOT_ALLOWED', { allowedTools: [] }],
    ['TOOL_NOT_ALLOWED', { allowedTools: undefined }],
    ['PERMISSION_DENIED', { grantedPermissions: [] }],
    ['PERMISSION_DENIED', { grantedPermissions: undefined }],
    ['INVALID_INPUT', { input: { value: 'simulation', extra: true } }],
    ['INVALID_INPUT', { input: { value: 1 } }],
    ['INVALID_INPUT', { input: { value: 'other' } }],
    ['INVALID_INPUT', { input: {} }],
    ['HANDLER_FAILED', {}, () => { throw new Error('private details'); }],
    ['HANDLER_FAILED', {}, async () => { throw new Error('private details'); }],
    ['INVALID_OUTPUT', {}, () => ({ value: 1 })]
  ])('audits %s fail-closed', async (code, change, handler) => {
    const definition = tool();
    if (handler) definition.handler = vi.fn(handler);
    const input = { ...args(), ...change };
    await expect(createToolRegistry([definition]).invoke(input)).rejects.toMatchObject({ name: 'ToolInvocationError', code });
    const events = input.session.getEvents();
    expect(events.map(({ eventType }) => eventType)).toEqual(['TOOL_CALL_REQUESTED', 'ERROR']);
    expect(events.map(({ sequence }) => sequence)).toEqual([1, 2]);
    expect(events[0]).toMatchObject({ actor: { kind: 'system', ref: 'tool-registry' }, payload: { toolName: input.name, input: input.input }, correlationId: 'call-1' });
    expect(events[1]).toMatchObject({ actor: { kind: 'system', ref: 'tool-registry' }, payload: { toolName: input.name, code, message: `Simulation tool invocation failed: ${code}.` } });
    if (!handler) expect(definition.handler).not.toHaveBeenCalled();
  });
  it('requires a session before running anything', async () => {
    const definition = tool();
    await expect(createToolRegistry([definition]).invoke({ ...args(), session: undefined })).rejects.toThrow();
    expect(definition.handler).not.toHaveBeenCalled();
  });
  it('owns metadata and snapshots inputs, outputs and injected time', async () => {
    const definition = tool();
    const registry = createToolRegistry([definition]);
    definition.permissions.push('write:changed');
    expect(Object.isFrozen(registry)).toBe(true);
    expect(registry.hasTool('getExample')).toBe(true);
    expect(registry.hasTool('toString')).toBe(false);
    expect(registry.listTools()[0]).not.toHaveProperty('handler');
    expect(Object.isFrozen(registry.listTools()[0].inputSchema.properties)).toBe(true);
    const input = args();
    const result = await registry.invoke(input);
    expect(Object.isFrozen(result)).toBe(true);
    expect(definition.handler.mock.calls[0][1].now()).toBe(now());
    expect(Object.isFrozen(definition.handler.mock.calls[0][0])).toBe(true);
    expect(input.session.getEvents()[1]).toMatchObject({ eventType: 'TOOL_CALL_COMPLETED', actor: { kind: 'tool', ref: 'getExample' }, payload: { toolName: 'getExample', output: result } });
    expect(new ToolInvocationError('INVALID_INPUT', 'Simulation input').code).toBe('INVALID_INPUT');
  });
});
