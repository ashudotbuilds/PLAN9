import React, { useEffect, useState } from 'react';
import { apiClient, SystemReadiness } from './api-client';
import {
  ProjectSummary,
  ProjectEnvironment,
  BaselineSummary,
  DependencyEdge,
  ReplayWorkflowResponse,
  IncidentSummary,
  IncidentDetail,
  AnalyzeImpactResponse
} from '@driftguard/contracts';

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

  // Ticket 02: Baseline & Workflow Lineage
  const [baseline, setBaseline] = useState<BaselineSummary | null>(null);
  const [readEdges, setReadEdges] = useState<DependencyEdge[]>([]);
  const [capturingBaseline, setCapturingBaseline] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [workflowResults, setWorkflowResults] = useState<Record<string, ReplayWorkflowResponse>>({});
  const [replayingWorkflow, setReplayingWorkflow] = useState<string | null>(null);

  // Ticket 03: Scenario Injection & Incidents
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [injectingScenario, setInjectingScenario] = useState(false);
  const [observing, setObserving] = useState(false);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  // Ticket 04: Impact Analysis & Lineage Trace
  const [analyzingImpact, setAnalyzingImpact] = useState(false);
  const [impactAnalysis, setImpactAnalysis] = useState<AnalyzeImpactResponse | null>(null);
  const [impactError, setImpactError] = useState<string | null>(null);


  const fetchStatus = async () => {
    setRefreshing(true);
    const data = await apiClient.checkSystemReadiness();
    setReadiness(data);
    setRefreshing(false);
  };

  const loadDemoState = async (projId: string, env: ProjectEnvironment) => {
    try {
      const state = await apiClient.getDemoState(projId, env);
      if (state.baseline) {
        setBaseline(state.baseline);
      } else {
        setBaseline(null);
      }
      if (state.readEdges) {
        setReadEdges(state.readEdges);
      }
      if (state.incidents) {
        setIncidents(state.incidents);
      }
      if (state.activeScenarios) {
        setActiveScenarios(state.activeScenarios);
      }
    } catch {
      // Ignore if unauthenticated
    }
  };


  const loadProjects = async () => {
    try {
      const list = await apiClient.listProjects();
      setProjects(list);
      setIsAuthenticated(true);
      const activeProjId = selectedProjectId || (list.length > 0 ? list[0].id : '');
      if (activeProjId && !selectedProjectId) {
        setSelectedProjectId(activeProjId);
      }
      if (activeProjId) {
        await loadDemoState(activeProjId, selectedEnvironment);
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

  useEffect(() => {
    if (selectedProjectId && isAuthenticated) {
      loadDemoState(selectedProjectId, selectedEnvironment);
    }
  }, [selectedProjectId, selectedEnvironment, isAuthenticated]);

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

  const handleCaptureBaseline = async () => {
    if (!selectedProjectId) return;
    setCapturingBaseline(true);
    setBaselineError(null);
    try {
      const res = await apiClient.captureBaseline(selectedProjectId, selectedEnvironment, 'sess_active');
      setBaseline(res.baseline);
      setReadEdges(res.readEdges);
    } catch (err) {
      setBaselineError((err as Error).message);
    } finally {
      setCapturingBaseline(false);
    }
  };

  const handleReplayWorkflow = async (workflowId: string) => {
    if (!selectedProjectId) return;
    setReplayingWorkflow(workflowId);
    try {
      const res = await apiClient.replayWorkflow(workflowId, selectedProjectId, selectedEnvironment, 'sess_active');
      setWorkflowResults((prev) => ({ ...prev, [workflowId]: res }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setReplayingWorkflow(null);
    }
  };

  const handleInjectScenario = async (scenarioId: string) => {
    if (!selectedProjectId) return;
    setInjectingScenario(true);
    setIncidentError(null);
    try {
      const res = await apiClient.injectScenario(
        scenarioId,
        selectedProjectId,
        selectedEnvironment,
        'sess_active'
      );
      setActiveScenarios(res.activeScenarios);
    } catch (err) {
      setIncidentError((err as Error).message);
    } finally {
      setInjectingScenario(false);
    }
  };

  const handleRunObservations = async () => {
    if (!selectedProjectId) return;
    setObserving(true);
    setIncidentError(null);
    try {
      const res = await apiClient.runObservations(
        selectedProjectId,
        selectedEnvironment,
        'sess_active'
      );
      setIncidents(res.incidents);
      if (res.incident) {
        const detail = await apiClient.getIncident(
          res.incident.id,
          selectedProjectId,
          selectedEnvironment
        );
        setSelectedIncident(detail);
      }
    } catch (err) {
      setIncidentError((err as Error).message);
    } finally {
      setObserving(false);
    }
  };

  const handleSelectIncident = async (id: string) => {
    setIncidentLoading(true);
    try {
      const detail = await apiClient.getIncident(id, selectedProjectId, selectedEnvironment);
      setSelectedIncident(detail);
      if (detail.impactAnalysis) {
        setImpactAnalysis(detail.impactAnalysis);
      } else {
        setImpactAnalysis(null);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIncidentLoading(false);
    }
  };

  const handleAnalyzeImpact = async (incidentId: string) => {
    setAnalyzingImpact(true);
    setImpactError(null);
    try {
      const res = await apiClient.analyzeImpact(
        incidentId,
        selectedProjectId,
        selectedEnvironment
      );
      setImpactAnalysis(res);
      setSelectedIncident((prev) => (prev ? { ...prev, impactAnalysis: res } : null));
    } catch (err) {
      setImpactError((err as Error).message || 'Failed to analyze impact.');
    } finally {
      setAnalyzingImpact(false);
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

        {/* Baseline Capture Section (A03) */}
        <section aria-label="Baseline Capture" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Baseline Behavioral Capture (A03)</h2>
                {baseline ? (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                    BASELINE CAPTURED v{baseline.version}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#8b949e]/20 text-[#8b949e] border border-[#8b949e]/40">
                    AWAITING BASELINE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e]">
                Observes mock providers, captures stable fixtures, and registers deterministic behavioral twin.
              </p>
            </div>

            <button
              onClick={handleCaptureBaseline}
              disabled={!isAuthenticated || capturingBaseline || !selectedProjectId}
              className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded text-xs font-medium transition flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>{capturingBaseline ? 'Capturing Baseline...' : 'Capture Healthy Baseline'}</span>
            </button>
          </div>

          {baselineError && (
            <div className="p-3 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
              {baselineError}
            </div>
          )}

          {baseline && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#30363d] text-xs">
              <div className="bg-[#0d1117] p-3 rounded border border-[#21262d] space-y-1">
                <span className="text-[#8b949e] block">Fingerprint:</span>
                <code className="text-[#58a6ff] font-mono block truncate" title={baseline.fingerprint}>
                  {baseline.fingerprint.slice(0, 16)}...
                </code>
              </div>
              <div className="bg-[#0d1117] p-3 rounded border border-[#21262d] space-y-1">
                <span className="text-[#8b949e] block">Captured Fixtures:</span>
                <span className="text-[#c9d1d9] font-mono block">
                  {baseline.fixtures.usersCount} users • {baseline.fixtures.inventoryItemsCount} items • Shipping OK
                </span>
              </div>
              <div className="bg-[#0d1117] p-3 rounded border border-[#21262d] space-y-1">
                <span className="text-[#8b949e] block">Captured At:</span>
                <span className="text-[#c9d1d9] font-mono block">
                  {new Date(baseline.capturedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Workflow Lineage & Invariants Section (A15) */}
        <section aria-label="Workflow Lineage" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Workflow Lineage & Invariant Tracing (A15)</h2>
              <p className="text-xs text-[#8b949e]">
                JavaScript Proxy traces canonical fields read during execution to calculate blast radius.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8b949e]">{readEdges.length} Active Read Edges</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'welcome_email',
                name: 'Welcome Email',
                field: 'user.displayName',
                provider: 'name -> displayName',
                invariant: 'recipientName non-empty & matches baseline'
              },
              {
                id: 'customer_profile',
                name: 'Customer Profile',
                field: 'user.id, user.displayName',
                provider: 'id, name -> displayName',
                invariant: 'Deep equals baseline profile'
              },
              {
                id: 'inventory_sync',
                name: 'Inventory Sync',
                field: 'inventory.items',
                provider: 'items list & quantities',
                invariant: 'Synced counts match baseline'
              },
              {
                id: 'delivery_estimate',
                name: 'Delivery Estimate',
                field: 'shipping.estimated_delivery_date',
                provider: 'calendar day baseline calculation',
                invariant: 'Delivery date matches baseline'
              }
            ].map((wf) => {
              const res = workflowResults[wf.id];
              return (
                <div key={wf.id} className="bg-[#0d1117] border border-[#30363d] rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#f0f6fc]">{wf.name}</h3>
                    <button
                      onClick={() => handleReplayWorkflow(wf.id)}
                      disabled={!baseline || replayingWorkflow === wf.id}
                      className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 text-[#c9d1d9] border border-[#30363d] rounded text-xs font-mono cursor-pointer transition"
                    >
                      {replayingWorkflow === wf.id ? 'Replaying...' : 'Replay'}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[#8b949e]">
                      <span>Read Edge:</span>
                      <span className="text-[#79c0ff]">{wf.field}</span>
                    </div>
                    <div className="flex justify-between text-[#8b949e]">
                      <span>Adapter Mapping:</span>
                      <span className="text-[#e3b341]">{wf.provider}</span>
                    </div>
                    <div className="flex justify-between text-[#8b949e]">
                      <span>Invariant:</span>
                      <span className="text-[#8b949e]">{wf.invariant}</span>
                    </div>
                  </div>

                  {res && (
                    <div className="pt-2 border-t border-[#21262d] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e] font-mono">Replay Invariant:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          res.status === 'passed' ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40' : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40'
                        }`}>
                          {res.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e] font-mono">{res.invariantResult.details}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Scenario Injection & Incident Detection Section (A05, A06, A07, A08) */}
        <section aria-label="Incident Detection" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Scenario Injection & Change Detection (A05/A06)</h2>
                {incidents.length > 0 ? (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40">
                    {incidents.length} INCIDENT DETECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                    NO ACTIVE INCIDENTS
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e]">
                Inject real dependency drift scenarios without server restart and observe field-level breaking changes.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleInjectScenario('users.field-rename')}
                disabled={!baseline || injectingScenario}
                className="px-3.5 py-1.5 bg-[#d29922]/20 hover:bg-[#d29922]/30 text-[#e3b341] border border-[#d29922]/40 disabled:opacity-50 rounded text-xs font-medium transition cursor-pointer"
              >
                {injectingScenario
                  ? 'Injecting...'
                  : activeScenarios.includes('users.field-rename')
                  ? 'Injected: users.field-rename'
                  : 'Inject User Rename'}
              </button>

              <button
                onClick={handleRunObservations}
                disabled={!baseline || observing}
                className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded text-xs font-medium transition cursor-pointer shadow-sm"
              >
                {observing ? 'Observing...' : 'Observe & Detect Drift'}
              </button>
            </div>
          </div>

          {incidentError && (
            <div className="p-3 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
              {incidentError}
            </div>
          )}

          {incidents.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#30363d]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#f0f6fc]">Detected Incidents (A07)</h3>
                <span className="text-[11px] font-mono text-[#8b949e]">Deduplicated by Fingerprint</span>
              </div>

              <div className="space-y-2">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc.id)}
                    className="p-3 bg-[#0d1117] border border-[#da3633]/40 rounded hover:border-[#da3633] transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40">
                          {inc.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-[#f0f6fc]">{inc.summary}</span>
                      </div>
                      <span className="text-xs font-mono text-[#8b949e]">{inc.id}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-[#8b949e]">
                      <div>Endpoint: <span className="text-[#58a6ff]">{inc.endpoint}</span></div>
                      <div>Strength: <span className="text-[#3fb950]">{inc.evidenceStrength}</span></div>
                      <div>Status: <span className="text-[#f85149]">{inc.status}</span></div>
                      <div>Affected Workflows: <span className="text-[#e3b341]">{inc.affectedWorkflows.join(', ')}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedIncident && (
                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-3 mt-3">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <h4 className="text-xs font-semibold text-[#f0f6fc]">
                      Incident Evidence Inspection (A08) — {selectedIncident.id}
                    </h4>
                    <span className="text-[11px] font-mono text-[#79c0ff]">
                      Fingerprint: {selectedIncident.fingerprint.slice(0, 16)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-[#161b22] p-3 rounded border border-[#21262d] space-y-1">
                      <span className="text-[#8b949e] font-semibold block">BEFORE (Baseline Evidence):</span>
                      <pre className="text-[#3fb950] text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedIncident.beforeEvidence, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-[#161b22] p-3 rounded border border-[#21262d] space-y-1">
                      <span className="text-[#8b949e] font-semibold block">AFTER (Observed Drift):</span>
                      <pre className="text-[#f85149] text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedIncident.afterEvidence, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-[#da3633]/10 border border-[#da3633]/30 p-3 rounded text-xs font-mono space-y-1">
                    <span className="text-[#f85149] font-bold block">Consumer Invariant Failures:</span>
                    {selectedIncident.failedWorkflows.map((wf) => (
                      <div key={wf.workflowId} className="text-[#f0f6fc] text-[11px]">
                        • <span className="font-semibold text-[#e3b341]">{wf.workflowId}</span>: {wf.reason}
                      </div>
                    ))}
                  </div>

                  {/* Ticket 04: Impact Analysis & Lineage Trace (A09) */}
                  <div className="pt-3 border-t border-[#21262d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-[#f0f6fc]">
                          Workflow Lineage & Impact Analysis (A09)
                        </h5>
                        <p className="text-[11px] text-[#8b949e]">
                          Traced across runtime read edges: provider → client → adapter → workflow
                        </p>
                      </div>
                      <button
                        onClick={() => handleAnalyzeImpact(selectedIncident.id)}
                        disabled={analyzingImpact}
                        className="px-3 py-1 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded text-xs font-medium transition cursor-pointer"
                      >
                        {analyzingImpact ? 'Analyzing Impact...' : 'Analyze Workflow Impact (A09)'}
                      </button>
                    </div>

                    {impactError && (
                      <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
                        {impactError}
                      </div>
                    )}

                    {(impactAnalysis || selectedIncident.impactAnalysis) && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Column 1: Affected Workflows */}
                          <div className="bg-[#161b22] border border-[#da3633]/30 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#f85149]">
                                {`AFFECTED WORKFLOWS (${(impactAnalysis || selectedIncident.impactAnalysis)?.affectedWorkflows.length || 0})`}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#da3633]/20 text-[#f85149] font-mono">
                                runtime_read
                              </span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {(impactAnalysis || selectedIncident.impactAnalysis)?.affectedWorkflows.map((wf) => (
                                <div key={wf.workflowId} className="p-2 bg-[#0d1117] border border-[#da3633]/20 rounded space-y-1 font-mono">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[#f0f6fc]">{wf.workflowId}</span>
                                    <span className="text-[10px] text-[#e3b341]">{`canonical: ${wf.canonicalField}`}</span>
                                  </div>
                                  <div className="text-[11px] text-[#f85149]">{wf.changedBehavior}</div>
                                  <div className="text-[10px] text-[#8b949e]">Invariant: {wf.invariant}</div>
                                </div>
                              ))}
                              {(impactAnalysis || selectedIncident.impactAnalysis)?.affectedWorkflows.length === 0 && (
                                <p className="text-[#8b949e] text-xs">No workflows affected.</p>
                              )}
                            </div>
                          </div>

                          {/* Column 2: Unaffected Workflows */}
                          <div className="bg-[#161b22] border border-[#238636]/30 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#3fb950]">
                                {`UNAFFECTED WORKFLOWS (${(impactAnalysis || selectedIncident.impactAnalysis)?.unaffectedWorkflows.length || 0})`}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#238636]/20 text-[#3fb950] font-mono">
                                excluded
                              </span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {(impactAnalysis || selectedIncident.impactAnalysis)?.unaffectedWorkflows.map((wf) => (
                                <div key={wf.workflowId} className="p-2 bg-[#0d1117] border border-[#238636]/20 rounded space-y-1 font-mono">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[#f0f6fc]">{wf.workflowId}</span>
                                    <span className="text-[10px] text-[#3fb950]">CLEAN</span>
                                  </div>
                                  <div className="text-[11px] text-[#8b949e]">{wf.reason}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 3: Full Trace Paths */}
                          <div className="bg-[#161b22] border border-[#58a6ff]/30 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#58a6ff]">
                                {`LINEAGE TRACE PATHS (${(impactAnalysis || selectedIncident.impactAnalysis)?.tracePaths.length || 0})`}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#58a6ff]/20 text-[#58a6ff] font-mono">
                                verified
                              </span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {(impactAnalysis || selectedIncident.impactAnalysis)?.tracePaths.map((tp, idx) => (
                                <div key={idx} className="p-2 bg-[#0d1117] border border-[#58a6ff]/20 rounded space-y-1 font-mono text-[11px]">
                                  <div className="text-[#58a6ff] font-semibold">
                                    {tp.provider} <span className="text-[#8b949e]">({tp.endpoint})</span>
                                  </div>
                                  <div className="text-[#8b949e]">↓ client: <span className="text-[#c9d1d9]">{tp.declaredClient}</span></div>
                                  <div className="text-[#8b949e]">↓ adapter: <span className="text-[#c9d1d9]">{tp.canonicalAdapter}</span></div>
                                  <div className="text-[#e3b341] font-semibold">→ workflow: {tp.workflow}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* If unknown workflows */}
                        {((impactAnalysis || selectedIncident.impactAnalysis)?.unknownWorkflows.length || 0) > 0 && (
                          <div className="p-3 bg-[#e3b341]/10 border border-[#e3b341]/30 rounded text-xs font-mono space-y-1">
                            <span className="text-[#e3b341] font-bold block">Unknown / Insufficient Evidence Workflows:</span>
                            {(impactAnalysis || selectedIncident.impactAnalysis)?.unknownWorkflows.map((wf) => (
                              <div key={wf.workflowId} className="text-[#c9d1d9] text-[11px]">
                                • <span className="text-[#e3b341] font-semibold">{wf.workflowId}</span>: {wf.reason}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
