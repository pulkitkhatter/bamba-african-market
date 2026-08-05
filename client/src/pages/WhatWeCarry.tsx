import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { api, type MarketCategory, type MarketProduct } from "../lib/api";
import { Seo } from "../seo/Seo";

function groupByCategory(products: MarketProduct[]): Map<string, MarketProduct[]> {
  const map = new Map<string, MarketProduct[]>();
  for (const product of products) {
    const list = map.get(product.category) ?? [];
    list.push(product);
    map.set(product.category, list);
  }
  return map;
}

function categoryAnchor(name: string): string {
  return `aisle-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function matchesSearch(product: MarketProduct, term: string): boolean {
  const haystack = `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();
  return haystack.includes(term);
}

export function WhatWeCarry() {
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.trim() ?? "";

  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([categoryList, productList]) => {
        setCategories(categoryList);
        setProducts(productList);
      })
      .catch(() => {
        setCategories([]);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = searchTerm
    ? products.filter((product) => matchesSearch(product, searchTerm.toLowerCase()))
    : products;
  const grouped = groupByCategory(visibleProducts);

  return (
    <div className="container section">
      <Seo
        title="What We Carry — Bamba African Market | Bed-Stuy Brooklyn"
        description="Fresh halal meat, fish, produce, spices, and hard-to-find African groceries — products you can't find in a regular Brooklyn supermarket."
        path="/what-we-carry"
      />

      <h1>What We Carry</h1>
      <p>
        Products you can&apos;t find in a regular supermarket — West African
        groceries, fresh halal meat and fish, produce, spices, drinks, and
        everyday essentials. Add anything to your cart and check out for
        pickup or delivery.
      </p>

      {loading && <p>Loading…</p>}

      {!loading && searchTerm && (
        <p className="search-results-summary">
          {visibleProducts.length > 0
            ? `${visibleProducts.length} result${visibleProducts.length === 1 ? "" : "s"} for “${searchTerm}”`
            : `No products found for “${searchTerm}”.`}{" "}
          <Link to="/what-we-carry">Clear search</Link>
        </p>
      )}

      {!loading && products.length === 0 && (
        <p>Our selection is being updated — check back shortly, or ask us on WhatsApp.</p>
      )}

      {!loading && products.length > 0 && searchTerm && visibleProducts.length === 0 && (
        <p>
          Don&apos;t see it? Ask us on WhatsApp — we may still carry it.
        </p>
      )}

      {visibleProducts.length > 0 && (
        <nav className="aisle-nav" aria-label="Jump to category">
          {categories
            .filter((category) => (grouped.get(category.name)?.length ?? 0) > 0)
            .map((category) => (
              <a key={category.id} href={`#${categoryAnchor(category.name)}`} className="aisle-pill">
                {category.name}
              </a>
            ))}
        </nav>
      )}

      {categories.map((category) => {
        const categoryProducts = grouped.get(category.name);
        if (!categoryProducts || categoryProducts.length === 0) return null;

        return (
          <section
            key={category.id}
            id={categoryAnchor(category.name)}
            className="product-category"
          >
            <div className="product-category-header">
              {category.photoUrl && (
                <img
                  src={category.photoUrl}
                  alt={category.name}
                  className="product-category-image"
                />
              )}
              <div>
                <h2>{category.name}</h2>
                {category.description && <p>{category.description}</p>}
              </div>
            </div>
            <div className="product-grid">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  fallbackPhotoUrl={category.photoUrl}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="catering-cta">
        <p>Don&apos;t see what you need? Ask us.</p>
        <WhatsAppButton
          label="Ask on WhatsApp"
          message="Hi! I'm looking for a product — do you carry it?"
        />
      </div>
    </div>
  );
}
