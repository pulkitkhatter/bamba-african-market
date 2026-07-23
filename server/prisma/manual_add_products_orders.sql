-- Applied once via `prisma db execute --file prisma/manual_add_products_orders.sql`.
-- Same reasoning as manual_create_tables.sql: this database is shared with
-- the Z Halal Restaurant project, so schema changes are raw SQL touching
-- only these new objects -- never `prisma db push`/`migrate`.

CREATE TYPE "MarketFulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

CREATE TABLE "MarketProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fulfillmentType" "MarketFulfillmentType" NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MarketOrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MarketOrderItem_orderId_fkey" FOREIGN KEY ("orderId")
        REFERENCES "MarketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
