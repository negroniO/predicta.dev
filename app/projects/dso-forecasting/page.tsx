import Link from "next/link";

export const metadata = {
  title: "Collections & DSO Forecasting | Project Case Study",
  description:
    "Time series forecasting of collections and Days Sales Outstanding (DSO) to support FP&A and treasury planning.",
};

export default function DSOForecastingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Case Study
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Finance Collections &amp; DSO Forecasting
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Forecasting <strong>cash collections</strong> and{" "}
          <strong>Days Sales Outstanding (DSO)</strong> to help FP&amp;A and
          treasury teams anticipate liquidity and risk.
        </p>
      </header>

      {/* Overview / Quick facts */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        <div className="space-y-4 text-sm text-slate-300">
          <h2 className="text-sm font-semibold text-slate-100">
            Business Context
          </h2>
          <p>
            Leadership wanted better visibility into{" "}
            <strong>future cash inflows</strong> and the evolution of{" "}
            <strong>DSO</strong> over time. Existing reporting was descriptive:
            it showed historical collections and aging, but not{" "}
            <em>what to expect next month or quarter</em>.
          </p>
          <p>
            The goal was to take invoice and AR data and build a simple,
            business-friendly forecasting view for collections and DSO to
            support planning and scenario discussions.
          </p>
        </div>

        <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 text-xs text-slate-200 space-y-3">
          <div>
            <p className="font-semibold">Role</p>
            <p className="text-slate-300">
              Design &amp; implementation of forecasting logic and visuals
            </p>
          </div>
          <div>
            <p className="font-semibold">Tech Stack</p>
            <p className="text-slate-300">
              Python · Prophet (or similar) · Pandas · BI tooling (Tableau /
              Power BI)
            </p>
          </div>
          <div>
            <p className="font-semibold">Key Outputs</p>
            <p className="text-slate-300">
              Projected collections by month · DSO time series · simple scenarios
            </p>
          </div>
        </aside>
      </section>

      {/* Data & Method */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Data & Methodology
        </h2>
        <p className="text-sm text-slate-300">
          The forecasting is based on historical invoice and collection data,
          typically at a <strong>monthly</strong> granularity:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Invoice issue date, due date, and amount</li>
          <li>Collection date and amount collected</li>
          <li>Aging buckets and write-offs</li>
        </ul>
        <p className="text-sm text-slate-300">
          From this data, I calculated historical{" "}
          <strong>DSO</strong> and <strong>collection curves</strong> (how much
          of a given month&apos;s sales is collected after 30, 60, 90 days,
          etc.), which are then fed into a <strong>time series model</strong>{" "}
          such as Prophet.
        </p>
      </section>

      {/* Forecasting logic */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Forecasting Approach
        </h2>
        <p className="text-sm text-slate-300">
          The forecasting logic focuses on two main outputs:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>
            <strong>Collections forecast</strong>: expected cash inflows by
            month, based on historical collection patterns and seasonality.
          </li>
          <li>
            <strong>DSO forecast</strong>: projected DSO values, showing whether
            receivables efficiency is improving or deteriorating.
          </li>
        </ul>
        <p className="text-sm text-slate-300">
          Rather than optimising for the most complex model, the focus is on
          producing <strong>stable, explainable</strong> forecasts that finance
          stakeholders can understand and trust.
        </p>
      </section>

      {/* Visualisation / usage */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Visualisation & Stakeholder Usage
        </h2>
        <p className="text-sm text-slate-300">
          The outputs are presented as simple visuals:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Line chart of historical vs. forecasted collections</li>
          <li>Line chart of historical vs. forecasted DSO</li>
          <li>
            Tooltips and annotations explaining key changes (e.g. step change
            due to policy, seasonality, or one-off events)
          </li>
        </ul>
        <p className="text-sm text-slate-300">
          These charts can be embedded in <strong>BI dashboards</strong> (Tableau
          or Power BI) or a lightweight <strong>Streamlit app</strong>, giving
          FP&amp;A and treasury a forward-looking view during monthly reviews.
        </p>
      </section>

      {/* Back link */}
      <section className="pt-4">
        <Link
          href="/projects"
          className="text-xs text-slate-300 hover:text-cyan-300 underline underline-offset-2"
        >
          ← Back to all projects
        </Link>
      </section>
    </div>
  );
}
