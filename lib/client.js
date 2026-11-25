'use client';
// Browser-side helpers
import { useCallback, useEffect, useState } from 'react';

/* ---------- Per-tab login ----------
 * The login token lives in sessionStorage, which belongs to ONE browser tab.
 * So you can be a client in one tab, a dietician in another and the admin in a third.
 * Closing the tab logs that tab out.
 */
const TOKEN_KEY = 'nc_token';
export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}
export const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(path, {
    method,
    headers: { ...authHeaders(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status, data });
  return data;
}

/** Downloads (or opens, for PDFs) a protected file using this tab's login. */
export async function openProtectedFile(path, { filename = 'document', open = false } = {}) {
  const res = await fetch(path, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'Could not get the file.');
  }
  const url = URL.createObjectURL(await res.blob());
  if (open) {
    window.open(url, '_blank', 'noopener');
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function useLoad(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!path) return;
    try {
      setError('');
      setData(await api(path));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('');

/**
 * The person logged in in THIS tab: undefined while loading, null for a visitor, else the user.
 * role() gives 'guest' | 'client' | 'provider' | 'admin'.
 */
export function useCurrentUser(deps = []) {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    let alive = true;
    if (!getToken()) { setUser(null); return; }
    api('/api/auth/me').then((d) => alive && setUser(d.user || null)).catch(() => alive && setUser(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return user;
}
export const roleOf = (user) => (user ? user.role : 'guest');
