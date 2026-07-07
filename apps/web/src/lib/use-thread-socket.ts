import { useEffect, useRef } from 'react';

import { connectSocket } from './socket';
import type { ChatMessage } from './api';

// Joins a chat thread room and keeps membership across reconnects.
// The server re-checks authorization on every join.
export const useThreadSocket = (
  threadId: string | null | undefined,
  onMessage: (message: ChatMessage) => void,
) => {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!threadId) return;

    const socket = connectSocket();

    const join = () => socket.emit('join_thread', threadId);
    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.threadId === threadId) {
        handlerRef.current(msg);
      }
    };

    if (socket.connected) {
      join();
    }
    // Fires on the initial connect and on every automatic reconnect.
    socket.on('connect', join);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_thread', threadId);
      socket.off('connect', join);
      socket.off('new_message', handleNewMessage);
    };
  }, [threadId]);
};

// Appends a message only if it is not in the list yet (the sender receives
// both the POST response and the socket echo).
export const appendUnique = (prev: ChatMessage[], msg: ChatMessage): ChatMessage[] =>
  prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
