import { io } from 'socket.io-client';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect:       true,
      reconnection:      true,
      reconnectionDelay: 1000,
      transports:        ['websocket', 'polling'],
    });

    socket.on('connect',    () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
