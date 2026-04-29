import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/authRouter.js";
import shopRouter from "./routes/shopRouter.js";
import itemRouter from "./routes/itemRouter.js";
import orderRouter from "./routes/orderRouter.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import socketHandler from "./sockets/socketHandler.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["POST", "GET"],
  },
});

socketHandler(io);
export { io };

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", router);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/orders", orderRouter);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  connectDB();
  console.log(`server is running on ${PORT}`);
});
