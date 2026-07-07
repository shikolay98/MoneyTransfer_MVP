import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AttachmentView } from '../components/chat/attachment-view';
import { ChatComposer } from '../components/chat/chat-composer';
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

  return (
    <div>
      <div className="mb-4">
        <Link className="text-xs font-semibold text-brand hover:underline" to="/dashboard">
          ← Назад в кабинет
        </Link>
      </div>

      <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col rounded-[20px] border border-line bg-white overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3 bg-[#f5f8fd]">
          <div className="text-sm font-semibold text-ink">Чат с менеджером</div>
          <div className="text-xs text-muted">Ответ обычно в течение 2-5 минут</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted py-8">Загрузка...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted py-8">
              <div aria-hidden="true" className="text-3xl mb-2">💬</div>
              Напишите сообщение менеджеру или прикрепите чек об оплате
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const isSystem = m.senderRole === 'SYSTEM';
              const attachments = m.attachments ?? [];

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
                  <div className={`max-w-[78%] rounded-[16px] px-4 py-2.5 text-sm ${isMe ? 'bg-brand text-white' : 'bg-[#f1f5fb] border border-line text-ink'}`}>
                    {!isMe && (
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {m.senderRole === 'ADMIN' ? 'Менеджер' : (m.sender?.firstName ?? 'Пользователь')}
                      </div>
                    )}
                    {m.body && <div className="whitespace-pre-wrap">{m.body}</div>}
                    {attachments.map((att) => (
                      <AttachmentView
                        key={att.token}
                        attachment={att}
                        basePath={`/api/chats/${threadId}`}
                        onDark={isMe}
                      />
                    ))}
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

        <ChatComposer
          onError={(msg) => addToast(msg, 'error')}
          onSend={handleSend}
          placeholder="Введите сообщение или прикрепите чек..."
        />
      </div>
    </div>
  );
};
