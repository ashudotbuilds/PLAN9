import { buildMockProvidersApp } from './app.js';

const app = buildMockProvidersApp();
const port = Number(process.env.MOCK_PROVIDERS_PORT || 4001);
const host = process.env.MOCK_PROVIDERS_HOST || '127.0.0.1';

app.listen({ port, host }, (err, address) => {
  if (err) {
    console.error('Failed to start mock-providers server:', err);
    process.exit(1);
  }
  console.log(`Mock providers listening on ${address}`);
});
