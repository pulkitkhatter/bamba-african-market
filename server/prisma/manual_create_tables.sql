-- Applied once via `prisma db execute --file prisma/manual_create_tables.sql`
-- instead of `prisma db push`/`migrate`, because this database is SHARED with
-- the Z Halal Restaurant project (same Supabase project, same owner). A
-- schema-diffing command like `db push` compares the WHOLE database against
-- this schema.prisma and would try to drop the restaurant's Admin/MenuItem/
-- Order/OrderItem/SiteSettings tables since they aren't declared here. Raw
-- SQL creates only these three new tables and touches nothing else.

CREATE TABLE "MarketAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketAdmin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketAdmin_email_key" ON "MarketAdmin"("email");

CREATE TABLE "MarketSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tagline" TEXT NOT NULL DEFAULT 'Fresh. Authentic. African.',
    "usp" TEXT NOT NULL DEFAULT 'West African specialty grocery, fresh halal meat, and hard-to-find African imports.',
    "heroImageUrl" TEXT,
    "comingSoonMessage" TEXT NOT NULL DEFAULT 'Hi! I''d like to place an online order — is that available yet?',
    "showReviewsWidget" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "highlightItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketCategory_pkey" PRIMARY KEY ("id")
);
