import { Response, Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { authenticate, AuthRequest } from "../middlewares/auth-middleware";
import z, { xid } from "zod";

const router = Router()
const prisma = new PrismaClient()

const BulkUpdateSchema = z.object({
    updateItems: z.array(
        z.object({
            id: z.number(),
            quantity: z.number().min(1)
        })
    ),
    deleteItems: z.array(
        z.object({
            id: z.number()
        })
    )
})

// Fetching the current user's cart
router.get('/all', authenticate, async(req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        
        const cartItems = await prisma.cartItem.findMany({
            where: {
                userId: req.user.id
            },
            select: {
                id: true,
                product: true,
                quantity: true,
            }
        })
        res.status(200).json({ cartItems: cartItems})
    } catch (e) {
        console.error(e)
        res.status(500).json({error: "Internal server error"})
    }
})

// Adding an item to the user's cart
router.post('/add', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        
        const {productId, quantity} = req.body
        if (!productId || !quantity) return res.status(400).json({error: "Missing fields"})

        const product = await prisma.product.findUnique({
            where: {
                id: parseInt(productId)
            }
        })

        if (!product) return res.status(404).json({error: `Product with id ${productId} not found`})
        
        const cartItem = await prisma.cartItem.create({
            data: {
                userId: req.user.id,
                productId: parseInt(productId),
                quantity: parseInt(quantity),
                }
            })

        res.status(201).json({message: "Added to cart"})

    } catch(e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})


// Syncing the user cart
router.put('/sync', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({message: "Unauthorized"})
        
        const parse = BulkUpdateSchema.safeParse(req.body)
        if (!parse.success) return res.status(400).json(parse.error)
        
        const {updateItems, deleteItems} = parse.data
        
        // Update items
        await prisma.$transaction(
            updateItems.map(({id, quantity}) => (
                prisma.cartItem.updateMany({
                    where: {
                        id,
                        userId
                    },
                    data: {
                        quantity
                    }
                })
            ))
        )
    
        // Delete items
        await prisma.$transaction(
             deleteItems.map(({id}) => (
                prisma.cartItem.deleteMany({
                    where: {
                        id,
                        userId
                    }
                })
            ))
        )

        res.status(200).json({message: "Cart synced"})
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})