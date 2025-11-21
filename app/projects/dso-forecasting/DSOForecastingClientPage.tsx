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

export default function DSOForecastingClientPage() {
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
        <Link href="/" className="hover:text-cyan-300">Home</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-cyan-300">Projects</Link>
        <span>/</span>
        <span className="text-slate-200">
          Finance Collections &amp; DSO Forecasting
        </span>
      </motion.nav>

      {/* Header */}
      <motion.header variants={item} className="space-y-3">
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
      </motion.header>

      {/* Overview / Quick facts */}
      <motion.section
        variants={item}
        className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]"
      >
        <div className="space-y-4 text-sm text-slate-300">
          <h2 className="text-sm font-semibold text-slate-100">Business Context</h2>
          <p>
            Leadership wanted better visibility into{" "}
            <strong>future cash inflows</strong> and the evolution of{" "}
            <strong>DSO</strong> over time...
          </p>
          <p>
            The goal was to take invoice and AR data and build a simple,
            business-friendly forecasting view...
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
              Python · Prophet · Pandas · Tableau / Power BI
            </p>
          </div>
          <div>
            <p className="font-semibold">Key Outputs</p>
            <p className="text-slate-300">
              Collections forecast · DSO forecast · scenarios
            </p>
          </div>
        </aside>
      </motion.section>

      {/* Data & Method */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Data & Methodology</h2>
        <p className="text-sm text-slate-300">
          The forecasting uses historical invoice and collection data...
        </p>
      </motion.section>

      {/* Forecasting logic */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Forecasting Approach</h2>
        <p className="text-sm text-slate-300">
          The forecasting logic focuses on two main outputs...
        </p>
      </motion.section>

      {/* Visualization */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Visualisation & Usage</h2>
        <p className="text-sm text-slate-300">
          The outputs are simple visuals embedded in BI dashboards...
        </p>
      </motion.section>

      {/* Back + Next */}
      <motion.section variants={item} className="pt-4 flex flex-col gap-2 text-xs">
        <Link href="/projects" className="text-slate-300 hover:text-cyan-300 underline underline-offset-2">
          ← Back to all projects
        </Link>
        <Link href="/projects/payment-recovery-ml" className="text-slate-300 hover:text-cyan-300 underline underline-offset-2">
          Next project: Payment Recovery ML →
        </Link>
      </motion.section>
    </motion.div>
  );
}
