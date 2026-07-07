import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fetchThreadMessages, sendMessage, type ChatMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useToast } from '../lib/toast-context';
import { usePageTitle } from '../lib/use-page-title';
import { appendUnique, useThreadSocket } from '../lib/use-thread-socket';

export const ChatPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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

  const handleSend = async () => {
    if (!threadId || !input.trim()) return;
    setIsSending(true);
    try {
      const sent = await sendMessage(threadId, input.trim());
      // Show the message immediately even if the socket echo is delayed or lost.
      setMessages((prev) => appendUnique(prev, sent));
      setInput('');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка отправки', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link className="text-xs font-semibold text-brand hover:underline" to="/dashboard">
          ← Назад в кабинет
        </Link>
      </div>

      <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col rounded-[20px] border border-line bg-white overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3 bg-[#f9fbfa]">
          <div className="text-sm font-semibold text-ink">Чат с менеджером</div>
          <div className="text-xs text-muted">Ответ обычно в течение 2-5 минут</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted py-8">Загрузка...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted py-8">
              <div aria-hidden="true" className="text-3xl mb-2">💬</div>
              Напишите сообщение менеджеру
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const isSystem = m.senderRole === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div className="max-w-[85%] rounded-full bg-brand-soft/70 px-4 py-1.5 text-center text-xs text-brand-dark">
                      {m.body}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-[16px] px-4 py-2.5 text-sm ${isMe ? 'bg-brand text-white' : 'bg-[#f3f5f3] border border-line text-ink'}`}>
                    {!isMe && (
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {m.senderRole === 'ADMIN' ? 'Менеджер' : (m.sender?.firstName ?? 'Пользователь')}
                      </div>
                    )}
                    {m.body}
                    <div className="text-xs mt-1 opacity-60">
                      {new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line/70 p-3 bg-[#f9fbfa]">
          <div className="flex gap-2">
            <input
              aria-label="Сообщение менеджеру"
              className="flex-1 rounded-[14px] border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSending}
              maxLength={4000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите сообщение..."
              value={input}
            />
            <button
              aria-label="Отправить сообщение"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
              disabled={isSending || !input.trim()}
              onClick={() => void handleSend()}
              type="button"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
