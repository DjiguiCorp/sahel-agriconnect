/** Admin JWT + localStorage session helpers */

export function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAdminTokenExpired(token) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

export function clearAdminSession() {
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('adminToken');
}

export function getAdminToken() {
  const token = localStorage.getItem('adminToken');
  if (!token || isAdminTokenExpired(token)) {
    clearAdminSession();
    return null;
  }
  return token;
}

export function authHeaders() {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Redirect to login when API returns expired/invalid admin token */
export function handleAdminApiUnauthorized(res, json = {}) {
  const msg = String(json?.error || '').toLowerCase();
  if (
    res?.status === 401 &&
    (msg.includes('expiré') || msg.includes('expired') || msg.includes('invalid') || msg.includes('invalide'))
  ) {
    clearAdminSession();
    const returnPath = `${window.location.pathname}${window.location.search}`;
    const q = new URLSearchParams({ return: returnPath, expired: '1' });
    window.location.href = `/admin/login?${q.toString()}`;
    return true;
  }
  return false;
}
