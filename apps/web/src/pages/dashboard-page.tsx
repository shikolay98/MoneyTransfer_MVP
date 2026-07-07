import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createChatThread,
  fetchMyChats,
  fetchMyRequests,
  type ChatThread,
  type ExchangeRequestItem,
} from '../lib/api';
import { useAuth } from '../lib/auth-context';
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
  const { user } = useAuth();
  const { addToast } = useToast();
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
        <div className="mb-4 flex items-center justify-between">
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
            {requests.map((r) => (
              <div key={r.id} className="rounded-[20px] border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-4">
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
                    <Link
                      className="shrink-0 rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition"
                      to={`/dashboard/chat/${r.chatThreadId}`}
                    >
                      Чат
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Profile + Chats */}
      <div className="grid gap-4 content-start">
        {/* Profile */}
        <div className="rounded-[20px] border border-line bg-white p-6">
          <h3 className="text-base font-semibold text-ink mb-3">Профиль</h3>
          {user?.photoUrl && (
            <img
              alt={`Фото профиля ${user.firstName ?? ''}`.trim()}
              className="mb-3 h-12 w-12 rounded-full"
              src={user.photoUrl}
            />
          )}
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
                <Link
                  key={ch.id}
                  className="block rounded-[16px] border border-line p-3 hover:border-brand transition"
                  to={`/dashboard/chat/${ch.id}`}
                >
                  <div className="text-sm font-semibold text-ink">{ch.subject ?? 'Общий вопрос'}</div>
                  {ch.lastMessage && (
                    <div className="mt-1 text-xs text-muted line-clamp-1">{ch.lastMessage}</div>
                  )}
                </Link>
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
  );
};
