import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripUndefined } from "../lib/stripUndefined.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  photoUrl: z.string().url().optional(),
  inStock: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

router.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.marketProduct.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = stripUndefined(productSchema.parse(req.body));
    const product = await prisma.marketProduct.create({ data });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing product id" });
      return;
    }
    const data = stripUndefined(productSchema.partial().parse(req.body));
    const product = await prisma.marketProduct.update({ where: { id }, data });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing product id" });
      return;
    }
    await prisma.marketProduct.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
