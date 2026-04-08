import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/authRouter.js";
import shopRouter from "./routes/shopRouter.js";
import itemRouter from "./routes/itemRouter.js";
import cors from "cors";

const app = express();
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`server is running on ${PORT}`);
});
