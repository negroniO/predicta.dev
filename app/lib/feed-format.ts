import { escapeXml } from "./export-format";

type FeedProject = {
  slug: string; title: string; subtitle: string | null; description: string;
  createdAt: Date; updatedAt: Date;
};

export function renderFeed(projects: FeedProject[], format: "rss" | "atom", site: string): string {
  const updated = new Date(Math.max(0, ...projects.map((p) => p.updatedAt.getTime())));
  const entries = projects.map((p) => {
    const url = escapeXml(`${site}/projects/${encodeURIComponent(p.slug)}`);
    const title = escapeXml(p.title);
    const description = escapeXml(p.subtitle || p.description);
    return format === "atom"
      ? `<entry><title>${title}</title><link href="${url}"/><id>${url}</id><published>${p.createdAt.toISOString()}</published><updated>${p.updatedAt.toISOString()}</updated><summary>${description}</summary></entry>`
      : `<item><title>${title}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${p.createdAt.toUTCString()}</pubDate><description>${description}</description></item>`;
  }).join("\n");
  const origin = escapeXml(site);
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  return format === "atom"
    ? `${declaration}\n<feed xmlns="http://www.w3.org/2005/Atom"><title>predicta.dev projects</title><link href="${origin}"/><link href="${origin}/atom" rel="self"/><id>${origin}/atom</id><updated>${updated.toISOString()}</updated><author><name>George Iordanous</name></author>${entries}</feed>`
    : `${declaration}\n<rss version="2.0"><channel><title>predicta.dev projects</title><link>${origin}</link><description>Projects by George Iordanous — finance and data analytics.</description><language>en-gb</language><lastBuildDate>${updated.toUTCString()}</lastBuildDate>${entries}</channel></rss>`;
}
