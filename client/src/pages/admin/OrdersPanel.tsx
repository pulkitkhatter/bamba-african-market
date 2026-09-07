import { useEffect, useRef, useState } from "react";
import { api, type MarketOrder } from "../../lib/api";

interface Props {
  canDelete: boolean;
}

const POLL_INTERVAL_MS = 15_000;

// Plays a short triple-beep so staff notice a new order without needing an
// audio file on disk. Browsers only allow audio after a user gesture on the
// page, so this stays silent until someone has clicked/typed on the
// dashboard at least once (logging in already satisfies that).
function playNewOrderAlert() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    [0, 0.3, 0.6].forEach((startAt) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startAt);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + startAt);
      oscillator.stop(ctx.currentTime + startAt + 0.25);
    });
  } catch {
    // Audio unavailable or blocked -- the order still shows up in the list.
  }
}

export function OrdersPanel({ canDelete }: Props) {
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string> | null>(null);

  function load() {
    api
      .getOrders()
      .then((data) => {
        if (seenIds.current) {
          const hasNewOrder = data.some((order) => !seenIds.current!.has(order.id));
          if (hasNewOrder) playNewOrderAlert();
        }
        seenIds.current = new Set(data.map((order) => order.id));
        setOrders(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => handleDelete(order)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
