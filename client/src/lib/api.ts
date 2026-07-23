const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4001";

export interface MarketCategory {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  highlightItems: string[];
  sortOrder: number;
}

export interface NewCategoryInput {
  name: string;
  description?: string;
  photoUrl?: string;
  highlightItems?: string[];
  sortOrder?: number;
}

export interface MarketSettings {
  tagline: string;
  usp: string;
  heroImageUrl: string | null;
  comingSoonMessage: string;
  showReviewsWidget: boolean;
}

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  inStock: boolean;
  sortOrder: number;
}

export interface NewProductInput {
  name: string;
  category: string;
  description?: string;
  price: number;
  photoUrl?: string;
  inStock?: boolean;
  sortOrder?: number;
}

export type FulfillmentType = "DELIVERY" | "PICKUP";

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface NewOrderInput {
  customerName: string;
  phone: string;
  fulfillmentType: FulfillmentType;
  address?: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface MarketOrder {
  id: string;
  customerName: string;
  phone: string;
  fulfillmentType: FulfillmentType;
  address: string | null;
  notes: string | null;
  completed: boolean;
  items: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getCategories: () => request<MarketCategory[]>("/api/categories"),
  createCategory: (data: NewCategoryInput) =>
    request<MarketCategory>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Omit<MarketCategory, "id">>) =>
    request<MarketCategory>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/api/categories/${id}`, { method: "DELETE" }),

  getSettings: () => request<MarketSettings>("/api/settings"),
  updateSettings: (data: Partial<MarketSettings>) =>
    request<MarketSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getProducts: () => request<MarketProduct[]>("/api/products"),
  createProduct: (data: NewProductInput) =>
    request<MarketProduct>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Omit<MarketProduct, "id">>) =>
    request<MarketProduct>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/api/products/${id}`, { method: "DELETE" }),

  createOrder: (data: NewOrderInput) =>
    request<MarketOrder>("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  getOrders: () => request<MarketOrder[]>("/api/orders"),
  updateOrder: (id: string, data: { completed: boolean }) =>
    request<MarketOrder>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteOrder: (id: string) => request<void>(`/api/orders/${id}`, { method: "DELETE" }),

  login: (email: string, password: string) =>
    request<{ email: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ email: string }>("/api/auth/me"),

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Upload failed (${res.status})`);
    }
    return res.json();
  },
};
