import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "predicta.dev | Data & Finance Analytics",
  description:
    "Predicta – ML-powered FP&A, collections, and finance analytics projects in payments and financial operations.",
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
              <Link href="/" className="font-semibold tracking-tight">
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
                  href="/#skills"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  Skills
                </Link>
                <Link
                  href="/#finance"
                  className="hover:text-cyan-300 transition-colors duration-150"
                >
                  Finance Use Cases
                </Link>
                <Link
                  href="/#contact"
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
