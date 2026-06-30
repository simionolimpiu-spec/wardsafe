import { describe, expect, it } from 'vitest';
import { createCorsHeaders, getAllowedOrigin, isOriginAllowed } from './corsConfig.js';

describe('corsConfig', () => {
  it('defaults to the local Vite origin when no preview origin is configured', () => {
    expect(getAllowedOrigin({})).toBe('http://127.0.0.1:5173');
    expect(isOriginAllowed('http://127.0.0.1:5173', {})).toBe(true);
    expect(isOriginAllowed('https://preview.example.com', {})).toBe(false);
  });

  it('uses the configured preview origin without enabling wildcard CORS', () => {
    const env = { SAFEFLOW_ALLOWED_ORIGIN: 'https://preview.example.com/' };

    expect(getAllowedOrigin(env)).toBe('https://preview.example.com');
    expect(isOriginAllowed('https://preview.example.com', env)).toBe(true);
    expect(isOriginAllowed('https://other.example.com', env)).toBe(false);
    expect(isOriginAllowed('*', env)).toBe(false);
  });

  it('allows the preview token header for browser API calls', () => {
    expect(createCorsHeaders({})['Access-Control-Allow-Headers']).toContain('X-SafeFlow-Preview-Token');
  });
});
