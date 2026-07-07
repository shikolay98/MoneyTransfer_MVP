import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AttachmentView } from '../components/chat/attachment-view';
import { ChatComposer } from '../components/chat/chat-composer';
import { CloseIcon, SupportIcon } from '../components/ui/icons';
import {
  fetchThreadMessages,
  sendMessage,
  type Attachment,
  type ChatMessage,
} from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useToast } from '../lib/toast-context';
import { usePageTitle } from '../lib/use-page-title';
import { appendUnique, useThreadSocket } from '../lib/use-thread-socket';

const formatDayLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Сегодня';
  if (sameDay(date, yesterday)) return 'Вчера';
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
};

export const ChatPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  usePageTitle('Чат с менеджером');

  useEffect(() => {
    if (!threadId) return;
    setIsLoading(true);
    setMessages([]);

    // Guard against out-of-order responses when switching threads quickly.
    let cancelled = false;

    fetchThreadMessages(threadId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch(() => {
        if (!cancelled) addToast('Не удалось загрузить сообщения', 'error');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [threadId, addToast]);

  useThreadSocket(threadId, (msg) => setMessages((prev) => appendUnique(prev, msg)));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (body: string, attachments: Attachment[]) => {
    if (!threadId) return;
    // Show the message immediately even if the socket echo is delayed or lost.
    const sent = await sendMessage(threadId, body, attachments);
    setMessages((prev) => appendUnique(prev, sent));
  };

  let lastDay = '';

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col bg-white sm:my-6 sm:h-[calc(100dvh-3rem)] sm:rounded-3xl sm:border sm:border-line sm:shadow-panel sm:overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
        <Link
          aria-label="Назад в кабинет"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
          to="/dashboard"
        >
          <CloseIcon className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-sky text-white">
          <SupportIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">Менеджер Money Transfer</div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            онлайн · ответ за 2–5 минут
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-[#eef2f9] px-3 py-4 sm:px-5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-white/70 px-5 py-6 text-center text-sm text-muted">
            <div aria-hidden="true" className="mb-2 text-3xl">💬</div>
            Напишите сообщение менеджеру или прикрепите чек об оплате — он ответит
            в ближайшее время.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user?.id;
            const isSystem = m.senderRole === 'SYSTEM';
            const attachments = m.attachments ?? [];
            const created = new Date(m.createdAt);

            const dayLabel = formatDayLabel(created);
            const showDay = dayLabel !== lastDay;
            lastDay = dayLabel;

            const dayDivider = showDay ? (
              <div key={`day-${m.id}`} className="flex justify-center py-2">
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
                  {dayLabel}
                </span>
              </div>
            ) : null;

            if (isSystem) {
              return (
                <div key={m.id}>
                  {dayDivider}
                  <div className="flex justify-center">
                    <div className="max-w-[90%] rounded-full bg-brand-soft/80 px-4 py-1.5 text-center text-xs text-brand-dark">
                      {m.body}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id}>
                {dayDivider}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm sm:max-w-[70%]',
                      isMe
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md bg-white text-ink',
                    ].join(' ')}
                  >
                    {!isMe && (
                      <div className="mb-0.5 text-xs font-semibold text-brand">
                        {m.senderRole === 'ADMIN' ? 'Менеджер' : (m.sender?.firstName ?? 'Пользователь')}
                      </div>
                    )}
                    {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                    {attachments.map((att) => (
                      <AttachmentView
                        key={att.token}
                        attachment={att}
                        basePath={`/api/chats/${threadId}`}
                        onDark={isMe}
                      />
                    ))}
                    <div className={`mt-0.5 text-right text-[11px] ${isMe ? 'text-white/60' : 'text-muted'}`}>
                      {created.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        onError={(msg) => addToast(msg, 'error')}
        onSend={handleSend}
        placeholder="Введите сообщение или прикрепите чек..."
      />
    </div>
  );
};
