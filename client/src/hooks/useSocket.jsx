import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../lib/socket";

/**
 * useSocket — manages connection lifecycle.
 *
 * Call once near the top of your app (e.g. in Home or App).
 * Every component that needs the socket can also import it directly
 * from `../lib/socket` without re-running this hook.
 */
const useSocket = () => {
  const user = useSelector((state) => state.user.userData);

  useEffect(() => {
    if (!user?._id) return;

    // Connect only if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-user", user._id);

    return () => {
      // Don't disconnect globally — just stop emitting for this user session.
      // Real disconnect happens on browser close / logout.
    };
  }, [user?._id]);

  return socket;
};

export default useSocket;
