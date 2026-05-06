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

async function request(path, options = {}) {
  const url = `${BASE_URL}${normalizePath(path)}`;
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

  const res = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: res.statusText };
  }

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    error.data = data;

    if (res.status === 401) {
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
