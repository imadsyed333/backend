import { Request, Response, Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { authenticate, AuthRequest } from "../middlewares/auth-middleware";

const router = Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })

        const orders = await prisma.order.findMany({
            where: {
                userId: req.user.id
            }
        })
        res.json(orders)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })

        const { cost, purchases } = req.body
        if (!purchases) return res.status(400).json({ error: "Missing fields" })

        const newOrder = await prisma.order.create({
            data: {
                userId: req.user.id,
                cost,
                purchases: {
                    create: purchases
                }
            },
            include: {
                purchases: true
            }
        })
        res.status(200).json(newOrder)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/all', async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany()
        res.status(200).json(orders)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id
        if (!orderId) return res.status(400).json({ error: "id not provided" })
        const order = await prisma.order.findUnique({
            where: {
                id: parseInt(orderId)
            }
        })
        if (!order) return res.status(404).json({ error: "Order not found" })
        res.status(200).json(order)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id
        if (!orderId) return res.status(400).json({ error: "id not provided" })
        const order = await prisma.order.delete({
            where: {
                id: parseInt(orderId)
            }
        })
        if (!order) return res.status(404).json({ error: "Order not found" })
        res.status(200).json(order)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

export default router
