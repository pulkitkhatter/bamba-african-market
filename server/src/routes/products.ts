import { Router, type Request } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripUndefined } from "../lib/stripUndefined.js";
import { AUTH_COOKIE, requireAuth } from "../middleware/auth.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  photoUrl: z.string().url().optional(),
  inStock: z.boolean().default(true),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Not `requireAuth`: this route serves both the public storefront (which must
// only ever see published products) and the admin dashboard (which needs to
// see drafts too, e.g. bulk-imported placeholder products awaiting a real
// name/price). It checks the same admin cookie but never rejects the
// request -- an absent/invalid cookie just means "treat as public."
function isAdminRequest(req: Request): boolean {
  const token = req.cookies?.[AUTH_COOKIE];
  const JWT_SECRET = process.env["JWT_SECRET"];
  if (!token || !JWT_SECRET) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

router.get("/", async (req, res, next) => {
  try {
    const products = await prisma.marketProduct.findMany({
      where: isAdminRequest(req) ? {} : { published: true },
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
