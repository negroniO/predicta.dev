import { SITE_URL } from "@/app/lib/site";
import { serializeJsonLd } from "@/app/lib/json-ld";
import { publicProjectWhere } from "@/app/lib/public-projects";
// app/homepage-server.tsx
import PageTransition from "./components/PageTransition";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import SubscribeForm from "./components/SubscribeForm";
import CardShell from "./components/CardShell";
import MlHome from "./components/MlHome";
import FeaturedRowCarousel from "./components/FeaturedRowCarousel";




export default async function HomePageServer() {
  const featuredProjects = await prisma.project.findMany({
    where: { featured: true, ...publicProjectWhere },
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    take: 4,
  });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Projects",
          item: `${SITE_URL}/projects`,
        },
      ],
    },

  ];

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      {/* 1) FULL-PAGE HERO */}
      <MlHome />

      {/* 2) REST OF HOMEPAGE CONTENT – scroll target for the hero */}
      <div
        id="homepage-main"
        className="max-w-5xl mx-auto px-4 py-12 space-y-10"
      >
        <CardShell className="p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Featured Projects */}
          <section id="projects" className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">
                Featured projects
              </h2>
              <p className="text-sm text-foreground/80">
                A selection of work focused on payment recovery, collections, and
                finance analytics.
              </p>
            </div>

            {featuredProjects.length === 0 ? (
              <p className="text-xs text-foreground/60">
                No featured projects yet. Mark a project as featured in the admin
                panel to show it here.
              </p>
            ) : (
              <FeaturedRowCarousel projects={featuredProjects} />
            )}

            <div className="pt-3">
              <Link
                href="/projects"
                className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                View all projects →
              </Link>
            </div>
          </section>




          {/* About teaser */}
          <section className="pt-4 border-t border-cardBorder/60 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              A bit about me
            </h2>
            <p className="text-sm text-foreground/80 max-w-3xl">
              I started on the operations side of finance — allocating payments,
              reconciling accounts, resolving disputes, and reducing DSO. Over
              time I moved into FP&amp;A and analytics, combining{" "}
              <strong>finance domain knowledge</strong> with{" "}
              <strong>Python, SQL, forecasting, and BI</strong> to build tools
              that teams actually use.
            </p>
            <p className="text-sm text-foreground/70">
              You can read more about my background on {" "}
              <Link
                href="/about"
                className="text-accent hover:text-accent-2 underline underline-offset-2"
              >
                About
              </Link>{" "}
              page.
            </p>
          </section>

          {/* Subscribe */}
          <section className="pt-4 border-t border-cardBorder/60 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Stay in the loop
            </h2>
            <p className="text-sm text-foreground/80">
              Interested in future projects and write-ups? Leave your email to register your interest.
            </p>
            <SubscribeForm />
          </section>
        </CardShell>
      </div>
    </PageTransition>
  );
}
