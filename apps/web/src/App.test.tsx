import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from './App';
import { apiClient } from './api-client';

describe('Web App - Operational Canvas & Operator Onboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ready state when all health checks succeed', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: {
        status: 'ready',
        details: {
          status: 'healthy',
          service: 'api',
          timestamp: '2026-10-11T00:00:00.000Z'
        }
      },
      mockProviders: {
        status: 'ready',
        details: {
          status: 'healthy',
          service: 'mock-providers',
          timestamp: '2026-10-11T00:00:00.000Z',
          providers: {
            users: 'ready',
            inventory: 'ready',
            shipping: 'ready'
          }
        }
      }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('READY').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Control Plane API')).toBeInTheDocument();
    expect(screen.getByText('Mock Dependency Providers')).toBeInTheDocument();
  });

  it('renders login prompt when operator is not authenticated', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'listProjects').mockRejectedValue(new Error('UNAUTHENTICATED'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('LOGIN REQUIRED')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Operator token...')).toBeInTheDocument();
  });

  it('allows operator to login and shows project selectors', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'loginOperator').mockResolvedValue({
      expiresAt: '2026-10-11T08:00:00.000Z',
      auditEventId: 'aud_login_test'
    });
    vi.spyOn(apiClient, 'listProjects')
      .mockRejectedValueOnce(new Error('UNAUTHENTICATED'))
      .mockResolvedValueOnce([
        {
          id: 'prj_test_1',
          name: 'Test Project',
          createdAt: '2026-10-11T00:00:00.000Z',
          environments: ['development', 'production']
        }
      ]);

    render(<App />);

    const tokenInput = await screen.findByPlaceholderText('Operator token...');
    fireEvent.change(tokenInput, { target: { value: 'secret-token' } });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('OPERATOR AUTHENTICATED')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Test Project/).length).toBeGreaterThan(0);
    expect(screen.getByText(/development \(demo active\)/)).toBeInTheDocument();
  });

  it('allows capturing baseline and displays workflow lineage', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'listProjects').mockResolvedValue([
      {
        id: 'prj_test_1',
        name: 'Test Project',
        createdAt: '2026-10-11T00:00:00.000Z',
        environments: ['development', 'production']
      }
    ]);
    vi.spyOn(apiClient, 'getDemoState').mockResolvedValue({
      projectId: 'prj_test_1',
      environment: 'development',
      sessionId: 'sess_1',
      status: 'awaiting_baseline',
      providers: []
    });
    vi.spyOn(apiClient, 'captureBaseline').mockResolvedValue({
      baseline: {
        id: 'base_1',
        projectId: 'prj_test_1',
        environment: 'development',
        sessionId: 'sess_1',
        version: 1,
        fingerprint: 'abc1234567890def',
        capturedAt: '2026-10-11T01:00:00.000Z',
        status: 'captured',
        fixtures: {
          usersCount: 3,
          inventoryItemsCount: 3,
          shippingCalculated: true
        }
      },
      readEdges: [
        {
          workflowId: 'welcome_email',
          canonicalField: 'user.displayName',
          invariant: 'recipientName non-empty'
        }
      ],
      auditEventId: 'aud_1'
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('AWAITING BASELINE')).toBeInTheDocument();
    });

    const captureBtn = screen.getByRole('button', { name: /capture healthy baseline/i });
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(screen.getByText('BASELINE CAPTURED v1')).toBeInTheDocument();
    });

    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
    expect(screen.getByText('user.displayName')).toBeInTheDocument();
  });

  it('allows injecting scenario and observing detected incident', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'listProjects').mockResolvedValue([
      {
        id: 'prj_test_1',
        name: 'Test Project',
        createdAt: '2026-10-11T00:00:00.000Z',
        environments: ['development', 'production']
      }
    ]);
    vi.spyOn(apiClient, 'getDemoState').mockResolvedValue({
      projectId: 'prj_test_1',
      environment: 'development',
      sessionId: 'sess_1',
      status: 'baseline_captured',
      providers: [],
      baseline: {
        id: 'base_1',
        projectId: 'prj_test_1',
        environment: 'development',
        sessionId: 'sess_1',
        version: 1,
        fingerprint: 'abc1234567890def',
        capturedAt: '2026-10-11T01:00:00.000Z',
        status: 'captured',
        fixtures: { usersCount: 3, inventoryItemsCount: 3, shippingCalculated: true }
      }
    });
    vi.spyOn(apiClient, 'injectScenario').mockResolvedValue({
      scenarioId: 'users.field-rename',
      activeScenarios: ['users.field-rename'],
      auditEventId: 'aud_scen_1'
    });
    vi.spyOn(apiClient, 'runObservations').mockResolvedValue({
      observationIds: ['obs_1'],
      findings: [
        {
          id: 'find_1',
          type: 'field_removed',
          provider: 'users',
          endpoint: '/users/:id',
          fieldName: 'name',
          path: '$.name',
          evidenceStrength: 'confirmed',
          description: "Field 'name' was removed"
        }
      ],
      incident: {
        id: 'inc_123',
        projectId: 'prj_test_1',
        environment: 'development',
        sessionId: 'sess_1',
        provider: 'users',
        endpoint: '/users/:id',
        fingerprint: 'fingerprint_123',
        status: 'detected',
        severity: 'high',
        summary: "Breaking schema change: provider field 'name' renamed to 'display_name'",
        detectedAt: '2026-10-11T01:30:00.000Z',
        evidenceStrength: 'confirmed',
        affectedWorkflows: ['welcome_email', 'customer_profile']
      },
      incidents: [
        {
          id: 'inc_123',
          projectId: 'prj_test_1',
          environment: 'development',
          sessionId: 'sess_1',
          provider: 'users',
          endpoint: '/users/:id',
          fingerprint: 'fingerprint_123',
          status: 'detected',
          severity: 'high',
          summary: "Breaking schema change: provider field 'name' renamed to 'display_name'",
          detectedAt: '2026-10-11T01:30:00.000Z',
          evidenceStrength: 'confirmed',
          affectedWorkflows: ['welcome_email', 'customer_profile']
        }
      ],
      auditEventId: 'aud_obs_1'
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('BASELINE CAPTURED v1')).toBeInTheDocument();
    });

    const injectBtn = screen.getByRole('button', { name: /inject user rename/i });
    fireEvent.click(injectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Injected: users\.field-rename/)).toBeInTheDocument();
    });

    const observeBtn = screen.getByRole('button', { name: /observe & detect drift/i });
    fireEvent.click(observeBtn);

    await waitFor(() => {
      expect(screen.getByText('1 INCIDENT DETECTED')).toBeInTheDocument();
    });

    expect(screen.getByText(/Breaking schema change: provider field 'name' renamed/)).toBeInTheDocument();
  });
});


