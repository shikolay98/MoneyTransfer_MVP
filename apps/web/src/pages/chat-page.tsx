import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fetchThreadMessages, sendMessage, type ChatMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { connectSocket } from '../lib/socket';
import { useToast } from '../lib/toast-context';

export const ChatPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) return;

    fetchThreadMessages(threadId)
      .then(setMessages)
      .catch(() => addToast('Не удалось загрузить сообщения', 'error'))
      .finally(() => setIsLoading(false));

    const socket = connectSocket();
    socket.emit('join_thread', threadId);

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_thread', threadId);
      socket.off('new_message', handleNewMessage);
    };
  }, [threadId, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!threadId || !input.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(threadId, input.trim());
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
              <div className="text-3xl mb-2">💬</div>
              Напишите сообщение менеджеру
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-[16px] px-4 py-2.5 text-sm ${isMe ? 'bg-brand text-white' : 'bg-[#f3f5f3] border border-line text-ink'}`}>
                    {!isMe && m.senderRole !== 'SYSTEM' && (
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
              className="flex-1 rounded-[14px] border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSending}
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
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
              disabled={isSending || !input.trim()}
              onClick={() => void handleSend()}
              type="button"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
