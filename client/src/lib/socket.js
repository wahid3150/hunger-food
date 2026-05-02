import { io } from "socket.io-client";

/**
 * Singleton Socket.IO client instance.
 * Import this everywhere — never call io() directly in components.
 *
 * NOTE: We intentionally do NOT import serverUrl from App.jsx here
 * because that creates a circular dependency (App → socket → App).
 */
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // connect manually after login via useSocket()
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
