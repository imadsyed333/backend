import express from "express";
import productRoutes from "./routes/product-routes";
import userRoutes from "./routes/user-routes";
import orderRoutes from "./routes/order-routes";
import cartRoutes from "./routes/cart-routes";
import webhookRoutes from "./routes/webhook-routes";
import paymentRoutes from "./routes/payment-routes";
import path from "path";
import { appendFileSync } from "fs";

require("dotenv").config();
const app = express();
const port = process.env.PORT!;
const client_url = process.env.CLIENT_URL!;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(
  cors({
    origin: client_url,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// app.use("/webhook", webhookRoutes);

app.use(express.json());
app.use(cookieParser());

app.use("/products", productRoutes);

app.use("/user", userRoutes);

app.use("/orders", orderRoutes);

app.use("/cart", cartRoutes);

app.use("/payments", paymentRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
