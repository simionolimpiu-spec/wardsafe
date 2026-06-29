import { describe, expect, it } from 'vitest';
import { buildApiUrl, resolveApiBaseUrl } from './apiBaseUrl.js';

describe('apiBaseUrl', () => {
  it('uses the configured public SafeFlow API base URL when provided', () => {
    expect(resolveApiBaseUrl({
      env: {
        VITE_SAFEFLOW_API_BASE_URL: 'https://preview-api.example.com/'
      }
    })).toBe('https://preview-api.example.com');

    expect(buildApiUrl('/api/simulation/workspace', {
      env: {
        VITE_SAFEFLOW_API_BASE_URL: 'https://preview-api.example.com/'
      }
    })).toBe('https://preview-api.example.com/api/simulation/workspace');
  });

  it('falls back to relative /api routes for local dev and same-origin preview when no public URL is configured', () => {
    expect(resolveApiBaseUrl({ env: {} })).toBe('');
    expect(buildApiUrl('/api/drafts/sbar', { env: {} })).toBe('/api/drafts/sbar');
  });

  it('does not read OPENAI_API_KEY from frontend env', () => {
    expect(resolveApiBaseUrl({
      env: {
        OPENAI_API_KEY: 'sk-secret',
        VITE_OPENAI_API_KEY: 'sk-publicly-wrong'
      }
    })).toBe('');
  });
});
