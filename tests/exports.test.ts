import { describe, expect, it } from "vitest";
import { csvCell, escapeXml, referrerLabel } from "../app/lib/export-format";
import { renderFeed } from "../app/lib/feed-format";

describe("CSV exports", () => {
  it("quotes delimiters, doubles quotes and preserves multiline values", () => {
    expect(csvCell('a,"quoted"\r\nsecond line')).toBe('"a,""quoted""\r\nsecond line"');
    expect(csvCell(null)).toBe('""');
  });
  it.each(["=1+1", "+SUM(1,2)", "-1+2", "@SUM(A1)", "  =1", "\t=1", "\r=1", "\n=1", "＝1", "＋1", "－1", "＠SUM(A1)"])("exports formula-like value %j as text", (value) => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
  it("keeps ordinary URLs and dates unchanged inside the quoted field", () => {
    expect(csvCell("https://example.com/a?x=1&y=2")).toBe('"https://example.com/a?x=1&y=2"');
    expect(csvCell("2026-10-03")).toBe('"2026-10-03"');
  });
});

describe("public feeds", () => {
  const project = { slug: "finance", title: 'FP&A <forecast> "]]>"', subtitle: null, description: "Revenue & costs", createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-02T00:00:00Z") };
  it.each(["rss", "atom"] as const)("escapes every content field in %s", (format) => {
    const xml = renderFeed([project], format, "https://example.com");
    expect(xml).toContain("FP&amp;A &lt;forecast&gt; &quot;]]&gt;&quot;");
    expect(xml).toContain("Revenue &amp; costs");
    expect(xml).not.toContain("<![CDATA[");
    expect(xml).not.toContain("<forecast>");
    expect(xml).toContain("https://example.com/projects/finance");
  });
  it("uses the newest update even when a different project is first", () => {
    const xml = renderFeed([project, { ...project, slug: "older", updatedAt: new Date("2026-10-03T00:00:00Z") }], "atom", "https://example.com");
    expect(xml.split("<entry>")[0]).toContain("<updated>2026-10-03T00:00:00.000Z</updated>");
  });
  it("removes invalid XML control characters and lone surrogates, keeping Unicode", () => {
    expect(escapeXml("hello\u0000\u0001\ud800 😀\t\n")).toBe("hello 😀\t\n");
  });
  it("produces a valid timestamp for an empty feed", () => {
    expect(renderFeed([], "atom", "https://example.com")).toContain("1970-01-01T00:00:00.000Z");
  });
});

describe("referrer analytics", () => {
  it.each([[null, "direct"], [" ", "direct"], ["https://example.com/path", "example.com"], ["not a URL", "invalid referrer"], ["/relative", "invalid referrer"], ["javascript:alert(1)", "other"]])("groups %j without crashing", (input, expected) => {
    expect(referrerLabel(input)).toBe(expected);
  });
});
