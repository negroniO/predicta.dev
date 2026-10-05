// Only display intentional, bounded messages; never render raw server responses.
export async function responseMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 401) return "Your session expired. Sign in again in another tab, then retry. Your changes are still here.";
  if (response.status === 403) return "This action is not permitted. Check that you are signed in with the administrator account.";
  if (response.status === 429 || response.status === 503) {
    const seconds = Number(response.headers.get("retry-after"));
    const wait = Number.isFinite(seconds) && seconds > 0 && seconds <= 3600 ? ` Try again in ${Math.ceil(seconds)} seconds.` : " Please try again shortly.";
    return (response.status === 429 ? "Too many requests." : "This service is temporarily unavailable.") + wait;
  }
  let data: { error?: string; message?: string } = {};
  try { data = await response.json(); } catch { return fallback; }
  if (data?.error === "stale_project" || data?.error === "stale_record") return "This item changed since you opened it. Your edits are still here. Open the latest version in another tab and compare before saving again.";
  if (data?.error === "already_exists") return "This slug is already in use. Choose a different slug and try again.";
  if (data?.error === "invalid_email") return "Enter a valid email address.";
  if (data?.error === "reserved_slug") return "This URL is reserved by the site. Choose a different slug.";
  if (response.status >= 500) return fallback;
  return typeof data?.message === "string" && data.message.length <= 500 && data.message !== data.error ? data.message : fallback;
}
