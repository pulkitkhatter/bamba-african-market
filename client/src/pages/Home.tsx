import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetDirectionsButton } from "../components/GetDirectionsButton";
import { GoogleMapEmbed } from "../components/GoogleMapEmbed";
import { ReviewsWidget } from "../components/ReviewsWidget";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { api, type MarketSettings } from "../lib/api";
import { BUSINESS, TAGLINE_OPTIONS, TRUST_BADGES } from "../lib/content";
import { Seo } from "../seo/Seo";

export function Home() {
  const [settings, setSettings] = useState<MarketSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const tagline = settings?.tagline ?? TAGLINE_OPTIONS[0];
  const usp = settings?.usp ?? "";
  const heroImage = settings?.heroImageUrl || "/logo-full.png";

  return (
    <>
      <Seo
        title="African Grocery Brooklyn Bed-Stuy | Bamba African Market"
        description="Bamba African Market is a West African specialty grocery in Bed-Stuy, Brooklyn — fresh halal meat, fish, produce, spices, and hard-to-find African imports."
        path="/"
      />

      <section className="hero-split">
        <div className="hero-split-panel">
          <img src="/logo-mark.png" alt="Bamba African Market" className="hero-badge" />
          <h1>{BUSINESS.name}</h1>
          <p className="tagline">{tagline}</p>
          <div className="cta-row">
            <Link to="/what-we-carry" className="btn btn-shop-now">
              Shop Now
            </Link>
            <WhatsAppButton label="Chat on WhatsApp" />
            <GetDirectionsButton />
          </div>
        </div>
        <div
          className="hero-split-photo"
          style={{ backgroundImage: `url(${heroImage})` }}
          role="img"
          aria-label="Fresh groceries at Bamba African Market"
        />
      </section>
      <div className="zigzag-divider" aria-hidden="true" />

      <section className="container section">
        <p className="usp-line">{usp}</p>

        <div className="info-strip">
          <div className="info-strip-item">
            <strong>Hours</strong>
            {BUSINESS.hours}
          </div>
          <div className="info-strip-item">
            <strong>Address</strong>
            {BUSINESS.address}
          </div>
          <div className="info-strip-item">
            <strong>Phone</strong>
            <a href={BUSINESS.phoneTel}>{BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="trust-badges">
          {TRUST_BADGES.map((badge) => (
            <div className="trust-badge" key={badge.title}>
              <span className="trust-badge-icon" aria-hidden="true">
                {badge.icon}
              </span>
              <h3>{badge.title}</h3>
              <p>{badge.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>Find Us</h2>
        <p>{BUSINESS.address}</p>
        <GoogleMapEmbed />
      </section>

      <ReviewsWidget show={settings?.showReviewsWidget ?? false} />
    </>
  );
}
