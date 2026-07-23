/// <reference path="./types/express.d.ts" />
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmetDefault from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import ordersRouter from "./routes/orders.js";
import productsRouter from "./routes/products.js";
import settingsRouter from "./routes/settings.js";
import uploadRouter from "./routes/upload.js";

// helmet's declared module shape resolves inconsistently across TS/npm
// environments (works locally, fails as "not callable" on Vercel's build),
// even though its default export is unambiguously a callable function at
// runtime. Asserting through `unknown` sidesteps whichever shape TS infers.
const helmet = helmetDefault as unknown as () => RequestHandler;

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/upload", uploadRouter);

  app.use(errorHandler);

  return app;
}
