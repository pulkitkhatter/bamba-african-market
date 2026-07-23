import { useState } from "react";
import { useCart } from "../context/CartContext";
import type { MarketProduct } from "../lib/api";

interface Props {
  product: MarketProduct;
  fallbackPhotoUrl?: string | null;
}

export function ProductCard({ product, fallbackPhotoUrl }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product.id, product.name, product.price, quantity);
    setQuantity(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const photo = product.photoUrl || fallbackPhotoUrl;

  return (
    <article className="product-card">
      <div className="product-card-image">
        {photo && <img src={photo} alt={product.name} loading="lazy" />}
        <span className="product-price-tag">${product.price.toFixed(2)}</span>
        {!product.inStock && <span className="badge product-card-ribbon">Out of Stock</span>}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        {product.description && <p className="product-description">{product.description}</p>}

        {product.inStock && (
          <div className="product-card-order">
            <div className="quantity-stepper">
              <button
                type="button"
                aria-label={`Decrease ${product.name} quantity`}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label={`Increase ${product.name} quantity`}
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
            <button type="button" className="btn btn-small" onClick={handleAdd}>
              {added ? "Added ✓" : "Add to Cart"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
