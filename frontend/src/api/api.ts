// Safe resolve API base without assuming `process` exists in the browser
const API_BASE: string = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
const API_PREFIX = `${API_BASE.replace(/\/$/, "")}`;

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function login(registrationNumber: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_number: registrationNumber, password }),
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
export async function getAnalytics(days: number, token?: string, activityLimit?: number) {
  const params = new URLSearchParams({ days: String(days) });
  if (activityLimit) params.append('activity_limit', String(activityLimit));
  const url = `${API_BASE}/admin/analytics?${params.toString()}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}
// -------------------------------------------------

// ----------------- NEW API FUNCTIONS FOR Busbar -----------------
export async function queryBusbar(payload: Record<string, any>) {
  const url = `${API_BASE}/queryBusbar`;
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
  const url = `${API_PREFIX}/getImage?path=${encodeURIComponent(path)}`;
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
  return `${API_PREFIX}/getFile?path=${encodeURIComponent(filePath)}`;
}

export async function getFileBlobByPath(path: string) {
  const url = `${API_PREFIX}/getFile?path=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, status: res.status, blob: null };
    const blob = await res.blob();
    return { ok: true, status: res.status, blob };
  } catch {
    return { ok: false, status: 0, blob: null };
  }
}

export async function getComponent(componentId: string, nbphase?: number) {
  const params = new URLSearchParams({ component_id: componentId });
  if (typeof nbphase === 'number') params.append('nbphase', String(nbphase));
  const url = `${API_PREFIX}/getComponents?${params.toString()}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function updateComponentData(payload: Record<string, any>) {
  const url = `${API_PREFIX}/updateComponent`;
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

export async function uploadProductImages(formData: FormData) {
  const url = `${API_PREFIX}/uploadImages`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function uploadProductFiles(formData: FormData) {
  const url = `${API_PREFIX}/uploadFiles`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function deleteImageByPath(image_path: string) {
  const url = `${API_PREFIX}/deleteImage`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_path }),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function deleteFileByPath(file_path: string) {
  const url = `${API_PREFIX}/deleteFile`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path }),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function deleteComponent(payload: { component_id: string; nbphase: number }) {
  const url = `${API_PREFIX}/deleteComponent`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

export async function createComponent(payload: Record<string, any>) {
  const url = `${API_PREFIX}/createComponent`;
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
  const url = `${API_BASE}/users`;
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
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
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
  const url = `${API_BASE}/users`;
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
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
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
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}`;
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
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}/increment_search`;
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

export async function getDailySearchLimit(userId: string, token?: string) {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}/daily_search_limit`;
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

export async function decrementDailySearchLimit(userId: string, token?: string) {
  const url = `${API_BASE}/users/${encodeURIComponent(userId)}/decrement_search_limit`;
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

// ----------------- ADMIN LOGS API -----------------
export async function listSearchLogs(limit = 100, offset = 0, token?: string) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const url = `${API_BASE}/admin/search-logs?${params.toString()}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export async function getUserSearchLogs(userId: string, days = 30, token?: string) {
  const params = new URLSearchParams({ days: String(days) });
  const url = `${API_BASE}/admin/search-logs/${encodeURIComponent(userId)}?${params.toString()}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}
// -------------------------------------------------

export async function getAllUsers(token?: string) {
  const res = await listUsers(token);
  return res.ok
    ? { data: res.data, error: null }
    : { data: null, error: new Error(res.data?.detail || 'Failed to fetch users') };
}

export async function updateUserAdmin(userId: string, payload: Record<string, any>, token?: string) {
  const res = await updateUser(userId, payload, token);
  return res.ok
    ? { data: res.data, error: null }
    : { data: null, error: new Error(res.data?.detail || 'Failed to update user') };
}

export async function deleteUserProfile(userId: string, token?: string) {
  const res = await deleteUser(userId, token);
  return res.ok
    ? { data: res.data, error: null }
    : { data: null, error: new Error(res.data?.detail || 'Failed to delete user') };
}


export default {
  login,
  register,
  me,
  getAnalytics,
  queryBusbar,
  getImageBlobByPath,
  getFileLink,
  getFileBlobByPath,
  getComponent,
  updateComponentData,
  uploadProductImages,
  uploadProductFiles,
  deleteImageByPath,
  deleteFileByPath,
  deleteComponent,
  createComponent,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  incrementUserSearch,
  getDailySearchLimit,
  decrementDailySearchLimit,
  listSearchLogs,
  getUserSearchLogs,
  getAllUsers,
  updateUserAdmin,
  deleteUserProfile,
  API_BASE
};
