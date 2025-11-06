import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth-middleware";
import prisma from "../lib/prisma";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "../utils/auth-utils";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../utils/constants";

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.status(200).json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
    }: { name: string; email: string; password: string } = req.body;

    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    res.status(201).json({ message: "User created" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });
    const expiresAt = new Date(Date.now() + REFRESH_COOKIE_OPTIONS.maxAge);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return res
      .cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS)
      .cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS)
      .json({ message: `${user.email} logged in` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = verifyRefreshToken(token) as { sub: number };
    const dbToken = await prisma.refreshToken.findUnique({
      where: {
        token,
      },
    });
    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    await prisma.refreshToken.update({
      where: {
        token,
      },
      data: {
        revoked: true,
      },
    });
    const newAccessToken = signAccessToken({ sub: payload.sub });
    const newRefreshToken = signRefreshToken({ sub: payload.sub });
    const newExpiresAt = new Date(Date.now() + REFRESH_COOKIE_OPTIONS.maxAge);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.sub,
        expiresAt: newExpiresAt,
      },
    });

    res
      .cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS)
      .cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS)
      .json({ message: "Token refreshed" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(400).json({ error: "Missing token" });
    await prisma.refreshToken.updateMany({
      where: {
        token,
      },
      data: {
        revoked: true,
      },
    });
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json({ message: "Logged out" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    res.json({ user: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
