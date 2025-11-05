import { Response, Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { authenticate, AuthRequest } from "../middlewares/auth-middleware";

const router = Router()
const prisma = new PrismaClient()

// Fetching the current user's cart
router.get('/', authenticate, async(req: AuthRequest, res: Response) => {
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
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
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

// Deleting an item from the user's cart
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        const cartItemId = req.params.id
        
        if (!cartItemId) return res.status(400).json({ error: "id not provided" })
        const cartItem = await prisma.cartItem.delete({
            where: {
                id: parseInt(cartItemId),
                userId: req.user.id
            }
        })
        if (!cartItem) return res.status(404).json({ error: "Cart item not found" })
        res.status(200).json({message: "Item deleted from cart"})
    } catch(e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

// Updating the quantity of a specific item in the user's cart
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        const cartItemId = req.params.id
        const {quantity} = req.body
        
        if (!cartItemId) return res.status(400).json({ error: "id not provided" })
        
        if (!quantity) return res.status(400).json({error: "Missing quantity"})

        const cartItem = await prisma.cartItem.update({
            where: {
                id: parseInt(cartItemId),
                userId: req.user.id
            },
            data: {
                quantity: parseInt(quantity),
            }
        })

        if (!cartItem) return res.status(404).json({error: "Cart item not found"})
        
        res.status(200).json({message: "Cart item updated"})
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})