import { useEffect, useRef, useState } from "react";
import { api, type MarketOrder } from "../../lib/api";

interface Props {
  canDelete: boolean;
}

const POLL_INTERVAL_MS = 15_000;
const ALARM_REPEAT_MS = 1_500;

type AudioContextClass = typeof AudioContext;

function getAudioContext(ctxRef: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ctxRef.current) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContextClass }).webkitAudioContext;
    ctxRef.current = new Ctor();
  }
  if (ctxRef.current.state === "suspended") ctxRef.current.resume();
  return ctxRef.current;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  durSec: number,
  attackSec: number,
  peak: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  const t0 = ctx.currentTime + startAt;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attackSec);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(t0);
  oscillator.stop(t0 + durSec + 0.02);
}

// Five fast alternating high/low pulses -- picked over a single beep so it's
// hard to miss from across a kitchen. One pass through this is easy to miss
// if no one's looking at the screen right then, so the caller loops it every
// ALARM_REPEAT_MS until someone hits "Stop Alarm".
function playAlarmPulse(ctx: AudioContext) {
  [0, 0.12, 0.24, 0.36, 0.48].forEach((startAt, i) =>
    playTone(ctx, i % 2 === 0 ? 1046.5 : 784, startAt, 0.11, 0.008, 0.34),
  );
}

export function OrdersPanel({ canDelete }: Props) {
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [alarmActive, setAlarmActive] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopAlarm() {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setAlarmActive(false);
  }

  function startAlarm() {
    if (alarmIntervalRef.current) return;
    setAlarmActive(true);
    try {
      playAlarmPulse(getAudioContext(audioCtxRef));
      alarmIntervalRef.current = setInterval(() => {
        try {
          playAlarmPulse(getAudioContext(audioCtxRef));
        } catch {
          // Audio unavailable or blocked -- the banner still shows.
        }
      }, ALARM_REPEAT_MS);
    } catch {
      // Audio unavailable or blocked -- the banner still shows.
    }
  }

  function load() {
    api
      .getOrders()
      .then((data) => {
        if (seenIds.current) {
          const hasNewOrder = data.some((order) => !seenIds.current!.has(order.id));
          if (hasNewOrder) startAlarm();
        }
        seenIds.current = new Set(data.map((order) => order.id));
        setOrders(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
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

  const alarmBanner = alarmActive && (
    <div className="new-order-alarm">
      <strong>🔔 New order — alarm is sounding</strong>
      <button type="button" className="new-order-alarm-stop" onClick={stopAlarm}>
        Stop Alarm
      </button>
    </div>
  );

  if (loading) return <p>Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <>
        {alarmBanner}
        <p className="admin-hint">No orders yet.</p>
      </>
    );
  }

  return (
    <>
      {alarmBanner}
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
    </>
  );
}
