import { NextFunction, Request, Response } from "express";
import { PrismaClient, User } from "../../generated/prisma";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient()

export interface UserRequest extends Request {
    user?: User
}

export const authenticate = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const tokenString = req.headers.authorization
    if (!tokenString) {
        res.status(401).json({ error: 'Unauthorized' })
    } else {
        const token = tokenString.split(' ')[1]
        if (!token) {
            res.status(401).json({ error: 'Token not found' })
        } else {
            try {
                const decode = verify(token, process.env.JWT_SECRET!) as { email: string }
                const user = await prisma.user.findUnique({
                    where: {
                        email: decode.email
                    }
                })

                req.user = user ?? undefined!
                next()
            } catch (e) {
                req.user = undefined!
                next()
            }
        }
    }
}