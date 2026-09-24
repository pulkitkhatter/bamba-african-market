import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { supabaseAdmin } from "../lib/supabaseStorage.js";

// One-off: finds objects in the bamba-market-images bucket that no
// MarketProduct/MarketCategory/MarketSettings row points at anymore --
// leftovers from deleted products, replaced photos, or past failed
// backfill runs. Removing them frees storage with zero quality tradeoff,
// unlike recompressing.
//
// Dry-run by default -- only lists orphans and how much space they take.
// Pass --delete to actually remove them from the bucket.
//
// Usage: npx tsx src/scripts/find_orphan_images.ts [--delete]

const BUCKET = "bamba-market-images";
const DELETE = process.argv.includes("--delete");

function objectNameFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function listAllObjects(): Promise<{ name: string; size: number }[]> {
  if (!supabaseAdmin) throw new Error("Supabase storage is not configured");

  const all: { name: string; size: number }[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Could not list objects: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const obj of data) {
      if (obj.id) {
        const size = typeof obj.metadata?.["size"] === "number" ? obj.metadata["size"] : 0;
        all.push({ name: obj.name, size });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  if (!supabaseAdmin) {
    console.error(
      "Supabase storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
    process.exit(1);
  }

  const [settings, categories, products] = await Promise.all([
    prisma.marketSettings.findMany({ select: { heroImageUrl: true } }),
    prisma.marketCategory.findMany({ select: { photoUrl: true } }),
    prisma.marketProduct.findMany({ select: { photoUrl: true } }),
  ]);

  const referenced = new Set<string>();
  for (const row of [...settings, ...categories, ...products]) {
    const url = "heroImageUrl" in row ? row.heroImageUrl : row.photoUrl;
    if (!url) continue;
    const name = objectNameFromUrl(url);
    if (name) referenced.add(name);
  }

  console.log(`${referenced.size} distinct image(s) referenced in the database`);

  const objects = await listAllObjects();
  console.log(`${objects.length} object(s) in ${BUCKET}`);

  const orphans = objects.filter((obj) => !referenced.has(obj.name));
  const orphanBytes = orphans.reduce((sum, obj) => sum + obj.size, 0);

  if (orphans.length === 0) {
    console.log("\nNo orphaned images found -- every object in the bucket is referenced.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n${orphans.length} orphaned object(s), ${(orphanBytes / 1024 / 1024).toFixed(2)} MB total:`);
  for (const obj of orphans) {
    console.log(`  ${obj.name} (${(obj.size / 1024).toFixed(0)} KB)`);
  }

  if (!DELETE) {
    console.log("\nDry run only -- nothing deleted. Re-run with --delete to remove these.");
    await prisma.$disconnect();
    return;
  }

  console.log("\nDeleting...");
  const names = orphans.map((obj) => obj.name);
  const batchSize = 100;
  let deleted = 0;
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`Failed to delete batch starting at ${batch[0]}:`, error.message);
      continue;
    }
    deleted += batch.length;
  }

  console.log(`\nDone. Deleted ${deleted}/${orphans.length} orphaned object(s), freeing ~${(orphanBytes / 1024 / 1024).toFixed(2)} MB.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
