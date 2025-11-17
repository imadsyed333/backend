import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth-middleware";
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrder,
  getUserOrders,
} from "../controllers/order-controller";

const router = Router();

// Getting the current user's orders
router.get("/", authenticate, getUserOrders);

// Creating an order for the current user
router.post("/", authenticate, createOrder);

// Getting all available orders
router.get("/all", authenticate, authorize, getAllOrders);

// Getting a specific order
router.get("/:id", authenticate, authorize, getOrder);

// Deleting a specific order
router.delete("/:id", authenticate, authorize, deleteOrder);

export default router;
