import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api, type MarketCategory, type MarketProduct, type MarketSettings } from "../../lib/api";
import { CategoryEditor } from "./CategoryEditor";
import { OrdersPanel } from "./OrdersPanel";
import { ProductEditor } from "./ProductEditor";

type Tab = "products" | "categories" | "orders" | "settings";
type ProductFilter = "published" | "drafts" | "all";

const DRAFTS_PAGE_SIZE = 30;

const emptyCategory = {
  name: "",
  description: "",
  highlightItems: [] as string[],
  sortOrder: 0,
};

export function AdminDashboard() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [newCategory, setNewCategory] = useState(emptyCategory);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "" });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [productFilter, setProductFilter] = useState<ProductFilter>("published");
  const [draftsShown, setDraftsShown] = useState(DRAFTS_PAGE_SIZE);

  function loadData() {
    api.getCategories().then((data) => {
      setCategories(data);
      setNewProduct((prev) => ({ ...prev, category: prev.category || data[0]?.name || "" }));
    });
    api.getProducts().then(setProducts);
    api.getSettings().then(setSettings);
  }

  useEffect(loadData, []);

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.name) return;
    await api.createCategory(newCategory);
    setNewCategory(emptyCategory);
    loadData();
  }

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category) return;
    await api.createProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: Number.parseFloat(newProduct.price) || 0,
    });
    setNewProduct({ name: "", category: newProduct.category, price: "" });
    loadData();
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await api.updateSettings(settings);
    setMessage("Settings saved.");
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setSettings({ ...settings, heroImageUrl: url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="container section admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div>
          <span>{email}</span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${tab === "products" ? "admin-tab-active" : ""}`}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === "categories" ? "admin-tab-active" : ""}`}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === "orders" ? "admin-tab-active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === "settings" ? "admin-tab-active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Site Settings
        </button>
      </div>

      {tab === "products" && (
        <section>
          <h2>Products</h2>
          <p className="admin-hint">
            Edit name/price/description inline (saves when you click away),
            change category, upload a photo, toggle in-stock, or delete.
            Unpublished products are hidden from the public site until you
            check "Published".
          </p>

          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${productFilter === "published" ? "admin-tab-active" : ""}`}
              onClick={() => setProductFilter("published")}
            >
              Published ({products.filter((p) => p.published).length})
            </button>
            <button
              type="button"
              className={`admin-tab ${productFilter === "drafts" ? "admin-tab-active" : ""}`}
              onClick={() => setProductFilter("drafts")}
            >
              Drafts ({products.filter((p) => !p.published).length})
            </button>
            <button
              type="button"
              className={`admin-tab ${productFilter === "all" ? "admin-tab-active" : ""}`}
              onClick={() => setProductFilter("all")}
            >
              All ({products.length})
            </button>
          </div>

          <div className="menu-item-editor-list">
            {(() => {
              const filtered = products.filter((p) => {
                if (productFilter === "published") return p.published;
                if (productFilter === "drafts") return !p.published;
                return true;
              });
              const visible =
                productFilter === "drafts" ? filtered.slice(0, draftsShown) : filtered;
              return (
                <>
                  {visible.map((product) => (
                    <ProductEditor
                      key={product.id}
                      product={product}
                      categoryNames={categories.map((c) => c.name)}
                      onChanged={loadData}
                      onDeleted={loadData}
                    />
                  ))}
                  {productFilter === "drafts" && filtered.length > visible.length && (
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => setDraftsShown((n) => n + DRAFTS_PAGE_SIZE)}
                    >
                      Load more ({filtered.length - visible.length} remaining)
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          <form onSubmit={handleAddProduct} className="admin-inline-form">
            <input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Price"
              inputMode="decimal"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              style={{ maxWidth: "90px" }}
            />
            <button type="submit" className="btn btn-small">
              Add Product
            </button>
          </form>
        </section>
      )}

      {tab === "orders" && (
        <section>
          <h2>Orders</h2>
          <OrdersPanel />
        </section>
      )}

      {tab === "categories" && (
        <section>
          <h2>Categories</h2>
          <p className="admin-hint">
            Edit name/description/highlight items inline (saves when you click
            away), upload a photo, or delete a category.
          </p>

          <div className="menu-item-editor-list">
            {categories.map((category) => (
              <CategoryEditor
                key={category.id}
                category={category}
                onChanged={loadData}
                onDeleted={loadData}
              />
            ))}
          </div>

          <form onSubmit={handleAddCategory} className="admin-inline-form">
            <input
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <input
              placeholder="Description (optional)"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
            />
            <button type="submit" className="btn btn-small">
              Add Category
            </button>
          </form>
        </section>
      )}

      {tab === "settings" && settings && (
        <section>
          <h2>Site Settings</h2>
          <form onSubmit={handleSaveSettings} className="admin-settings-form">
            <label>
              Tagline
              <input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </label>
            <label>
              One-sentence USP
              <textarea
                value={settings.usp}
                onChange={(e) => setSettings({ ...settings, usp: e.target.value })}
              />
            </label>
            <label>
              Hero image
              <input type="file" accept="image/*" onChange={handleHeroUpload} />
              {uploading && <span> Uploading…</span>}
              {settings.heroImageUrl && (
                <img
                  src={settings.heroImageUrl}
                  alt="Current hero"
                  className="admin-hero-preview"
                />
              )}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.showReviewsWidget}
                onChange={(e) =>
                  setSettings({ ...settings, showReviewsWidget: e.target.checked })
                }
              />
              Show Google reviews widget
            </label>
            {message && <p className="form-success">{message}</p>}
            <button type="submit" className="btn">
              Save Settings
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
