import { spawn } from 'node:child_process';

const processes: Array<{ name: string; proc: ReturnType<typeof spawn> }> = [];

function startProcess(name: string, command: string, args: string[], cwd: string) {
  console.log(`[${name}] Starting...`);
  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  proc.on('exit', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  processes.push({ name, proc });
}

console.log('Starting DriftGuard Services (TICKET 01)...');

// Start Mock Providers (port 4001)
startProcess('Mock-Providers', 'npx', ['tsx', 'src/index.ts'], 'apps/mock-providers');

// Start Control Plane API (port 4000)
startProcess('API', 'npx', ['tsx', 'src/index.ts'], 'apps/api');

// Start Web Frontend (port 3000)
startProcess('Web', 'npx', ['vite'], 'apps/web');

process.on('SIGINT', () => {
  console.log('Shutting down services...');
  for (const { proc } of processes) {
    proc.kill('SIGINT');
  }
  process.exit(0);
});
