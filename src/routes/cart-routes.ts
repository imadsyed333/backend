import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware";
import { addToCart, fetchCart, syncCart } from "../controllers/cart-controller";

const router = Router();

// Fetching the current user's cart
router.get("/all", authenticate, fetchCart);

// Adding an item to the user's cart
router.post("/add", authenticate, addToCart);

// Syncing the user cart
router.put("/sync", authenticate, syncCart);

export default router;
