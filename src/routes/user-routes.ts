import { Router, Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { authenticate, AuthRequest } from "../middlewares/auth-middleware";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword, verifyRefreshToken } from "../utils/auth-utils";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../utils/constants";

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            }
        })
        res.status(200).json(users)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password }: { name: string, email: string, password: string } = req.body

        if (!email || !password) return res.status(400).json({ error: "Missing fields" })
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            }
        })
        if (existingUser) return res.status(409).json({ error: "Email already in use" })
        const hashedPassword = await hashPassword(password)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            }
        })
        res.status(201).json({ id: user.id, email: user.email, name: user.name })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password }: { email: string, password: string } = req.body
        if (!email || !password) return res.status(400).json({ error: "Missing fields" })

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) return res.status(401).json({ error: "Invalid credentials" })

        const isValid = await verifyPassword(password, user.password)
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" })

        const accessToken = signAccessToken({ sub: user.id, email: user.email })
        const refreshToken = signRefreshToken({ sub: user.id })
        const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt
            }
        })

        return res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS).cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS).json({ message: `${user.email} logged in` })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post("/refresh", async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken
    if (!token) return res.status(401).json({ error: "No refresh token" })

    try {
        const payload = verifyRefreshToken(token) as { sub: number }
        const dbToken = await prisma.refreshToken.findUnique({
            where: {
                token
            }
        })
        if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
            return res.status(401).json({ error: "Invalid refresh token" })
        }

        await prisma.refreshToken.update({
            where: {
                token
            },
            data: {
                revoked: true
            }
        })
        const newAccessToken = signAccessToken({ sub: payload.sub })
        const newRefreshToken = signRefreshToken({ sub: payload.sub })
        const newExpiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))

        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken, userId: payload.sub, expiresAt: newExpiresAt
            }
        })

        res.cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS).cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS).json({ message: "Token refreshed" })
    } catch {
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post("/logout", async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken
        if (token) {
            await prisma.refreshToken.updateMany({
                where: {
                    token
                },
                data: {
                    revoked: true
                }
            })
        }
        res.clearCookie("accessToken").clearCookie("refreshToken").json({ message: "Logged out" })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        })
        res.json({ user: user })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

export default router