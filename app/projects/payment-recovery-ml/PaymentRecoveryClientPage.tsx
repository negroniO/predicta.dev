"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export default function PaymentRecoveryClientPage() {
  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-10 space-y-8"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Breadcrumb */}
      <motion.nav
        variants={item}
        className="text-[11px] text-slate-400 mb-1 flex flex-wrap items-center gap-1"
      >
        <Link href="/" className="hover:text-cyan-300">
          Home
        </Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-cyan-300">
          Projects
        </Link>
        <span>/</span>
        <span className="text-slate-200">
          Payment Recovery ML (End-to-End System)
        </span>
      </motion.nav>

      {/* Header */}
      <motion.header variants={item} className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Case Study
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Payment Recovery ML (End-to-End System)
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Predicting which failed / unpaid card transactions are likely to be
          recovered, and prioritising collections outreach by{" "}
          <strong>expected recovered revenue</strong>.
        </p>
      </motion.header>

      {/* Overview / Quick facts */}
      <motion.section
        variants={item}
        className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]"
      >
        <div className="space-y-4 text-sm text-slate-300">
          <h2 className="text-sm font-semibold text-slate-100">
            Business Context
          </h2>
          <p>
            The business had a large volume of{" "}
            <strong>failed card payments</strong> and unpaid invoices handled
            manually by the credit control team. Every day, new failed
            transactions came in, and the team had to decide who to call or
            email first with limited time.
          </p>
          <p>
            The goal was to use <strong>machine learning</strong> to estimate the{" "}
            <strong>probability of recovery</strong> for each failed
            transaction, and then rank them by{" "}
            <strong>expected recovered amount</strong> (amount × probability).
            This allows the team to focus effort where it generates the most
            value.
          </p>
        </div>

        <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 text-xs text-slate-200 space-y-3">
          <div>
            <p className="font-semibold">Role</p>
            <p className="text-slate-300">
              End-to-end individual contributor (data, modelling, app)
            </p>
          </div>
          <div>
            <p className="font-semibold">Tech Stack</p>
            <p className="text-slate-300">
              Python · scikit-learn · Pandas · SQL · Streamlit
            </p>
          </div>
          <div>
            <p className="font-semibold">Key Techniques</p>
            <p className="text-slate-300">
              Logistic Regression · calibration · PR AUC · Brier Score · lift
              analysis
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link
              href="https://github.com/negroniO/payment-recovery-ml"
              target="_blank"
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-medium hover:bg-slate-200"
            >
              GitHub Repo
            </Link>
          </div>
        </aside>
      </motion.section>

      {/* Data & Features */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Data &amp; Feature Engineering
        </h2>
        <p className="text-sm text-slate-300">
          I combined transactional and customer data to build features around:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Payment amount, currency, provider, and card type</li>
          <li>
            Historical behaviour: past successful / failed payments per customer
          </li>
          <li>Time since invoice, invoice age, and days outstanding</li>
          <li>
            Aggregated risk signals (e.g. previous write-offs, chargebacks,
            disputes)
          </li>
        </ul>
        <p className="text-sm text-slate-300">
          The features were engineered in <strong>SQL</strong>, then exported to
          Python for modelling. Care was taken to avoid target leakage by using
          only information available at the time of the failure.
        </p>
      </motion.section>

      {/* Modelling approach */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Modelling Approach
        </h2>
        <p className="text-sm text-slate-300">
          I chose a <strong>Logistic Regression</strong> classifier as a strong,
          interpretable baseline and focused on building a{" "}
          <strong>well-calibrated model</strong> rather than a black-box with
          marginally higher raw accuracy.
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Train / validation split with time-aware folds</li>
          <li>
            Evaluation focused on <strong>PR AUC</strong> due to class imbalance
          </li>
          <li>
            <strong>Brier Score</strong> and calibration curves to validate
            probability estimates
          </li>
          <li>
            <strong>Lift analysis</strong> to understand business impact by
            decile (top X% of scored accounts)
          </li>
        </ul>
        <p className="text-sm text-slate-300">
          The final model produced <strong>well-calibrated probabilities</strong>{" "}
          that can be used directly to compute expected recovered revenue per
          transaction.
        </p>
      </motion.section>

      {/* Impact */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Business Impact &amp; Usage
        </h2>
        <p className="text-sm text-slate-300">
          In the Streamlit app, each failed transaction appears with:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Probability of recovery (0–100%)</li>
          <li>Amount and expected recovered revenue (amount × probability)</li>
          <li>Ranked priority within the daily worklist</li>
        </ul>
        <p className="text-sm text-slate-300">
          This allows the credit control team to:
        </p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>
            Focus on accounts with both <strong>high probability</strong> and{" "}
            <strong>high amount</strong>
          </li>
          <li>
            Quickly see “easy wins” vs. low-probability / low-value cases
          </li>
          <li>
            Better justify prioritisation decisions with <strong>data</strong>,
            not intuition alone
          </li>
        </ul>
      </motion.section>

      {/* Back + Next project */}
      <motion.section
        variants={item}
        className="pt-4 flex flex-col gap-2 text-xs"
      >
        <Link
          href="/projects"
          className="text-slate-300 hover:text-cyan-300 underline underline-offset-2"
        >
          ← Back to all projects
        </Link>
        <Link
          href="/projects/dso-forecasting"
          className="text-slate-300 hover:text-cyan-300 underline underline-offset-2"
        >
          Next project: Finance Collections &amp; DSO Forecasting →
        </Link>
      </motion.section>
    </motion.div>
  );
}
