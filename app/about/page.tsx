import Link from "next/link";
import PageTransition from "../components/PageTransition";
import { prisma } from "@/app/lib/prisma";
import { marked } from "marked";

export async function generateMetadata() {
  const page = await prisma.page.findFirst({
    where: { slug: "about", status: "published" },
    select: { title: true, excerpt: true },
  });

  return {
    title: page?.title ?? "About | predicta.dev",
    description:
      page?.excerpt ??
      "About George Iordanous – FP&A analyst specialising in data-driven collections, forecasting, and payment analytics.",
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const page = await prisma.page.findFirst({
    where: { slug: "about", status: "published" },
  });

  const html = page?.content ? await marked(page.content) : null;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {page ? (
          <>
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                About
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {page.title}
              </h1>
              {page.excerpt && (
                <p className="text-sm text-foreground/80 max-w-2xl">{page.excerpt}</p>
              )}
            </header>
            {html ? (
              <section
                className="prose prose-invert max-w-none text-sm text-foreground/85"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : null}
          </>
        ) : (
          <>
        {/* Page header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            About
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            About George Iordanous
          </h1>
          <p className="text-sm text-foreground/80 max-w-2xl">
            FP&amp;A analyst with a background in credit control and a master&apos;s
            degree in Data Analytics in Accounting &amp; Finance. I specialise in
            using data, forecasting, and machine learning to improve{" "}
            <strong>collections</strong>, <strong>cash flow visibility</strong>,
            and <strong>decision-making</strong> in finance.
          </p>
        </header>

        {/* Current role / focus */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-3 text-sm text-foreground/80">
            <h2 className="text-sm font-semibold text-slate-100">
              What I do today
            </h2>
            <p>
              I currently work as an <strong>FP&amp;A analyst</strong>, building
              reports, forecasts, and tools that help finance and leadership teams
              understand performance and make better decisions.
            </p>
            <p>
              Before moving into FP&amp;A, I spent several years in{" "}
              <strong>credit control and billing</strong>, working directly with
              payment allocation, reconciliations, VAT issues, and customer
              queries. That experience shaped how I think about{" "}
              <strong>collections, DSO, and risk</strong> in a very practical way.
            </p>
            <p>
              Today I combine that finance domain knowledge with{" "}
              <strong>Python, SQL, BI tools, and ML</strong> to build end-to-end
              analytics and forecasting workflows.
            </p>
          </div>

        </section>

        {/* Journey */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            My journey into data &amp; finance analytics
          </h2>
          <div className="space-y-2 text-sm text-foreground/80">
            <p>
              I started on the <strong>operations side of finance</strong> –
              allocating payments, reconciling accounts, resolving disputes, and
              chasing overdue invoices. Working with real customers and real cash
              taught me how important it is to have{" "}
              <strong>accurate, actionable data</strong> instead of static Excel
              files.
            </p>
            <p>
              Over time, I found myself automating reports, exploring data in{" "}
              <strong>Excel, R, and Python</strong>, and asking questions like:
              &quot;Which customers are most at risk?&quot; or
              &quot;What patterns predict whether a failed payment will be
              recovered?&quot;
            </p>
            <p>
              That curiosity led me to complete my{" "}
              <strong>MSc in Data Analytics in Accounting &amp; Finance</strong>,
              and to focus more on <strong>analytics, forecasting, and ML</strong>{" "}
              as part of my day-to-day work.
            </p>
          </div>
        </section>

        {/* Education / Certifications */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Education / Certifications
          </h2>
          <ul className="text-sm text-foreground/80 list-disc list-inside space-y-1">
            <li>
              <strong>MSc Data Analytics in Accounting &amp; Finance</strong> – European University of Cyprus
            </li>
            <li>
              <strong>BS Science of Economics</strong> - University of Cyprus
            </li>
            <li>
              <strong>IBM Data Science Certificate</strong> – via Coursera
            </li>
          </ul>
        </section>

        {/* Links */}
        <section className="pt-2 text-sm text-foreground/80 space-y-2">
          <p>
            You can explore my work in more detail on the{" "}
            <Link
              href="/projects"
              className="text-accent hover:text-accent-2 underline underline-offset-2"
            >
              Projects
            </Link>{" "}
            page.
          </p>
          <p>
            If you&apos;d like to connect, feel free to{" "}
            <Link
              href="/contact"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              get in touch
            </Link>{" "}
          </p>
        </section>
          </>
        )}
      </div>
    </PageTransition>
  );
}
