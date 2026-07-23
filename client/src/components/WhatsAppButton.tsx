import { DEFAULT_WHATSAPP_MESSAGE, whatsappUrl } from "../lib/content";

interface WhatsAppButtonProps {
  variant?: "floating" | "inline";
  label?: string;
  message?: string;
}

export function WhatsAppButton({
  variant = "inline",
  label = "Chat on WhatsApp",
  message = DEFAULT_WHATSAPP_MESSAGE,
}: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={variant === "floating" ? "whatsapp-fab" : "btn btn-whatsapp"}
      aria-label={label}
    >
      {variant === "floating" ? "WhatsApp" : label}
    </a>
  );
}
