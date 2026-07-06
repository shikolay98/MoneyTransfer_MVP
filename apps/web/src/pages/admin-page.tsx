import { useEffect, useRef, useState } from 'react';

import {
  adminDeleteFaq,
  adminFetchChats,
  adminFetchContent,
  adminFetchFaq,
  adminFetchRates,
  adminFetchRequests,
  adminFetchUsers,
  adminFetchThreadMessages,
  adminSendMessage,
  adminUpdateContent,
  adminUpdateFaq,
  adminUpdateRate,
  adminUpdateRequestStatus,
  adminCreateFaq,
  type AdminChatThread,
  type AdminContentSection,
  type AdminFaqItem,
  type AdminRate,
  type AdminRequest,
  type AdminUser,
  type ChatMessage,
} from '../lib/api';
import { connectSocket } from '../lib/socket';
import { useToast } from '../lib/toast-context';

type Tab = 'rates' | 'content' | 'faq' | 'requests' | 'users' | 'chats';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

// ── Rates Panel ───────────────────────────────────────────────────────────────
const RatesPanel = () => {
  const { addToast } = useToast();
  const [rates, setRates] = useState<AdminRate[]>([]);
  const [editing, setEditing] = useState<Record<string, { rate: string; feePercent: string; note: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetchRates()
      .then(setRates)
      .catch(() => addToast('Не удалось загрузить курсы', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  const startEdit = (r: AdminRate) => {
    setEditing((prev) => ({
      ...prev,
      [r.id]: { rate: r.rate, feePercent: r.feePercent ?? '', note: r.note ?? '' },
    }));
  };

  const saveRate = async (id: string) => {
    const e = editing[id];
    if (!e) return;
    try {
      const updated = await adminUpdateRate(id, {
        rate: parseFloat(e.rate),
        feePercent: e.feePercent ? parseFloat(e.feePercent) : undefined,
        note: e.note || undefined,
      });
      setRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      addToast('Курс обновлён', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка', 'error');
    }
  };

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold text-ink">Курсы валют</h2>
      {rates.map((r) => {
        const e = editing[r.id];
        return (
          <div key={r.id} className="rounded-[20px] border border-line bg-[#f9fbfa] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-ink text-lg">{r.pair}</div>
                {r.updatedBy && (
                  <div className="text-xs text-muted mt-0.5">Обновлено: {r.updatedBy}</div>
                )}
              </div>
              {!e ? (
                <button
                  className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                  onClick={() => startEdit(r)}
                  type="button"
                >
                  Редактировать
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white"
                    onClick={() => void saveRate(r.id)}
                    type="button"
                  >
                    Сохранить
                  </button>
                  <button
                    className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted"
                    onClick={() => setEditing((prev) => { const n = { ...prev }; delete n[r.id]; return n; })}
                    type="button"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>

            {!e ? (
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted">Курс</div>
                  <div className="font-semibold text-ink mt-0.5">{r.rate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Комиссия %</div>
                  <div className="font-semibold text-ink mt-0.5">{r.feePercent ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Заметка</div>
                  <div className="font-semibold text-ink mt-0.5">{r.note || '—'}</div>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(['rate', 'feePercent', 'note'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs text-muted">
                      {field === 'rate' ? 'Курс' : field === 'feePercent' ? 'Комиссия %' : 'Заметка'}
                    </label>
                    <input
                      className="mt-1 w-full rounded-[14px] border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
                      onChange={(ev) => setEditing((prev) => ({ ...prev, [r.id]: { ...prev[r.id]!, [field]: ev.target.value } }))}
                      type={field === 'note' ? 'text' : 'number'}
                      step={field === 'note' ? undefined : '0.000001'}
                      value={e[field]}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Content Panel ─────────────────────────────────────────────────────────────
const ContentPanel = () => {
  const { addToast } = useToast();
  const [sections, setSections] = useState<AdminContentSection[]>([]);
  const [editing, setEditing] = useState<Record<string, Partial<AdminContentSection>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetchContent()
      .then(setSections)
      .catch(() => addToast('Не удалось загрузить контент', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  const save = async (id: string) => {
    const e = editing[id];
    if (!e) return;
    try {
      const updated = await adminUpdateContent(id, e);
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      addToast('Контент сохранён', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка', 'error');
    }
  };

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  const grouped = sections.reduce<Record<string, AdminContentSection[]>>((acc, s) => {
    (acc[s.page] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold text-ink">Контент страниц</h2>
      {Object.entries(grouped).map(([page, items]) => (
        <div key={page}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">{page}</div>
          <div className="grid gap-3">
            {items.map((s) => {
              const e = editing[s.id];
              return (
                <div key={s.id} className="rounded-[20px] border border-line bg-[#f9fbfa] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-sm font-semibold text-ink">{s.key}</div>
                    {!e ? (
                      <button
                        className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                        onClick={() => setEditing((prev) => ({ ...prev, [s.id]: { title: s.title ?? '', subtitle: s.subtitle ?? '', body: s.body ?? '' } }))}
                        type="button"
                      >
                        Редактировать
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white" onClick={() => void save(s.id)} type="button">Сохранить</button>
                        <button className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted" onClick={() => setEditing((prev) => { const n = { ...prev }; delete n[s.id]; return n; })} type="button">Отмена</button>
                      </div>
                    )}
                  </div>

                  {!e ? (
                    <div className="mt-3 grid gap-1.5 text-sm text-muted">
                      {s.title && <div><span className="font-medium text-ink">Заголовок:</span> {s.title}</div>}
                      {s.subtitle && <div><span className="font-medium text-ink">Подзаголовок:</span> {s.subtitle}</div>}
                      {s.body && <div className="line-clamp-2"><span className="font-medium text-ink">Текст:</span> {s.body}</div>}
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      {(['title', 'subtitle', 'body'] as const).map((field) => (
                        <div key={field}>
                          <label className="text-xs text-muted">{field === 'title' ? 'Заголовок' : field === 'subtitle' ? 'Подзаголовок' : 'Текст'}</label>
                          {field === 'body' ? (
                            <textarea
                              className="mt-1 w-full rounded-[14px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                              onChange={(ev) => setEditing((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [field]: ev.target.value } }))}
                              rows={4}
                              value={e[field] ?? ''}
                            />
                          ) : (
                            <input
                              className="mt-1 w-full rounded-[14px] border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
                              onChange={(ev) => setEditing((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [field]: ev.target.value } }))}
                              value={e[field] ?? ''}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── FAQ Panel ─────────────────────────────────────────────────────────────────
const FaqPanel = () => {
  const { addToast } = useToast();
  const [items, setItems] = useState<AdminFaqItem[]>([]);
  const [editing, setEditing] = useState<Record<string, Partial<AdminFaqItem>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ question: '', answer: '' });

  useEffect(() => {
    adminFetchFaq()
      .then(setItems)
      .catch(() => addToast('Не удалось загрузить FAQ', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  const save = async (id: string) => {
    const e = editing[id];
    if (!e) return;
    try {
      const updated = await adminUpdateFaq(id, e);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      addToast('FAQ сохранён', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка', 'error');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await adminDeleteFaq(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      addToast('Вопрос удалён', 'success');
    } catch {
      addToast('Ошибка удаления', 'error');
    }
  };

  const createItem = async () => {
    if (!newItem.question || !newItem.answer) return;
    try {
      const created = await adminCreateFaq({ ...newItem, sortOrder: items.length + 1, isPublished: true });
      setItems((prev) => [...prev, created]);
      setNewItem({ question: '', answer: '' });
      setIsCreating(false);
      addToast('Вопрос добавлен', 'success');
    } catch {
      addToast('Ошибка создания', 'error');
    }
  };

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">Частые вопросы</h2>
        <button className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white" onClick={() => setIsCreating(true)} type="button">+ Добавить вопрос</button>
      </div>

      {isCreating && (
        <div className="rounded-[20px] border-2 border-brand/20 bg-[#f0f7f4] p-5">
          <div className="grid gap-3">
            <input className="w-full rounded-[14px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="Вопрос" value={newItem.question} onChange={(e) => setNewItem((p) => ({ ...p, question: e.target.value }))} />
            <textarea className="w-full rounded-[14px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="Ответ" rows={3} value={newItem.answer} onChange={(e) => setNewItem((p) => ({ ...p, answer: e.target.value }))} />
            <div className="flex gap-2">
              <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white" onClick={() => void createItem()} type="button">Сохранить</button>
              <button className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted" onClick={() => setIsCreating(false)} type="button">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {items.map((item) => {
        const e = editing[item.id];
        return (
          <div key={item.id} className="rounded-[20px] border border-line bg-[#f9fbfa] p-5">
            <div className="flex items-start justify-between gap-4">
              {!e ? (
                <div className="text-sm font-semibold text-ink">{item.question}</div>
              ) : null}
              <div className="flex gap-2 shrink-0">
                {!e ? (
                  <>
                    <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-brand hover:text-brand" onClick={() => setEditing((prev) => ({ ...prev, [item.id]: { question: item.question, answer: item.answer } }))} type="button">Изменить</button>
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50" onClick={() => void deleteItem(item.id)} type="button">Удалить</button>
                  </>
                ) : (
                  <>
                    <button className="rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white" onClick={() => void save(item.id)} type="button">Сохранить</button>
                    <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted" onClick={() => setEditing((prev) => { const n = { ...prev }; delete n[item.id]; return n; })} type="button">Отмена</button>
                  </>
                )}
              </div>
            </div>

            {!e ? (
              <p className="mt-2 text-sm text-muted">{item.answer}</p>
            ) : (
              <div className="grid gap-3 mt-2">
                <input className="w-full rounded-[14px] border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand" value={e.question ?? ''} onChange={(ev) => setEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], question: ev.target.value } }))} />
                <textarea className="w-full rounded-[14px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" rows={3} value={e.answer ?? ''} onChange={(ev) => setEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], answer: ev.target.value } }))} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Requests Panel ────────────────────────────────────────────────────────────
const RequestsPanel = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetchRequests()
      .then(setRequests)
      .catch(() => addToast('Не удалось загрузить заявки', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminUpdateRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      addToast('Статус обновлён', 'success');
    } catch {
      addToast('Ошибка', 'error');
    }
  };

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold text-ink">Заявки ({requests.length})</h2>
      {requests.length === 0 && <div className="text-sm text-muted">Нет заявок</div>}
      {requests.map((r) => (
        <div key={r.id} className="rounded-[20px] border border-line bg-[#f9fbfa] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">
                  {r.sendCurrency} → {r.receiveCurrency}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted">
                {r.amount} | {r.senderBank} → {r.receiverBank}
              </div>
              <div className="text-xs text-muted mt-0.5">
                Контакт: {r.contact}
                {r.user && ` | Пользователь: ${r.user.firstName ?? r.user.telegramUsername ?? r.user.id}`}
              </div>
              <div className="text-xs text-muted">{new Date(r.createdAt).toLocaleString('ru')}</div>
            </div>
            <select
              className="rounded-[14px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none"
              onChange={(e) => void updateStatus(r.id, e.target.value)}
              value={r.status}
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Users Panel ───────────────────────────────────────────────────────────────
const UsersPanel = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetchUsers()
      .then(setUsers)
      .catch(() => addToast('Не удалось загрузить пользователей', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold text-ink">Пользователи ({users.length})</h2>
      {users.map((u) => (
        <div key={u.id} className="rounded-[20px] border border-line bg-[#f9fbfa] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-ink">
                {u.firstName ?? '—'}{u.lastName ? ` ${u.lastName}` : ''}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
              </div>
              <div className="mt-1 text-sm text-muted">
                {u.email ?? (u.telegramUsername ? `@${u.telegramUsername}` : '—')}
              </div>
              <div className="mt-1 text-xs text-muted">
                Заявок: {u._count.exchangeRequests} | Чатов: {u._count.chatThreads} | Зарегистрирован: {new Date(u.createdAt).toLocaleDateString('ru')}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Chats Panel ───────────────────────────────────────────────────────────────
const ChatsPanel = () => {
  const { addToast } = useToast();
  const [threads, setThreads] = useState<AdminChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminFetchChats()
      .then(setThreads)
      .catch(() => addToast('Не удалось загрузить чаты', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    if (!selectedId) return;

    adminFetchThreadMessages(selectedId)
      .then(setMessages)
      .catch(() => addToast('Не удалось загрузить сообщения', 'error'));

    const socket = connectSocket();
    socket.emit('join_thread', selectedId);

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_thread', selectedId);
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedId, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!selectedId || !input.trim()) return;
    setIsSending(true);
    try {
      await adminSendMessage(selectedId, input.trim());
      setInput('');
    } catch {
      addToast('Ошибка отправки', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="text-muted text-sm">Загрузка...</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div>
        <h2 className="mb-3 text-xl font-semibold text-ink">Чаты ({threads.length})</h2>
        <div className="grid gap-2">
          {threads.length === 0 && <div className="text-sm text-muted">Нет чатов</div>}
          {threads.map((t) => (
            <button
              key={t.id}
              className={`rounded-[16px] border p-3 text-left transition ${selectedId === t.id ? 'border-brand bg-brand/5' : 'border-line bg-[#f9fbfa] hover:border-brand/40'}`}
              onClick={() => setSelectedId(t.id)}
              type="button"
            >
              <div className="text-sm font-semibold text-ink">
                {t.user.firstName ?? t.user.telegramUsername ?? 'Пользователь'}
              </div>
              <div className="mt-0.5 text-xs text-muted line-clamp-1">{t.subject ?? '—'}</div>
              {t.lastMessage && <div className="mt-1 text-xs text-muted/70 line-clamp-1">{t.lastMessage}</div>}
            </button>
          ))}
        </div>
      </div>

      {selectedId ? (
        <div className="flex h-[520px] flex-col rounded-[20px] border border-line bg-[#f9fbfa]">
          <div className="border-b border-line/70 px-4 py-3">
            <div className="text-sm font-semibold text-ink">
              {threads.find((t) => t.id === selectedId)?.subject ?? 'Чат'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-[16px] px-4 py-2.5 text-sm ${m.senderRole === 'ADMIN' ? 'bg-brand text-white' : 'bg-white border border-line text-ink'}`}>
                  {m.senderRole !== 'ADMIN' && (
                    <div className="text-xs font-semibold mb-1 opacity-70">
                      {m.sender?.firstName ?? 'Пользователь'}
                    </div>
                  )}
                  {m.body}
                  <div className={`text-xs mt-1 opacity-60`}>{new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line/70 p-3">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-[14px] border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-brand"
                disabled={isSending}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Сообщение..."
                value={input}
              />
              <button
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isSending || !input.trim()}
                onClick={() => void send()}
                type="button"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-[20px] border border-line bg-[#f9fbfa] text-sm text-muted">
          Выберите чат слева
        </div>
      )}
    </div>
  );
};

// ── Main Admin Page ───────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'rates', label: 'Курсы' },
  { id: 'content', label: 'Контент' },
  { id: 'faq', label: 'FAQ' },
  { id: 'requests', label: 'Заявки' },
  { id: 'users', label: 'Пользователи' },
  { id: 'chats', label: 'Чаты' },
];

export const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('rates');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-brand text-white' : 'border border-line bg-white text-ink hover:border-brand hover:text-brand'}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rates' && <RatesPanel />}
      {tab === 'content' && <ContentPanel />}
      {tab === 'faq' && <FaqPanel />}
      {tab === 'requests' && <RequestsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'chats' && <ChatsPanel />}
    </div>
  );
};
