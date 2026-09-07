import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripUndefined } from "../lib/stripUndefined.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  photoUrl: z.string().url().optional(),
  highlightItems: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.marketCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = stripUndefined(categorySchema.parse(req.body));
    const category = await prisma.marketCategory.create({ data });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing category id" });
      return;
    }
    const data = stripUndefined(categorySchema.partial().parse(req.body));
    const category = await prisma.marketCategory.update({ where: { id }, data });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing category id" });
      return;
    }
    await prisma.marketCategory.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
