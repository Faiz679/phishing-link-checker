/**
 * Handles incoming deep links from other apps (e.g. WhatsApp).
 * - phishingchecker://check?url=https://example.com  → opens home with prefilled url
 * - https://yourdomain.com/check?url=...      → same (requires Universal/App Links)
 * - any other https://... tapped that targets the app → prefill home with that URL
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (!path) return "/";

    // Parse possible url query param
    const queryIndex = path.indexOf("?");
    if (queryIndex !== -1) {
      const query = path.slice(queryIndex + 1);
      const params = new URLSearchParams(query);
      const incoming = params.get("url");
      if (incoming) {
        return `/?url=${encodeURIComponent(incoming)}`;
      }
    }

    // If the path itself is a full http(s) URL, treat it as the link to check
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return `/?url=${encodeURIComponent(path)}`;
    }

    return "/";
  } catch (e) {
    console.log("native-intent error", e);
    return "/";
  }
}
