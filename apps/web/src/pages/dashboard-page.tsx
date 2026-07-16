import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createChatThread,
  deleteAccount,
  deleteExchangeRequest,
  deleteMyChatThread,
  fetchMyChats,
  fetchMyRequests,
  type ChatThread,
  type ExchangeRequestItem,
} from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useConfirm } from '../lib/confirm-context';
import { connectSocket } from '../lib/socket';
import { useToast } from '../lib/toast-context';
import { usePageTitle } from '../lib/use-page-title';

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

const formatAmount = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString('ru') : value;
};

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ExchangeRequestItem[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  usePageTitle('Личный кабинет');

  useEffect(() => {
    Promise.all([fetchMyRequests(), fetchMyChats()])
      .then(([reqs, ch]) => {
        setRequests(reqs);
        setChats(ch);
      })
      .catch(() => addToast('Не удалось загрузить данные', 'error'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  // Live unread: refetch the chat list when the manager sends a new message.
  useEffect(() => {
    const socket = connectSocket();
    const refetch = () => void fetchMyChats().then(setChats).catch(() => undefined);
    // The manager deleted a chat for everyone — drop it from the list and from
    // the matching request card live.
    const onThreadDeleted = (payload: { threadId: string }) => {
      setChats((prev) => prev.filter((c) => c.id !== payload.threadId));
      setRequests((prev) =>
        prev.map((r) => (r.chatThreadId === payload.threadId ? { ...r, chatThreadId: null } : r)),
      );
    };
    socket.on('unread_ping', refetch);
    socket.on('thread_deleted', onThreadDeleted);
    window.addEventListener('focus', refetch);
    return () => {
      socket.off('unread_ping', refetch);
      socket.off('thread_deleted', onThreadDeleted);
      window.removeEventListener('focus', refetch);
    };
  }, []);

  const handleStartChat = async () => {
    setIsStartingChat(true);
    try {
      const thread = await createChatThread();
      void navigate(`/dashboard/chat/${thread.id}`);
    } catch {
      addToast('Не удалось открыть чат', 'error');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleDeleteChat = async (threadId: string) => {
    const ok = await confirm({
      title: 'Удалить чат?',
      message: 'Чат исчезнет из вашего списка. Менеджер сохранит переписку у себя.',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteMyChatThread(threadId);
      setChats((prev) => prev.filter((c) => c.id !== threadId));
      // Drop the "Открыть чат" action from the matching request card too.
      setRequests((prev) =>
        prev.map((r) => (r.chatThreadId === threadId ? { ...r, chatThreadId: null } : r)),
      );
      addToast('Чат удалён', 'success');
    } catch {
      addToast('Не удалось удалить чат', 'error');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    const ok = await confirm({
      title: 'Удалить заявку?',
      message: 'Заявка исчезнет из вашего кабинета вместе с чатом. Отменить это действие нельзя.',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteExchangeRequest(requestId);
      const req = requests.find((r) => r.id === requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      // Its chat (if any) is hidden server-side — mirror that in the list.
      if (req?.chatThreadId) {
        setChats((prev) => prev.filter((c) => c.id !== req.chatThreadId));
      }
      addToast('Заявка удалена', 'success');
    } catch {
      addToast('Не удалось удалить заявку', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Удалить аккаунт?',
      message:
        'Ваш аккаунт и переписка будут удалены без возможности восстановления. Это действие необратимо.',
      confirmText: 'Удалить аккаунт',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAccount();
      await logout();
      addToast('Аккаунт удалён', 'info');
      void navigate('/');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Не удалось удалить аккаунт', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-3 content-start">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
        <div className="grid gap-3 content-start">
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left: Requests */}
      <div>
        <div className="mb-4 flex min-h-[2.5rem] items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Мои заявки ({requests.length})</h2>
          <Link
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90"
            to="/#exchange-form"
          >
            + Новая заявка
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-[20px] border border-line bg-white p-8 text-center text-sm text-muted">
            <div aria-hidden="true" className="text-3xl mb-3">📋</div>
            <div className="font-semibold text-ink mb-1">Заявок ещё нет</div>
            <p>Заполните форму обмена на главной странице, чтобы создать первую заявку.</p>
            <Link
              className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand/90"
              to="/#exchange-form"
            >
              Перейти к форме
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((r) => {
              const cardBody = (
                <div className="flex items-center justify-between gap-4 pr-6">
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
                      {formatAmount(r.amount)} {r.sendCurrency} · {r.senderBank} → {r.receiverBank}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {new Date(r.createdAt).toLocaleString('ru')}
                    </div>
                  </div>
                  {r.chatThreadId && (
                    <span className="shrink-0 rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">
                      Открыть чат
                    </span>
                  )}
                </div>
              );

              return (
                <div key={r.id} className="group relative">
                  {r.chatThreadId ? (
                    <Link
                      className="group block rounded-[20px] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-panel"
                      to={`/dashboard/chat/${r.chatThreadId}`}
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    <div className="rounded-[20px] border border-line bg-white p-5">{cardBody}</div>
                  )}
                  <button
                    aria-label="Удалить заявку"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    onClick={() => void handleDeleteRequest(r.id)}
                    title="Удалить заявку"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Profile + Chats */}
      <div className="content-start">
        <div className="mb-4 flex min-h-[2.5rem] items-center">
          <h2 className="text-xl font-semibold text-ink">Аккаунт</h2>
        </div>
        <div className="grid gap-4">
        {/* Profile */}
        <div className="rounded-[20px] border border-line bg-white p-6">
          <h3 className="text-base font-semibold text-ink mb-3">Профиль</h3>
          <div className="grid gap-1.5 text-sm">
            <div>
              <span className="text-muted">Имя: </span>
              <span className="text-ink font-medium">{user?.firstName ?? '—'}</span>
            </div>
            {user?.telegramUsername && (
              <div>
                <span className="text-muted">Telegram: </span>
                <span className="text-ink font-medium">@{user.telegramUsername}</span>
              </div>
            )}
            {user?.email && (
              <div>
                <span className="text-muted">Email: </span>
                <span className="text-ink font-medium">{user.email}</span>
              </div>
            )}
          </div>
          {user?.role !== 'ADMIN' && (
            <button
              className="mt-4 text-xs font-semibold text-danger transition hover:underline"
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              Удалить аккаунт
            </button>
          )}
        </div>

        {/* Chats */}
        <div className="rounded-[20px] border border-line bg-white p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-ink">Чаты с менеджером</h3>
          </div>

          {chats.length === 0 ? (
            <div className="text-sm text-muted">
              Здесь появится переписка с менеджером по вашим заявкам.
            </div>
          ) : (
            <div className="grid gap-2">
              {chats.map((ch) => (
                <div
                  key={ch.id}
                  className="group relative rounded-[16px] border border-line transition hover:border-brand"
                >
                  <Link className="block p-3 pr-9" to={`/dashboard/chat/${ch.id}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {ch.subject ?? 'Общий вопрос'}
                      </span>
                      {ch.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                          {ch.unreadCount}
                        </span>
                      )}
                    </div>
                    {ch.lastMessage && (
                      <div className="mt-1 text-xs text-muted line-clamp-1">{ch.lastMessage}</div>
                    )}
                  </Link>
                  <button
                    aria-label="Удалить чат"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    onClick={() => void handleDeleteChat(ch.id)}
                    title="Удалить чат у себя"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="mt-3 w-full rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
            disabled={isStartingChat}
            onClick={() => void handleStartChat()}
            type="button"
          >
            {isStartingChat ? 'Открываем чат...' : 'Написать менеджеру'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
