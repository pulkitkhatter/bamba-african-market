import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { compressImage, supabaseAdmin } from "../lib/supabaseStorage.js";

// One-off backfill: re-encodes every image already sitting in the
// bamba-market-images bucket (uploaded before uploadImage() compressed on
// the way in) to WebP, then repoints any DB row still pointing at the old
// URL. Safe to re-run -- already-WebP objects are skipped.
//
// Usage: npx tsx src/scripts/compress_existing_images.ts

const BUCKET = "bamba-market-images";

async function listAllObjectNames(): Promise<string[]> {
  if (!supabaseAdmin) throw new Error("Supabase storage is not configured");

  const names: string[] = [];
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

    // Supabase returns a placeholder row (no `id`) for "folders"; there
    // shouldn't be any in this flat bucket, but skip defensively.
    for (const obj of data) {
      if (obj.id) names.push(obj.name);
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return names;
}

async function main() {
  if (!supabaseAdmin) {
    console.error(
      "Supabase storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
    process.exit(1);
  }

  const objectNames = await listAllObjectNames();
  console.log(`Found ${objectNames.length} object(s) in ${BUCKET}`);

  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const urlRewrites = new Map<string, string>();

  for (const name of objectNames) {
    try {
      if (name.toLowerCase().endsWith(".webp")) {
        skipped++;
        continue;
      }

      const { data: blob, error: downloadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(name);
      if (downloadError || !blob) {
        throw new Error(downloadError?.message ?? "empty download");
      }
      const original = Buffer.from(await blob.arrayBuffer());
      const compressed = await compressImage(original);

      if (compressed.length >= original.length) {
        console.log(
          `Skipping ${name}: WebP wasn't smaller (${original.length} -> ${compressed.length} bytes)`,
        );
        skipped++;
        continue;
      }

      const newName = name.replace(/\.[^./]+$/, "") + ".webp";
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(newName, compressed, { contentType: "image/webp", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      if (newName !== name) {
        const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([name]);
        if (removeError) {
          console.warn(`Uploaded ${newName} but could not remove old object ${name}: ${removeError.message}`);
        }

        const oldUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
        const newUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(newName).data.publicUrl;
        urlRewrites.set(oldUrl, newUrl);
      }

      totalBefore += original.length;
      totalAfter += compressed.length;
      converted++;
      const savedPct = Math.round((1 - compressed.length / original.length) * 100);
      console.log(`Compressed ${name} -> ${newName}: ${original.length} -> ${compressed.length} bytes (-${savedPct}%)`);
    } catch (err) {
      failed++;
      console.error(`Failed on ${name}:`, err);
    }
  }

  if (urlRewrites.size > 0) {
    console.log(`\nRewriting ${urlRewrites.size} URL(s) referenced in the database...`);
    for (const [oldUrl, newUrl] of urlRewrites) {
      const [settings, categories, products] = await Promise.all([
        prisma.marketSettings.updateMany({
          where: { heroImageUrl: oldUrl },
          data: { heroImageUrl: newUrl },
        }),
        prisma.marketCategory.updateMany({
          where: { photoUrl: oldUrl },
          data: { photoUrl: newUrl },
        }),
        prisma.marketProduct.updateMany({
          where: { photoUrl: oldUrl },
          data: { photoUrl: newUrl },
        }),
      ]);
      const rows = settings.count + categories.count + products.count;
      if (rows === 0) {
        console.warn(`No DB row referenced ${oldUrl} (orphaned storage object?)`);
      }
    }
  }

  console.log("\nDone.");
  console.log(`Converted: ${converted}, skipped: ${skipped}, failed: ${failed}`);
  if (totalBefore > 0) {
    const savedPct = Math.round((1 - totalAfter / totalBefore) * 100);
    console.log(
      `Total size: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB (-${savedPct}%)`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
