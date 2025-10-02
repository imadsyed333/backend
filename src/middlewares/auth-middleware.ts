import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth-utils";

export interface AuthRequest extends Request {
    user?: { id: number, email?: string }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    let token: string | undefined

    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split("")[1]
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken
    }

    if (!token) return res.status(401).json({ error: "No token provided" })

    try {
        const payload = verifyAccessToken(token) as { sub: number, email: string }
        req.user = { id: payload.sub, email: payload.email }
        next()
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" })
    }
}