export interface Bot {
  id: string;
  name: string;
  business_description: string | null;
  tone: string;
  fallback_message: string;
  ai_provider: string;
  ai_model: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  bot_id: string;
  name: string;
  price: number | null;
  currency: string;
  stock: number;
  description: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
  });

  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('ورود لازم است');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'خطای ناشناخته');
  return data as T;
}

export const api = {
  login: (password: string) => request<{ ok: true }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  meta: () => request<{ providers: string[] }>('/meta'),

  listBots: () => request<Bot[]>('/bots'),
  getBot: (id: string) => request<Bot>(`/bots/${id}`),
  createBot: (payload: Record<string, unknown>) =>
    request<{ bot: Bot; telegram_username?: string }>('/bots', { method: 'POST', body: JSON.stringify(payload) }),
  updateBot: (id: string, payload: Record<string, unknown>) =>
    request<Bot>(`/bots/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBot: (id: string) => request<{ ok: true }>(`/bots/${id}`, { method: 'DELETE' }),

  listProducts: (botId: string) => request<Product[]>(`/bots/${botId}/products`),
  upsertProduct: (botId: string, payload: Partial<Product>) =>
    request<Product>(`/bots/${botId}/products`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteProduct: (botId: string, productId: string) =>
    request<{ ok: true }>(`/bots/${botId}/products/${productId}`, { method: 'DELETE' }),

  testBot: (botId: string, message: string) =>
    request<{ reply: string }>(`/bots/${botId}/test`, { method: 'POST', body: JSON.stringify({ message }) }),

  conversations: (botId: string) =>
    request<{ telegram_chat_id: string; role: string; content: string; created_at: string }[]>(
      `/bots/${botId}/conversations`
    ),
};
