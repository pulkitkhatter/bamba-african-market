import { BUSINESS } from "../lib/content";

export function GoogleMapEmbed() {
  return (
    <div className="map-embed">
      <iframe
        title={`Map showing ${BUSINESS.name}`}
        src={`https://maps.google.com/maps?q=${BUSINESS.mapsQuery}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
