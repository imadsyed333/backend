import { Router, Request, Response } from "express"
import { PrismaClient } from "../generated/prisma"

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany()
        res.status(200).json(products);
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, price, image, description } = req.body
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                image
            }
        })
        res.status(201).json(newProduct)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const productId = req.params.id
        if (productId === undefined) {
            throw new Error('id is undefined!')
        }
        const product = await prisma.product.findUnique({
            where: {
                id: parseInt(productId || '1')
            }
        })
        if (product) {
            res.status(200).json(product)
        } else {
            res.status(404).json({ error: 'Product could not be found' })
        }
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const productId = req.params.id
        if (productId === undefined) {
            throw new Error('id is undefined!')
        }
        const deletedProduct = await prisma.product.delete({
            where: {
                id: parseInt(productId || '1')
            }
        })
        res.status(200).json(deletedProduct)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
})



export default router