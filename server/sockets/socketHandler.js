const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // join user room (notifications)
    socket.on("join-user", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined user room`);
    });

    // join order room (tracking)
    socket.on("join-order", (orderId) => {
      socket.join(orderId);
      console.log(`Joined order room: ${orderId}`);
    });

    // delivery sends location
    socket.on("send-location", (data) => {
      const { orderId, latitude, longitude } = data;

      // broadcast to order room
      io.to(orderId).emit("receive-location", {
        orderId,
        latitude,
        longitude,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export default socketHandler;
