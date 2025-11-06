import { Router } from "express";
import {
  authenticate,
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
} from "../controllers/user-controller";

const router = Router();

// Get all users
router.get("/all", authenticate, getAllUsers);

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

export default router;
