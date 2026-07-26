-- Adds a "published" flag to MarketProduct so draft/placeholder products
-- (e.g. bulk-imported photos awaiting a real name/price from the admin) can
-- be hidden from the public storefront while still visible in the admin
-- dashboard. Existing rows default to true so nothing currently live is
-- hidden by this migration.
ALTER TABLE "MarketProduct" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
