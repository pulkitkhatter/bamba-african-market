import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Seo } from "../seo/Seo";

export function Cart() {
  const { lines, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container section cart-page">
      <Seo
        title="Your Cart | Bamba African Market"
        description="Review your order before checkout."
        path="/cart"
      />
      <h1>Your Cart</h1>

      {lines.length === 0 && (
        <p>
          Your cart is empty. <Link to="/what-we-carry">Browse what we carry</Link> to add
          products.
        </p>
      )}

      {lines.length > 0 && (
        <>
          <div className="cart-lines">
            {lines.map((line) => (
              <div className="cart-line" key={line.productId}>
                <div className="cart-line-info">
                  <strong>{line.name}</strong>
                  <span className="cart-line-size">${line.price.toFixed(2)} each</span>
                </div>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    aria-label={`Decrease ${line.name} quantity`}
                    onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${line.name} quantity`}
                    onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="cart-line-total">
                  ${(line.price * line.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => removeItem(line.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-line cart-summary-total">
            <strong>Total</strong>
            <strong>${totalPrice.toFixed(2)}</strong>
          </div>

          <button type="button" className="btn" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
