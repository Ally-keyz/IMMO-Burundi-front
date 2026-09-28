import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './tokenStore';
import { SOCKET_URL } from './runtime';

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.io connection to the backend.
 * The current access token is passed as handshake auth when connecting
 * (or reconnecting), so the server can place the user in their room.
 *
 * SOCKET_URL is the page origin by default (works behind the same-origin
 * reverse proxy) and the backend origin when VITE_API_BASE_URL is set.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    withCredentials: true,
    auth: (cb) => cb({ token: getAccessToken() }),
  });

  socket.on('connect_error', () => {
    /* transient — socket.io auto-retries */
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}