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
  IDEMPOTENCY_KEY_HEADER
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
}

export const apiClient = new ApiClient();
