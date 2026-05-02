import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // connect manually after login via useSocket()
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
