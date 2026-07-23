import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripUndefined } from "../lib/stripUndefined.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const settingsSchema = z.object({
  tagline: z.string().min(1).optional(),
  usp: z.string().min(1).optional(),
  heroImageUrl: z.string().url().optional(),
  comingSoonMessage: z.string().min(1).optional(),
  showReviewsWidget: z.boolean().optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const settings = await prisma.marketSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const data = stripUndefined(settingsSchema.parse(req.body));
    const settings = await prisma.marketSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
