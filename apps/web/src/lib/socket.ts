import { io, type Socket } from 'socket.io-client';

// Empty VITE_API_URL means same-origin deployment (nginx proxies /socket.io).
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const options = {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: false,
    };
    socket = API_URL ? io(API_URL, options) : io(options);
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};
