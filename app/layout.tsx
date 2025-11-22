import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  // Base URL for all absolute links
  metadataBase: new URL("https://predicta.dev"),

  // Browser title + template for subpages
  title: {
    default: "predicta.dev | Data & Finance Analytics",
    template: "%s | predicta.dev",
  },

  description:
    "Predicta – portfolio of George Iordanous. FP&A, credit control, data analytics, and machine learning projects in finance and payments.",

  // OpenGraph → LinkedIn, Slack, etc. preview
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

  // Twitter / X card
  twitter: {
    card: "summary_large_image",
    title: "predicta.dev | Data & Finance Analytics",
    description:
      "Predicta – FP&A, collections, and machine learning projects in finance and payments by George Iordanous.",
    images: ["/og-image.png"],
  },

  // Browser tab icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
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
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-700/50 bg-[#132235]/70 backdrop-blur-md sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              {/* Brand name updated */}
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <img
                  src="/favicon-32x32.png"
                  alt="Predicta logo"
                  className="w-5 h-5 opacity-90 hover:opacity-100 transition"
                />
                predicta.dev
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
      </body>
    </html>
  );
}
