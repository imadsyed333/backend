import { raw, Router } from "express";
import { handleCheckout } from "../controllers/webhook-controller";

const router = Router();

router.post("/", raw({ type: "application/json" }), handleCheckout);

export default router;
