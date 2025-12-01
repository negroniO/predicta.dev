import Link from "next/link";
import { Mail, Linkedin, Github } from "lucide-react";
import PageTransition from "../components/PageTransition";
import TrackedContactLink from "./TrackedContactLink";
import { prisma } from "@/app/lib/prisma";
import { marked } from "marked";

export async function generateMetadata() {
  const page = await prisma.page.findFirst({
    where: { slug: "contact", status: "published" },
    select: { title: true, excerpt: true },
  });

  return {
    title: page?.title ?? "Contact | predicta.dev",
    description:
      page?.excerpt ??
      "Contact George Iordanous – FP&A, data analytics, and machine learning for finance and payments.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const page = await prisma.page.findFirst({
    where: { slug: "contact", status: "published" },
  });

  const headerTitle = page?.title ?? "Let's get in touch";
  const headerBody =
    page?.excerpt ??
    "You can reach me via email or LinkedIn – I'll usually respond within a couple of days.";
  const contentHtml = page?.content
    ? await marked(page.content)
    : null;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Page header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Contact
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {headerTitle}
          </h1>
          <p className="text-sm text-foreground/70 max-w-2xl">
            {headerBody}
          </p>
        </header>

        {contentHtml && (
          <section
            className="prose prose-invert max-w-none text-sm text-foreground/80"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        {/* Contact cards */}
        <section className="grid gap-6 md:grid-cols-3 text-center">
          {/* Email */}
          <TrackedContactLink
            href="mailto:george.iordanous@hotmail.com?subject=Contact%20from%20predicta.dev"
            className="group rounded-2xl border border-card-border/70 bg-card/70 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/25"
          >
            <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
              <Mail size={28} className="text-cyan-300 group-hover:text-cyan-200" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Email</p>
            <p className="text-xs text-foreground/70 mt-1">
              Click to send me an email
            </p>
          </TrackedContactLink>

          {/* LinkedIn */}
          <TrackedContactLink
            href="https://www.linkedin.com/in/george-iordanous"
            target="_blank"
            className="group rounded-2xl border border-card-border/70 bg-card/70 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/25"
          >
            <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
              <Linkedin
                size={28}
                className="text-cyan-300 group-hover:text-cyan-200"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">LinkedIn</p>
            <p className="text-xs text-foreground/70 mt-1">Connect with me</p>
          </TrackedContactLink>

          {/* GitHub */}
          <TrackedContactLink
            href="https://github.com/negroniO"
            target="_blank"
            className="group rounded-2xl border border-card-border/70 bg-card/70 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/25"
          >
            <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
              <Github
                size={28}
                className="text-cyan-300 group-hover:text-cyan-200"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">GitHub</p>
            <p className="text-xs text-foreground/70 mt-1">See my code</p>
          </TrackedContactLink>
        </section>

        {/* Extra note */}
        <section className="text-xs text-foreground/70 space-y-1">
          <p>
            If you&apos;d like more context before reaching out, you can read more
            about my background on the{" "}
            <Link
              href="/about"
              className="text-accent hover:text-accent-2 underline underline-offset-2"
            >
              About
            </Link>{" "}
            page or explore my{" "}
            <Link
              href="/projects"
              className="text-accent hover:text-accent-2 underline underline-offset-2"
            >
              Projects
            </Link>
            .
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
