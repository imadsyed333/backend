import { Router } from "express";
import {
  createProduct,
  createProductBulk,
  deleteProduct,
  getAllProducts,
  getProduct,
} from "../controllers/product-controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

// Fetch all products
router.get("/all", getAllProducts);

// Create a product
router.post("/", authenticate, createProduct);

// Bulk create products
router.post("/", authenticate, createProductBulk);

// Get product with id
router.get("/:id", getProduct);

// Delete product with id
router.delete("/:id", authenticate, deleteProduct);

export default router;
