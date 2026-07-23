import { BUSINESS } from "../lib/content";

export function GetDirectionsButton() {
  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${BUSINESS.mapsQuery}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline"
    >
      Get Directions
    </a>
  );
}
