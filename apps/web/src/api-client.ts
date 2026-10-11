import {
  ApiHealthResponse,
  ApiHealthResponseSchema,
  MockHealthResponse,
  MockHealthResponseSchema,
  ProjectSummary,
  ProjectSummarySchema,
  CreateProjectResponse,
  CreateProjectResponseSchema,
  ListProjectsResponseSchema,
  DemoStateResponse,
  DemoStateResponseSchema,
  OperatorSessionResponse,
  OperatorSessionResponseSchema,
  IDEMPOTENCY_KEY_HEADER,
  ProjectEnvironment,
  CaptureBaselineResponse,
  CaptureBaselineResponseSchema,
  ReplayWorkflowResponse,
  ReplayWorkflowResponseSchema,
  InjectScenarioResponse,
  InjectScenarioResponseSchema,
  RunObservationsResponse,
  RunObservationsResponseSchema,
  IncidentSummary,
  ListIncidentsResponseSchema,
  IncidentDetail,
  IncidentDetailResponseSchema,
  AnalyzeImpactResponse,
  AnalyzeImpactResponseSchema,
  ProposeRepairResponse,
  ProposeRepairResponseSchema,
  ValidatePatchResponse,
  ValidatePatchResponseSchema,
  ActivatePatchResponse,
  ActivatePatchResponseSchema,
  RollbackPatchResponse,
  RollbackPatchResponseSchema,
  StartRecoveryResponse,
  StartRecoveryResponseSchema,
  GetRecoveryRunResponseSchema,
  RecoveryRun,
  ProviderSummary,
  ListProvidersResponseSchema,
  CreateIngestionKeyResponse,
  CreateIngestionKeyResponseSchema,
  RotateIngestionKeyResponse,
  RotateIngestionKeyResponseSchema,
  RevokeIngestionKeyResponse,
  RevokeIngestionKeyResponseSchema,
  ProjectDetailResponse,
  ProjectDetailResponseSchema,
  RegisterDependencyRequest,
  RegisterDependencyResponse,
  RegisterDependencyResponseSchema,
  DependencySummary,
  ListDependenciesResponse,
  ListDependenciesResponseSchema,
  DependencyDetailResponse,
  DependencyDetailResponseSchema,
  ObservationBatchV1,
  IngestObservationsResponse,
  IngestObservationsResponseSchema,
  SdkDiagnosticsResponse,
  SdkDiagnosticsResponseSchema,
  ResetDemoResponse,
  ResetDemoResponseSchema
} from '@driftguard/contracts';



export interface SystemReadiness {
  api: {
    status: 'loading' | 'ready' | 'offline';
    details?: ApiHealthResponse;
    error?: string;
  };
  mockProviders: {
    status: 'loading' | 'ready' | 'offline';
    details?: MockHealthResponse;
    error?: string;
  };
}

export class ApiClient {
  constructor(private apiBase = '/api', private mockBase = 'http://127.0.0.1:4001') {}

  async checkApiHealth(): Promise<ApiHealthResponse> {
    const res = await fetch(`${this.apiBase}/health`);
    if (!res.ok) {
      throw new Error(`API health check returned status ${res.status}`);
    }
    const json = await res.json();
    return ApiHealthResponseSchema.parse(json);
  }

  async checkMockHealth(): Promise<MockHealthResponse> {
    const res = await fetch(`${this.mockBase}/health`);
    if (!res.ok) {
      throw new Error(`Mock providers health check returned status ${res.status}`);
    }
    const json = await res.json();
    return MockHealthResponseSchema.parse(json);
  }

  async checkSystemReadiness(): Promise<SystemReadiness> {
    const result: SystemReadiness = {
      api: { status: 'loading' },
      mockProviders: { status: 'loading' }
    };

    try {
      const apiHealth = await this.checkApiHealth();
      result.api = { status: 'ready', details: apiHealth };
    } catch (err) {
      result.api = { status: 'offline', error: (err as Error).message };
    }

    try {
      const mockHealth = await this.checkMockHealth();
      result.mockProviders = { status: 'ready', details: mockHealth };
    } catch (err) {
      result.mockProviders = { status: 'offline', error: (err as Error).message };
    }

    return result;
  }

  // Operator Auth (A20)
  async loginOperator(token: string): Promise<OperatorSessionResponse> {
    const res = await fetch(`${this.apiBase}/operator/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ token })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Login failed with status ${res.status}`);
    }

