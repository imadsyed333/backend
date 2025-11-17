import z from "zod";
import { AuthRequest } from "../middlewares/auth-middleware";
import { Response } from "express";
import prisma from "../lib/prisma";

const BulkUpdateSchema = z.object({
  updateItems: z.array(
    z.object({
      id: z.number(),
      quantity: z.number().min(1),
    })
  ),
  deleteItems: z.array(
    z.object({
      id: z.number(),
    })
  ),
});

const CartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
});

export const fetchCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        product: true,
        quantity: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json({ cartItems: cartItems });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const parse = CartItemSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = z.flattenError(parse.error);
      return res.status(400).json(errors.fieldErrors);
    }

    const { productId, quantity } = parse.data;

    const product = await prisma.product.findUnique({
      cacheStrategy: {
        ttl: 60 * 60,
      },
      where: {
        id: productId,
      },
    });

    if (!product)
      return res
        .status(404)
        .json({ error: `Product with id ${productId} not found` });

    const updateResult = await prisma.cartItem.updateMany({
      where: {
        userId: req.user.id,
        productId,
      },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });

    if (updateResult.count === 0) {
      await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          quantity,
        },
      });
    }

    res.status(201).json({ message: "Added to cart" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const syncCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parse = BulkUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = z.flattenError(parse.error);
      return res.status(400).json(errors);
    }

    const { updateItems, deleteItems } = parse.data;

    // Update items
    await prisma.$transaction(
      updateItems.map(({ id, quantity }) =>
        prisma.cartItem.updateMany({
          where: {
            id,
            userId,
          },
          data: {
            quantity,
          },
        })
      )
    );

    // Delete items
    await prisma.$transaction(
      deleteItems.map(({ id }) =>
        prisma.cartItem.deleteMany({
          where: {
            id,
            userId,
          },
        })
      )
    );

    res.status(200).json({ message: "Cart synced" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
