import { useEffect, useState } from "react";
import { api, type MarketProduct } from "../../lib/api";

interface Props {
  product: MarketProduct;
  categoryNames: string[];
  onChanged: () => void;
  onDeleted: () => void;
}

export function ProductEditor({ product, categoryNames, onChanged, onDeleted }: Props) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
  }, [product.id]);

  async function saveText() {
    const numericPrice = Number.parseFloat(price) || 0;
    if (
      name === product.name &&
      category === product.category &&
      description === (product.description ?? "") &&
      numericPrice === product.price
    ) {
      return;
    }
    await api.updateProduct(product.id, { name, category, description, price: numericPrice });
    onChanged();
  }

  async function handleToggleStock() {
    await api.updateProduct(product.id, { inStock: !product.inStock });
    onChanged();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      await api.updateProduct(product.id, { photoUrl: url });
      onChanged();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?`)) return;
    await api.deleteProduct(product.id);
    onDeleted();
  }

  return (
    <div className="menu-item-editor">
      <div className="menu-item-editor-image">
        {product.photoUrl && <img src={product.photoUrl} alt={product.name} />}
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploading && <span className="uploading-note">Uploading…</span>}
      </div>

      <div className="menu-item-editor-fields">
        <div className="menu-item-editor-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveText}
            placeholder="Product name"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={saveText}
            placeholder="Price"
            inputMode="decimal"
            style={{ maxWidth: "90px" }}
          />
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveText}
          placeholder="Short description…"
        />

        <div className="menu-item-editor-row menu-item-editor-controls">
          <select value={category} onChange={(e) => { setCategory(e.target.value); }} onBlur={saveText}>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="checkbox-label">
            <input type="checkbox" checked={product.inStock} onChange={handleToggleStock} />
            In Stock
          </label>

          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
