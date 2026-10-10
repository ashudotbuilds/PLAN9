import React, { useEffect, useState } from 'react';
import { apiClient, SystemReadiness } from './api-client';
import { ProjectSummary, ProjectEnvironment } from '@driftguard/contracts';

export function App() {
  const [readiness, setReadiness] = useState<SystemReadiness>({
    api: { status: 'loading' },
    mockProviders: { status: 'loading' }
  });
  const [refreshing, setRefreshing] = useState(false);

  // Operator Auth & Projects
  const [operatorToken, setOperatorToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<ProjectEnvironment>('development');
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setRefreshing(true);
    const data = await apiClient.checkSystemReadiness();
    setReadiness(data);
    setRefreshing(false);
  };

  const loadProjects = async () => {
    try {
      const list = await apiClient.listProjects();
      setProjects(list);
      setIsAuthenticated(true);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      if ((err as Error).message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    loadProjects();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorToken.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await apiClient.loginOperator(operatorToken.trim());
      setIsAuthenticated(true);
      setOperatorToken('');
      await loadProjects();
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    setProjectError(null);
    try {
      const res = await apiClient.createProject(newProjectName.trim());
      setNewProjectName('');
      await loadProjects();
      setSelectedProjectId(res.project.id);
    } catch (err) {
      setProjectError((err as Error).message);
    } finally {
      setCreatingProject(false);
    }
  };

  const getStatusBadge = (status: 'loading' | 'ready' | 'offline') => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
            READY
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40">
            OFFLINE
          </span>
        );
      case 'loading':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/40 animate-pulse">
            CHECKING...
          </span>
        );
    }
  };

  const isSystemReady = readiness.api.status === 'ready' && readiness.mockProviders.status === 'ready';
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-[#58a6ff] rounded-sm" />
          <h1 className="text-lg font-semibold tracking-tight text-[#f0f6fc]">
            DriftGuard Control Plane
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-mono">
            MVP 24H • TICKET 28
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs font-mono text-[#8b949e]">
            System Status:{' '}
            <span className={isSystemReady ? 'text-[#3fb950] font-bold' : 'text-[#f85149] font-bold'}>
              {readiness.api.status === 'loading' || readiness.mockProviders.status === 'loading'
                ? 'CHECKING'
                : isSystemReady
                ? 'HEALTHY'
                : 'DEGRADED / OFFLINE'}
            </span>
          </div>

          <button
            onClick={fetchStatus}
            disabled={refreshing}
            className="px-3 py-1.5 text-xs font-medium bg-[#21262d] hover:bg-[#30363d] active:bg-[#282e33] border border-[#30363d] rounded text-[#c9d1d9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            {refreshing ? 'Checking...' : 'Refresh Readiness'}
          </button>
        </div>
      </header>

      {/* Main Operational Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Ticket 28: Operator Onboarding & Project Scope */}
        <section aria-label="Operator & Project Scope" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Operator Onboarding & Project Scope</h2>
              <p className="text-xs text-[#8b949e]">PRD 13.1 / Ticket 28: Scoped operator session and project environment management</p>
            </div>
            <div>
              {isAuthenticated ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                  OPERATOR AUTHENTICATED
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e3b341]/20 text-[#f2cc60] border border-[#e3b341]/40">
                  LOGIN REQUIRED
                </span>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="border-t border-[#30363d] pt-4 space-y-3">
              <p className="text-xs text-[#8b949e]">
                Enter your loopback operator token (<code className="text-[#c9d1d9]">DRIFTGUARD_OPERATOR_TOKEN</code>) to establish an HttpOnly operator session.
              </p>
              <div className="flex gap-3 max-w-md">
                <input
                  type="password"
                  placeholder="Operator token..."
                  value={operatorToken}
                  onChange={(e) => setOperatorToken(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="px-4 py-1.5 text-xs font-medium bg-[#238636] hover:bg-[#2ea043] rounded text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                >
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
              {authError && (
                <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs max-w-md">
                  {authError}
                </div>
              )}
            </form>
          ) : (
            <div className="border-t border-[#30363d] pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Selector */}
                <div className="space-y-2">
                  <label htmlFor="project-select" className="text-xs font-medium text-[#8b949e]">
                    Active Project
                  </label>
                  <select
                    id="project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Environment Selector */}
                <div className="space-y-2">
                  <label htmlFor="env-select" className="text-xs font-medium text-[#8b949e]">
                    Environment Scope
                  </label>
                  <select
                    id="env-select"
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value as ProjectEnvironment)}
                    className="w-full px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    <option value="development">development (demo active)</option>
                    <option value="production">production</option>
                  </select>
                </div>
              </div>

              {/* Active Scoped Project Info */}
              {selectedProject && (
                <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs space-y-1 font-mono">
                  <div className="text-[#8b949e]">
                    Active Scope:{' '}
                    <span className="text-[#58a6ff]">{selectedProject.name}</span> •{' '}
                    <span className="text-[#3fb950]">{selectedEnvironment}</span>
                  </div>
                  <div className="text-[#8b949e]">
                    Project ID: <span className="text-[#c9d1d9]">{selectedProject.id}</span>
                  </div>
                </div>
              )}

              {/* Create New Project Form */}
              <form onSubmit={handleCreateProject} className="flex gap-3 max-w-md items-center">
                <input
                  type="text"
                  placeholder="New project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-3 py-1.5 text-xs font-medium bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-[#c9d1d9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                >
                  {creatingProject ? 'Creating...' : '+ Create Project'}
                </button>
              </form>
              {projectError && (
                <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs max-w-md">
                  {projectError}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Service Readiness Cards */}
        <section aria-label="System Readiness" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Plane API Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Control Plane API</h2>
                <p className="text-xs text-[#8b949e] font-mono">http://127.0.0.1:4000/api/health</p>
              </div>
              <div>{getStatusBadge(readiness.api.status)}</div>
            </div>

            <div className="border-t border-[#30363d] pt-3 text-xs space-y-2">
              <div className="flex justify-between text-[#8b949e]">
                <span>Service Target:</span>
                <span className="font-mono text-[#c9d1d9]">apps/api (Fastify)</span>
              </div>
              <div className="flex justify-between text-[#8b949e]">
                <span>Timestamp:</span>
                <span className="font-mono text-[#c9d1d9]">
                  {readiness.api.details?.timestamp ? new Date(readiness.api.details.timestamp).toLocaleTimeString() : '—'}
                </span>
              </div>
              {readiness.api.error && (
                <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
                  {readiness.api.error}
                </div>
              )}
            </div>
          </div>

          {/* Mock Providers Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Mock Dependency Providers</h2>
                <p className="text-xs text-[#8b949e] font-mono">http://127.0.0.1:4001/health</p>
              </div>
              <div>{getStatusBadge(readiness.mockProviders.status)}</div>
            </div>

            <div className="border-t border-[#30363d] pt-3 text-xs space-y-2">
              <div className="flex justify-between text-[#8b949e]">
                <span>Service Target:</span>
                <span className="font-mono text-[#c9d1d9]">apps/mock-providers</span>
              </div>
              <div className="flex justify-between text-[#8b949e]">
                <span>Timestamp:</span>
                <span className="font-mono text-[#c9d1d9]">
                  {readiness.mockProviders.details?.timestamp
                    ? new Date(readiness.mockProviders.details.timestamp).toLocaleTimeString()
                    : '—'}
                </span>
              </div>
              {readiness.mockProviders.error && (
                <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
                  {readiness.mockProviders.error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Seeded Endpoints Status */}
        <section aria-label="Mock Dependency Endpoints" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Simulated Dependency Endpoints
            </h2>
            <span className="text-xs text-[#8b949e]">Deterministic seeded routes (FR-SIM-01)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="py-2 px-3 font-medium">PROVIDER</th>
                  <th className="py-2 px-3 font-medium">ROUTE</th>
                  <th className="py-2 px-3 font-medium">SAMPLE DATA / SEED</th>
                  <th className="py-2 px-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                <tr>
                  <td className="py-2 px-3 text-[#f0f6fc] font-semibold">Users API</td>
                  <td className="py-2 px-3 text-[#58a6ff]">GET /users/:id</td>
                  <td className="py-2 px-3 text-[#8b949e]">u-123 (Aarav), u-456 (Meera), u-789 (Kabir)</td>
                  <td className="py-2 px-3 text-[#3fb950]">
                    {readiness.mockProviders.status === 'ready' ? 'READY' : 'WAITING'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-[#f0f6fc] font-semibold">Inventory API</td>
                  <td className="py-2 px-3 text-[#58a6ff]">GET /inventory/items</td>
                  <td className="py-2 px-3 text-[#8b949e]">WIDGET-A, GADGET-B, SENSOR-C</td>
                  <td className="py-2 px-3 text-[#3fb950]">
                    {readiness.mockProviders.status === 'ready' ? 'READY' : 'WAITING'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-[#f0f6fc] font-semibold">Shipping API</td>
                  <td className="py-2 px-3 text-[#58a6ff]">GET /shipping/estimate</td>
                  <td className="py-2 px-3 text-[#8b949e]">ship_date=2026-10-09&delivery_days=3</td>
                  <td className="py-2 px-3 text-[#3fb950]">
                    {readiness.mockProviders.status === 'ready' ? 'READY' : 'WAITING'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Security & Operator Notice */}
        <section className="p-4 bg-[#161b22] border border-[#30363d] rounded text-xs space-y-2">
          <div className="flex items-center space-x-2 text-[#e3b341]">
            <span className="font-bold">OPERATOR NOTICE (PRD 13.1):</span>
            <span>Loopback operator authentication active. Exact UI Origin and loopback guards enforced.</span>
          </div>
          <p className="text-[#8b949e]">
            Loopback bindings active: API on <code className="text-[#c9d1d9]">127.0.0.1:4000</code>, Mock Providers on <code className="text-[#c9d1d9]">127.0.0.1:4001</code>. No credentials or secrets exposed to frontend storage.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] px-6 py-3 text-xs text-[#8b949e] flex justify-between">
        <span>DriftGuard — API Dependency Intelligence & Resilience</span>
        <span>Ticket 28 Onboarding • PS 3 Resilient Infrastructure</span>
      </footer>
    </div>
  );
}
