import { Router, Request, Response } from "express";
import { PrismaClient, User } from "../generated/prisma";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { authenticate, UserRequest } from "./middlewares/auth";

require('dotenv').config()
const router = Router()
const prisma = new PrismaClient()

const generateToken = (user: User): string => {
    const JWT_SECRET = process.env.JWT_SECRET!
    return sign({ email: user.email }, JWT_SECRET)
}

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
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password }: { name: string, email: string, password: string } = req.body
        const userExists = await prisma.user.findUnique({
            where: {
                email: email,
            }
        })
        if (userExists) {
            throw new Error("Email already exists")
        }
        const hashedPassword: string = await hash(password, 10)
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        })
        const { password: _password, ...userInfo } = newUser
        res.status(201).json({ ...userInfo, token: generateToken(newUser) })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password }: { email: string, password: string } = req.body
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!user) {
            throw new Error('User not found')
        }

        const isPasswordCorrect = await compare(user.password, password)
        if (!isPasswordCorrect) {
            throw new Error('Incorrect password')
        }

        const { password: _password, ...userInfo } = user
        res.status(201).json({ ...userInfo, token: generateToken(user) })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.get('/profile', authenticate, async (req: UserRequest, res: Response, next) => {
    try {
        const { user } = req
        if (!user) {
            return res.sendStatus(401)
        }
        const { password: _password, ...userInfo } = user
        res.status(201).json({ ...userInfo, token: generateToken(user) })
    } catch (e) {
        next(e)
    }
})

export default router