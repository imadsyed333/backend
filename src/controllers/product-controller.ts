import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth-middleware";
import z from "zod";

const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  image: z.string(),
  description: z.string(),
});

const BulkProductSchema = z.array(ProductSchema);

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json({ products: products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const parse = ProductSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = z.flattenError(parse.error);
      return res.status(400).json(errors.fieldErrors);
    }
    const { name, price, image, description } = parse.data;

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
      },
    });
    res.status(201).json({ product: newProduct });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProductBulk = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const parse = BulkProductSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = z.flattenError(parse.error);
      return res.status(400).json(errors);
    }

    const newProducts = await prisma.product.createMany({
      data: parse.data,
      skipDuplicates: true,
    });
    res.status(201).json({ products: newProducts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    if (!productId) return res.status(400).json({ error: "id not provided" });

    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(productId),
      },
    });
    if (!product) return res.status(404).json({ error: "product not found" });
    res.status(200).json({ product: product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.params.id;

    if (!productId) return res.status(400).json({ error: "id not provided" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error);
      return res.status(400).json(errors);
    }
    const updatedProduct = await prisma.product.update({
      where: {
        id: parseInt(productId),
      },
      data: parsed.data,
    });
    res.status(200).json({ product: updatedProduct });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const productId = req.params.id;

    if (!productId) return res.status(400).json({ error: "id not provided" });

    const deletedProduct = await prisma.product.delete({
      where: {
        id: parseInt(productId),
      },
    });
    if (!deletedProduct)
      return res.status(404).json({ error: "product not found" });
    res.status(200).json(deletedProduct);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
