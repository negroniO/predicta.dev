import Link from "next/link";

const projects = [
  {
    id: 1,
    title: "Payment Recovery ML (End-to-End System)",
    badge: "Flagship",
    description:
      "Predicts which failed / unpaid transactions are likely to be recovered and prioritises outreach by expected recovered revenue.",
    bullets: [
      "End-to-end ML pipeline (SQL → features → model → Streamlit app)",
      "Calibrated Logistic Regression with PR AUC, Brier Score, lift analysis",
      "Expected value ranking: amount × probability to maximise recovered revenue",
    ],
    tags: ["ML", "Finance", "Streamlit", "SQL"],
    caseStudyHref: "/projects/payment-recovery-ml",
    links: [
      {
        label: "GitHub Repo",
        href: "https://github.com/negroniO/payment-recovery-ml",
      },
      {
        label: "Live Streamlit App",
        href: "https://payment-recovery-ml.streamlit.app",
      },
    ],
  },
  {
    id: 2,
    title: "Finance Collections & DSO Forecasting",
    description:
      "Time series forecasting for collections and Days Sales Outstanding (DSO), helping finance teams anticipate cash flow and risk.",
    bullets: [
      "Built using Prophet and invoice / AR data",
      "Produces visual forecasts of expected cash inflows and DSO trends",
      "Supports FP&A and treasury planning with scenario-style views",
    ],
    tags: ["Time Series", "Finance", "Prophet"],
    caseStudyHref: "/projects/dso-forecasting",
    links: [],
  },
  {
    id: 3,
    title: "SQL Analytics & BI Dashboards",
    description:
      "SQL-based analytical views and dashboards for AR, collections, and operations, consumed in Tableau / Power BI.",
    bullets: [
      "Heavy use of window functions, cohort logic, and aggregations",
      "Aging buckets, collection performance, and payment behaviour segmentation",
      "Designed for self-service exploration by non-technical stakeholders",
    ],
    tags: ["SQL", "BI", "Finance"],
    caseStudyHref: undefined,
    links: [],
  },
];

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Portfolio
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Projects
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          A deeper look at the projects I&apos;ve built across{" "}
          <strong>payment recovery</strong>, <strong>collections</strong>,{" "}
          <strong>cash flow forecasting</strong>, and{" "}
          <strong>analytics engineering</strong>.
        </p>
      </header>

      {/* Project Cards */}
      <div className="space-y-5">
        {projects.map((p) => (
          <article
            key={p.id}
            className="
              rounded-2xl border border-slate-600/60 bg-slate-900/60 backdrop-blur-xl
              p-5 shadow-lg shadow-black/40 
              transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30
            "
          >
            {/* Title + Badge */}
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-50">
                {p.title}
              </h2>
              {p.badge && (
                <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-1 rounded-full border border-cyan-400/70 bg-cyan-500/10 text-cyan-200/90">
                  {p.badge}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-2 text-sm text-slate-300">{p.description}</p>

            {/* Bullets */}
            {p.bullets.length > 0 && (
              <ul className="mt-3 text-xs text-slate-300 space-y-1 list-disc list-inside">
                {p.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full border border-slate-600/80 bg-slate-900/70 text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Links */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {p.caseStudyHref && (
                <Link
                  href={p.caseStudyHref}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-medium shadow-md shadow-cyan-500/30 transition"
                >
                  View case study
                </Link>
              )}

              {p.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Footer note */}
      <div className="pt-4 text-xs text-slate-400">
        <p>
          More projects (e.g. SQL notebooks, BI dashboards, and smaller
          experiments) are available on{" "}
          <Link
            href="https://github.com/negroniO"
            target="_blank"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            GitHub
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
