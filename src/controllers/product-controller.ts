import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth-middleware";
import z from "zod";
import path from "path";
import { unlink } from "fs";

const ProductSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price: z.coerce.number(),
  description: z.string().min(1, { message: "Description is required" }),
});

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

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const newProduct = await prisma.product.create({
      data: {
        ...parse.data,
        image: imageUrl,
      },
    });
    res.status(201).json({ product: newProduct });
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

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: parseInt(productId),
      },
    });

    if (!existingProduct) return res.status(404).json({ error: "Not Found" });

    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error);
      return res.status(400).json(errors);
    }

    let newImageUrl: string | undefined = undefined;

    if (req.file) {
      newImageUrl = `/uploads/${req.file.filename}`;

      if (existingProduct.image) {
        const oldImageUrl = path.join(
          __dirname,
          "../../" + existingProduct.image
        );

        unlink(oldImageUrl, (err) => {
          if (err) {
            console.error("Error deleting old image:", err);
          } else {
            console.log("Old image deleted:", oldImageUrl);
          }
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: parseInt(productId),
      },
      data: {
        ...parsed.data,
        ...(newImageUrl !== undefined && { image: newImageUrl }),
      },
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