    const data = await res.json();
    return OperatorSessionResponseSchema.parse(data);
  }

  // Projects (A21, A22)
  async listProjects(): Promise<ProjectSummary[]> {
    const res = await fetch(`${this.apiBase}/projects`, {
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error(`Failed to list projects: ${res.status}`);
    }

    const data = await res.json();
    const parsed = ListProjectsResponseSchema.parse(data);
    return parsed.projects;
  }

  async createProject(name: string, idempotencyKey = `idem_${Date.now()}`): Promise<CreateProjectResponse> {
    const res = await fetch(`${this.apiBase}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [IDEMPOTENCY_KEY_HEADER]: idempotencyKey
      },
      credentials: 'include',
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to create project: ${res.status}`);
    }

    const data = await res.json();
    return CreateProjectResponseSchema.parse(data);
  }

  // Demo State (A02)
  async getDemoState(projectId?: string, environment = 'development'): Promise<DemoStateResponse> {
    const query = new URLSearchParams({ environment });
    if (projectId) query.set('projectId', projectId);

    const res = await fetch(`${this.apiBase}/demo/state?${query.toString()}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to get demo state: ${res.status}`);
    }

    const data = await res.json();
    return DemoStateResponseSchema.parse(data);
  }

  // Demo Reset (A04)
  async resetDemo(
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<ResetDemoResponse> {
    const res = await fetch(`${this.apiBase}/demo/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to reset demo: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return ResetDemoResponseSchema.parse(data);
  }

  // Providers (A14)
  async listProviders(): Promise<ProviderSummary[]> {
    const res = await fetch(`${this.apiBase}/providers`, {
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error(`Failed to list providers: ${res.status}`);
    }

    const data = await res.json();
    const parsed = ListProvidersResponseSchema.parse(data);
    return parsed.providers;
  }

  // Baseline & Workflows (A03, A15)
  async captureBaseline(
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<CaptureBaselineResponse> {
    const res = await fetch(`${this.apiBase}/baselines/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to capture baseline: ${res.status}`);
    }

    const data = await res.json();
    return CaptureBaselineResponseSchema.parse(data);
  }

  async replayWorkflow(
    workflowId: string,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string,
    userId?: string
  ): Promise<ReplayWorkflowResponse> {
    const res = await fetch(`${this.apiBase}/workflows/${workflowId}/replay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId, userId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to replay workflow: ${res.status}`);
    }

    const data = await res.json();
    return ReplayWorkflowResponseSchema.parse(data);
  }

  // Scenarios & Incidents (A05, A06, A07, A08)
  async injectScenario(
    scenarioId: string,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<InjectScenarioResponse> {
    const res = await fetch(`${this.apiBase}/scenarios/${scenarioId}/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to inject scenario: ${res.status}`);
    }

    const data = await res.json();
    return InjectScenarioResponseSchema.parse(data);
  }

  async runObservations(
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<RunObservationsResponse> {
    const res = await fetch(`${this.apiBase}/observations/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to run observations: ${res.status}`);
    }

    const data = await res.json();
    return RunObservationsResponseSchema.parse(data);
  }

  async listIncidents(
    projectId: string,
    environment: ProjectEnvironment
  ): Promise<IncidentSummary[]> {
    const query = new URLSearchParams({ projectId, environment });
    const res = await fetch(`${this.apiBase}/incidents?${query.toString()}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to list incidents: ${res.status}`);
    }

    const data = await res.json();
    const parsed = ListIncidentsResponseSchema.parse(data);
    return parsed.incidents;
  }

  async getIncident(
    incidentId: string,
    projectId: string,
    environment: ProjectEnvironment
  ): Promise<IncidentDetail> {
    const query = new URLSearchParams({ projectId, environment });
    const res = await fetch(`${this.apiBase}/incidents/${incidentId}?${query.toString()}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to get incident: ${res.status}`);
    }

    const data = await res.json();
    const parsed = IncidentDetailResponseSchema.parse(data);
    return parsed.incident;
  }

  async analyzeImpact(
    incidentId: string,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId?: string
  ): Promise<AnalyzeImpactResponse> {
    const res = await fetch(`${this.apiBase}/incidents/${incidentId}/analyze-impact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to analyze impact: ${res.status}`);
    }

    const data = await res.json();
    return AnalyzeImpactResponseSchema.parse(data);
  }

  async proposeRepair(
    incidentId: string,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId?: string,
    model?: string,
    strategy?: string | any
  ): Promise<ProposeRepairResponse> {
    const res = await fetch(`${this.apiBase}/incidents/${incidentId}/propose-repair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId, model, strategy })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to propose repair: ${res.status}`);
    }

    const data = await res.json();
    return ProposeRepairResponseSchema.parse(data);
  }

  // Shadow Validation & Automatic Eligibility (A11)
  async validatePatch(
    patchId: string,
    projectId: string,
    environment: ProjectEnvironment,
    patchHash?: string
  ): Promise<ValidatePatchResponse> {
    const res = await fetch(`${this.apiBase}/patches/${patchId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, patchHash })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to validate patch: ${res.status}`);
    }

    const data = await res.json();
    return ValidatePatchResponseSchema.parse(data);
  }

  // Activate Adapter & Safe Rollback (A12, A13)
  async activatePatch(
    patchId: string,
    projectId: string,
    environment: ProjectEnvironment,
    patchHash?: string
  ): Promise<ActivatePatchResponse> {
    const res = await fetch(`${this.apiBase}/patches/${patchId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, patchHash })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to activate patch: ${res.status}`);
    }

    const data = await res.json();
    return ActivatePatchResponseSchema.parse(data);
  }

  async rollbackPatch(
    patchId: string,
    projectId: string,
    environment: ProjectEnvironment
  ): Promise<RollbackPatchResponse> {
    const res = await fetch(`${this.apiBase}/patches/${patchId}/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to rollback patch: ${res.status}`);
    }

    const data = await res.json();
    return RollbackPatchResponseSchema.parse(data);
  }

  // Recovery Run & Polling (A16, A17)
  async startRecovery(
    incidentId: string,
    projectId: string,
    environment: ProjectEnvironment
  ): Promise<StartRecoveryResponse> {
    const res = await fetch(`${this.apiBase}/incidents/${incidentId}/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to start recovery: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      (err as any).details = errorJson.error?.details;
      throw err;
    }

    const data = await res.json();
    return StartRecoveryResponseSchema.parse(data);
  }

  async getRecoveryRun(recoveryRunId: string): Promise<RecoveryRun> {
    const res = await fetch(`${this.apiBase}/recovery-runs/${recoveryRunId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to get recovery run: ${res.status}`);
    }

    const data = await res.json();
    const parsed = GetRecoveryRunResponseSchema.parse(data);
    return parsed.recoveryRun;
  }

  async getProjectDetail(
    projectId: string,
    environment?: ProjectEnvironment
  ): Promise<ProjectDetailResponse> {
    const query = environment ? `?environment=${environment}` : '';
    const res = await fetch(`${this.apiBase}/projects/${projectId}${query}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to fetch project detail: ${res.status}`);
    }

    const data = await res.json();
    return ProjectDetailResponseSchema.parse(data);
  }

  async createIngestionKey(
    projectId: string,
    environment: ProjectEnvironment,
    label?: string
  ): Promise<CreateIngestionKeyResponse> {
    const res = await fetch(`${this.apiBase}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ environment, label })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to create ingestion key: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return CreateIngestionKeyResponseSchema.parse(data);
  }

  async rotateIngestionKey(
    projectId: string,
    keyId: string
  ): Promise<RotateIngestionKeyResponse> {
    const res = await fetch(`${this.apiBase}/projects/${projectId}/keys/${keyId}/rotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to rotate ingestion key: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return RotateIngestionKeyResponseSchema.parse(data);
  }

  async revokeIngestionKey(
    projectId: string,
    keyId: string
  ): Promise<RevokeIngestionKeyResponse> {
    const res = await fetch(`${this.apiBase}/projects/${projectId}/keys/${keyId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to revoke ingestion key: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return RevokeIngestionKeyResponseSchema.parse(data);
  }

  // Ticket 30: Dependency Registration & Inventory (A27, A30, A31)
  async registerDependency(
    apiKey: string,
    req: RegisterDependencyRequest
  ): Promise<RegisterDependencyResponse> {
    const res = await fetch(`${this.apiBase}/ingest/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to register dependency: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return RegisterDependencyResponseSchema.parse(data);
  }

  async listDependencies(
    projectId: string,
    environment: ProjectEnvironment,
    limit = 50,
    cursor?: string
  ): Promise<ListDependenciesResponse> {
    const params = new URLSearchParams({ environment, limit: String(limit) });
    if (cursor) {
      params.set('cursor', cursor);
    }

    const res = await fetch(`${this.apiBase}/projects/${projectId}/dependencies?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to list dependencies: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return ListDependenciesResponseSchema.parse(data);
  }

  async getDependencyDetail(
    projectId: string,
    dependencyId: string,
    environment: ProjectEnvironment
  ): Promise<DependencyDetailResponse> {
    const params = new URLSearchParams({ environment });
    const res = await fetch(
      `${this.apiBase}/projects/${projectId}/dependencies/${dependencyId}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    );

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to get dependency detail: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return DependencyDetailResponseSchema.parse(data);
  }

  // Ticket 31: SDK Observation Ingestion & Diagnostics (A28, A29)
  async ingestObservations(
    apiKey: string,
    batch: ObservationBatchV1
  ): Promise<IngestObservationsResponse> {
    const res = await fetch(`${this.apiBase}/ingest/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to ingest observations: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return IngestObservationsResponseSchema.parse(data);
  }

  async getSdkDiagnostics(apiKey: string): Promise<SdkDiagnosticsResponse> {
    const res = await fetch(`${this.apiBase}/sdk/diagnostics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.error?.message || `Failed to get SDK diagnostics: ${res.status}`);
      (err as any).code = errorJson.error?.code;
      throw err;
    }

    const data = await res.json();
    return SdkDiagnosticsResponseSchema.parse(data);
  }
}

export const apiClient = new ApiClient();

