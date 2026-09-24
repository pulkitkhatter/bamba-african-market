import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { supabaseAdmin } from "../lib/supabaseStorage.js";

// One-off: downloads every object currently in the bamba-market-images
// bucket to a local folder, as a plain backup. Read-only against Supabase --
// nothing in the bucket or the database is touched.
//
// Usage: npx tsx src/scripts/download_bucket_backup.ts [output-dir]
// Defaults to ./bucket-backup

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

  const outDir = process.argv[2] ?? "bucket-backup";
  mkdirSync(outDir, { recursive: true });

  const objectNames = await listAllObjectNames();
  console.log(`Found ${objectNames.length} object(s) in ${BUCKET}`);
  console.log(`Downloading to ${outDir}/`);

  let downloaded = 0;
  let failed = 0;
  let totalBytes = 0;

  for (const name of objectNames) {
    try {
      const { data: blob, error } = await supabaseAdmin.storage.from(BUCKET).download(name);
      if (error || !blob) {
        throw new Error(error?.message ?? "empty download");
      }
      const buffer = Buffer.from(await blob.arrayBuffer());
      writeFileSync(join(outDir, name), buffer);
      totalBytes += buffer.length;
      downloaded++;
      if (downloaded % 25 === 0) {
        console.log(`  ${downloaded}/${objectNames.length} downloaded...`);
      }
    } catch (err) {
      failed++;
      console.error(`Failed on ${name}:`, err);
    }
  }

  console.log("\nDone.");
  console.log(`Downloaded: ${downloaded}, failed: ${failed}`);
  console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved to: ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
