// app/homepage-server.tsx
import PageTransition from "./components/PageTransition";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import SubscribeForm from "./components/SubscribeForm";
import FeaturedCarousel from "./components/FeaturedCarousel";
import HomeFall from "./components/HomeFallOut";
import CardShell from "./components/CardShell";
import mlhome from "./components/MlHome";
import MlHome from "./components/MlHome";
import MlScatter from "./components/MlScatter";
import FeaturedRowCarousel from "./components/FeaturedRowCarousel";


export const revalidate = 60;

export default async function HomePageServer() {
  const featuredProjects = await prisma.project.findMany({
    where: { featured: true },
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
          item: "https://predicta.dev/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Projects",
          item: "https://predicta.dev/projects",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "George",
      url: "https://predicta.dev/",
      jobTitle: "FP&A / Data Science",
      worksFor: {
        "@type": "Organization",
        name: "predicta.dev",
      },
      sameAs: [
        "https://predicta.dev/projects",
        "https://predicta.dev/about",
      ],
    },
  ];

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1) FULL-PAGE HERO */}
      <MlHome />

      {/* 2) REST OF HOMEPAGE CONTENT – scroll target for the hero */}
      <main
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
              <FeaturedRowCarousel projects={featuredProjects as any} />
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
              Get the latest project in your inbox with the occasional write-up.
              One field, one click.
            </p>
            <SubscribeForm />
          </section>
        </CardShell>
      </main>
    </PageTransition>
  );
}
