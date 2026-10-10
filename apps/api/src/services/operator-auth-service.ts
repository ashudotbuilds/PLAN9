import { randomUUID, timingSafeEqual } from 'node:crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  OPERATOR_TOKEN_HEADER,
  OPERATOR_SESSION_COOKIE,
  CORRELATION_ID_HEADER
} from '@driftguard/contracts';

export interface OperatorSession {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
}

export class OperatorAuthService {
  private operatorToken: string;
  private sessions = new Map<string, OperatorSession>();
  private loginAttempts = new Map<string, number[]>(); // IP -> timestamps
  private sessionDurationMs = 8 * 60 * 60 * 1000; // 8 hours
  private allowedOrigins = new Set([
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:4000',
    'http://localhost:4000'
  ]);

  constructor(token?: string) {
    this.operatorToken = token || process.env.DRIFTGUARD_OPERATOR_TOKEN || 'operator-secret-token';
  }

  isLoopback(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip === 'localhost'
    );
  }

  validateOrigin(origin?: string): boolean {
    if (!origin) return false;
    return this.allowedOrigins.has(origin);
  }

  checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(ip) || [];
    const recent = attempts.filter((t) => now - t < 60000); // 1 minute window
    if (recent.length >= 5) {
      return false; // Exceeded 5 attempts/minute
    }
    recent.push(now);
    this.loginAttempts.set(ip, recent);
    return true;
  }

  verifyToken(candidate: string): boolean {
    if (!candidate || candidate.length === 0) return false;
    const a = Buffer.from(candidate);
    const b = Buffer.from(this.operatorToken);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  createSession(): { session: OperatorSession; cookieValue: string } {
    const sessionId = randomUUID();
    const now = Date.now();
    const session: OperatorSession = {
      sessionId,
      createdAt: now,
      expiresAt: now + this.sessionDurationMs
    };
    this.sessions.set(sessionId, session);
    return { session, cookieValue: sessionId };
  }

  getSession(sessionId: string): OperatorSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  isAuthenticated(request: FastifyRequest): boolean {
    // 1. Scripted operator token header
    const tokenHeader = request.headers[OPERATOR_TOKEN_HEADER] as string;
    if (tokenHeader && this.verifyToken(tokenHeader)) {
      return true;
    }

    // 2. Cookie session
    const cookie = request.cookies[OPERATOR_SESSION_COOKIE];
    if (cookie) {
      const session = this.getSession(cookie);
      if (session) return true;
    }

    return false;
  }
}
