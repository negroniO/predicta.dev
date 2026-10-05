export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  // Force formula-like values to text, including whitespace/full-width variants.
  // CSV has no universal spreadsheet type information; see the release notes.
  if (/^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function escapeXml(value: string): string {
  return value
    // XML 1.0 excludes these control characters and lone UTF-16 surrogates.
    .replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function referrerLabel(value: string | null): string {
  if (!value?.trim()) return "direct";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.hostname : "other";
  } catch {
    return "invalid referrer";
  }
}
