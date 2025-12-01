import { prisma } from "@/app/lib/prisma";
import PageTransition from "@/app/components/PageTransition";
import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const entry = await prisma.page.findFirst({
    where: { slug: page, status: "published" },
    select: { title: true, excerpt: true },
  });

  if (!entry) return {};

  return {
    title: entry.title,
    description: entry.excerpt ?? undefined,
    alternates: { canonical: `/${page}` },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;

  // Skip slugs handled by other routes explicitly
  if (["about", "contact", "projects", "admin"].includes(page)) {
    notFound();
  }

  const entry = await prisma.page.findFirst({
    where: { slug: page, status: "published" },
  });

  if (!entry) {
    notFound();
  }

  const html = entry.content ? await marked(entry.content) : null;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Page
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {entry.title}
          </h1>
          {entry.excerpt && (
            <p className="text-sm text-slate-300 max-w-2xl">{entry.excerpt}</p>
          )}
        </header>

        {html ? (
          <section
            className="prose prose-invert max-w-none text-sm text-slate-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-sm text-slate-400">No content yet.</p>
        )}

        <div className="pt-2 text-xs text-slate-500">
          <Link
            href="/"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
