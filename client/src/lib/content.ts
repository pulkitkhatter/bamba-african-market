export const BUSINESS = {
  name: "Bamba African Market",
  address: "1193 Fulton Street, Brooklyn, NY 11238",
  phoneDisplay: "(347) 996-2154",
  phoneTel: "tel:+13479962154",
  whatsappNumber: "13479962154",
  hours: "8:00 AM – 1:00 AM, 7 days a week",
  mapsQuery: encodeURIComponent("1193 Fulton Street, Brooklyn, NY 11238"),
};

export function whatsappUrl(message: string): string {
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WHATSAPP_MESSAGE = "Hi! I found you on your website";

// Three tagline options written per the brief (Section 5) for Blast to choose
// from. The first is the live default (also seeded as MarketSettings.tagline).
export const TAGLINE_OPTIONS = [
  "Fresh. Authentic. African.",
  "Your neighborhood African market.",
  "Everything from home, right here in Brooklyn.",
];

export const TRUST_BADGES = [
  {
    icon: "🥩",
    title: "Fresh Halal Meat & Fish",
    text: "Cut and prepared fresh, every day.",
  },
  {
    icon: "🌍",
    title: "Hard-to-Find Imports",
    text: "Products you can't find in a regular Brooklyn supermarket.",
  },
  {
    icon: "🕐",
    title: "Open Late, Every Day",
    text: "8:00 AM – 1:00 AM, 7 days a week.",
  },
  {
    icon: "🤝",
    title: "Community-Rooted",
    text: "Same owner as Z Halal Restaurant next door on Fulton St.",
  },
];
