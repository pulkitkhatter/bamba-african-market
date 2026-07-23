import { useEffect, useState } from "react";
import { api, type MarketOrder } from "../../lib/api";

export function OrdersPanel() {
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleCompleted(order: MarketOrder) {
    await api.updateOrder(order.id, { completed: !order.completed });
    load();
  }

  async function handleDelete(order: MarketOrder) {
    if (!confirm(`Delete order from ${order.customerName}?`)) return;
    await api.deleteOrder(order.id);
    load();
  }

  if (loading) return <p>Loading orders…</p>;
  if (orders.length === 0) return <p className="admin-hint">No orders yet.</p>;

  return (
    <div className="orders-list">
      {orders.map((order) => {
        const total = order.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );
        return (
          <div
            className={`order-card ${order.completed ? "order-card-completed" : ""}`}
            key={order.id}
          >
            <div className="order-card-header">
              <div>
                <strong>{order.customerName}</strong> · {order.phone}
                <div className="order-meta">
                  {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"} ·{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </div>
                {order.address && <div className="order-meta">Address: {order.address}</div>}
                {order.notes && <div className="order-meta">Notes: {order.notes}</div>}
              </div>
              <span className={`badge ${order.completed ? "" : "badge-pending"}`}>
                {order.completed ? "Completed" : "Pending"}
              </span>
            </div>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.productName} — ${item.unitPrice.toFixed(2)} each
                </li>
              ))}
            </ul>
            <div className="order-total">Total: ${total.toFixed(2)}</div>

            <div className="order-card-actions">
              <button type="button" className="btn btn-small" onClick={() => toggleCompleted(order)}>
                Mark as {order.completed ? "Pending" : "Completed"}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={() => handleDelete(order)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
