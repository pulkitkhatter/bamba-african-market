import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { ensureBucketExists } from "../lib/supabaseStorage.js";

interface CategorySeed {
  name: string;
  description: string;
  photoUrl: string;
  highlightItems: string[];
  sortOrder: number;
}

// Placeholder copy sourced from the Blast contractor brief (Section 5).
// Chosen tagline: "Fresh. Authentic. African." -- the other two brief options
// ("Your neighborhood African market." / "Everything from home, right here in
// Brooklyn.") are documented here for Blast to swap in via /admin.
const TAGLINE_OPTIONS = [
  "Fresh. Authentic. African.",
  "Your neighborhood African market.",
  "Everything from home, right here in Brooklyn.",
];

// Placeholder hero image -- swap for the on-site filming session photo per brief Section 7.
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1600&q=80";

const CATEGORIES: CategorySeed[] = [
  {
    name: "African Groceries",
    description: "Pantry staples and imports you won't find at a regular supermarket.",
    photoUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Rice varieties", "Palm oil", "Cassava & fufu flour", "Dried fish"],
    sortOrder: 1,
  },
  {
    name: "Halal Meat & Fish",
    description: "Fresh halal meat and fish, cut to order.",
    photoUrl:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Goat", "Beef", "Lamb", "Fresh fish"],
    sortOrder: 2,
  },
  {
    name: "Fresh Produce",
    description: "Fresh vegetables and fruit for everyday West African cooking.",
    photoUrl:
      "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Okra", "Scotch bonnet peppers", "Plantains", "Leafy greens"],
    sortOrder: 3,
  },
  {
    name: "Spices",
    description: "Authentic spice blends and seasonings from home.",
    photoUrl:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Suya spice", "Maggi/bouillon cubes", "Dried chilies"],
    sortOrder: 4,
  },
  {
    name: "Drinks & Beverages",
    description: "Milky drinks and beverages from West Africa.",
    // Non-alcoholic soft drinks photo -- brief explicitly prohibits any
    // alcohol-adjacent imagery on either site.
    photoUrl:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Milky drinks", "Juices", "Soft drinks"],
    sortOrder: 5,
  },
  {
    name: "Hygiene Products",
    description: "Everyday hygiene and household products.",
    photoUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=80",
    highlightItems: ["Soaps", "Shea butter", "Household basics"],
    sortOrder: 6,
  },
];

interface ProductSeed {
  name: string;
  category: string;
  description: string;
  price: number;
  photoUrl?: string;
  sortOrder: number;
}

// Realistic sample products so the cart/checkout flow has real things to
// order -- Blast/the admin can rename, reprice, delete, or add more from
// /admin at any time. `category` must match a name in CATEGORIES above.
const PRODUCTS: ProductSeed[] = [
  {
    name: "Jasmine Rice (5lb)",
    category: "African Groceries",
    description: "Long-grain jasmine rice, a pantry staple for daily cooking.",
    price: 8.99,
    sortOrder: 1,
  },
  {
    name: "Palm Oil (1L)",
    category: "African Groceries",
    description: "Pure red palm oil, essential for West African sauces and stews.",
    price: 6.49,
    sortOrder: 2,
  },
  {
    name: "Fufu Flour (2lb)",
    category: "African Groceries",
    description: "Cassava-based fufu flour, ready to prepare.",
    price: 5.99,
    sortOrder: 3,
  },
  {
    name: "Goat Meat (1lb)",
    category: "Halal Meat & Fish",
    description: "Fresh halal goat meat, cut to order.",
    price: 9.99,
    sortOrder: 1,
  },
  {
    name: "Whole Tilapia (fresh)",
    category: "Halal Meat & Fish",
    description: "Fresh whole tilapia, cleaned and ready to cook.",
    price: 7.49,
    sortOrder: 2,
  },
  {
    name: "Beef Cubes (1lb)",
    category: "Halal Meat & Fish",
    description: "Fresh halal beef, cut into stew-ready cubes.",
    price: 8.49,
    sortOrder: 3,
  },
  {
    name: "Okra (1lb)",
    category: "Fresh Produce",
    description: "Fresh okra, a staple for soups and stews.",
    price: 3.49,
    sortOrder: 1,
  },
  {
    name: "Scotch Bonnet Peppers (0.5lb)",
    category: "Fresh Produce",
    description: "Fresh, fiery scotch bonnet peppers.",
    price: 2.99,
    sortOrder: 2,
  },
  {
    name: "Plantains (3-pack)",
    category: "Fresh Produce",
    description: "Fresh plantains, ready to fry, boil, or roast.",
    price: 2.49,
    sortOrder: 3,
  },
  {
    name: "Suya Spice Blend",
    category: "Spices",
    description: "House suya spice blend for grilling meat and vegetables.",
    price: 4.99,
    sortOrder: 1,
  },
  {
    name: "Maggi Bouillon Cubes (pack)",
    category: "Spices",
    description: "Classic seasoning cubes used in everyday West African cooking.",
    price: 2.99,
    sortOrder: 2,
  },
  {
    name: "Dried Chili Flakes",
    category: "Spices",
    description: "Dried, crushed chili flakes for extra heat.",
    price: 3.99,
    sortOrder: 3,
  },
  {
    name: "Vitamalt (6-pack)",
    category: "Drinks & Beverages",
    description: "Malt beverage, a popular non-alcoholic favorite.",
    price: 6.99,
    sortOrder: 1,
  },
  {
    name: "Sobo Juice",
    category: "Drinks & Beverages",
    description: "Hibiscus (zobo) juice drink.",
    price: 2.49,
    sortOrder: 2,
  },
  {
    name: "Malta Guinness (6-pack)",
    category: "Drinks & Beverages",
    description: "Non-alcoholic malt drink, a classic favorite.",
    price: 8.99,
    sortOrder: 3,
  },
  {
    name: "Raw Shea Butter (8oz)",
    category: "Hygiene Products",
    description: "Unrefined raw shea butter for skin and hair.",
    price: 6.99,
    sortOrder: 1,
  },
  {
    name: "African Black Soap",
    category: "Hygiene Products",
    description: "Traditional black soap bar for face and body.",
    price: 3.49,
    sortOrder: 2,
  },
  {
    name: "Cocoa Butter Lotion",
    category: "Hygiene Products",
    description: "Moisturizing cocoa butter body lotion.",
    price: 5.99,
    sortOrder: 3,
  },
];

async function main() {
  const adminEmail = process.env["ADMIN_EMAIL"];
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed an admin user",
    );
  }

  await ensureBucketExists();
  console.log("Storage bucket ready");

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.marketAdmin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  await prisma.marketSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, tagline: TAGLINE_OPTIONS[0] ?? "Fresh. Authentic. African.", heroImageUrl: HERO_IMAGE_URL },
  });
  console.log("Site settings ready");

  const existingCount = await prisma.marketCategory.count();
  if (existingCount === 0) {
    await prisma.marketCategory.createMany({ data: CATEGORIES });
    console.log(`Seeded ${CATEGORIES.length} categories`);
  } else {
    console.log(`Categories table already has ${existingCount} rows, skipping seed`);
  }

  const existingProductCount = await prisma.marketProduct.count();
  if (existingProductCount === 0) {
    await prisma.marketProduct.createMany({ data: PRODUCTS });
    console.log(`Seeded ${PRODUCTS.length} products`);
  } else {
    console.log(`Products table already has ${existingProductCount} rows, skipping seed`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
