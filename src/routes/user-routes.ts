import { Router } from "express";
import {
  authenticate,
  authorize,
  validateLogin,
  validateRegister,
} from "../middlewares/auth-middleware";
import {
  getAllUsers,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
  verifyEmail,
} from "../controllers/user-controller";

const router = Router();

// Get all users
router.get("/all", authenticate, authorize, getAllUsers);

// Register user
router.post("/register", validateRegister, registerUser);

// Login user
router.post("/login", validateLogin, loginUser);

// Refresh user session
router.post("/refresh", refreshUserToken);

// Logout user
router.post("/logout", authenticate, logoutUser);

// Get user profile
router.get("/profile", authenticate, getUserProfile);

// Check if email exists
router.post("/email-check", verifyEmail);

export default router;
