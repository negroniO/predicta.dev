import Link from "next/link";

export const metadata = {
  title: "About | predicta.dev",
  description:
    "About George Iordanous – FP&A analyst specialising in data-driven collections, forecasting, and payment analytics.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Page header */}
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          About
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          About George Iordanous
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          FP&amp;A analyst with a background in credit control and a master&apos;s
          degree in Data Analytics in Accounting &amp; Finance. I specialise in
          using data, forecasting, and machine learning to improve{" "}
          <strong>collections</strong>, <strong>cash flow visibility</strong>,
          and <strong>decision-making</strong> in finance.
        </p>
      </header>

      {/* Current role / focus */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3 text-sm text-slate-300">
          <h2 className="text-sm font-semibold text-slate-100">
            What I do today
          </h2>
          <p>
            I currently work as an <strong>FP&amp;A analyst</strong>, building
            reports, forecasts, and tools that help finance and leadership teams
            understand performance and make better decisions.
          </p>
          <p>
            Before moving into FP&amp;A, I spent several years in{" "}
            <strong>credit control and billing</strong>, working directly with
            payment allocation, reconciliations, VAT issues, and customer
            queries. That experience shaped how I think about{" "}
            <strong>collections, DSO, and risk</strong> in a very practical way.
          </p>
          <p>
            Today I combine that finance domain knowledge with{" "}
            <strong>Python, SQL, BI tools, and ML</strong> to build end-to-end
            analytics and forecasting workflows.
          </p>
        </div>

        <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 text-xs text-slate-200 space-y-2 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25">
          <h3 className="text-xs font-semibold text-slate-100 mb-1">
            Snapshot
          </h3>
          <ul className="space-y-1">
            <li>🎓 MSc Data Analytics in Accounting &amp; Finance</li>
            <li>📊 FP&amp;A &amp; collections experience in transportation / payments</li>
            <li>🧮 Python, SQL, forecasting, BI dashboards</li>
            <li>💳 Focus on payments, failed transactions, and AR</li>
          </ul>
        </aside>
      </section>

      {/* Journey */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          My journey into data &amp; finance analytics
        </h2>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            I started on the <strong>operations side of finance</strong> –
            allocating payments, reconciling accounts, resolving disputes, and
            chasing overdue invoices. Working with real customers and real cash
            taught me how important it is to have{" "}
            <strong>accurate, actionable data</strong> instead of static Excel
            files.
          </p>
          <p>
            Over time, I found myself automating reports, exploring data in{" "}
            <strong>Excel, R, and Python</strong>, and asking questions like:
            &quot;Which customers are most at risk?&quot; or
            &quot;What patterns predict whether a failed payment will be
            recovered?&quot;
          </p>
          <p>
            That curiosity led me to complete my{" "}
            <strong>MSc in Data Analytics in Accounting &amp; Finance</strong>,
            and to focus more on <strong>analytics, forecasting, and ML</strong>{" "}
            as part of my day-to-day work.
          </p>
        </div>
      </section>

      {/* How I work */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          How I like to work
        </h2>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>
            Start from the <strong>business question</strong> (cash, risk,
            growth), not from a model.
          </li>
          <li>
            Build <strong>clean datasets</strong> in SQL first – then model or
            visualise.
          </li>
          <li>
            Prefer <strong>interpretable, explainable</strong> models when they
            are &quot;good enough&quot; for the decision.
          </li>
          <li>
            Turn analysis into <strong>tools</strong>: dashboards, apps, or
            simple workflows that teams can actually use.
          </li>
        </ul>
      </section>

      {/* What I'm interested in */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          What I&apos;m interested in next
        </h2>
        <p className="text-sm text-slate-300">
          I&apos;m especially interested in roles where I can sit between{" "}
          <strong>finance</strong> and <strong>data</strong> – for example:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Data analyst / analytics engineer in a finance or payments team</li>
          <li>Data scientist focusing on risk, churn, or revenue forecasting</li>
          <li>
            FP&amp;A / finance analytics roles with strong ownership of data
            models and reporting
          </li>
        </ul>
      </section>

      {/* Links */}
      <section className="pt-2 text-sm text-slate-300 space-y-2">
        <p>
          You can explore my work in more detail on the{" "}
          <Link
            href="/projects"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            Projects
          </Link>{" "}
          page.
        </p>
        <p>
          If you&apos;d like to connect, feel free to{" "}
          <Link
            href="/contact"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            get in touch
          </Link>{" "}
          via email or LinkedIn.
        </p>
      </section>
    </div>
  );
}
