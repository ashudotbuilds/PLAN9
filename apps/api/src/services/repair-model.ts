import {
  AdapterRule,
  AdapterRuleSchema,
  Finding
} from '@driftguard/contracts';
import { z } from 'zod';

export interface RepairModelContext {
  incidentId: string;
  provider: string;
  endpoint: string;
  findings: Finding[];
  canonicalFields: string[];
}

export interface RepairModelResult {
  rules: AdapterRule[];
  confidence: number;
  recommendation: 'recommended' | 'review_required' | 'rejected';
  diff: string;
  uncertainties: string[];
  requiredChecks: string[];
}

export interface RepairModel {
  generateProposal(context: RepairModelContext): Promise<RepairModelResult>;
}

// Strict schema for LLM structured output
export const ModelRepairOutputSchema = z.object({
  rules: z.array(AdapterRuleSchema).min(1).max(10),
  confidence: z.number().min(0).max(1),
  recommendation: z.enum(['recommended', 'review_required', 'rejected']),
  rationale: z.string().max(1000).optional(),
  uncertainties: z.array(z.string().max(200)).optional(),
  requiredChecks: z.array(z.string().max(200)).optional()
});

export type ModelRepairOutput = z.infer<typeof ModelRepairOutputSchema>;

export interface LiveRepairModelOptions {
  endpoint?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export class LiveRepairModel implements RepairModel {
  private endpoint: string;
  private apiKey: string;
  private timeoutMs: number;
  private fetchFn: typeof fetch;

  constructor(options: LiveRepairModelOptions = {}) {
    this.endpoint = options.endpoint || process.env.DRIFTGUARD_MODEL_ENDPOINT || '';
    this.apiKey = options.apiKey || process.env.DRIFTGUARD_MODEL_API_KEY || '';
    this.timeoutMs = options.timeoutMs || 3000;
    this.fetchFn = options.fetchFn || globalThis.fetch;
  }

  public isConfigured(): boolean {
    return Boolean(this.endpoint.trim() && this.apiKey.trim());
  }

  public formatPrompt(context: RepairModelContext): { prompt: string; minimalPayload: unknown } {
    // Sanitize and redact: omit keys, operator tokens, cookies, raw HTTP bodies
    const sanitizedFindings = context.findings.map(f => ({
      id: f.id,
      type: f.type,
      fieldName: f.fieldName,
      description: f.description
    }));

    const minimalPayload = {
      provider: context.provider,
      endpoint: context.endpoint,
      findings: sanitizedFindings,
      canonicalFields: context.canonicalFields
    };

    const prompt = `You are a deterministic contract repair engine. Given an upstream API drift incident for provider '${context.provider}', synthesize an adapter rule mapping changed provider fields back to canonical entity fields.
Allowed ops: 'rename', 'coalesce'.
Do not output executable code. Output JSON adhering to the specified schema only.
Payload: ${JSON.stringify(minimalPayload)}`;

    return { prompt, minimalPayload };
  }

  public async generateProposal(context: RepairModelContext): Promise<RepairModelResult> {
    if (!this.isConfigured()) {
      const err = new Error('Live model credentials or endpoint not configured.');
      (err as any).statusCode = 503;
      (err as any).code = 'MODEL_NOT_CONFIGURED';
      throw err;
    }

    const { prompt } = this.formatPrompt(context);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const err = new Error(`Live model provider returned HTTP ${res.status}: ${errorText}`);
        (err as any).statusCode = 502;
        (err as any).code = 'MODEL_PROVIDER_ERROR';
        throw err;
      }

      const rawJson = await res.json();
      // Handle response directly or unwrapped from { choices: [...] } or { content: ... }
      const content = rawJson.output || rawJson.choices?.[0]?.message?.content || rawJson;
      let parsedCandidate = content;
      if (typeof content === 'string') {
        try {
          parsedCandidate = JSON.parse(content);
        } catch (_parseErr) {
          const err = new Error('Model produced unparseable non-JSON output.');
          (err as any).statusCode = 422;
          (err as any).code = 'INVALID_MODEL_OUTPUT';
          throw err;
        }
      }

      const validated = ModelRepairOutputSchema.safeParse(parsedCandidate);
      if (!validated.success) {
        const err = new Error('Model produced malformed or invalid proposal structure.');
        (err as any).statusCode = 422;
        (err as any).code = 'INVALID_MODEL_OUTPUT';
        (err as any).details = validated.error.format();
        throw err;
      }

      const { rules, confidence, recommendation, uncertainties = [], requiredChecks = [] } = validated.data;

      // Construct diff for the proposed rules
      const ruleSummaries = rules.map(
        r => `+${r.targetField}: raw.${r.sources.join(' ?? raw.')}`
      );
      const diff = `--- Canonical${context.provider.toUpperCase()}Adapter.v1
+++ Canonical${context.provider.toUpperCase()}Adapter.v2 (live model proposal)
@@ -1,1 +1,${ruleSummaries.length} @@
${ruleSummaries.join('\n')}`;

      return {
        rules,
        confidence,
        recommendation,
        diff,
        uncertainties,
        requiredChecks
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Live model request timed out after ${this.timeoutMs}ms.`);
        (timeoutErr as any).statusCode = 504;
        (timeoutErr as any).code = 'MODEL_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
