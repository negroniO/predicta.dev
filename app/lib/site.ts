export function resolveSiteUrl(primary?: string, legacy?: string): string {
  const url = new URL(primary?.trim() || legacy?.trim() || "https://predicta.dev");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("The public site URL must be an HTTP(S) origin without credentials");
  }
  return url.origin;
}

// Keep direct env references so Next.js can inline them in client bundles.
export const SITE_URL = resolveSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
);
