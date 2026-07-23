# Bamba African Market — Website

Express + TypeScript + Prisma backend, React + TypeScript + Vite frontend.
Built to mirror the sibling **Z Halal Restaurant** project's stack exactly
(same owner, same conventions) — see `../z-halal-restaurant/`.

- Public site: Home, What We Carry (real products with Add to Cart), Cart,
  Checkout, Contact — navy/marigold/berry palette (Fraunces + Space Grotesk),
  a zigzag basket-weave motif pulled from the logo art, split hero, sticky
  "aisle" category nav, price-tag-style product cards, mobile-first
- Real ordering: customers add products to a cart, then check out as
  **Pickup (pay at counter)** or **Delivery (address entry, pay cash/card on
  delivery)** — no online payment processing, per request
- Admin dashboard at `/admin`: manage Products (price, photo, category,
  in-stock), Categories, incoming Orders (mark completed/delete), and
  site settings (tagline/USP/hero image) without touching code
- Real logo (extracted from the provided logo screenshot) is wired into the
  header, footer, hero badge, and favicons — kept as the brand anchor
  through the redesign

## Shared Supabase project

This site **reuses the same Supabase project as Z Halal Restaurant** (same
owner, one Supabase project, two independent sets of tables) rather than
needing a second account:

- Tables are named `MarketAdmin` / `MarketSettings` / `MarketCategory` /
  `MarketProduct` / `MarketOrder` / `MarketOrderItem` (plus the
  `MarketFulfillmentType` enum) — distinct from the restaurant's `Admin` /
  `SiteSettings` / `MenuItem` / `Order` / `OrderItem` tables, so nothing
  collides.
- They were created with `prisma db execute --file prisma/manual_create_tables.sql`
  and `prisma/manual_add_products_orders.sql`, **not** `prisma db push` /
  `migrate`. `db push` diffs the *entire* database against this schema and
  would try to drop the restaurant's tables since they aren't declared here
  (confirmed this the hard way — it listed the restaurant's `MenuItem`/
  `Order`/etc. as pending drops) — raw `CREATE TABLE` statements touch only
  the new tables. If the schema ever needs to change again, add a new
  `prisma/manual_*.sql` file with `ALTER TABLE` statements rather than running
  `db push`.
- Storage uploads go to their own bucket, `bamba-market-images` (auto-created
  on first `npm run seed` via the service-role key), separate from the
  restaurant's `site-images` bucket.
- The admin session cookie is named `bamba_market_token` (not `token`) since
  browsers scope cookies by domain only, not port — using the same cookie
  name as the restaurant site would let one site's admin login clobber the
  other's when both are open on `localhost`.

## Setup

```bash
# Server
cd server
# .env is already configured with the shared Supabase project's credentials
npm install
npx prisma db execute --file prisma/manual_create_tables.sql          # first time only
npx prisma db execute --file prisma/manual_add_products_orders.sql    # first time only
npm run seed     # creates the admin login, seeds settings + 6 categories + 18 products, creates storage bucket
npm run dev      # http://localhost:4001

# Client (separate terminal)
cd client
npm install
npm run dev      # http://localhost:5174
```

Log into `/admin/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` set in
`server/.env`.

Ports are deliberately different from the restaurant project (backend 4001
vs 4000, frontend 5174 vs 5173) so both sites can run at once locally, and
different from 5000 since macOS's AirPlay Receiver (ControlCenter) already
listens on that port on this machine.

## What's still a placeholder

Per the brief, these are intentionally stubbed until Blast sends real
material — edit them from the admin dashboard once they arrive, no code
changes needed:

- **Photos**: seeded with Unsplash placeholder images (checked to exclude any
  alcohol/pork imagery, per the brief). Swap the hero image, each category
  photo, and individual product photos from `/admin` once the on-site
  filming session photos are available. Products without their own photo
  fall back to their category's photo.
- **Taglines**: three options written per brief Section 5 in
  `client/src/lib/content.ts` (`TAGLINE_OPTIONS`) — the first is live by
  default, editable from `/admin`.
- **Google Review widget**: intentionally not wired up (no EmbedSocial/
  Elfsight account exists yet) — see `client/src/components/ReviewsWidget.tsx`.
  Turn on `MarketSettings.showReviewsWidget` from `/admin` once Blast
  supplies a widget embed.
- **French language toggle**: not built — see the comment in `App.tsx`
  routes for where a `/fr` variant or i18n approach would slot in.

## Deployment (Vercel)

Both `client/` and `server/` are deployed as **separate** Vercel projects
under the `muskans-projects-5dfbe7c1` team:

- Backend: `bamba-african-market-backend` → https://bamba-african-market-backend.vercel.app
  — deployed via `vercel.json` + `api/index.ts` (the Express app wrapped as a
  single serverless function, same pattern as the restaurant project).
  Production env vars (`DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`,
  `FRONTEND_URL`) are set directly on the Vercel project, not committed.
- Frontend: `bamba-african-market-frontend` → https://bamba-african-market-frontend.vercel.app
  — static Vite build. `vercel.json` rewrites every path to `/index.html` so
  client-side routes (`/what-we-carry`, `/admin/login`, etc.) don't 404 on
  direct navigation/refresh. `VITE_API_URL` (production) points at the
  backend URL above — it's a public build-time value, not a secret.

To redeploy after code changes: `cd server && npx vercel deploy --prod --scope muskans-projects-5dfbe7c1`
and/or `cd client && npx vercel deploy --prod --scope muskans-projects-5dfbe7c1`.
If the backend's `FRONTEND_URL` or the frontend's `VITE_API_URL` ever need to
change, update via `vercel env rm/add <NAME> production` then redeploy —
env var changes don't apply retroactively to existing deployments.

The **admin password was rotated** before deploying (it was seeded locally as
an obvious placeholder, which isn't safe once the login is reachable
publicly) — the real one is only in `server/.env` and the Vercel project's
env vars, not in this repo.

## Notes

- Do not launch this live without written approval, and do not add any
  freelancer/agency branding to the public pages — both are hard rules from
  the project brief. (The user directing this build has since explicitly
  requested the Vercel deployment described above.)
- `server/.env` contains real, working Supabase credentials shared with the
  restaurant project — keep it out of version control (already gitignored).
