import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const staff = await prisma.marketAdmin.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(staff);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { email, password } = createStaffSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.marketAdmin.create({
      data: { email, passwordHash, role: "EMPLOYEE" },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing staff id" });
      return;
    }
    const target = await prisma.marketAdmin.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (target.role === "ADMIN") {
      res.status(400).json({ error: "Admin accounts can't be removed here" });
      return;
    }
    await prisma.marketAdmin.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
