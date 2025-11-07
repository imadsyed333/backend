import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware";
import { createCheckoutSession } from "../controllers/payment-controller";

const router = Router();

router.post("/create-checkout-session", authenticate, createCheckoutSession);

export default router;
