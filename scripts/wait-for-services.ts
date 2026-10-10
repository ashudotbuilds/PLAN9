export async function waitForServices(timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  const targets = [
    { name: 'Control Plane API', url: 'http://127.0.0.1:4000/api/health' },
    { name: 'Mock Providers', url: 'http://127.0.0.1:4001/health' }
  ];

  console.log(`Waiting for services to become ready (timeout ${timeoutMs}ms)...`);

  while (Date.now() - start < timeoutMs) {
    let allReady = true;

    for (const target of targets) {
      try {
        const res = await fetch(target.url, { signal: AbortSignal.timeout(1000) });
        if (!res.ok) {
          allReady = false;
          break;
        }
      } catch {
        allReady = false;
        break;
      }
    }

    if (allReady) {
      console.log('All services are healthy and responsive.');
      return true;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.error('Timed out waiting for services.');
  return false;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const ready = await waitForServices();
  process.exit(ready ? 0 : 1);
}
