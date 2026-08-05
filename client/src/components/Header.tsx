import { type FormEvent, useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { BUSINESS } from "../lib/content";

export function Header() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    navigate(trimmed ? `/what-we-carry?search=${encodeURIComponent(trimmed)}` : "/what-we-carry");
  }

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
        <form className="header-search" role="search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            name="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit" aria-label="Search">
            Search
          </button>
        </form>
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
