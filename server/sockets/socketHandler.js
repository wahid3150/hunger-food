const socketHandler = (io) => {
  const lastEmitTime = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-user", (userId) => {
      socket.join(userId);
    });

    socket.on("join-order", (orderId) => {
      socket.join(orderId);
    });

    socket.on("leave-order", (orderId) => {
      socket.leave(orderId);
    });

    socket.on("send-location", ({ orderId, latitude, longitude }) => {
      if (!orderId || !latitude || !longitude) return;

      if (typeof latitude !== "number" || typeof longitude !== "number") return;

      const now = Date.now();

      if (lastEmitTime[socket.id] && now - lastEmitTime[socket.id] < 2000)
        return;

      lastEmitTime[socket.id] = now;

      io.to(orderId).emit("receive-location", {
        orderId,
        latitude,
        longitude,
      });
    });

    socket.on("disconnect", () => {
      delete lastEmitTime[socket.id];
      console.log("User disconnected:", socket.id);
    });
  });
};

export default socketHandler;
