import { Router, Request, Response } from "express";
import { PrismaClient, User } from "../generated/prisma";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { authenticate, UserRequest } from "./middlewares/auth";

require('dotenv').config()
const router = Router()
const prisma = new PrismaClient()

const generateToken = (user: User): string => {
    return sign({ email: user.email }, process.env.JWT_SECRET!)
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
            res.status(409).json({ error: 'User with email already exists' })
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
            res.status(404).json({ error: 'User with email not found' })
        } else {
            const isPasswordCorrect = await compare(password, user.password)
            if (!isPasswordCorrect) {
                res.status(401).json({ error: 'Unauthorized' })
            }
            const { password: _password, ...userInfo } = user
            res.status(201).json({ ...userInfo, token: generateToken(user) })
        }

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