import "dotenv/config";
import { prisma } from "../lib/prisma.js";

// One-off repair: compress_existing_images.ts renames every object it
// converts to the same basename with a .webp extension, uploads the new
// file, deletes the old one, then rewrites DB rows pointing at the old
// URL. If that run got interrupted (e.g. lost DB connectivity) after the
// storage side finished but before the DB rewrite ran, rows are left
// pointing at now-deleted files while the compressed replacement sits
// under the URL this script predicts -- a pure data-repair, no
// recompression or re-upload involved.
//
// For every non-null, non-.webp photoUrl/heroImageUrl still in the
// database, this checks whether the predicted .webp URL actually
// resolves (a plain public HTTP GET, no credentials needed) and only
// rewrites the row if it does. Nothing is deleted or modified in
// storage.
//
// Usage: npx tsx src/scripts/repair_photo_urls.ts

function webpCandidate(url: string): string {
  return url.replace(/\.[a-zA-Z0-9]+$/, ".webp");
}

async function urlResolves(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const [settings, categories, products] = await Promise.all([
    prisma.marketSettings.findMany({
      where: { heroImageUrl: { not: null } },
      select: { id: true, heroImageUrl: true },
    }),
    prisma.marketCategory.findMany({
      where: { photoUrl: { not: null } },
      select: { id: true, photoUrl: true },
    }),
    prisma.marketProduct.findMany({
      where: { photoUrl: { not: null } },
      select: { id: true, photoUrl: true },
    }),
  ]);

  let repaired = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const row of settings) {
    const url = row.heroImageUrl!;
    if (url.toLowerCase().endsWith(".webp")) {
      skipped++;
      continue;
    }
    const candidate = webpCandidate(url);
    if (await urlResolves(candidate)) {
      await prisma.marketSettings.update({
        where: { id: row.id },
        data: { heroImageUrl: candidate },
      });
      repaired++;
      console.log(`Repaired settings.heroImageUrl -> ${candidate}`);
    } else {
      unresolved++;
      console.warn(`No WebP replacement found for settings.heroImageUrl: ${url}`);
    }
  }

  for (const row of categories) {
    const url = row.photoUrl!;
    if (url.toLowerCase().endsWith(".webp") || !url.includes("supabase.co")) {
      skipped++;
      continue;
    }
    const candidate = webpCandidate(url);
    if (await urlResolves(candidate)) {
      await prisma.marketCategory.update({
        where: { id: row.id },
        data: { photoUrl: candidate },
      });
      repaired++;
      console.log(`Repaired category ${row.id} -> ${candidate}`);
    } else {
      unresolved++;
      console.warn(`No WebP replacement found for category ${row.id}: ${url}`);
    }
  }

  for (const row of products) {
    const url = row.photoUrl!;
    if (url.toLowerCase().endsWith(".webp") || !url.includes("supabase.co")) {
      skipped++;
      continue;
    }
    const candidate = webpCandidate(url);
    if (await urlResolves(candidate)) {
      await prisma.marketProduct.update({
        where: { id: row.id },
        data: { photoUrl: candidate },
      });
      repaired++;
      if (repaired % 25 === 0) {
        console.log(`  ${repaired} repaired so far...`);
      }
    } else {
      unresolved++;
      console.warn(`No WebP replacement found for product ${row.id}: ${url}`);
    }
  }

  console.log("\nDone.");
  console.log(`Repaired: ${repaired}, already WebP or external: ${skipped}, unresolved: ${unresolved}`);
  if (unresolved > 0) {
    console.log(
      "Unresolved rows have no matching compressed file in storage -- those need a fresh photo re-upload through the admin panel.",
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
