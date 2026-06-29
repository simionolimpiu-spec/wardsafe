import { describe, expect, it } from 'vitest';
import { runApiSmoke } from './apiSmoke.js';

describe('runApiSmoke', () => {
  it('checks health, workspace, readiness, audit and SBAR draft routes without exposing unsafe data', async () => {
    const messages = [];

    const result = await runApiSmoke({
      log(message) {
        messages.push(message);
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      health: 'ok',
      workspace: 'local-fictional-fixture',
      readiness: 'approved',
      riskSupportReport: 'simulation-risk-support-read-only-report',
      audit: 'local-audit-fixture',
      auditRead: 'local-audit-fixture',
      draft: 'deterministic'
    });
    expect(messages).toEqual(expect.arrayContaining([
      expect.stringContaining('/api/health'),
      expect.stringContaining('/api/simulation/workspace'),
      expect.stringContaining('/api/simulation/readiness'),
      expect.stringContaining('/api/simulation/risk-support-report'),
      expect.stringContaining('/api/simulation/audit-events'),
      expect.stringContaining('/api/drafts/sbar')
    ]));
    expect(serialized).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(serialized).not.toMatch(/\bsk-[A-Za-z0-9_-]{8,}/);
    expect(serialized).not.toContain('postgres://');
  });
});
