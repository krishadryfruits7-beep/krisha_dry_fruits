// In dev with `netlify dev`, functions run on port 8888
// In prod, netlify.toml redirects /api/* -> /.netlify/functions/:splat
function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.port === '8888') {
    return '/.netlify/functions';
  }
  return '/api';
}

const BASE = getBaseUrl();

function getAdminSecret(): string {
  return (
    (import.meta.env.VITE_ADMIN_PASSKEY as string) ||
    (import.meta.env.VITE_ADMIN_SECRET as string) ||
    'krisha_admin_2024'
  );
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function adminHeaders(extra?: Record<string, string>) {
  const secret = getAdminSecret();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}`, ...extra };
}

// ── Public ───────────────────────────────────────────────────────────────────

export const api = {
  products: {
    list: () => req<any[]>('/products'),
    get: (id: string) => req<any>(`/products?id=${id}`),
  },
  orders: {
    create: (order: any) =>
      req<any>('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }),
    get: (orderId: string) => req<any>(`/orders?orderId=${orderId}`),
    listByUser: (email: string) => req<{ orders: any[] }>(`/orders?email=${encodeURIComponent(email)}`),
  },
  content: {
    get: () => req<any>('/content'),
    resolveLocation: (input: string) =>
      req<any>('/content?action=resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      }),
  },
  reviews: {
    list: () => req<any[]>('/reviews'),
    create: (review: any) =>
      req<any>('/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) }),
  },
};

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  products: {
    list: () => req<any[]>('/admin-products', { headers: adminHeaders() }),
    create: (data: any) =>
      req<any>('/admin-products', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      req<any>(`/admin-products?id=${id}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(data) }),
    delete: (id: string) =>
      req<any>(`/admin-products?id=${id}`, { method: 'DELETE', headers: adminHeaders() }),
    seed: () =>
      req<any>('/admin-products?action=seed', { method: 'POST', headers: adminHeaders() }),
  },
  content: {
    get: () => req<any>('/admin-content', { headers: adminHeaders() }),
    update: (data: any) =>
      req<any>('/admin-content', { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(data) }),
    reset: () =>
      req<any>('/admin-content?action=reset', { method: 'POST', headers: adminHeaders() }),
    resolveLocation: (input: string) =>
      req<any>('/admin-content?action=resolve-location', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ input }),
      }),
  },
  orders: {
    list: (params?: { status?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      return req<any>(`/admin-orders?${q}`, { headers: adminHeaders() });
    },
    get: (id: string) => req<any>(`/admin-orders?id=${id}`, { headers: adminHeaders() }),
    update: (id: string, data: any) =>
      req<any>(`/admin-orders?id=${id}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(data) }),
    delete: (id: string) =>
      req<any>(`/admin-orders?id=${id}`, { method: 'DELETE', headers: adminHeaders() }),
    stats: () => req<any>('/admin-orders?action=stats', { headers: adminHeaders() }),
  },
  upload: (dataUrl: string) =>
    req<{ url: string; publicId: string }>('/upload', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ data: dataUrl }),
    }),
};