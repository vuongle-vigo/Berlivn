// Safe resolve API base without assuming `process` exists in the browser
const API_BASE: string = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export async function register(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export async function me(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

// ----------------- new function -----------------
export async function getAnalytics(days: number, token?: string) {
  const url = `${API_BASE}/admin/analytics?days=${encodeURIComponent(String(days))}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}
// -------------------------------------------------

// ----------------- NEW API FUNCTIONS FOR Busbar -----------------
export async function queryBusbar(payload: Record<string, any>) {
  const url = `${API_BASE}/api/queryBusbar`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

/**
 * Fetch image blob from backend getImage endpoint for a given relative path.
 * Returns { ok, status, blob } where blob is a Blob when ok===true.
 */
export async function getImageBlobByPath(path: string) {
  const url = `${API_BASE}/api/getImage?path=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, status: res.status, blob: null };
    const blob = await res.blob();
    return { ok: true, status: res.status, blob };
  } catch (err) {
    return { ok: false, status: 0, blob: null };
  }
}

/**
 * Build direct download URL for getFile endpoint.
 */
export function getFileLink(filePath: string) {
  return `${API_BASE}/api/getFile?path=${encodeURIComponent(filePath)}`;
}

// ----------------- NEW: calcExcel -----------------
export async function calcExcel(payload: {
  W: number;
  T: number;
  B: number;
  Angle: number;
  a: number;
  Icc: number;
  Force: number;
  NbrePhase: number;
}) {
  const url = `${API_BASE}/api/calcExcel`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}
// -------------------------------------------------

// ----------------- USER CRUD API -----------------
export async function listUsers(token?: string) {
  const url = `${API_BASE}/api/users`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'GET', headers });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function getUser(userId: string, token?: string) {
  const url = `${API_BASE}/api/users/${encodeURIComponent(userId)}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'GET', headers });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function createUser(payload: Record<string, any>, token?: string) {
  const url = `${API_BASE}/api/users`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function updateUser(userId: string, payload: Record<string, any>, token?: string) {
  const url = `${API_BASE}/api/users/${encodeURIComponent(userId)}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function deleteUser(userId: string, token?: string) {
  const url = `${API_BASE}/api/users/${encodeURIComponent(userId)}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'DELETE', headers });
    // backend may return empty body for 204 - safeJson will return {}
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function incrementUserSearch(userId: string, token?: string) {
  const url = `${API_BASE}/api/users/${encodeURIComponent(userId)}/increment_search`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: 'POST', headers });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}
// -------------------------------------------------

export default { login, register, me, getAnalytics, queryBusbar, getImageBlobByPath, getFileLink, calcExcel, listUsers, getUser, createUser, updateUser, deleteUser, incrementUserSearch, API_BASE };
