import type { PublicBootstrap } from '../types/public';

// Empty VITE_API_URL means same-origin deployment (nginx proxies /api).
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  // Only send a JSON content-type when there is actually a body — Fastify
  // rejects an empty body with content-type: application/json (400), which
  // otherwise breaks bodyless POSTs like logout.
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (init?.body !== undefined && init?.body !== null) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(err.message ?? err.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
};

// ── Public ──────────────────────────────────────────────────────────────────
export const fetchPublicBootstrap = () =>
  request<PublicBootstrap>('/api/public/bootstrap');

// ── Auth ────────────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  role: 'USER' | 'ADMIN';
  firstName: string | null;
  lastName?: string | null;
  email?: string | null;
  telegramUsername?: string | null;
  photoUrl?: string | null;
};

export const fetchMe = () => request<AuthUser | null>('/api/auth/me');

export const adminLogin = (email: string, password: string) =>
  request<AuthUser>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const telegramLogin = (data: Record<string, unknown>) =>
  request<AuthUser>('/api/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const logout = () =>
  request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });

// ── Exchange Requests ────────────────────────────────────────────────────────
export type ExchangeRequestPayload = {
  sendCurrencyId: string;
  receiveCurrencyId: string;
  senderBankId: string;
  receiverBankId: string;
  amount: number;
  contact: string;
  notes?: string;
};

export type ExchangeRequestItem = {
  id: string;
  status: string;
  sendCurrency: string;
  receiveCurrency: string;
  senderBank: string;
  receiverBank: string;
  amount: string;
  contact: string;
  chatThreadId: string | null;
  createdAt: string;
};

export const createExchangeRequest = (data: ExchangeRequestPayload) =>
  request<ExchangeRequestItem>('/api/exchange-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchMyRequests = () =>
  request<ExchangeRequestItem[]>('/api/exchange-requests/my');

// ── Chat ─────────────────────────────────────────────────────────────────────
export type ChatThread = {
  id: string;
  subject: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  exchangeRequest: { id: string; status: string } | null;
};

export type Attachment = {
  token: string;
  name: string;
  mime: string;
  size: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string | null;
  senderRole: 'USER' | 'ADMIN' | 'SYSTEM';
  body: string;
  attachments?: Attachment[] | null;
  status: string;
  createdAt: string;
  sender: { id: string; firstName: string | null; role: string } | null;
};

// Uploads one file and returns its metadata to attach to a message.
export const uploadFile = async (file: File): Promise<Attachment> => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? 'Не удалось загрузить файл');
  }
  return res.json() as Promise<Attachment>;
};

// Fetches an authorized attachment as an object URL (cookies flow via
// credentials, which <img src> would not send cross-origin in dev).
export const fetchAttachmentObjectUrl = async (path: string): Promise<string> => {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Не удалось загрузить вложение');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const fetchMyChats = () =>
  request<ChatThread[]>('/api/chats/my');

export const fetchThreadMessages = (threadId: string) =>
  request<ChatMessage[]>(`/api/chats/${threadId}/messages`);

export const sendMessage = (threadId: string, body: string, attachments: Attachment[] = []) =>
  request<ChatMessage>(`/api/chats/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, attachments }),
  });

export const createChatThread = (subject?: string) =>
  request<ChatThread>('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ subject }),
  });

// ── Admin ─────────────────────────────────────────────────────────────────────
export type AdminRate = {
  id: string;
  pair: string;
  fromCurrency: { id: string; code: string; name: string };
  toCurrency: { id: string; code: string; name: string };
  rate: string;
  feePercent: string | null;
  note: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string | null;
};

export type AdminContentSection = {
  id: string;
  page: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  metadata: unknown;
  isPublished: boolean;
};

export type AdminFaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminUser = {
  id: string;
  role: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramUsername: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { exchangeRequests: number; chatThreads: number };
};

export type AdminRequest = {
  id: string;
  status: string;
  sendCurrency: string;
  receiveCurrency: string;
  senderBank: string;
  receiverBank: string;
  amount: string;
  contact: string;
  notes: string | null;
  user: { id: string; firstName: string | null; telegramUsername: string | null } | null;
  chatThreadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminChatThread = {
  id: string;
  subject: string | null;
  user: { id: string; firstName: string | null; telegramUsername: string | null };
  lastMessage: string | null;
  lastMessageAt: string | null;
  exchangeRequest: { id: string; status: string } | null;
};

export const adminFetchRates = () => request<AdminRate[]>('/api/admin/rates');
export const adminUpdateRate = (id: string, data: { rate: number; feePercent?: number; note?: string; isActive?: boolean }) =>
  request<AdminRate>(`/api/admin/rates/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const adminFetchContent = () => request<AdminContentSection[]>('/api/admin/content');
export const adminUpdateContent = (id: string, data: Partial<AdminContentSection>) =>
  request<AdminContentSection>(`/api/admin/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const adminFetchFaq = () => request<AdminFaqItem[]>('/api/admin/faq');
export const adminUpdateFaq = (id: string, data: Partial<AdminFaqItem>) =>
  request<AdminFaqItem>(`/api/admin/faq/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const adminCreateFaq = (data: Omit<AdminFaqItem, 'id'>) =>
  request<AdminFaqItem>('/api/admin/faq', { method: 'POST', body: JSON.stringify(data) });
export const adminDeleteFaq = (id: string) =>
  request<{ ok: boolean }>(`/api/admin/faq/${id}`, { method: 'DELETE' });

export const adminFetchUsers = () => request<AdminUser[]>('/api/admin/users');

export const adminFetchRequests = (status?: string) =>
  request<AdminRequest[]>(`/api/admin/requests${status ? `?status=${status}` : ''}`);
export const adminUpdateRequestStatus = (id: string, status: string) =>
  request<{ id: string; status: string }>(`/api/admin/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const adminFetchChats = () => request<AdminChatThread[]>('/api/admin/chats');
export const adminFetchThreadMessages = (threadId: string) =>
  request<ChatMessage[]>(`/api/admin/chats/${threadId}/messages`);
export const adminSendMessage = (threadId: string, body: string, attachments: Attachment[] = []) =>
  request<ChatMessage>(`/api/admin/chats/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, attachments }),
  });
