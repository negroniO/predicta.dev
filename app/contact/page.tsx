import Link from "next/link";
import { Mail, Linkedin, Github } from "lucide-react";

export const metadata = {
  title: "Contact | predicta.dev",
  description:
    "Contact George Iordanous – FP&A, data analytics, and machine learning for finance and payments.",
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Page header */}
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Contact
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Let&apos;s get in touch
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          I&apos;m open to roles in data analytics, data science, and finance
          analytics. The best ways to reach me are email and LinkedIn – I&apos;ll
          usually respond within a couple of days.
        </p>
      </header>

      {/* Contact methods */}
      <section className="grid gap-6 md:grid-cols-3 text-center">
        {/* Email */}
        <a
          href="mailto:george.iordanous@hotmail.com?subject=Contact%20from%20predicta.dev"
          className="group rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
            <Mail size={28} className="text-cyan-300 group-hover:text-cyan-200" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">Email</p>
          <p className="text-xs text-slate-400 mt-1">
            Click to send me an email
          </p>
        </a>

        {/* LinkedIn */}
        <Link
          href="https://www.linkedin.com/in/george-iordanous"
          target="_blank"
          className="group rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
            <Linkedin
              size={28}
              className="text-cyan-300 group-hover:text-cyan-200"
            />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">LinkedIn</p>
          <p className="text-xs text-slate-400 mt-1">Connect with me</p>
        </Link>

        {/* GitHub */}
        <Link
          href="https://github.com/negroniO"
          target="_blank"
          className="group rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col items-center shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-cyan-500/20 transition">
            <Github
              size={28}
              className="text-cyan-300 group-hover:text-cyan-200"
            />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-100">GitHub</p>
          <p className="text-xs text-slate-400 mt-1">See my code</p>
        </Link>
      </section>

      {/* Extra note */}
      <section className="text-xs text-slate-400 space-y-1">
        <p>
          If you&apos;d like more context before reaching out, you can read more
          about my background on the{" "}
          <Link
            href="/about"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            About
          </Link>{" "}
          page or explore my{" "}
          <Link
            href="/projects"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            Projects
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
