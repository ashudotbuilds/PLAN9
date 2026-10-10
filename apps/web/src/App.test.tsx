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

  it('allows analyzing incident impact and renders 3-column lineage trace', async () => {
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
      status: 'ready',
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
      ]
    });
    vi.spyOn(apiClient, 'getIncident').mockResolvedValue({
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
      affectedWorkflows: ['welcome_email', 'customer_profile'],
      findings: [],
      beforeEvidence: { users: [] },
      afterEvidence: { users: [] },
      failedWorkflows: [
        { workflowId: 'welcome_email', reason: 'Missing name' }
      ],
      auditEventId: 'aud_inc_1'
    });
    const analyzeSpy = vi.spyOn(apiClient, 'analyzeImpact').mockResolvedValue({
      incidentId: 'inc_123',
      analyzedAt: '2026-10-11T01:45:00.000Z',
      status: 'completed',
      affectedWorkflows: [
        {
          workflowId: 'welcome_email',
          status: 'affected',
          reason: 'Read edge confirmed displayName dependency on drifted name',
          canonicalField: 'displayName',
          providerField: 'name',
          changedBehavior: "Field 'name' was renamed to 'display_name'",
          invariant: 'nonempty_recipient_matches_baseline',
          provenance: 'runtime_read',
          evidenceRefs: ['inc_123']
        }
      ],
      unaffectedWorkflows: [
        {
          workflowId: 'inventory_sync',
          status: 'unaffected',
          reason: 'Consumes inventory items only',
          provenance: 'runtime_read',
          evidenceRefs: ['inc_123']
        }
      ],
      unknownWorkflows: [],
      tracePaths: [
        {
          provider: 'users',
          endpoint: '/api/v1/users',
          declaredClient: 'users-client-sdk',
          canonicalAdapter: 'CanonicalUserAdapter',
          workflow: 'welcome_email',
          provenance: 'runtime_read',
          evidenceRefs: ['inc_123']
        }
      ],
      auditEventId: 'aud_impact_1'
    });

    render(<App />);

    // Click the incident badge to open inspection drawer
    const incidentCard = await screen.findByText(/Breaking schema change: provider field 'name' renamed/);
    fireEvent.click(incidentCard);

    // Verify incident drawer is open
    await waitFor(() => {
      expect(screen.getByText(/Incident Evidence Inspection \(A08\)/)).toBeInTheDocument();
    });

    // Click Analyze Workflow Impact button
    const analyzeBtn = screen.getByRole('button', { name: /analyze workflow impact/i });
    fireEvent.click(analyzeBtn);

    expect(analyzeSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/canonical: displayName/)).toBeInTheDocument();
      expect(screen.getByText(/Consumes inventory items only/)).toBeInTheDocument();
    });
  });

  it('allows proposing compatible adapter and renders proposal diff and rules', async () => {
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
      status: 'ready',
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
      ]
    });
    vi.spyOn(apiClient, 'getIncident').mockResolvedValue({
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
      affectedWorkflows: ['welcome_email', 'customer_profile'],
      findings: [],
      beforeEvidence: { users: [] },
      afterEvidence: { users: [] },
      failedWorkflows: [
        { workflowId: 'welcome_email', reason: 'Missing name' }
      ],
      auditEventId: 'aud_inc_1'
    });
    const proposeSpy = vi.spyOn(apiClient, 'proposeRepair').mockResolvedValue({
      proposal: {
        id: 'adp_prop_123',
        incidentId: 'inc_123',
        source: 'deterministic_fallback',
        recommendation: 'recommended',
        confidence: 0.95,
        patch: {
          id: 'patch_123',
          hash: 'hash_123',
          provider: 'users',
          targetEntity: 'CanonicalUser',
          version: 2,
          rules: [
            {
              op: 'coalesce',
              sources: ['display_name', 'name'],
              targetField: 'displayName'
            }
          ],
          preservedFields: ['id'],
          diff: '@@ -1,3 +1,5 @@\n-    displayName: record.name\n+    displayName: record.display_name ?? record.name'
        },
        uncertainties: [],
        evidenceRefs: ['inc_123'],
        requiredChecks: ['baseline_replay', 'shadow_canary'],
        createdAt: '2026-10-11T02:00:00.000Z',
        auditEventId: 'aud_prop_123'
      },
      auditEventId: 'aud_prop_123'
    });

    render(<App />);

    // Click the incident badge to open inspection drawer
    const incidentCard = await screen.findByText(/Breaking schema change: provider field 'name' renamed/);
    fireEvent.click(incidentCard);

    // Verify incident drawer is open
    await waitFor(() => {
      expect(screen.getByText(/Incident Evidence Inspection \(A08\)/)).toBeInTheDocument();
    });

    // Click Propose Compatible Adapter button
    const proposeBtn = screen.getByRole('button', { name: /propose compatible adapter/i });
    fireEvent.click(proposeBtn);

    expect(proposeSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/adp_prop_123/)).toBeInTheDocument();
      expect(screen.getByText(/deterministic_fallback/)).toBeInTheDocument();
      expect(screen.getByText(/display_name, name/)).toBeInTheDocument();
    });
  });

  it('allows validating candidate adapter and renders all 9 gates with eligibility status (A11)', async () => {
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
      status: 'ready',
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
      ]
    });
    vi.spyOn(apiClient, 'getIncident').mockResolvedValue({
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
      affectedWorkflows: ['welcome_email', 'customer_profile'],
      findings: [],
      beforeEvidence: { users: [] },
      afterEvidence: { users: [] },
      failedWorkflows: [
        { workflowId: 'welcome_email', reason: 'Missing name' }
      ],
      proposals: [
        {
          id: 'adp_prop_123',
          incidentId: 'inc_123',
          source: 'deterministic_fallback',
          recommendation: 'recommended',
          confidence: 0.95,
          patch: {
            id: 'patch_val_123',
            hash: 'hash_val_123',
            provider: 'users',
            targetEntity: 'CanonicalUser',
            version: 2,
            rules: [
              {
                op: 'coalesce',
                sources: ['display_name', 'name'],
                targetField: 'displayName'
              }
            ],
            preservedFields: ['id'],
            diff: '@@ -1,3 +1,5 @@\n-    displayName: record.name\n+    displayName: record.display_name ?? record.name'
          },
          uncertainties: [],
          evidenceRefs: ['inc_123'],
          requiredChecks: ['baseline_replay', 'shadow_canary'],
          createdAt: '2026-10-11T02:00:00.000Z',
          auditEventId: 'aud_prop_123'
        }
      ],
      auditEventId: 'aud_inc_1'
    });

    const validateSpy = vi.spyOn(apiClient, 'validatePatch').mockResolvedValue({
      validationRun: {
        id: 'val_run_123',
        patchId: 'patch_val_123',
        patchHash: 'hash_val_123',
        incidentId: 'inc_123',
        status: 'passed',
        eligibility: 'eligible',
        gates: [
          { gateId: 'read_only_endpoint', status: 'passed', details: 'Endpoint verified read-only GET' },
          { gateId: 'structural_drift_only', status: 'passed', details: 'Structural field rename' },
          { gateId: 'allowed_operations_only', status: 'passed', details: 'coalesce/rename only' },
          { gateId: 'value_equivalence_identities', status: 'passed', details: 'Values match across 3 identities' },
          { gateId: 'no_proposal_uncertainty', status: 'passed', details: '0 uncertainties' },
          { gateId: 'replay_safe_workflows', status: 'passed', details: 'Side effects stubbed' },
          { gateId: 'canonical_schema_and_invariants', status: 'passed', details: 'Invariants pass' },
          { gateId: 'patch_hash_match', status: 'passed', details: 'Hash matches' },
          { gateId: 'no_unrelated_regression', status: 'passed', details: 'Unaffected workflows pass' }
        ],
        workflowOutcomes: [
          { workflowId: 'welcome_email', status: 'passed', details: 'Recipient matches', sideEffectStubbed: true },
          { workflowId: 'customer_profile', status: 'passed', details: 'Profile matches', sideEffectStubbed: false },
          { workflowId: 'inventory_sync', status: 'unchanged', details: 'Regression free', sideEffectStubbed: false },
          { workflowId: 'delivery_estimate', status: 'unchanged', details: 'Regression free', sideEffectStubbed: false }
        ],
        evaluatedAt: '2026-10-11T02:40:00.000Z',
        auditEventId: 'aud_val_run_123'
      },
      auditEventId: 'aud_val_run_123'
    });

    render(<App />);

    // Click the incident badge to open inspection drawer
    const incidentCard = await screen.findByText(/Breaking schema change: provider field 'name' renamed/);
    fireEvent.click(incidentCard);

    // Verify drawer is open
    await waitFor(() => {
      expect(screen.getByText(/Incident Evidence Inspection \(A08\)/)).toBeInTheDocument();
    });

    // Click Validate Candidate Adapter button
    const valBtn = screen.getByRole('button', { name: /validate candidate adapter/i });
    fireEvent.click(valBtn);

    expect(validateSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('ELIGIBLE FOR ACTIVATION')).toBeInTheDocument();
      expect(screen.getByText(/read_only_endpoint/)).toBeInTheDocument();
      expect(screen.getByText(/stubbed \(0 live transmission\)/)).toBeInTheDocument();
    });
  });

  it('Ticket 07: activates validated adapter with replay verification and executes safe rollback in UI', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'listProjects').mockResolvedValue([
      {
        id: 'prj_test_1',
        name: 'Test Project',
        environments: ['development'],
        createdAt: '2026-10-11T00:00:00.000Z'
      }
    ]);
    vi.spyOn(apiClient, 'getDemoState').mockResolvedValue({
      projectId: 'prj_test_1',
      environment: 'development',
      sessionId: 'sess_1',
      status: 'ready',
      providers: [],
      readEdges: [],
      incidents: [
        {
          id: 'inc_123',
          projectId: 'prj_test_1',
          environment: 'development',
          sessionId: 'sess_1',
          provider: 'users',
          endpoint: '/users/:id',
          fingerprint: 'fingerprint_123',
          status: 'validated',
          severity: 'high',
          summary: "Breaking schema change: provider field 'name' renamed to 'display_name'",
          detectedAt: '2026-10-11T01:30:00.000Z',
          evidenceStrength: 'confirmed',
          affectedWorkflows: ['welcome_email', 'customer_profile']
        }
      ],
      activeScenarios: ['users.field-rename']
    });

    vi.spyOn(apiClient, 'getIncident').mockResolvedValue({
      id: 'inc_123',
      projectId: 'prj_test_1',
      environment: 'development',
      sessionId: 'sess_1',
      provider: 'users',
      endpoint: '/users/:id',
      fingerprint: 'fingerprint_123',
      status: 'validated',
      severity: 'high',
      summary: "Breaking schema change: provider field 'name' renamed to 'display_name'",
      detectedAt: '2026-10-11T01:30:00.000Z',
      evidenceStrength: 'confirmed',
      affectedWorkflows: ['welcome_email', 'customer_profile'],
      findings: [],
      beforeEvidence: {},
      afterEvidence: {},
      failedWorkflows: [],
      proposals: [
        {
          id: 'prop_123',
          incidentId: 'inc_123',
          source: 'deterministic_fallback',
          recommendation: 'recommended',
          confidence: 0.95,
          patch: {
            id: 'patch_val_123',
            hash: 'hash_val_123',
            provider: 'users',
            targetEntity: 'CanonicalUser',
            version: 2,
            rules: [
              {
                op: 'coalesce',
                sources: ['display_name', 'name'],
                targetField: 'displayName'
              }
            ],
            preservedFields: ['id'],
            diff: 'diff'
          },
          uncertainties: [],
          evidenceRefs: ['inc_123'],
          requiredChecks: ['baseline_replay', 'shadow_canary'],
          createdAt: '2026-10-11T02:00:00.000Z',
          auditEventId: 'aud_prop_123'
        }
      ],
      validationRuns: [
        {
          id: 'val_run_123',
          patchId: 'patch_val_123',
          patchHash: 'hash_val_123',
          incidentId: 'inc_123',
          status: 'passed',
          eligibility: 'eligible',
          gates: [
            { gateId: 'read_only_endpoint', status: 'passed', details: 'Endpoint verified read-only GET' }
          ],
          workflowOutcomes: [
            { workflowId: 'welcome_email', status: 'passed', details: 'Recipient matches', sideEffectStubbed: true }
          ],
          evaluatedAt: '2026-10-11T02:40:00.000Z',
          auditEventId: 'aud_val_run_123'
        }
      ],
      auditEventId: 'aud_inc_1'
    });

    const activateSpy = vi.spyOn(apiClient, 'activatePatch').mockResolvedValue({
      activeAdapter: {
        id: 'adp_v2',
        version: 2,
        parentVersion: 1,
        patchId: 'patch_val_123',
        patchHash: 'hash_val_123',
        provider: 'users',
        targetEntity: 'CanonicalUser',
        rules: [{ op: 'coalesce', sources: ['display_name', 'name'], targetField: 'displayName' }],
        preservedFields: ['id'],
        status: 'active',
        activatedAt: '2026-10-11T02:50:00.000Z'
      },
      postActivationReplay: {
        status: 'passed',
        replays: [
          {
            workflowId: 'welcome_email',
            status: 'passed',
            result: { type: 'send_email', recipientName: 'Aarav' },
            invariantResult: { passed: true, details: 'recipientName non-empty' },
            readFields: ['user.displayName'],
            auditEventId: 'aud_replay_1'
          }
        ],
        details: 'Post-activation replay verified.'
      },
      incidentStatus: 'recovered',
      recoveryStatus: 'recovered',
      auditEventId: 'aud_act_123'
    });

    const rollbackSpy = vi.spyOn(apiClient, 'rollbackPatch').mockResolvedValue({
      restoredAdapter: {
        id: 'adp_v1',
        version: 1,
        parentVersion: null,
        patchId: 'patch_v1_baseline',
        patchHash: 'hash_v1_baseline',
        provider: 'users',
        targetEntity: 'CanonicalUser',
        rules: [{ op: 'rename', sources: ['name'], targetField: 'displayName' }],
        preservedFields: ['id'],
        status: 'active',
        activatedAt: '2026-10-11T02:55:00.000Z'
      },
      incidentStatus: 'rolled_back',
      auditEventId: 'aud_roll_123'
    });

    render(<App />);

    // Click incident to open inspection drawer
    const incidentCard = await screen.findByText(/Breaking schema change: provider field 'name' renamed/);
    fireEvent.click(incidentCard);

    // Verify Activate button is visible
    const activateBtn = await screen.findByRole('button', { name: /activate adapter \(a12\)/i });
    expect(activateBtn).toBeEnabled();

    // Click Activate
    fireEvent.click(activateBtn);
    expect(activateSpy).toHaveBeenCalled();

    // Verify RECOVERED badge and active adapter v2 rendered
    await waitFor(() => {
      expect(screen.getByText('RECOVERED')).toBeInTheDocument();
      expect(screen.getByText('adp_v2')).toBeInTheDocument();
      expect(screen.getByText(/POST-ACTIVATION REPLAY VERIFICATION/)).toBeInTheDocument();
    });

    // Verify Rollback button is now present and clickable
    const rollbackBtn = screen.getByRole('button', { name: /rollback to parent \(a13\)/i });
    expect(rollbackBtn).toBeEnabled();

    // Click Rollback
    fireEvent.click(rollbackBtn);
    expect(rollbackSpy).toHaveBeenCalled();

    // Verify ROLLED BACK badge rendered and adapter restored to v1
    await waitFor(() => {
      expect(screen.getByText('ROLLED BACK')).toBeInTheDocument();
      expect(screen.getByText('adp_v1')).toBeInTheDocument();
    });
  });

  it('Ticket 08: runs safe recovery workflow and tracks real-time progress in UI', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });
    vi.spyOn(apiClient, 'listProjects').mockResolvedValue([
      {
        id: 'prj_test_1',
        name: 'Test Project',
        environments: ['development'],
        createdAt: '2026-10-11T00:00:00.000Z'
      }
    ]);
    vi.spyOn(apiClient, 'getDemoState').mockResolvedValue({
      projectId: 'prj_test_1',
      environment: 'development',
      sessionId: 'sess_1',
      status: 'ready',
      providers: [],
      readEdges: [],
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
      activeScenarios: ['users.field-rename']
    });

    vi.spyOn(apiClient, 'getIncident').mockResolvedValue({
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
      affectedWorkflows: ['welcome_email', 'customer_profile'],
      findings: [],
      beforeEvidence: {},
      afterEvidence: {},
      failedWorkflows: [],
      auditEventId: 'aud_inc_1'
    });

    const startRecoverySpy = vi.spyOn(apiClient, 'startRecovery').mockResolvedValue({
      recoveryRunId: 'rec_run_999',
      incidentId: 'inc_123'
    });

    const getRecoveryRunSpy = vi.spyOn(apiClient, 'getRecoveryRun').mockResolvedValue({
      id: 'rec_run_999',
      incidentId: 'inc_123',
      projectId: 'prj_test_1',
      environment: 'development',
      status: 'succeeded',
      stage: 'completed',
      stageHistory: [
        { stage: 'queued', status: 'completed', startedAt: '2026-10-11T03:00:00.000Z' },
        { stage: 'impact', status: 'completed', startedAt: '2026-10-11T03:00:01.000Z' },
        { stage: 'proposing', status: 'completed', startedAt: '2026-10-11T03:00:02.000Z' },
        { stage: 'validating', status: 'completed', startedAt: '2026-10-11T03:00:03.000Z' },
        { stage: 'activating', status: 'completed', startedAt: '2026-10-11T03:00:04.000Z' },
        { stage: 'replaying', status: 'completed', startedAt: '2026-10-11T03:00:05.000Z' }
      ],
      artifacts: {
        patchId: 'patch_val_123',
        patchHash: 'hash_val_123',
        validationRunId: 'val_123',
        activeAdapterId: 'adp_v2'
      },
      startedAt: '2026-10-11T03:00:00.000Z',
      completedAt: '2026-10-11T03:00:06.000Z',
      auditEventId: 'aud_rec_999'
    });

    render(<App />);

    // Click incident card
    const incidentCard = await screen.findByText(/Breaking schema change: provider field 'name' renamed/);
    fireEvent.click(incidentCard);

    // Verify Run Safe Recovery button exists
    const recoverBtn = await screen.findByRole('button', { name: /run safe recovery \(a16\)/i });
    expect(recoverBtn).toBeEnabled();

    // Click recovery
    fireEvent.click(recoverBtn);
    expect(startRecoverySpy).toHaveBeenCalledWith('inc_123', 'prj_test_1', 'development');

    // Verify recovery run ID and completed stage rendered
    await waitFor(() => {
      expect(screen.getByText('rec_run_999')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText(/validating \(completed\)/)).toBeInTheDocument();
    });
  });
});


