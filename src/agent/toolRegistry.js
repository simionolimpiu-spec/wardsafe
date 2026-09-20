import { frozenCopy, isNonEmptyString } from './domainValues.js';
import { assertSupportedSchema, validateAgainstSchema } from './toolSchema.js';
import { copyToolOutput } from './untrustedContent.js';

export class ToolInvocationError extends Error {
  constructor(code, message) { super(message); this.name = 'ToolInvocationError'; this.code = code; }
}

export function createToolRegistry(tools) {
  if (!Array.isArray(tools)) throw new TypeError('Tool definitions must be an array.');
  const definitions = new Map();
  for (const tool of tools) {
    if (!tool || typeof tool.name !== 'string' || !/^get[A-Z][A-Za-z]+$/.test(tool.name)
      || ['executeSQL', 'runAnything', 'runShell', 'eval', 'query', 'fetch'].includes(tool.name)
      || definitions.has(tool.name) || !isNonEmptyString(tool.description)
      || !Array.isArray(tool.permissions) || !tool.permissions.length
      || tool.permissions.some((permission) => typeof permission !== 'string' || !permission.startsWith('read:') || !isNonEmptyString(permission.slice(5)))
      || typeof tool.handler !== 'function') throw new TypeError('Invalid read tool definition.');
    assertSupportedSchema(tool.inputSchema);
    assertSupportedSchema(tool.outputSchema);
    const { name, description, permissions, inputSchema, outputSchema, handler } = tool;
    definitions.set(name, { metadata: frozenCopy({ name, description, permissions, inputSchema, outputSchema }), handler });
  }
  const listed = Object.freeze([...definitions.values()].map(({ metadata }) => metadata));
  return Object.freeze({
    listTools: () => listed,
    hasTool: (name) => definitions.has(name),
    async invoke({ name, input, session, correlationId, allowedTools, grantedPermissions }) {
      if (!session || typeof session.append !== 'function') throw new TypeError('A simulation session is required.');
      const actor = { kind: 'system', ref: 'tool-registry' };
      const requested = session.append({ eventType: 'TOOL_CALL_REQUESTED', actor, payload: { toolName: name, input }, correlationId });
      let output;
      let code = 'UNKNOWN_TOOL';
      try {
        const definition = definitions.get(name);
        if (!definition) throw new Error();
        code = 'TOOL_NOT_ALLOWED';
        if (!Array.isArray(allowedTools) || !allowedTools.includes(name)) throw new Error();
        code = 'PERMISSION_DENIED';
        if (!Array.isArray(grantedPermissions) || !definition.metadata.permissions.every((permission) => grantedPermissions.includes(permission))) throw new Error();
        code = 'INVALID_INPUT';
        const snapshot = requested.payload.input;
        if (!validateAgainstSchema(definition.metadata.inputSchema, snapshot).valid) throw new Error();
        code = 'HANDLER_FAILED';
        const result = await definition.handler(snapshot, Object.freeze({ now: () => requested.timestamp }));
        code = 'INVALID_OUTPUT';
        if (!validateAgainstSchema(definition.metadata.outputSchema, result).valid) throw new Error();
        output = copyToolOutput(result);
      } catch {
        const message = `Simulation tool invocation failed: ${code}.`;
        session.append({ eventType: 'ERROR', actor, payload: { toolName: name, code, message }, correlationId });
        throw new ToolInvocationError(code, message);
      }
      session.append({ eventType: 'TOOL_CALL_COMPLETED', actor: { kind: 'tool', ref: name }, payload: { toolName: name, output }, correlationId });
      return output;
    }
  });
}
