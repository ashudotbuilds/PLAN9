import { randomUUID } from 'node:crypto';
import {
  ProjectSummary,
  ProjectEnvironment,
  CreateProjectResponse,
  ProjectDetailResponse,
  BaselineSummary,
  DependencyEdge,
  IncidentSummary
} from '@driftguard/contracts';



export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  environments: ProjectEnvironment[];
  environmentState: {
    development: { activeSessionId: string; lastIngestAt: string | null };
    production: { activeSessionId: string; lastIngestAt: string | null };
  };
  collectionPolicy: Record<string, unknown>;
  auditEventId: string;
}

interface IdempotencyRecord {
  key: string;
  name: string;
  createdAt: number;
  response: CreateProjectResponse;
}

import type { KeyService } from './key-service.js';

export class ProjectService {
  private projects = new Map<string, ProjectRecord>();
  private idempotencyStore = new Map<string, IdempotencyRecord>();
  private readonly maxProjects = 20;

  constructor(private keyService?: KeyService) {
    // Initialize default demo project
    this.seedDefaultProject();
  }

  setKeyService(keyService: KeyService): void {
    this.keyService = keyService;
  }

  getProjectRecord(projectId: string): ProjectRecord | undefined {
    return this.projects.get(projectId);
  }

  private seedDefaultProject(): void {
    const id = 'prj_demo_default';
    const createdAt = new Date().toISOString();
    const record: ProjectRecord = {
      id,
      name: 'Default Demo Project',
      createdAt,
      environments: ['development', 'production'],
      environmentState: {
        development: { activeSessionId: 'sess_dev_default', lastIngestAt: null },
        production: { activeSessionId: 'sess_prod_default', lastIngestAt: null }
      },
      collectionPolicy: {
        version: 1,
        allowedBodyPaths: ['$.id', '$.name', '$.display_name']
      },
      auditEventId: 'aud_seed_default'
    };
    this.projects.set(id, record);
  }

  createProject(name: string, idempotencyKey: string): CreateProjectResponse {
    const now = Date.now();

    // Check idempotency cache (24 hours)
    const existingKey = this.idempotencyStore.get(idempotencyKey);
    if (existingKey && now - existingKey.createdAt < 24 * 60 * 60 * 1000) {
      if (existingKey.name === name) {
        return existingKey.response;
      }
      const err = new Error('Conflicting request body for this idempotency key');
      (err as any).statusCode = 409;
      (err as any).code = 'IDEMPOTENCY_CONFLICT';
      throw err;
    }

    if (this.projects.size >= this.maxProjects) {
      const err = new Error('Demo project limit of 20 reached');
      (err as any).statusCode = 409;
      (err as any).code = 'PROJECT_LIMIT_EXCEEDED';
      throw err;
    }

    const id = `prj_${randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    const record: ProjectRecord = {
      id,
      name,
      createdAt,
      environments: ['development', 'production'],
      environmentState: {
        development: { activeSessionId: `sess_${randomUUID().slice(0, 8)}`, lastIngestAt: null },
        production: { activeSessionId: `sess_${randomUUID().slice(0, 8)}`, lastIngestAt: null }
      },
      collectionPolicy: {
        version: 1,
        allowedBodyPaths: ['$.id', '$.name', '$.display_name']
      },
      auditEventId
    };

    this.projects.set(id, record);

    const response: CreateProjectResponse = {
      project: {
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        environments: record.environments
      },
      auditEventId
    };

    this.idempotencyStore.set(idempotencyKey, {
      key: idempotencyKey,
      name,
      createdAt: now,
      response
    });

    return response;
  }

  listProjects(): ProjectSummary[] {
    return Array.from(this.projects.values()).map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      environments: p.environments
    }));
  }

  getProject(projectId: string, environment: ProjectEnvironment = 'development'): ProjectDetailResponse | null {
    const record = this.projects.get(projectId);
    if (!record) return null;

    const envState = record.environmentState[environment] || record.environmentState.development;

    return {
      project: {
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        environments: record.environments
      },
      environmentState: {
        environment,
        activeSessionId: envState.activeSessionId,
        lastIngestAt: envState.lastIngestAt
      },
      keyMetadata: this.keyService ? this.keyService.listKeyMetadata(projectId, environment) : [],
      collectionPolicy: record.collectionPolicy
    };
  }

  getDemoState(
    projectId?: string,
    environment: ProjectEnvironment = 'development',
    baseline?: BaselineSummary | null,
    readEdges?: DependencyEdge[],
    incidents?: IncidentSummary[],
    activeScenarios?: string[]
  ) {
    let targetProject = projectId ? this.projects.get(projectId) : undefined;
    if (!targetProject) {
      targetProject = Array.from(this.projects.values())[0];
    }
    if (!targetProject) return null;

    const envState = targetProject.environmentState[environment] || targetProject.environmentState.development;

    let status = 'awaiting_baseline';
    if (incidents && incidents.length > 0) {
      status = 'incident_detected';
    } else if (baseline) {
      status = 'baseline_captured';
    }

    return {
      projectId: targetProject.id,
      environment,
      sessionId: envState.activeSessionId,
      status,
      providers: [
        {
          id: 'users',
          name: 'Users API',
          status: activeScenarios?.includes('users.field-rename') ? 'drift_detected' : 'ready'
        },
        {
          id: 'inventory',
          name: 'Inventory API',
          status: activeScenarios?.includes('inventory.cursor-pagination') ? 'drift_detected' : 'ready'
        },
        {
          id: 'shipping',
          name: 'Shipping API',
          status: activeScenarios?.includes('shipping.business-days') ? 'drift_detected' : 'ready'
        }
      ],
      baseline: baseline || undefined,
      readEdges: readEdges || undefined,
      incidents: incidents && incidents.length > 0 ? incidents : undefined,
      activeScenarios: activeScenarios && activeScenarios.length > 0 ? activeScenarios : undefined
    };
  }

  resetProjectSession(projectId: string, environment: ProjectEnvironment): string {
    let record = this.projects.get(projectId);
    if (!record) {
      record = Array.from(this.projects.values())[0];
    }
    const newSessionId = `sess_${randomUUID().slice(0, 8)}`;
    if (record) {
      if (!record.environmentState[environment]) {
        record.environmentState[environment] = {
          activeSessionId: newSessionId,
          lastIngestAt: null
        };
      } else {
        record.environmentState[environment].activeSessionId = newSessionId;
      }
    }
    return newSessionId;
  }
}


