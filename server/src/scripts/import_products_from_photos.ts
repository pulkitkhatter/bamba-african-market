import "dotenv/config";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { prisma } from "../lib/prisma.js";
import { uploadImage } from "../lib/supabaseStorage.js";

// One-off bulk import: point it at a folder of raw product photos and it
// uploads each to Supabase Storage and creates a draft (unpublished)
// MarketProduct per photo, so an admin can fill in the real name/price/
// category later without the placeholders showing up on the live site.
//
// Usage: npx tsx src/scripts/import_products_from_photos.ts <directory> [category] [namePrefix]

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error(
      "Usage: npx tsx src/scripts/import_products_from_photos.ts <directory> [category] [namePrefix]",
    );
    process.exit(1);
  }
  const category = process.argv[3] ?? "Uncategorized";
  const namePrefix = process.argv[4] ?? "New Product";

  const existingCategory = await prisma.marketCategory.findFirst({ where: { name: category } });
  if (!existingCategory) {
    await prisma.marketCategory.create({ data: { name: category, sortOrder: 999 } });
    console.log(`Created category "${category}"`);
  }

  const files = readdirSync(dir)
    .filter((f) => Object.prototype.hasOwnProperty.call(MIME_BY_EXT, extname(f).toLowerCase()))
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();

  console.log(`Found ${files.length} image files in ${dir}`);

  let created = 0;
  let failed = 0;
  for (const [index, file] of files.entries()) {
    const filePath = join(dir, file);
    try {
      const buffer = readFileSync(filePath);
      const ext = extname(file).toLowerCase();
      const mimetype = MIME_BY_EXT[ext] ?? "image/jpeg";

      const photoUrl = await uploadImage({
        originalname: file,
        mimetype,
        buffer,
      } as Express.Multer.File);

      await prisma.marketProduct.create({
        data: {
          name: `${namePrefix} ${index + 1}`,
          category,
          price: 0,
          photoUrl,
          inStock: true,
          published: false,
        },
      });
      created++;
      console.log(`[${index + 1}/${files.length}] ${file} -> OK (${created} created so far)`);
    } catch (err) {
      failed++;
      console.error(`[${index + 1}/${files.length}] FAILED: ${file}`, err);
    }
  }

  console.log(`Done. Created ${created}, failed ${failed}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
