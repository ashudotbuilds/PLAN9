import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import {
  ProjectEnvironment,
  IngestionKeyMetadata,
  CreateIngestionKeyResponse,
  RotateIngestionKeyResponse,
  RevokeIngestionKeyResponse
} from '@driftguard/contracts';

export interface StoredKeyRecord {
  keyId: string;
  projectId: string;
  environment: ProjectEnvironment;
  digest: string;
  prefix: string;
  status: 'active' | 'revoked';
  createdAt: string;
  replacesKeyId?: string | null;
  revokedAt?: string | null;
  label?: string;
  auditEventId: string;
  revokeAuditEventId?: string;
}

export interface KeyVerificationResult {
  valid: boolean;
  code?: string;
  message?: string;
  key?: {
    keyId: string;
    projectId: string;
    environment: ProjectEnvironment;
  };
}

export class KeyService {
  private keys = new Map<string, StoredKeyRecord>();
  private readonly maxActiveKeysPerEnvironment = 3;

  createKey(
    projectId: string,
    environment: ProjectEnvironment,
    label?: string
  ): CreateIngestionKeyResponse {
    // 1. Enforce active key limit (max 3 active per project environment)
    const activeCount = Array.from(this.keys.values()).filter(
      (k) => k.projectId === projectId && k.environment === environment && k.status === 'active'
    ).length;

    if (activeCount >= this.maxActiveKeysPerEnvironment) {
      const err = new Error(
        `Active key limit of ${this.maxActiveKeysPerEnvironment} reached for ${projectId} in ${environment}.`
      );
      (err as any).statusCode = 409;
      (err as any).code = 'ACTIVE_KEY_LIMIT_REACHED';
      throw err;
    }

    // 2. Generate random key: dg_ing_<keyId>.<secret>
    const keyId = `key_${randomUUID().slice(0, 8)}`;
    const secret = randomBytes(32).toString('base64url');
    const prefix = `dg_ing_${keyId}`;
    const apiKey = `${prefix}.${secret}`;

    // 3. Persist only SHA-256 digest + safe metadata
    const digest = createHash('sha256').update(apiKey).digest('hex');
    const createdAt = new Date().toISOString();
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    const record: StoredKeyRecord = {
      keyId,
      projectId,
      environment,
      digest,
      prefix,
      status: 'active',
      createdAt,
      label,
      auditEventId
    };

    this.keys.set(keyId, record);

    return {
      keyId,
      apiKey,
      prefix,
      environment,
      auditEventId
    };
  }

  rotateKey(projectId: string, keyId: string): RotateIngestionKeyResponse {
    const existing = this.keys.get(keyId);
    if (!existing || existing.projectId !== projectId) {
      const err = new Error(`Ingestion key '${keyId}' not found.`);
      (err as any).statusCode = 404;
      (err as any).code = 'KEY_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'revoked') {
      const err = new Error(`Cannot rotate an already revoked ingestion key.`);
      (err as any).statusCode = 409;
      (err as any).code = 'KEY_ALREADY_REVOKED';
      throw err;
    }

    const now = new Date().toISOString();
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    // Generate replacement key
    const newKeyId = `key_${randomUUID().slice(0, 8)}`;
    const newSecret = randomBytes(32).toString('base64url');
    const newPrefix = `dg_ing_${newKeyId}`;
    const newApiKey = `${newPrefix}.${newSecret}`;
    const newDigest = createHash('sha256').update(newApiKey).digest('hex');

    // Atomically revoke old key and save new key
    existing.status = 'revoked';
    existing.revokedAt = now;

    const newRecord: StoredKeyRecord = {
      keyId: newKeyId,
      projectId,
      environment: existing.environment,
      digest: newDigest,
      prefix: newPrefix,
      status: 'active',
      createdAt: now,
      replacesKeyId: existing.keyId,
      auditEventId
    };

    this.keys.set(newKeyId, newRecord);

    return {
      keyId: newKeyId,
      apiKey: newApiKey,
      prefix: newPrefix,
      replacesKeyId: existing.keyId,
      auditEventId
    };
  }

  revokeKey(projectId: string, keyId: string): RevokeIngestionKeyResponse {
    const existing = this.keys.get(keyId);
    if (!existing || existing.projectId !== projectId) {
      const err = new Error(`Ingestion key '${keyId}' not found.`);
      (err as any).statusCode = 404;
      (err as any).code = 'KEY_NOT_FOUND';
      throw err;
    }

    // Idempotent state action: if already revoked, return original revocation without duplicate audit
    if (existing.status === 'revoked') {
      return {
        keyId,
        status: 'revoked',
        auditEventId: existing.revokeAuditEventId || existing.auditEventId
      };
    }

    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;
    existing.status = 'revoked';
    existing.revokedAt = new Date().toISOString();
    existing.revokeAuditEventId = auditEventId;

    return {
      keyId,
      status: 'revoked',
      auditEventId
    };
  }

  listKeyMetadata(
    projectId: string,
    environment?: ProjectEnvironment
  ): IngestionKeyMetadata[] {
    const list: IngestionKeyMetadata[] = [];
    for (const k of this.keys.values()) {
      if (k.projectId === projectId) {
        if (!environment || k.environment === environment) {
          list.push({
            keyId: k.keyId,
            prefix: k.prefix,
            environment: k.environment,
            status: k.status,
            createdAt: k.createdAt,
            replacesKeyId: k.replacesKeyId || undefined,
            revokedAt: k.revokedAt || undefined,
            label: k.label
          });
        }
      }
    }
    return list;
  }

  verifyKey(
    rawKey: string,
    expectedProjectId?: string,
    expectedEnvironment?: ProjectEnvironment
  ): KeyVerificationResult {
    if (!rawKey || typeof rawKey !== 'string') {
      return { valid: false, code: 'UNAUTHORIZED', message: 'Missing or empty API key.' };
    }

    const presentedDigest = createHash('sha256').update(rawKey).digest('hex');
    const presentedBuffer = Buffer.from(presentedDigest, 'hex');

    let matchedRecord: StoredKeyRecord | undefined;

    for (const record of this.keys.values()) {
      const storedBuffer = Buffer.from(record.digest, 'hex');
      if (storedBuffer.length === presentedBuffer.length && timingSafeEqual(storedBuffer, presentedBuffer)) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      return { valid: false, code: 'INVALID_CREDENTIALS', message: 'Invalid ingestion key.' };
    }

    if (matchedRecord.status === 'revoked') {
      return { valid: false, code: 'REVOKED_INGESTION_KEY', message: 'Ingestion key has been revoked.' };
    }

    if (expectedProjectId && matchedRecord.projectId !== expectedProjectId) {
      return {
        valid: false,
        code: 'SCOPE_FORBIDDEN',
        message: `Key project '${matchedRecord.projectId}' does not match requested scope '${expectedProjectId}'.`
      };
    }

    if (expectedEnvironment && matchedRecord.environment !== expectedEnvironment) {
      return {
        valid: false,
        code: 'SCOPE_FORBIDDEN',
        message: `Key environment '${matchedRecord.environment}' does not match requested scope '${expectedEnvironment}'.`
      };
    }

    return {
      valid: true,
      key: {
        keyId: matchedRecord.keyId,
        projectId: matchedRecord.projectId,
        environment: matchedRecord.environment
      }
    };
  }
}
