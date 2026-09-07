-- Applied once via `prisma db execute --file prisma/manual_add_admin_role.sql`.
-- Same reasoning as manual_create_tables.sql: this database is shared with
-- the Z Halal Restaurant project, so schema changes are raw SQL touching
-- only these new objects -- never `prisma db push`/`migrate`.
--
-- Named "MarketAdminRole" (not "AdminRole") because the restaurant project
-- already created a Postgres type named "AdminRole" in this same database.

CREATE TYPE "MarketAdminRole" AS ENUM ('ADMIN', 'EMPLOYEE');

ALTER TABLE "MarketAdmin" ADD COLUMN "role" "MarketAdminRole" NOT NULL DEFAULT 'ADMIN';
