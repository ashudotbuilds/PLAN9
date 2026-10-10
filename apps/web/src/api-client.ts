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
  RollbackPatchResponseSchema
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
    model?: string
  ): Promise<ProposeRepairResponse> {
    const res = await fetch(`${this.apiBase}/incidents/${incidentId}/propose-repair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, environment, sessionId, model })
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
}

export const apiClient = new ApiClient();
