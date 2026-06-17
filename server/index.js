import { createServer } from 'node:http';
import { createApiHandler } from './api.js';
import { createConfiguredDraftProvider } from './providerFactory.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const provider = createConfiguredDraftProvider();
const server = createServer(createApiHandler({ provider }));

server.listen(port, host, () => {
  console.log(`SafeFlow API listening on http://${host}:${port}`);
  console.log(`Draft provider: ${provider.id}`);
});
