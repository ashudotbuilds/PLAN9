import { buildApiApp } from './app.js';

const app = buildApiApp();
const port = Number(process.env.PORT || process.env.API_PORT || 4000);
const host = process.env.API_HOST || '127.0.0.1';

app.listen({ port, host }, (err, address) => {
  if (err) {
    console.error('Failed to start Control Plane API server:', err);
    process.exit(1);
  }
  console.log(`Control Plane API listening on ${address}`);
});
