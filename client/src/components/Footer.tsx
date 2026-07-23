import { Link } from "react-router-dom";
import { BUSINESS } from "../lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="zigzag-divider zigzag-divider-footer" aria-hidden="true" />
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="brand-badge brand-badge-footer">
            <img src="/logo-mark.png" alt="Bamba African Market" className="footer-logo" />
          </span>
          <div>
            <p>{BUSINESS.address}</p>
            <p>
              <a href={BUSINESS.phoneTel}>{BUSINESS.phoneDisplay}</a>
            </p>
            <p>{BUSINESS.hours}</p>
          </div>
        </div>
        <nav className="footer-nav">
          <Link to="/">Home</Link>
          <Link to="/what-we-carry">What We Carry</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
