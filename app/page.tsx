"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[1.5fr_minmax(0,1fr)] items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Data • Finance • Analytics
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            Hi, I&apos;m George{" "}
            <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">
            I work at the intersection of <strong>FP&amp;A</strong>,{" "}
            <strong>credit control</strong>, and{" "}
            <strong>data science</strong>, building tools that improve
            collections, forecasting, and decision-making.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            MSc in Data Analytics in Accounting &amp; Finance · FP&amp;A Analyst ·
            Python, SQL, BI, Machine Learning.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link
              href="#projects"
              className="px-4 py-2 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-medium shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 hover:shadow-cyan-400/40"
            >
              View Projects
            </Link>
            <Link
              href="#contact"
              className="px-4 py-2 rounded-full border border-slate-700/80 hover:border-cyan-400/80 text-slate-200 bg-slate-900/60 backdrop-blur-md transition transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/60"
            >
              Get in touch
            </Link>
          </div>
        </div>

        {/* Hero visual: animated line chart + stats */}
        <div className="rounded-2xl border border-slate-600/60 bg-slate-900/60 backdrop-blur-xl p-4 shadow-2xl shadow-black/60 relative overflow-hidden transition transform hover:-translate-y-1 hover:shadow-cyan-500/30">
          {/* Soft gradient glow background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(94,234,212,0.16),_transparent_55%)]" />
          <div className="relative">
            <h2 className="text-sm font-medium text-slate-200 mb-1.5">
              Collections &amp; DSO snapshot
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Example of the type of forecasting and payment analytics I work on.
            </p>

            {/* Mini animated line chart (SVG) */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-3 mb-3">
              <svg viewBox="0 0 240 80" className="w-full h-24">
                <defs>
                  <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>

                {/* Soft glow under the line */}
                <path
                  d="M5,60 L40,50 L80,55 L120,35 L160,45 L200,30 L235,40"
                  fill="none"
                  stroke="rgba(56,189,248,0.25)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.35"
                />

                {/* Animated line */}
                <path
                  d="M5,60 L40,50 L80,55 L120,35 L160,45 L200,30 L235,40"
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="260"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="260"
                    to="0"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>

            {/* Stats under the chart */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                <p className="text-slate-400">Avg DSO (last 12m)</p>
                <p className="text-base font-semibold text-slate-50 mt-1">42 days</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                <p className="text-slate-400">Recovery rate</p>
                <p className="text-base font-semibold text-emerald-300 mt-1">87.7%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
        <p className="text-sm text-slate-300">
          A selection of work focused on payment recovery, collections, and
          finance analytics.
        </p>

        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25">
            <h3 className="text-sm font-semibold">
              1️⃣ Payment Recovery ML (End-to-End System)
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Predicts which failed / unpaid transactions are likely to be recovered
              and prioritises outreach by expected recovered revenue.
            </p>
            <ul className="mt-2 text-xs text-slate-400 list-disc list-inside space-y-1">
              <li>End-to-end ML pipeline (SQL → features → model → Streamlit app)</li>
              <li>Calibrated Logistic Regression with PR AUC, Brier Score, lift analysis</li>
              <li>Expected value ranking: amount × probability</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-emerald-200/90">
                ML
              </span>
              <span className="px-2 py-1 rounded-full border border-sky-400/70 bg-sky-500/10 text-sky-200/90">
                Finance
              </span>
              <span className="px-2 py-1 rounded-full border border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-200/90">
                Streamlit
              </span>
              <span className="px-2 py-1 rounded-full border border-amber-400/70 bg-amber-500/10 text-amber-200/90">
                SQL
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link
                href="https://github.com/negroniO/payment-recovery-ml"
                target="_blank"
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                GitHub Repo
              </Link>
              <Link
                href="https://payment-recovery-ml.streamlit.app"
                target="_blank"
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                Live App
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25">
            <h3 className="text-sm font-semibold">
              2️⃣ Finance Collections &amp; DSO Forecasting
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Time series forecasting for collections and Days Sales Outstanding (DSO),
              helping finance teams anticipate cash flow and risk.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Built using Prophet and invoice / AR data, producing visual forecasts of
              expected cash inflows and DSO trends.
            </p>
          </article>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Skills & Experience</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 transition transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20">
            <h3 className="text-sm font-semibold mb-2">Technical</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>Python · SQL (PostgreSQL, Presto) · R (basic)</li>
              <li>scikit-learn · time series forecasting (Prophet)</li>
              <li>Feature engineering · model evaluation · calibration</li>
              <li>Streamlit · Tableau · Power BI · advanced Excel</li>
            </ul>
          </div>
         <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 transition transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20">
            <h3 className="text-sm font-semibold mb-2">Finance & Business</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>FP&amp;A: budgeting, variance analysis, forecasting</li>
              <li>Credit control &amp; collections; DSO reduction</li>
              <li>Payment operations: card payments, providers, settlement</li>
              <li>Reporting &amp; KPI dashboards for stakeholders</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Finance Use Cases */}
      <section id="finance" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Finance Use Cases</h2>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Payment recovery &amp; collections prioritisation using ML</li>
          <li>• DSO &amp; cash flow forecasting for planning &amp; treasury</li>
          <li>• Credit control &amp; risk segmentation by payment behaviour</li>
          <li>• BI dashboards automating manual Excel workflows</li>
        </ul>
      </section>

      {/* Contact */}
      <section id="contact" className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
        <p className="text-sm text-slate-300">
          Open to roles in{" "}
          <strong>data analytics</strong>, <strong>data science</strong>, and{" "}
          <strong>finance analytics</strong>.
        </p>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>
            GitHub:{" "}
            <Link
              href="https://github.com/negroniO"
              target="_blank"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              @negroniO
            </Link>
          </li>
          <li>
            LinkedIn:{" "}
            <Link
              href="https://www.linkedin.com/in/george-iordanous"
              target="_blank"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              George Iordanous
            </Link>
          </li>
          <li>Email: <span className="text-slate-100">george.iordanous@hotmail.com</span></li>
        </ul>
      </section>
    </div>
  );
}
