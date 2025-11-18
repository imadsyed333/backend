import { Response } from "express";
import { AuthRequest } from "../middlewares/auth-middleware";
import prisma from "../lib/prisma";
import stripe from "../lib/stripe";

const DOMAIN = process.env.CLIENT_URL;

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const currency = "cad";

    // Fetch the user's cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const amount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: cartItems.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.product.name },
          unit_amount: item.product.price,
        },
        quantity: item.quantity,
      })),
      metadata: { userId, amount, currency },
      success_url: `${DOMAIN}/checkout/success`,
      cancel_url: `${DOMAIN}/cart`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
