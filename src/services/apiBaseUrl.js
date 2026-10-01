const FRONTEND_API_BASE_URL = 'VITE_SAFEFLOW_API_BASE_URL';
const FRONTEND_PREVIEW_ACCESS_TOKEN = 'VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN';
export const PREVIEW_ACCESS_TOKEN_HEADER = 'X-SafeFlow-Preview-Token';

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

export function createApiHeaders(headers = {}, { env = import.meta.env ?? {} } = {}) {
  const previewAccessToken = typeof env?.[FRONTEND_PREVIEW_ACCESS_TOKEN] === 'string'
    ? env[FRONTEND_PREVIEW_ACCESS_TOKEN].trim()
    : '';

  return previewAccessToken
    ? { ...headers, [PREVIEW_ACCESS_TOKEN_HEADER]: previewAccessToken }
    : { ...headers };
}
