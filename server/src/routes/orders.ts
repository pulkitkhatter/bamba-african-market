import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { stripUndefined } from "../lib/stripUndefined.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

const orderSchema = z
  .object({
    customerName: z.string().min(1),
    phone: z.string().min(1),
    fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),
    address: z.string().min(1).optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1),
  })
  .refine((data) => data.fulfillmentType !== "DELIVERY" || !!data.address, {
    message: "Address is required for delivery orders",
    path: ["address"],
  });

router.post("/", async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);

    // Look up name/price server-side rather than trusting the client's cart
    // state -- prevents a tampered request from placing an order at an
    // arbitrary price.
    const products = await prisma.marketProduct.findMany({
      where: { id: { in: data.items.map((item) => item.productId) } },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const missing = data.items.find((item) => !productById.has(item.productId));
    if (missing) {
      res.status(400).json({ error: `Unknown product: ${missing.productId}` });
      return;
    }

    const order = await prisma.marketOrder.create({
      data: stripUndefined({
        customerName: data.customerName,
        phone: data.phone,
        fulfillmentType: data.fulfillmentType,
        address: data.fulfillmentType === "DELIVERY" ? data.address : undefined,
        notes: data.notes,
        items: {
          create: data.items.map((item) => {
            const product = productById.get(item.productId)!;
            return {
              productName: product.name,
              quantity: item.quantity,
              unitPrice: product.price,
            };
          }),
        },
      }),
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const orders = await prisma.marketOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing order id" });
      return;
    }
    const data = z.object({ completed: z.boolean() }).parse(req.body);
    const order = await prisma.marketOrder.update({
      where: { id },
      data,
      include: { items: true },
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Missing order id" });
      return;
    }
    await prisma.marketOrder.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
