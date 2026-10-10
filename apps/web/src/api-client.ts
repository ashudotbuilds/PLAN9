import { ApiHealthResponse, ApiHealthResponseSchema, MockHealthResponse, MockHealthResponseSchema } from '@driftguard/contracts';

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
}

export const apiClient = new ApiClient();
