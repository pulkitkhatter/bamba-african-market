import { GoogleMapEmbed } from "../components/GoogleMapEmbed";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { BUSINESS } from "../lib/content";
import { Seo } from "../seo/Seo";

export function Contact() {
  return (
    <div className="container section">
      <Seo
        title="Contact & Hours — Bamba African Market | Bed-Stuy Brooklyn"
        description="Visit Bamba African Market at 1193 Fulton Street, Brooklyn, NY. Open 8am–1am daily. Call, WhatsApp, or get directions."
        path="/contact"
      />

      <h1>Contact &amp; Hours</h1>

      {/* Business name, address, and phone rendered as plain text (not an
          image) for SEO, per the project brief. */}
      <div className="contact-details">
        <p>{BUSINESS.address}</p>
        <p>
          <a href={BUSINESS.phoneTel}>{BUSINESS.phoneDisplay}</a>
        </p>
        <p>Hours: {BUSINESS.hours}</p>
        <WhatsAppButton label="Chat on WhatsApp" />
      </div>

      <GoogleMapEmbed />
    </div>
  );
}
