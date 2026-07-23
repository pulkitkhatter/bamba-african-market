import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { BUSINESS } from "../lib/content";

export function Header() {
  const { totalItems } = useCart();

  return (
    <header className="site-header">
      <div className="header-topbar">
        <div className="container header-topbar-inner">
          <span>{BUSINESS.hours}</span>
          <a href={BUSINESS.phoneTel}>{BUSINESS.phoneDisplay}</a>
        </div>
      </div>
      <div className="container header-inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-badge">
            <img src="/logo-mark.png" alt="Bamba African Market" className="brand-logo" />
          </span>
          <span className="brand-name">Bamba African Market</span>
        </NavLink>
        <nav className="main-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/what-we-carry">What We Carry</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/cart" className="cart-link">
            Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
