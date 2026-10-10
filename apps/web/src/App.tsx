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
  AnalyzeImpactResponse,
  RepairProposal,
  ValidationRun,
  ActiveAdapter,
  PostActivationReplayOutcome,
  RecoveryRun,
  ProviderSummary,
  IngestionKeyMetadata
} from '@driftguard/contracts';

interface AuditTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  summary: string;
  scope?: string;
}

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
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<ProjectEnvironment>('development');
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Ticket 09: Dependency Rail (A14)
  const [providers, setProviders] = useState<ProviderSummary[]>([
    { id: 'users', name: 'Users API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' },
    { id: 'inventory', name: 'Inventory API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' },
    { id: 'shipping', name: 'Shipping API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' }
  ]);

  // Ticket 09: Compact Audit Timeline (NFR-08)
  const [auditTimeline, setAuditTimeline] = useState<AuditTimelineEntry[]>([
    {
      id: 'aud_seed_default',
      timestamp: new Date().toISOString(),
      action: 'control_plane_ready',
      summary: 'Operator authenticated; control plane operational',
      scope: 'system'
    }
  ]);

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

  // Ticket 05: Repair Proposal
  const [proposingRepair, setProposingRepair] = useState(false);
  const [repairProposal, setRepairProposal] = useState<RepairProposal | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Ticket 06: Shadow Validation & Automatic Eligibility (A11)
  const [validatingPatch, setValidatingPatch] = useState(false);
  const [validationRun, setValidationRun] = useState<ValidationRun | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ticket 07: Activation, Replay & Rollback (A12, A13)
  const [activatingPatch, setActivatingPatch] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activeAdapter, setActiveAdapter] = useState<ActiveAdapter | null>(null);
  const [postActivationReplay, setPostActivationReplay] = useState<PostActivationReplayOutcome | null>(null);

  // Ticket 08: Backend Recovery Workflow & Polling (A16, A17)
  const [runningRecovery, setRunningRecovery] = useState(false);
  const [activeRecoveryRun, setActiveRecoveryRun] = useState<RecoveryRun | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Ticket 29: Ingestion Keys (A24, A25, A26)
  const [keyMetadata, setKeyMetadata] = useState<IngestionKeyMetadata[]>([]);
  const [issuedApiKey, setIssuedApiKey] = useState<{ keyId: string; apiKey: string } | null>(null);
  const [issuingKey, setIssuingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const recordAudit = (id: string, action: string, summary: string, scope?: string) => {
    setAuditTimeline((prev) => [
      {
        id,
        timestamp: new Date().toISOString(),
        action,
        summary,
        scope: scope || `${selectedProjectId || 'default'}:${selectedEnvironment}`
      },
      ...prev.slice(0, 49)
    ]);
  };

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
      try {
        const detail = await apiClient.getProjectDetail(projId, env);
        if (detail.keyMetadata) {
          setKeyMetadata(detail.keyMetadata);
        }
      } catch {
        // Ignore
      }
    } catch {
      // Ignore if unauthenticated
    }
  };

  const loadProviders = async () => {
    try {
      const list = await apiClient.listProviders();
      setProviders(list);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      }
    }
  };

  const loadProjects = async () => {
    try {
      const list = await apiClient.listProjects();
      setProjects(list);
      setIsAuthenticated(true);
      setSessionExpiredNotice(null);
      const activeProjId = selectedProjectId || (list.length > 0 ? list[0].id : '');
      if (activeProjId && !selectedProjectId) {
        setSelectedProjectId(activeProjId);
      }
      if (activeProjId) {
        await loadDemoState(activeProjId, selectedEnvironment);
      }
      await loadProviders();
    } catch (err) {
      if ((err as Error).message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    loadProjects();
  }, []);

  useEffect(() => {
    // Ticket 09: Project/environment changes clear stale incident/run views
    setSelectedIncident(null);
    setImpactAnalysis(null);
    setRepairProposal(null);
    setValidationRun(null);
    setActiveAdapter(null);
    setActiveRecoveryRun(null);
    setPostActivationReplay(null);
    setWorkflowResults({});
    setIncidentError(null);
    setImpactError(null);
    setProposalError(null);
    setValidationError(null);
    setActivationError(null);
    setRecoveryError(null);

    if (selectedProjectId && isAuthenticated) {
      loadDemoState(selectedProjectId, selectedEnvironment);
      loadProviders();
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
      recordAudit(res.auditEventId, 'create_project', `Created project: ${res.project.name} (${res.project.id})`);
      await loadProjects();
      setSelectedProjectId(res.project.id);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setProjectError(err.message);
      }
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateKey = async () => {
    if (!selectedProjectId) return;
    setIssuingKey(true);
    setKeyError(null);
    try {
      const res = await apiClient.createIngestionKey(selectedProjectId, selectedEnvironment);
      setIssuedApiKey({ keyId: res.keyId, apiKey: res.apiKey });
      setKeyMetadata((prev) => [
        {
          keyId: res.keyId,
          prefix: res.prefix,
          environment: res.environment,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      recordAudit(res.auditEventId, 'issue_key', `Issued ingestion key ${res.keyId} for ${selectedEnvironment}`);
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setIssuingKey(false);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (!selectedProjectId) return;
    setKeyError(null);
    try {
      const res = await apiClient.rotateIngestionKey(selectedProjectId, keyId);
      setIssuedApiKey({ keyId: res.keyId, apiKey: res.apiKey });
      setKeyMetadata((prev) =>
        prev
          .map((k) => (k.keyId === keyId ? { ...k, status: 'revoked' as const, revokedAt: new Date().toISOString() } : k))
          .concat({
            keyId: res.keyId,
            prefix: res.prefix,
            environment: selectedEnvironment,
            status: 'active' as const,
            createdAt: new Date().toISOString(),
            replacesKeyId: res.replacesKeyId
          })
      );
      recordAudit(res.auditEventId, 'rotate_key', `Rotated ingestion key ${keyId} -> ${res.keyId}`);
    } catch (err: any) {
      setKeyError(err.message);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!selectedProjectId) return;
    setKeyError(null);
    try {
      const res = await apiClient.revokeIngestionKey(selectedProjectId, keyId);
      setKeyMetadata((prev) =>
        prev.map((k) => (k.keyId === keyId ? { ...k, status: 'revoked' as const, revokedAt: new Date().toISOString() } : k))
      );
      recordAudit(res.auditEventId, 'revoke_key', `Revoked ingestion key ${keyId}`);
    } catch (err: any) {
      setKeyError(err.message);
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
      recordAudit(res.auditEventId, 'capture_baseline', `Captured baseline v${res.baseline.version} (${res.readEdges.length} read edges)`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setBaselineError(err.message);
      }
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
      recordAudit(res.auditEventId || `aud_replay_${Date.now()}`, 'replay_workflow', `Replayed workflow ${workflowId} (${res.status})`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        alert(err.message);
      }
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
      recordAudit(res.auditEventId, 'inject_scenario', `Injected fault scenario: ${scenarioId}`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setIncidentError(err.message);
      }
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
      recordAudit(res.auditEventId, 'observe_drift', `Observed drift: detected ${res.incidents.length} incidents`);
      if (res.incident) {
        const detail = await apiClient.getIncident(
          res.incident.id,
          selectedProjectId,
          selectedEnvironment
        );
        setSelectedIncident(detail);
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setIncidentError(err.message);
      }
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
      if (detail.proposals && detail.proposals.length > 0) {
        setRepairProposal(detail.proposals[detail.proposals.length - 1]);
      } else {
        setRepairProposal(null);
      }
      if (detail.validationRuns && detail.validationRuns.length > 0) {
        setValidationRun(detail.validationRuns[detail.validationRuns.length - 1]);
      } else {
        setValidationRun(null);
      }
      if (detail.activeAdapter) {
        setActiveAdapter(detail.activeAdapter);
      } else {
        setActiveAdapter(null);
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        alert(err.message);
      }
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
      recordAudit(res.auditEventId, 'analyze_impact', `Analyzed blast radius for ${incidentId} (${res.affectedWorkflows.length} affected)`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setImpactError(err.message || 'Failed to analyze impact.');
      }
    } finally {
      setAnalyzingImpact(false);
    }
  };

  const handleProposeRepair = async (incidentId: string) => {
    setProposingRepair(true);
    setProposalError(null);
    try {
      const res = await apiClient.proposeRepair(
        incidentId,
        selectedProjectId,
        selectedEnvironment,
        baseline?.sessionId
      );
      setRepairProposal(res.proposal);
      setSelectedIncident((prev) => {
        if (!prev) return null;
        const proposals = prev.proposals ? [...prev.proposals, res.proposal] : [res.proposal];
        return { ...prev, proposals };
      });
      recordAudit(res.auditEventId, 'propose_repair', `Generated candidate patch ${res.proposal.patch.id} (confidence: ${res.proposal.confidence})`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setProposalError(err.message || 'Failed to propose repair.');
      }
    } finally {
      setProposingRepair(false);
    }
  };

  const handleValidatePatch = async (patchId: string, patchHash: string) => {
    setValidatingPatch(true);
    setValidationError(null);
    try {
      const res = await apiClient.validatePatch(
        patchId,
        selectedProjectId,
        selectedEnvironment,
        patchHash
      );
      setValidationRun(res.validationRun);
      setSelectedIncident((prev) => {
        if (!prev) return null;
        const validationRuns = prev.validationRuns
          ? [...prev.validationRuns, res.validationRun]
          : [res.validationRun];
        return { ...prev, validationRuns };
      });
      recordAudit(res.auditEventId, 'validate_patch', `9-gate shadow validation ${res.validationRun.status} (${res.validationRun.eligibility === 'eligible' ? 'eligible' : 'ineligible'})`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setValidationError(err.message || 'Failed to validate candidate patch.');
      }
    } finally {
      setValidatingPatch(false);
    }
  };

  const handleActivatePatch = async (patchId: string, patchHash?: string) => {
    setActivatingPatch(true);
    setActivationError(null);
    try {
      const res = await apiClient.activatePatch(
        patchId,
        selectedProjectId,
        selectedEnvironment,
        patchHash
      );
      setActiveAdapter(res.activeAdapter);
      setPostActivationReplay(res.postActivationReplay);
      setSelectedIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: res.incidentStatus as any,
          recoveryStatus: res.recoveryStatus,
          activeAdapter: res.activeAdapter
        };
      });
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === selectedIncident?.id
            ? { ...inc, status: res.incidentStatus as any }
            : inc
        )
      );
      recordAudit(res.auditEventId, 'activate_adapter', `Activated adapter ${res.activeAdapter.id} (v${res.activeAdapter.version})`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setActivationError(err.message || 'Failed to activate patch.');
      }
    } finally {
      setActivatingPatch(false);
    }
  };

  const handleRollbackPatch = async (patchId: string) => {
    setRollingBack(true);
    setActivationError(null);
    try {
      const res = await apiClient.rollbackPatch(
        patchId,
        selectedProjectId,
        selectedEnvironment
      );
      setActiveAdapter(res.restoredAdapter);
      setSelectedIncident((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: res.incidentStatus as any,
          recoveryStatus: 'rolled_back',
          activeAdapter: res.restoredAdapter
        };
      });
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === selectedIncident?.id
            ? { ...inc, status: res.incidentStatus as any }
            : inc
        )
      );
      recordAudit(res.auditEventId, 'rollback_adapter', `Rolled back adapter to parent v${res.restoredAdapter.version}`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setActivationError(err.message || 'Failed to rollback adapter.');
      }
    } finally {
      setRollingBack(false);
    }
  };

  const handleStartRecovery = async (incidentId: string) => {
    if (!selectedProjectId) return;
    setRunningRecovery(true);
    setRecoveryError(null);
    try {
      const res = await apiClient.startRecovery(
        incidentId,
        selectedProjectId,
        selectedEnvironment
      );
      // Immediately fetch initial state
      let run = await apiClient.getRecoveryRun(res.recoveryRunId);
      setActiveRecoveryRun(run);

      // Poll every 400ms until terminal status (succeeded or failed)
      while (run.status === 'queued' || run.status === 'running') {
        await new Promise((resolve) => setTimeout(resolve, 400));
        run = await apiClient.getRecoveryRun(res.recoveryRunId);
        setActiveRecoveryRun(run);
      }

      // Refresh incident detail to capture updated status and active adapter
      const detail = await apiClient.getIncident(
        incidentId,
        selectedProjectId,
        selectedEnvironment
      );
      setSelectedIncident(detail);
      if (detail.activeAdapter) {
        setActiveAdapter(detail.activeAdapter);
      }
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId ? { ...inc, status: detail.status } : inc
        )
      );
      recordAudit(run.auditEventId || `aud_rec_${Date.now()}`, 'recovery_run', `One-click recovery run ${run.id}: ${run.status} (${run.stage})`);
    } catch (err: any) {
      if (err.message === 'UNAUTHENTICATED') {
        setIsAuthenticated(false);
        setSessionExpiredNotice('Session expired or Origin rejected. Please re-authenticate as operator.');
      } else {
        setRecoveryError(err.message || 'Failed to start recovery.');
      }
    } finally {
      setRunningRecovery(false);
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
        {sessionExpiredNotice && (
          <div
            role="alert"
            className="p-3 bg-[#da3633]/10 border border-[#da3633]/40 rounded text-[#f85149] text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold">AUTHENTICATION NOTICE:</span>
              <span>{sessionExpiredNotice}</span>
            </div>
            <button
              onClick={() => setSessionExpiredNotice(null)}
              className="text-[#8b949e] hover:text-[#c9d1d9] text-xs px-2 py-0.5 border border-[#30363d] rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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

        {/* Ticket 09: Dependency Rail (A14) */}
        <section aria-label="Dependency Rail" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Dependency Rail (A14)</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {providers.length} Registered Providers
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Monitors simulated external provider contracts, active behavioral baselines, and fault scenario states.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-[#8b949e]">
                Baseline:{' '}
                <strong className={baseline ? 'text-[#3fb950]' : 'text-[#8b949e]'}>
                  {baseline ? `v${baseline.version}` : 'AWAITING'}
                </strong>
              </span>
              <span className="text-[#8b949e]">•</span>
              <span className="text-[#8b949e]">
                Scenarios:{' '}
                <strong className={activeScenarios.length > 0 ? 'text-[#e3b341]' : 'text-[#3fb950]'}>
                  {activeScenarios.length > 0 ? activeScenarios.join(', ') : 'NONE ACTIVE'}
                </strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="py-2 px-3 font-medium">PROVIDER NAME</th>
                  <th className="py-2 px-3 font-medium">ENDPOINT BASE</th>
                  <th className="py-2 px-3 font-medium">STATUS</th>
                  <th className="py-2 px-3 font-medium">ACTIVE SCENARIO</th>
                  <th className="py-2 px-3 font-medium">BASELINE VERSION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {providers.map((p) => {
                  const hasScenario = p.id === 'users' && activeScenarios.includes('users.field-rename');
                  return (
                    <tr key={p.id} className="hover:bg-[#21262d]/50 transition-colors">
                      <td className="py-2 px-3 text-[#f0f6fc] font-semibold">
                        {p.name} <span className="text-[#8b949e]">({p.id})</span>
                      </td>
                      <td className="py-2 px-3 text-[#58a6ff]">{p.baseUrl}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {hasScenario ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/40">
                            users.field-rename
                          </span>
                        ) : (
                          <span className="text-[#8b949e]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#8b949e]">
                        {baseline ? `v${baseline.version}` : 'Awaiting baseline'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ticket 29: Ingestion Keys Management Section (A24, A25, A26) */}
        <section aria-label="Ingestion Keys" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Ingestion API Keys (A24/A25/A26)</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40">
                  {keyMetadata.filter((k) => k.status === 'active').length} ACTIVE KEYS (MAX 3)
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Environment-scoped keys for SDK telemetry ingestion. Plaintext is only shown once at creation.
              </p>
            </div>

            <button
              onClick={handleCreateKey}
              disabled={issuingKey || !selectedProjectId}
              className="px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded text-xs font-medium transition cursor-pointer"
            >
              {issuingKey ? 'Issuing Key...' : 'Issue New Key'}
            </button>
          </div>

          {keyError && (
            <div className="p-3 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
              {keyError}
            </div>
          )}

          {issuedApiKey && (
            <div className="p-3 bg-[#238636]/10 border border-[#238636]/30 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3fb950]">ONE-TIME PLAINTEXT API KEY</span>
                <span className="text-[10px] text-[#8b949e]">Will never be displayed again</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={issuedApiKey.apiKey}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs font-mono text-[#58a6ff]"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(issuedApiKey.apiKey)}
                  className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-white text-xs rounded font-mono"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setIssuedApiKey(null)}
                  className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] text-xs rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto pt-2 border-t border-[#30363d]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="py-2 px-3 font-medium">KEY ID</th>
                  <th className="py-2 px-3 font-medium">PREFIX</th>
                  <th className="py-2 px-3 font-medium">ENVIRONMENT</th>
                  <th className="py-2 px-3 font-medium">STATUS</th>
                  <th className="py-2 px-3 font-medium">CREATED AT</th>
                  <th className="py-2 px-3 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {keyMetadata.map((k) => (
                  <tr key={k.keyId} className="hover:bg-[#21262d]/50 transition-colors">
                    <td className="py-2 px-3 text-[#f0f6fc] font-semibold">{k.keyId}</td>
                    <td className="py-2 px-3 text-[#58a6ff]">{k.prefix}</td>
                    <td className="py-2 px-3 text-[#c9d1d9]">{k.environment}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          k.status === 'active'
                            ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                            : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40'
                        }`}
                      >
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#8b949e]">{new Date(k.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 text-right space-x-2">
                      {k.status === 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRotateKey(k.keyId)}
                            className="px-2 py-0.5 bg-[#1f6feb]/20 hover:bg-[#1f6feb]/30 text-[#58a6ff] border border-[#1f6feb]/40 rounded text-[10px]"
                          >
                            Rotate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(k.keyId)}
                            className="px-2 py-0.5 bg-[#da3633]/20 hover:bg-[#da3633]/30 text-[#f85149] border border-[#da3633]/40 rounded text-[10px]"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {keyMetadata.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-[#8b949e] text-center">
                      No ingestion keys created yet. Click &quot;Issue New Key&quot; to generate an environment-scoped key.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                onClick={() => handleInjectScenario('shipping.business-days')}
                disabled={!baseline || injectingScenario}
                className="px-3.5 py-1.5 bg-[#d29922]/20 hover:bg-[#d29922]/30 text-[#e3b341] border border-[#d29922]/40 disabled:opacity-50 rounded text-xs font-medium transition cursor-pointer"
              >
                {injectingScenario
                  ? 'Injecting...'
                  : activeScenarios.includes('shipping.business-days')
                  ? 'Injected: shipping.business-days'
                  : 'Inject Shipping Business Days'}
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
                  <div className="flex flex-wrap items-center justify-between border-b border-[#21262d] pb-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-semibold text-[#f0f6fc]">
                        Incident Evidence Inspection (A08) — {selectedIncident.id}
                      </h4>
                      <span className="text-[11px] font-mono text-[#79c0ff]">
                        Fingerprint: {selectedIncident.fingerprint.slice(0, 16)}...
                      </span>
                    </div>

                    {/* Ticket 08: One-Click Backend Recovery Workflow (A16) */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleStartRecovery(selectedIncident.id)}
                        disabled={runningRecovery || selectedIncident.status === 'recovered'}
                        className="px-3 py-1 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>
                          {runningRecovery
                            ? 'Recovering Workflow...'
                            : selectedIncident.status === 'recovered'
                            ? 'Recovered'
                            : 'Run Safe Recovery (A16)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="p-2 bg-[#da3633]/20 border border-[#da3633] text-[#f85149] rounded text-xs font-mono">
                      {recoveryError}
                    </div>
                  )}

                  {/* Active Recovery Run Live Progress */}
                  {activeRecoveryRun && (
                    <div className="p-3 bg-[#161b22] border border-[#1f6feb]/50 rounded space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e]">
                          RECOVERY RUN:{' '}
                          <strong className="text-[#58a6ff]">{activeRecoveryRun.id}</strong> • Stage:{' '}
                          <strong className="text-[#e3b341]">{activeRecoveryRun.stage.toUpperCase()}</strong>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeRecoveryRun.status === 'succeeded'
                              ? 'bg-[#238636]/20 text-[#3fb950]'
                              : activeRecoveryRun.status === 'failed'
                              ? 'bg-[#da3633]/20 text-[#f85149]'
                              : 'bg-[#1f6feb]/20 text-[#58a6ff] animate-pulse'
                          }`}
                        >
                          {activeRecoveryRun.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Stage History */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#21262d] text-[10px]">
                        {activeRecoveryRun.stageHistory.map((s, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded border ${
                              s.status === 'completed'
                                ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40'
                                : s.status === 'failed'
                                ? 'bg-[#da3633]/20 text-[#f85149] border-[#da3633]/40'
                                : 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40 animate-pulse'
                            }`}
                          >
                            {s.stage} ({s.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                        {/* 3-Column Causal Ordering: Upstream Change -> Downstream Consumer -> Affected Workflows */}
                        <div className="p-3 bg-[#161b22] border border-[#30363d] rounded space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#f0f6fc]">
                              CAUSAL IMPACT TRACE (PRD 17 / AT-SDK-11)
                            </span>
                            <span className="text-[10px] font-mono text-[#8b949e]">
                              Upstream Change → Downstream Consumer → Affected Workflows
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                            {/* Column 1 */}
                            <div className="p-2.5 bg-[#0d1117] border border-[#da3633]/30 rounded space-y-1">
                              <span className="text-[10px] font-bold text-[#f85149] block">1. UPSTREAM PROVIDER CHANGE</span>
                              <div className="text-[#f0f6fc] font-semibold">{selectedIncident.provider} ({selectedIncident.endpoint})</div>
                              <div className="text-[#8b949e] text-[11px]">{selectedIncident.summary}</div>
                              <div className="text-[10px] text-[#8b949e] pt-1">
                                Evidence maturity: <span className="text-[#3fb950] font-semibold">{selectedIncident.evidenceStrength}</span>
                                {((selectedIncident.evidenceStrength as string) === 'limited' || (selectedIncident.evidenceStrength as string) === 'inferred') && (
                                  <span className="text-[#e3b341]"> (limited precision)</span>
                                )}
                              </div>
                            </div>
                            {/* Column 2 */}
                            <div className="p-2.5 bg-[#0d1117] border border-[#58a6ff]/30 rounded space-y-1">
                              <span className="text-[10px] font-bold text-[#58a6ff] block">2. DOWNSTREAM CLIENT / ADAPTER</span>
                              <div className="text-[#c9d1d9] font-semibold">UserServiceClient / Adapter</div>
                              <div className="text-[#8b949e] text-[11px]">Mapping: name → displayName</div>
                              <div className="text-[10px] text-[#79c0ff] pt-1">Lineage: runtime verified (Proxy)</div>
                            </div>
                            {/* Column 3 */}
                            <div className="p-2.5 bg-[#0d1117] border border-[#e3b341]/30 rounded space-y-1">
                              <span className="text-[10px] font-bold text-[#e3b341] block">3. AFFECTED WORKFLOWS</span>
                              <div className="text-[#f0f6fc] font-semibold">
                                {(impactAnalysis || selectedIncident.impactAnalysis)?.affectedWorkflows.map((w) => w.workflowId).join(', ') || selectedIncident.affectedWorkflows.join(', ')}
                              </div>
                              <div className="text-[#f85149] text-[11px]">Invariant breached</div>
                              <div className="text-[10px] text-[#8b949e] pt-1">Blast radius: {selectedIncident.affectedWorkflows.length} workflows</div>
                            </div>
                          </div>
                        </div>

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

                  {/* Ticket 05: Constrained Compatible Adapter Proposal (A10) */}
                  <div className="pt-3 border-t border-[#21262d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-[#f0f6fc]">
                          Constrained Compatible Adapter Proposal (A10)
                        </h5>
                        <p className="text-[11px] text-[#8b949e]">
                          Deterministic RepairModel: rename/coalesce adapter synthesis with invariant guarantees
                        </p>
                      </div>
                      <button
                        onClick={() => handleProposeRepair(selectedIncident.id)}
                        disabled={proposingRepair}
                        className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded text-xs font-medium transition cursor-pointer"
                      >
                        {proposingRepair ? 'Proposing Repair...' : 'Propose Compatible Adapter (A10)'}
                      </button>
                    </div>

                    {proposalError && (
                      <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
                        {proposalError}
                      </div>
                    )}

                    {(repairProposal || (selectedIncident.proposals && selectedIncident.proposals[0])) && (
                      <div className="p-3 bg-[#161b22] border border-[#238636]/40 rounded space-y-3 font-mono text-xs">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                              RECOMMENDED
                            </span>
                            <span className="text-[#f0f6fc] font-semibold text-[11px]">
                              {`Confidence: ${Math.round(((repairProposal || selectedIncident.proposals?.[0])?.confidence || 0) * 100)}%`}
                            </span>
                            <span className="text-[#8b949e] text-[10px]">
                              {`Source: ${(repairProposal || selectedIncident.proposals?.[0])?.source}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8b949e]">
                            {`Proposal ID: ${(repairProposal || selectedIncident.proposals?.[0])?.id}`}
                          </span>
                        </div>

                        {/* Adapter Diff */}
                        <div className="space-y-1">
                          <span className="text-[#8b949e] text-[10px] font-bold block">SYNTHESIZED ADAPTER DIFF:</span>
                          <pre className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded text-[11px] text-[#58a6ff] overflow-x-auto whitespace-pre-wrap">
                            {(repairProposal || selectedIncident.proposals?.[0])?.patch.diff}
                          </pre>
                        </div>

                        {/* Rules & Preservation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-[#0d1117] border border-[#21262d] rounded space-y-1">
                            <span className="text-[#8b949e] text-[10px] font-bold block">SYNTHESIS RULES:</span>
                            {(repairProposal || selectedIncident.proposals?.[0])?.patch.rules.map((r, i) => (
                              <div key={i} className="text-[#3fb950]">
                                • {r.targetField} ← {r.op}([ {r.sources.join(', ')} ])
                              </div>
                            ))}
                            <div className="text-[#8b949e] text-[10px] pt-1">
                              Preserved: {((repairProposal || selectedIncident.proposals?.[0])?.patch.preservedFields || []).join(', ')}
                            </div>
                          </div>

                          <div className="p-2 bg-[#0d1117] border border-[#21262d] rounded space-y-1">
                            <span className="text-[#8b949e] text-[10px] font-bold block">MANDATORY GATES / CHECKS:</span>
                            {(repairProposal || selectedIncident.proposals?.[0])?.requiredChecks.map((c, i) => (
                              <div key={i} className="text-[#e3b341]">
                                ✓ {c}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticket 06: Shadow Validation & Automatic Eligibility (A11) */}
                  <div className="pt-3 border-t border-[#21262d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-[#f0f6fc]">
                          Shadow Validation & Automatic Eligibility (A11)
                        </h5>
                        <p className="text-[11px] text-[#8b949e]">
                          FR-REP-07 & FR-VAL-01..05: 9 conjunctive safety gates in isolated counterfactual twin
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const prop = repairProposal || selectedIncident.proposals?.[0];
                          if (prop) {
                            handleValidatePatch(prop.patch.id, prop.patch.hash);
                          }
                        }}
                        disabled={!(repairProposal || (selectedIncident.proposals && selectedIncident.proposals.length > 0)) || validatingPatch}
                        className="px-3 py-1 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded text-xs font-medium transition cursor-pointer"
                      >
                        {validatingPatch ? 'Validating Patch...' : 'Validate Candidate Adapter (A11)'}
                      </button>
                    </div>

                    {validationError && (
                      <div className="p-2 bg-[#da3633]/10 border border-[#da3633]/30 rounded text-[#f85149] font-mono text-xs">
                        {validationError}
                      </div>
                    )}

                    {(validationRun || (selectedIncident.validationRuns && selectedIncident.validationRuns[0])) && (
                      <div className="p-3 bg-[#161b22] border border-[#1f6feb]/40 rounded space-y-3 font-mono text-xs">
                        {/* Status Badges Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2">
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const run = validationRun || selectedIncident.validationRuns?.[0];
                              const elig = run?.eligibility;
                              if (elig === 'eligible') {
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                                    ELIGIBLE FOR ACTIVATION
                                  </span>
                                );
                              }
                              if (elig === 'review_required') {
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/40">
                                    REVIEW REQUIRED
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40">
                                  REJECTED
                                </span>
                              );
                            })()}
                            <span className="text-[#f0f6fc] font-semibold text-[11px]">
                              {`Status: ${(validationRun || selectedIncident.validationRuns?.[0])?.status.toUpperCase()}`}
                            </span>
                            <span className="text-[#8b949e] text-[10px]">
                              {`Patch Hash: ${(validationRun || selectedIncident.validationRuns?.[0])?.patchHash.slice(0, 16)}...`}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8b949e]">
                            {`Run ID: ${(validationRun || selectedIncident.validationRuns?.[0])?.id}`}
                          </span>
                        </div>

                        {/* 9 Conjunctive Safety Gates */}
                        <div className="space-y-1">
                          <span className="text-[#8b949e] text-[10px] font-bold block">
                            FR-REP-07 CONJUNCTIVE SAFETY GATES:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {(validationRun || selectedIncident.validationRuns?.[0])?.gates.map((g) => (
                              <div
                                key={g.gateId}
                                className={`p-2 bg-[#0d1117] border rounded space-y-1 ${
                                  g.status === 'passed' ? 'border-[#238636]/30' : 'border-[#da3633]/40'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#f0f6fc] font-semibold truncate" title={g.gateId}>
                                    {g.gateId}
                                  </span>
                                  <span
                                    className={`px-1 rounded text-[9px] font-bold ${
                                      g.status === 'passed' ? 'bg-[#238636]/20 text-[#3fb950]' : 'bg-[#da3633]/20 text-[#f85149]'
                                    }`}
                                  >
                                    {g.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[#8b949e] line-clamp-2" title={g.details}>
                                  {g.details}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Workflow Replay Outcomes with Side Effect Isolation */}
                        <div className="pt-2 border-t border-[#21262d] space-y-1">
                          <span className="text-[#8b949e] text-[10px] font-bold block">
                            SHADOW WORKFLOW OUTCOMES & SIDE-EFFECT ISOLATION (FR-VAL-07):
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            {(validationRun || selectedIncident.validationRuns?.[0])?.workflowOutcomes.map((wf) => (
                              <div key={wf.workflowId} className="p-2 bg-[#0d1117] border border-[#21262d] rounded flex items-center justify-between">
                                <div>
                                  <span className="text-[#79c0ff] font-semibold">{wf.workflowId}</span>
                                  <span className="text-[#8b949e] text-[10px] block">{wf.details}</span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      wf.status === 'passed'
                                        ? 'bg-[#238636]/20 text-[#3fb950]'
                                        : wf.status === 'unchanged'
                                        ? 'bg-[#58a6ff]/20 text-[#58a6ff]'
                                        : 'bg-[#da3633]/20 text-[#f85149]'
                                    }`}
                                  >
                                    {wf.status.toUpperCase()}
                                  </span>
                                  {wf.sideEffectStubbed && (
                                    <span className="block text-[9px] text-[#e3b341]">
                                      stubbed (0 live transmission)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ticket 07: Activation, Replay & Rollback Controls (A12, A13) */}
                    <div className="pt-3 border-t border-[#30363d] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#f0f6fc]">
                            ADAPTER LIFECYCLE & RECOVERY (A12 / A13)
                          </span>
                          {selectedIncident.recoveryStatus && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                selectedIncident.recoveryStatus === 'recovered'
                                  ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40'
                                  : selectedIncident.recoveryStatus === 'rolled_back'
                                  ? 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/40'
                                  : 'bg-[#8b949e]/20 text-[#8b949e] border-[#30363d]'
                              }`}
                            >
                              {selectedIncident.recoveryStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleActivatePatch(
                                (repairProposal || selectedIncident.proposals?.[0])!.patch.id,
                                (repairProposal || selectedIncident.proposals?.[0])!.patch.hash
                              )
                            }
                            disabled={
                              activatingPatch ||
                              rollingBack ||
                              !(validationRun || selectedIncident.validationRuns?.[0]) ||
                              (validationRun || selectedIncident.validationRuns?.[0])?.eligibility !== 'eligible'
                            }
                            className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <span>
                              {activatingPatch ? 'Activating & Replaying...' : 'Activate Adapter (A12)'}
                            </span>
                          </button>

                          {((activeAdapter && activeAdapter.parentVersion) ||
                            (selectedIncident.activeAdapter && selectedIncident.activeAdapter.parentVersion)) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRollbackPatch(
                                  (repairProposal || selectedIncident.proposals?.[0])!.patch.id
                                )
                              }
                              disabled={rollingBack || activatingPatch}
                              className="px-3 py-1 bg-[#da3633] hover:bg-[#f85149] disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center space-x-1"
                            >
                              <span>{rollingBack ? 'Rolling back...' : 'Rollback to Parent (A13)'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activationError && (
                        <div className="p-2 bg-[#da3633]/20 border border-[#da3633] text-[#f85149] rounded text-xs">
                          {activationError}
                        </div>
                      )}

                      {/* Active Adapter Inspector */}
                      {(activeAdapter || selectedIncident.activeAdapter) && (
                        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8b949e]">
                              ACTIVE ADAPTER:{' '}
                              <strong className="text-[#79c0ff]">
                                {(activeAdapter || selectedIncident.activeAdapter)!.id}
                              </strong>{' '}
                              (v{(activeAdapter || selectedIncident.activeAdapter)!.version}
                              {(activeAdapter || selectedIncident.activeAdapter)!.parentVersion
                                ? `, parent: v${(activeAdapter || selectedIncident.activeAdapter)!.parentVersion}`
                                : ''}
                              )
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                (activeAdapter || selectedIncident.activeAdapter)!.status === 'active'
                                  ? 'bg-[#238636]/20 text-[#3fb950]'
                                  : (activeAdapter || selectedIncident.activeAdapter)!.status === 'rolled_back'
                                  ? 'bg-[#d29922]/20 text-[#d29922]'
                                  : 'bg-[#8b949e]/20 text-[#8b949e]'
                              }`}
                            >
                              {(activeAdapter || selectedIncident.activeAdapter)!.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Post-Activation Workflow Replay Details */}
                          {postActivationReplay && (
                            <div className="pt-2 border-t border-[#21262d] space-y-1">
                              <span className="text-[#8b949e] text-[10px] font-bold block">
                                POST-ACTIVATION REPLAY VERIFICATION (FR-VAL-08):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                {postActivationReplay.replays.map((rep) => (
                                  <div
                                    key={rep.workflowId}
                                    className="p-2 bg-[#161b22] border border-[#21262d] rounded flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="text-[#79c0ff] font-semibold">
                                        {rep.workflowId}
                                      </span>
                                      <span className="text-[#8b949e] text-[10px] block">
                                        {rep.invariantResult.details}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        rep.status === 'passed'
                                          ? 'bg-[#238636]/20 text-[#3fb950]'
                                          : 'bg-[#da3633]/20 text-[#f85149]'
                                      }`}
                                    >
                                      {rep.status.toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Ticket 09: Compact Audit Timeline (NFR-08) */}
        <section aria-label="Compact Audit Timeline" className="bg-[#161b22] border border-[#30363d] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Compact Audit Timeline (NFR-08)</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {auditTimeline.length} Events Logged
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Append-only non-destructive operational audit trail with aud_* event IDs, timestamps, and causal operations.
              </p>
            </div>
            <span className="text-xs font-mono text-[#3fb950]">IMMUTABLE AUDIT LOG</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e] sticky top-0 bg-[#161b22]">
                  <th className="py-2 px-3 font-medium">EVENT ID</th>
                  <th className="py-2 px-3 font-medium">TIMESTAMP</th>
                  <th className="py-2 px-3 font-medium">OPERATION</th>
                  <th className="py-2 px-3 font-medium">SCOPE</th>
                  <th className="py-2 px-3 font-medium">SUMMARY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {auditTimeline.map((item) => (
                  <tr key={item.id} className="hover:bg-[#21262d]/50 transition-colors">
                    <td className="py-2 px-3 text-[#58a6ff] font-semibold">{item.id}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#21262d] border border-[#30363d] text-[#c9d1d9]">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#8b949e]">{item.scope || '—'}</td>
                    <td className="py-2 px-3 text-[#c9d1d9]">{item.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
