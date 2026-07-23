import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AUTH_COOKIE, requireAuth } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"] ?? "";
const isProduction = process.env["NODE_ENV"] === "production";

// Frontend and backend are deployed on different domains, so the session
// cookie needs SameSite=None (which browsers only allow when Secure) to be
// sent on cross-site requests. Locally (http, same-ish origin) Lax is fine.
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.marketAdmin.findUnique({ where: { email } });
    if (!admin) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie(AUTH_COOKIE, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ email: admin.email });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.adminId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const admin = await prisma.marketAdmin.findUnique({
      where: { id: req.adminId },
    });
    if (!admin) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({ email: admin.email });
  } catch (err) {
    next(err);
  }
});

export default router;
