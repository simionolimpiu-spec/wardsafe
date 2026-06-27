import { createServer } from 'node:http';
import { createApiHandler } from './api.js';
import { createConfiguredAuditEventProvider } from './auditEventProvider.js';
import { createConfiguredDraftProvider } from './providerFactory.js';
import { createConfiguredWorkspaceProvider } from './workspaceProvider.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const provider = createConfiguredDraftProvider();
const workspaceProvider = createConfiguredWorkspaceProvider();
const auditEventProvider = createConfiguredAuditEventProvider();
const server = createServer(createApiHandler({ provider, workspaceProvider, auditEventProvider }));

server.listen(port, host, () => {
  console.log(`SafeFlow API listening on http://${host}:${port}`);
  console.log(`Draft provider: ${provider.id}`);
  console.log(`Workspace provider: ${workspaceProvider.id}`);
  console.log(`Audit provider: ${auditEventProvider.id}`);
});
