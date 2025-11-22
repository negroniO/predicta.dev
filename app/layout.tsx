import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ScrollToTop from "./components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";  // 👈 NEW

export const metadata: Metadata = {
  metadataBase: new URL("https://predicta.dev"),
  title: {
    default: "predicta.dev | Data & Finance Analytics",
    template: "%s | predicta.dev",
  },
  description:
    "Predicta – portfolio of George Iordanous. FP&A, credit control, data analytics, and machine learning projects in finance and payments.",
  themeColor: "#0d1623",
  openGraph: {
    title: "predicta.dev | Data & Finance Analytics",
    description:
      "Predicta – FP&A, collections, and machine learning projects in finance and payments by George Iordanous.",
    url: "https://predicta.dev",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-[#0d1623] via-[#111c2a] to-[#0d1623] text-slate-100">
        {/* Schema.org JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "George Iordanous",
              jobTitle: "FP&A Analyst / Data Analytics",
              url: "https://predicta.dev",
              image: "https://predicta.dev/logo.svg",
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
          <header className="border-b border-slate-700/50 bg-[#132235]/70 backdrop-blur-md sticky top-0 z-20">
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

              <nav className="flex gap-4 text-sm text-slate-300">
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

          <main className="flex-1">{children}</main>

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
