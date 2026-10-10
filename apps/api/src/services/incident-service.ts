import { createHash, randomUUID } from 'node:crypto';
import {
  Finding,
  IncidentDetail,
  IncidentSummary,
  ProjectEnvironment,
  WorkflowId
} from '@driftguard/contracts';
import { BaselineService } from './baseline-service.js';

export interface IncidentServiceOptions {
  mockProvidersBaseUrl?: string;
  fetchFn?: typeof fetch;
}

export class IncidentService {
  private activeScenarios = new Set<string>();
  private incidents = new Map<string, IncidentDetail>(); // keyed by incidentId
  private mockProvidersBaseUrl: string;
  private fetchFn: typeof fetch;

  constructor(
    private baselineService: BaselineService,
    options: IncidentServiceOptions = {}
  ) {
    this.mockProvidersBaseUrl =
      options.mockProvidersBaseUrl ||
      process.env.MOCK_PROVIDERS_URL ||
      'http://127.0.0.1:4001';
    this.fetchFn = options.fetchFn || fetch;
  }

  getActiveScenarios(): string[] {
    return Array.from(this.activeScenarios);
  }

  async injectScenario(
    scenarioId: string,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<{ scenarioId: string; activeScenarios: string[]; auditEventId: string }> {
    // 1. Verify demo lease
    this.baselineService.acquireLease(projectId, environment, sessionId);

    // 2. Validate known scenario
    const supportedScenarios = ['users.field-rename', 'shipping.business-days'];
    if (!supportedScenarios.includes(scenarioId)) {
      const err = new Error(`Scenario '${scenarioId}' is not recognized.`);
      (err as any).statusCode = 404;
      (err as any).code = 'SCENARIO_NOT_FOUND';
      throw err;
    }

    // 3. Inject into mock providers over HTTP
    try {
      const res = await this.fetchFn(
        `${this.mockProvidersBaseUrl}/scenarios/${scenarioId}/inject`,
        { method: 'POST' }
      );
      if (!res.ok) {
        throw new Error(`Mock provider injection returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      const error = new Error(`Failed to inject scenario on mock provider: ${err.message}`);
      (error as any).statusCode = 502;
      (error as any).code = 'PROVIDER_UNAVAILABLE';
      throw error;
    }

    this.activeScenarios.add(scenarioId);
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    return {
      scenarioId,
      activeScenarios: Array.from(this.activeScenarios),
      auditEventId
    };
  }

  async runObservations(
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<{
    observationIds: string[];
    findings: Finding[];
    incident: IncidentSummary | null;
    incidents: IncidentSummary[];
    auditEventId: string;
  }> {
    // 1. Verify lease & baseline
    this.baselineService.acquireLease(projectId, environment, sessionId);

    const baseline = this.baselineService.getBaseline(projectId, environment);
    if (!baseline) {
      const err = new Error('No baseline captured. You must capture a healthy baseline before observing drift.');
      (err as any).statusCode = 409;
      (err as any).code = 'BASELINE_REQUIRED';
      throw err;
    }

    // 2. Fetch live observations from mock providers
    const userIds = ['u-123', 'u-456', 'u-789'];
    let observedUsers: any[] = [];
    try {
      const promises = userIds.map(async (id) => {
        const res = await this.fetchFn(`${this.mockProvidersBaseUrl}/users/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching user ${id}`);
        return res.json();
      });
      observedUsers = await Promise.all(promises);
    } catch (err: any) {
      const error = new Error(`Observation failed: ${err.message}`);
      (error as any).statusCode = 502;
      (error as any).code = 'OBSERVATION_FAILED';
      throw error;
    }

    const observationIds = userIds.map(() => `obs_${randomUUID().slice(0, 8)}`);
    const findings: Finding[] = [];
    const affectedWorkflows: WorkflowId[] = [];
    const failedWorkflows: { workflowId: WorkflowId; reason: string }[] = [];

    // 3. Compare live users against baseline users
    let renameCount = 0;
    for (const obsUser of observedUsers) {
      if ('display_name' in obsUser && !('name' in obsUser)) {
        renameCount++;
      }
    }

    if (renameCount > 0) {
      const evidenceStrength = renameCount === 3 ? 'confirmed' : 'limited';

      findings.push({
        id: `find_${randomUUID().slice(0, 8)}`,
        type: 'field_removed',
        provider: 'users',
        endpoint: '/users/:id',
        fieldName: 'name',
        path: '$.name',
        evidenceStrength,
        beforeValue: 'Aarav',
        afterValue: undefined,
        description: `Field 'name' was removed from response across ${renameCount} identity fixtures.`
      });

      findings.push({
        id: `find_${randomUUID().slice(0, 8)}`,
        type: 'field_added',
        provider: 'users',
        endpoint: '/users/:id',
        fieldName: 'display_name',
        path: '$.display_name',
        evidenceStrength,
        beforeValue: undefined,
        afterValue: 'Aarav',
        description: `Field 'display_name' was added to response across ${renameCount} identity fixtures.`
      });

      // Workflows affected by removed 'name' -> displayName
      affectedWorkflows.push('welcome_email', 'customer_profile');
      failedWorkflows.push(
        {
          workflowId: 'welcome_email',
          reason: "Required field 'user.displayName' is missing (provider 'name' missing)."
        },
        {
          workflowId: 'customer_profile',
          reason: "Required field 'user.displayName' is missing (provider 'name' missing)."
        }
      );
    }

    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    let incidentSummary: IncidentSummary | null = null;

    if (findings.length > 0) {
      // Deterministic fingerprint
      const fingerprint = createHash('sha256')
        .update(
          JSON.stringify({
            projectId,
            environment,
            provider: 'users',
            endpoint: '/users/:id',
            findings: findings.map((f) => ({ type: f.type, field: f.fieldName }))
          })
        )
        .digest('hex');

      // Check if existing incident in scope shares fingerprint
      let existingIncident: IncidentDetail | undefined;
      for (const inc of this.incidents.values()) {
        if (
          inc.projectId === projectId &&
          inc.environment === environment &&
          inc.fingerprint === fingerprint
        ) {
          existingIncident = inc;
          break;
        }
      }

      const now = new Date().toISOString();
      const beforeEvidence: Record<string, unknown> = {
        users: baseline.rawEvidence.users
      };
      const afterEvidence: Record<string, unknown> = {
        users: observedUsers
      };

      if (existingIncident) {
        // Reuse incident ID and update timestamp/evidence
        existingIncident.detectedAt = now;
        existingIncident.findings = findings;
        existingIncident.afterEvidence = afterEvidence;
        incidentSummary = {
          id: existingIncident.id,
          projectId: existingIncident.projectId,
          environment: existingIncident.environment,
          sessionId: existingIncident.sessionId,
          provider: existingIncident.provider,
          endpoint: existingIncident.endpoint,
          fingerprint: existingIncident.fingerprint,
          status: existingIncident.status,
          severity: existingIncident.severity,
          summary: existingIncident.summary,
          detectedAt: existingIncident.detectedAt,
          evidenceStrength: existingIncident.evidenceStrength,
          affectedWorkflows: existingIncident.affectedWorkflows
        };
      } else {
        const incidentId = `inc_${randomUUID().slice(0, 8)}`;
        const detail: IncidentDetail = {
          id: incidentId,
          projectId,
          environment,
          sessionId,
          provider: 'users',
          endpoint: '/users/:id',
          fingerprint,
          status: 'detected',
          severity: 'high',
          summary: "Breaking schema change: provider field 'name' renamed to 'display_name'",
          detectedAt: now,
          evidenceStrength: renameCount === 3 ? 'confirmed' : 'limited',
          affectedWorkflows,
          findings,
          beforeEvidence,
          afterEvidence,
          failedWorkflows,
          auditEventId
        };
        this.incidents.set(incidentId, detail);
        incidentSummary = {
          id: detail.id,
          projectId: detail.projectId,
          environment: detail.environment,
          sessionId: detail.sessionId,
          provider: detail.provider,
          endpoint: detail.endpoint,
          fingerprint: detail.fingerprint,
          status: detail.status,
          severity: detail.severity,
          summary: detail.summary,
          detectedAt: detail.detectedAt,
          evidenceStrength: detail.evidenceStrength,
          affectedWorkflows: detail.affectedWorkflows
        };
      }
    }

    const allIncidents = this.listIncidents(projectId, environment);

    return {
      observationIds,
      findings,
      incident: incidentSummary,
      incidents: allIncidents,
      auditEventId
    };
  }

  listIncidents(projectId: string, environment: ProjectEnvironment): IncidentSummary[] {
    const list: IncidentSummary[] = [];
    for (const inc of this.incidents.values()) {
      if (inc.projectId === projectId && inc.environment === environment) {
        list.push({
          id: inc.id,
          projectId: inc.projectId,
          environment: inc.environment,
          sessionId: inc.sessionId,
          provider: inc.provider,
          endpoint: inc.endpoint,
          fingerprint: inc.fingerprint,
          status: inc.status,
          severity: inc.severity,
          summary: inc.summary,
          detectedAt: inc.detectedAt,
          evidenceStrength: inc.evidenceStrength,
          affectedWorkflows: inc.affectedWorkflows
        });
      }
    }
    return list;
  }

  getIncident(
    incidentId: string,
    projectId: string,
    environment: ProjectEnvironment
  ): IncidentDetail | null {
    const detail = this.incidents.get(incidentId);
    if (!detail) return null;
    if (detail.projectId !== projectId || detail.environment !== environment) {
      return null;
    }
    return detail;
  }
}
