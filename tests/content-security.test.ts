import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../app/lib/content";
import { serializeJsonLd } from "../app/lib/json-ld";

describe("stored content", () => {
  it.each([
    '<script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)">',
    '<a href="jav&#x61;script:alert(1)">link</a>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<svg><textarea><img src=x onerror=alert(1)></textarea></svg>',
    '<textarea></textarea/><img src=x onerror=alert(1)>',
    '<img src="data:image/svg+xml,bad" style="position:fixed" />',
    '<a href="//attacker.test">link</a><form action="javascript:alert(1)"></form>',
  ])("removes executable markup: %s", (input) => {
    const html = renderMarkdown(input);
    expect(html).not.toMatch(/<\/?(?:script|iframe|svg|textarea|form)\b|onerror\s*=|javascript:|data:image|style=|href="\/\//i);
  });

  it("preserves headings, lists, code, links and safe images", () => {
    const html = renderMarkdown('## Heading\n\n- **One**\n\n```js\nconst x = 1;\n```\n\n[Docs](https://example.com)\n\n![Cover](https://example.com/cover.png)');
    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<strong>One</strong>");
    expect(html).toContain('class="language-js"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="https://example.com/cover.png"');
  });

  it("keeps JSON-LD data intact without allowing a script close tag", () => {
    const data = { name: '</script><script>alert("x")</script>' };
    const serialized = serializeJsonLd(data);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
