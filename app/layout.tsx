import { SITE_URL } from "@/app/lib/site";
import { serializeJsonLd } from "@/app/lib/json-ld";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ScrollToTop from "./components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";  // 👈 NEW
import type { Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "predicta.dev | Data & Finance Analytics",
    template: "%s | predicta.dev",
  },
  description:
    "Predicta – portfolio of George Iordanous. FP&A, credit control, data analytics, and machine learning projects in finance and payments.",
  openGraph: {
    title: "predicta.dev | Data & Finance Analytics",
    description:
      "Predicta – FP&A, collections, and machine learning projects in finance and payments by George Iordanous.",
    url: SITE_URL,
    siteName: "predicta.dev",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "predicta.dev – Data & Finance Analytics by George Iordanous",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "predicta.dev | Data & Finance Analytics",
    description:
      "Predicta – FP&A, collections, and machine learning projects in finance and payments by George Iordanous.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "manifest",
        url: "/site.webmanifest",
      },
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#22d3ee",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2937",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[color:var(--background)] text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-cyan-300">Skip to content</a>
        {/* Schema.org JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "George Iordanous",
              jobTitle: "FP&A Analyst / Data Analytics",
              url: SITE_URL,
              image: `${SITE_URL}/logo.svg`,
              sameAs: [
                "https://www.linkedin.com/in/george-iordanous",
                "https://github.com/negroniO",
              ],
              alumniOf: {
                "@type": "CollegeOrUniversity",
                name: "MSc Data Analytics in Accounting & Finance",
              },
              knowsAbout: [
                "FP&A",
                "Credit Control",
                "Collections",
                "Machine Learning",
                "Finance Analytics",
                "Python",
                "SQL",
                "Forecasting",
                "BI Tools",
              ],
            }),
          }}
        />

        <div className="min-h-screen flex flex-col">
          <header className="border-b border-card-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold tracking-tight"
              >
                <Image
                  src="/logo.svg"
                  alt="Predicta logo"
                  width={20}
                  height={20}
                  className="nav-logo opacity-90"
                  priority
                />
                <span>predicta.dev</span>
              </Link>

              <nav aria-label="Main navigation" className="flex gap-4 text-sm text-slate-300">
                <Link
                  href="/"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  Home
                </Link>
                <Link
                  href="/projects"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  Projects
                </Link>
                <Link
                  href="/about"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>

          <footer className="border-t border-slate-800/70 bg-slate-900/70 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-slate-400 flex justify-between">
              <span>© {new Date().getFullYear()} predicta.dev</span>
              <span>Predicta · Data &amp; Finance Analytics</span>
            </div>
          </footer>
        </div>

        {/* Scroll-to-top floating button */}
        <ScrollToTop />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
