import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware";
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrder,
  getUserOrders,
} from "../controllers/order-controller";

const router = Router();

// The current user's orders
router.get("/", authenticate, getUserOrders);

// Creating an order for the current user
router.post("/", authenticate, createOrder);

// Getting all available orders
router.get("/all", authenticate, getAllOrders);

// Getting a specific order
router.get("/:id", authenticate, getOrder);

// Deleting a specific order
router.delete("/:id", authenticate, deleteOrder);

export default router;
