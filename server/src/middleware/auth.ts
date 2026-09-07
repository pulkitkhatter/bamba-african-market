import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"];

// Named distinctly from the restaurant site's "token" cookie: browsers scope
// cookies by domain only (not port), so on localhost both backends would
// otherwise clobber each other's admin session cookie.
export const AUTH_COOKIE = "bamba_market_token";

interface TokenPayload {
  adminId: string;
  role: "ADMIN" | "EMPLOYEE";
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];

  if (!token || !JWT_SECRET) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.adminId = payload.adminId;
    req.adminRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.adminRole !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
