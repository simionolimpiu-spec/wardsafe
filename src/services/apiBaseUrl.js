const FRONTEND_API_BASE_URL = 'VITE_SAFEFLOW_API_BASE_URL';

export function resolveApiBaseUrl({ env = import.meta.env ?? {} } = {}) {
  const configuredBaseUrl = typeof env?.[FRONTEND_API_BASE_URL] === 'string'
    ? env[FRONTEND_API_BASE_URL].trim()
    : '';

  if (!configuredBaseUrl) {
    return '';
  }

  return configuredBaseUrl.replace(/\/+$/, '');
}

export function buildApiUrl(path, { env = import.meta.env ?? {} } = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl({ env });

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
