import { Request, Response } from "express";
import stripe from "../lib/stripe";
import Stripe from "stripe";
import prisma from "../lib/prisma";

export const handleCheckout = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId!;
      const amount = parseInt(session.metadata?.amount!);

      const payment = await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: "succeeded",
          stripeIntentId: session.payment_intent as string,
        },
      });

      const cartItems = await prisma.cartItem.findMany({
        where: { userId: parseInt(userId) },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        console.warn("No cart items found for user:", userId);
        return res.json({ received: true });
      }

      const order = await prisma.order.create({
        data: {
          userId: parseInt(userId),
          cost: amount,
          status: "PLACED",
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              subtotal: item.product.price * item.quantity,
            })),
          },
        },
        include: { orderItems: true },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { orderId: order.id },
      });

      await prisma.cartItem.deleteMany({ where: { userId: parseInt(userId) } });

      console.log(`Order ${order.id} created for user ${userId}`);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
