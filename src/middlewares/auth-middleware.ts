import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth-utils";
import z from "zod";
import { PrismaClient } from "../../generated/prisma";

export interface AuthRequest extends Request {
  user?: { id: number; email?: string };
}

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().nonempty({ error: "Must not be empty" }),
  email: z.email().refine(async (input) => {
    const count = await prisma.user.count({
      where: {
        email: input,
      },
    });
    return count < 1;
  }, "Email already exists"),
  password: z
    .string()
    .min(8, { error: "Must have at least 8 characters" })
    .regex(/[a-z]+/, { error: "Must contain a lower-case letter" })
    .regex(/[A-Z]+/, { error: "Must contain an upper-case letter" })
    .regex(/[0-9]+/, { error: "Must contain a digit" }),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const validateRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = await registerSchema.safeParseAsync(req.body);
  if (result.success) {
    next();
  } else {
    const errors = z.flattenError(result.error);
    res.status(400).json(errors.fieldErrors);
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = loginSchema.safeParse(req.body);
  if (result.success) {
    console.log("Hello there everything is fine");
    next();
  } else {
    res.status(400).json({ error: "Invalid credentials" });
  }
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split("")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const payload = verifyAccessToken(token) as { sub: number; email: string };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
