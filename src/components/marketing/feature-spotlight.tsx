"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SLIDES = [
  {
    title: "Pipeline, visualized",
    description:
      "Drag deals through your stages on a live Kanban board that updates instantly for your whole team.",
  },
  {
    title: "Research, automated",
    description:
      "The moment you add a company, Firecrawl and Claude generate a snapshot brief — no manual digging.",
  },
  {
    title: "Deep-dive on demand",
    description:
      "One click produces a full account or market report with sources, financials, and talking points — exportable as PDF.",
  },
  {
    title: "Team, aligned",
    description:
      "Invite reps and admins, assign deal owners, and keep every note and call logged in one place.",
  },
];

export function FeatureSpotlight() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <div className="relative h-32 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center gap-2 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground">{slide.title}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
