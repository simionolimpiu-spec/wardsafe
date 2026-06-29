export const DEFAULT_ALLOWED_ORIGIN = 'http://127.0.0.1:5173';

export function getAllowedOrigin(env = process.env) {
  const configuredOrigin = typeof env?.SAFEFLOW_ALLOWED_ORIGIN === 'string'
    ? env.SAFEFLOW_ALLOWED_ORIGIN.trim()
    : '';

  if (!configuredOrigin || configuredOrigin === '*') {
    return DEFAULT_ALLOWED_ORIGIN;
  }

  return configuredOrigin.replace(/\/+$/, '');
}

export function isOriginAllowed(origin, env = process.env) {
  if (typeof origin !== 'string' || !origin.trim()) {
    return false;
  }

  return origin.replace(/\/+$/, '') === getAllowedOrigin(env);
}

export function createCorsHeaders(env = process.env) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(env),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
