import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  updateProduct,
} from "../controllers/product-controller";
import { authenticate, authorize } from "../middlewares/auth-middleware";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

// Fetch all products
router.get("/all", getAllProducts);

// Create a product
router.post(
  "/",
  authenticate,
  authorize,
  upload.single("image"),
  createProduct
);

// Get product with id
router.get("/:id", getProduct);

// Update product with id
router.put(
  "/:id",
  authenticate,
  authorize,
  upload.single("image"),
  updateProduct
);

// Delete product with id
router.delete("/:id", authenticate, authorize, deleteProduct);

export default router;
