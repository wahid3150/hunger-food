import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../lib/socket";

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
