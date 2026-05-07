const readEnv = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
};

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const normalizePrefix = (value, fallback) => {
  const raw = readEnv(value) || fallback;
  if (!raw.startsWith("/")) return `/${raw}`;
  return raw;
};

const normalizePath = (path) => {
  if (!path) return "/";
  if (path.startsWith("/")) return path;
  return `/${path}`;
};

const API_URL = readEnv(process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";
const API_PREFIX = normalizePrefix(process.env.NEXT_PUBLIC_API_PREFIX, "/api");
const BASE_URL = `${stripTrailingSlash(API_URL)}${API_PREFIX}`;
const API_ORIGIN = stripTrailingSlash(API_URL);
const AUTH_ROUTES_WITH_EXPECTED_401 = new Set(["/auth/login", "/auth/register"]);

let authToken = null;

export function setToken(token) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('ivb_token', token);
    } else {
      localStorage.removeItem('ivb_token');
    }
  }
}

export function getToken() {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ivb_token');
    if (stored) {
      authToken = stored;
      return stored;
    }
  }
  return null;
}

export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ivb_token');
  }
}

export function toApiAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${normalizePath(path)}`;
}

const extractErrorMessage = (payload, fallback) => {
  const message =
    payload?.message ||
    payload?.error?.message ||
    payload?.error ||
    fallback;

  return typeof message === "string" && message.trim() ? message.trim() : fallback;
};

async function request(path, options = {}) {
  const normalizedPath = normalizePath(path);
  const url = `${BASE_URL}${normalizedPath}`;
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError) {
    const error = new Error("Unable to connect to the server. Please try again.");
    error.status = 0;
    error.path = normalizedPath;
    error.data = null;
    error.cause = networkError;
    throw error;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: res.statusText || "Request failed" };
  }

  if (!res.ok) {
    const message = extractErrorMessage(data, res.statusText || "Request failed");
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    error.path = normalizedPath;
    error.messageFromApi = message;

    const shouldHandleUnauthorized =
      res.status === 401 &&
      Boolean(token) &&
      !AUTH_ROUTES_WITH_EXPECTED_401.has(normalizedPath);

    if (shouldHandleUnauthorized) {
      clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw error;
  }

  return data;
}

export const api = {
  get: (path, options = {}) =>
    request(path, { method: 'GET', ...options }),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  patch: (path, body, options = {}) =>
    request(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  delete: (path, options = {}) =>
    request(path, { method: 'DELETE', ...options }),
};
