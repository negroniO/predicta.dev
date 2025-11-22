"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// This comes directly from your working case study animations
const page = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={page}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
