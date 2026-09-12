"use client";

import { motion } from "motion/react";

const ORBS = [
  { className: "left-[8%] top-[10%] size-72 bg-primary/30", duration: 18 },
  { className: "right-[12%] top-[30%] size-96 bg-emerald-400/20", duration: 24 },
  { className: "left-[38%] bottom-[8%] size-64 bg-primary/20", duration: 20 },
];

export function GradientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
