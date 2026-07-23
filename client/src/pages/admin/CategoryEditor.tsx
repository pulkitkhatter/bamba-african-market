import { useEffect, useState } from "react";
import { api, type MarketCategory } from "../../lib/api";

interface Props {
  category: MarketCategory;
  onChanged: () => void;
  onDeleted: () => void;
}

export function CategoryEditor({ category, onChanged, onDeleted }: Props) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [highlightText, setHighlightText] = useState(category.highlightItems.join(", "));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(category.name);
    setDescription(category.description ?? "");
    setHighlightText(category.highlightItems.join(", "));
  }, [category.id]);

  async function saveText() {
    const highlightItems = highlightText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (
      name === category.name &&
      description === (category.description ?? "") &&
      highlightItems.join(", ") === category.highlightItems.join(", ")
    ) {
      return;
    }
    await api.updateCategory(category.id, { name, description, highlightItems });
    onChanged();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      await api.updateCategory(category.id, { photoUrl: url });
      onChanged();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"?`)) return;
    await api.deleteCategory(category.id);
    onDeleted();
  }

  return (
    <div className="menu-item-editor">
      <div className="menu-item-editor-image">
        {category.photoUrl && <img src={category.photoUrl} alt={category.name} />}
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploading && <span className="uploading-note">Uploading…</span>}
      </div>

      <div className="menu-item-editor-fields">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveText}
          placeholder="Category name"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveText}
          placeholder="Short description…"
        />

        <input
          value={highlightText}
          onChange={(e) => setHighlightText(e.target.value)}
          onBlur={saveText}
          placeholder="Highlight items, comma separated"
        />

        <div className="menu-item-editor-row menu-item-editor-controls">
          <button type="button" className="btn btn-outline btn-small" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
