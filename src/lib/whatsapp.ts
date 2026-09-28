/**
 * WhatsApp deep-link helpers.
 *
 * `https://wa.me/?text=...` only opens the system share chooser — it has no
 * recipient. A direct agent chat needs the number in the path:
 * `https://wa.me/<digits>?text=<encoded>`.
 */

/** Strips formatting and returns digits only, or null when nothing usable is left. */
export function normalizeWhatsappPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

/** Direct agent chat link, or null when the agent has no usable number. */
export function whatsappChatUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const digits = normalizeWhatsappPhone(phone);
  if (!digits) return null;
  const text = message?.trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

/** `tel:` href, or null when the agent has no usable number. */
export function telUrl(phone: string | null | undefined): string | null {
  const digits = normalizeWhatsappPhone(phone);
  return digits ? `tel:+${digits}` : null;
}

/** Prefilled message used when the user leaves the buy/contact message blank. */
export function defaultContactMessage(propertyTitle?: string, lang?: string): string {
  const title = propertyTitle?.trim();
  if (lang === 'fr') {
    return title
      ? `Bonjour, je suis intéressé(e) par le bien « ${title} ». Pouvons-nous en parler ?`
      : "Bonjour, je suis intéressé(e) par ce bien. Pouvons-nous en parler ?";
  }
  if (lang === 'sw') {
    return title
      ? `Habari, ninataka kujadili nyumba "${title}". Tunaweza kuzungumza?`
      : 'Habari, ninataka kujadili nyumba hii. Tunaweza kuzungumza?';
  }
  return title
    ? `Hello, I'm interested in "${title}". Could we discuss it?`
    : "Hello, I'm interested in this property. Could we discuss it?";
}
