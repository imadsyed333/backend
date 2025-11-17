import { Router } from "express";
import {
  createProduct,
  createProductBulk,
  deleteProduct,
  getAllProducts,
  getProduct,
} from "../controllers/product-controller";
import { authenticate, authorize } from "../middlewares/auth-middleware";

const router = Router();

// Fetch all products
router.get("/all", getAllProducts);

// Create a product
router.post("/", authenticate, authorize, createProduct);

// Bulk create products
router.post("/", authenticate, authorize, createProductBulk);

// Get product with id
router.get("/:id", getProduct);

// Delete product with id
router.delete("/:id", authenticate, authorize, deleteProduct);

export default router;
