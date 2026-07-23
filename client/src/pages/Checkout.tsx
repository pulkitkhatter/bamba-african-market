import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api, type FulfillmentType } from "../lib/api";
import { Seo } from "../seo/Seo";

export function Checkout() {
  const { lines, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("PICKUP");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const order = await api.createOrder({
        customerName,
        phone,
        fulfillmentType,
        address: fulfillmentType === "DELIVERY" ? address : undefined,
        notes: notes || undefined,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });
      setConfirmedOrderId(order.id);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrderId) {
    return (
      <div className="container section checkout-page">
        <Seo
          title="Order Placed | Bamba African Market"
          description="Your order has been placed."
          path="/checkout"
        />
        <h1>Order Placed!</h1>
        <p>
          Thanks{customerName ? `, ${customerName}` : ""} — we've got your order
          {fulfillmentType === "DELIVERY" ? " and will deliver it soon." : " ready for pickup."}{" "}
          Pay in cash or card {fulfillmentType === "DELIVERY" ? "on delivery" : "at the counter"}.
        </p>
        <p>
          <Link to="/what-we-carry">Order something else</Link> or{" "}
          <Link to="/">go home</Link>.
        </p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container section checkout-page">
        <Seo
          title="Checkout | Bamba African Market"
          description="Complete your order."
          path="/checkout"
        />
        <h1>Checkout</h1>
        <p>
          Your cart is empty. <Link to="/what-we-carry">Browse what we carry</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="container section checkout-page">
      <Seo title="Checkout | Bamba African Market" description="Complete your order." path="/checkout" />
      <h1>Checkout</h1>

      <div className="cart-summary">
        {lines.map((line) => (
          <div className="cart-summary-line" key={line.productId}>
            <span>
              {line.quantity}× {line.name}
            </span>
            <span>${(line.price * line.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="cart-summary-line cart-summary-total">
          <strong>Total</strong>
          <strong>${totalPrice.toFixed(2)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <label>
          Full name
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </label>
        <label>
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <div className="fulfillment-choice">
          <label className="radio-label">
            <input
              type="radio"
              name="fulfillment"
              checked={fulfillmentType === "PICKUP"}
              onChange={() => setFulfillmentType("PICKUP")}
            />
            Pickup — pay at counter
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="fulfillment"
              checked={fulfillmentType === "DELIVERY"}
              onChange={() => setFulfillmentType("DELIVERY")}
            />
            Delivery — pay cash or card on delivery
          </label>
        </div>

        {fulfillmentType === "DELIVERY" && (
          <label>
            Delivery address
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>
        )}

        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests?"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Placing order…" : "Place Order"}
        </button>
        <p className="checkout-payment-note">
          No online payment — pay in cash or card{" "}
          {fulfillmentType === "DELIVERY" ? "on delivery" : "at the counter"}.
        </p>
      </form>
    </div>
  );
}
