import { Response } from "express";
import { AuthRequest } from "../middlewares/auth-middleware";
import prisma from "../lib/prisma";

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        cost: true,
        createdAt: true,
        orderItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ orders: orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: req.user.id,
      },
      include: { product: true },
    });
    if (cartItems.length === 0)
      return res.status(404).json({ error: "No cart items found" });

    const amount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const newOrder = await prisma.order.create({
      data: {
        userId: req.user.id,
        cost: amount,
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: item.product.price * item.quantity,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });
    res.status(201).json({ message: "Order placed" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const orders = await prisma.order.findMany();
    res.status(200).json({ orders: orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ error: "id not provided" });
    const order = await prisma.order.findUnique({
      where: {
        id: parseInt(orderId),
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.status(200).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ error: "id not provided" });
    const order = await prisma.order.delete({
      where: {
        id: parseInt(orderId),
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.status(200).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
