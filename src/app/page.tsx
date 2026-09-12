"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { motion } from "motion/react";
import { Columns3, Users, Sparkles, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CursorGlow } from "@/components/marketing/cursor-glow";
import { GradientOrbs } from "@/components/marketing/gradient-orbs";
import { FeatureSpotlight } from "@/components/marketing/feature-spotlight";

const FEATURES = [
  {
    icon: Columns3,
    title: "Pipeline that just works",
    description:
      "Track deals from first touch to close on a Kanban board built for how sales teams actually work.",
  },
  {
    icon: Users,
    title: "Built for your whole team",
    description: "Invite teammates, assign deal owners, and log every call and note in one shared record.",
  },
  {
    icon: Sparkles,
    title: "AI-powered account research",
    description:
      "Firecrawl and Claude generate company and market briefs automatically, so reps walk into every call prepared.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <CursorGlow />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between border-b border-border px-6 py-4"
      >
        <span className="font-semibold">Revenue Engine</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonVariants({ variant: "glow", size: "default" })}>
              Sign up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/pipeline" className={buttonVariants({ variant: "glow", size: "default" })}>
              Go to pipeline
            </Link>
          </Show>
        </div>
      </motion.header>

      <main className="relative flex flex-1 flex-col items-center px-6">
        <GradientOrbs />

        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="flex flex-col items-center py-24 text-center"
        >
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            The sales pipeline CRM for your team
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-4 max-w-md text-lg text-muted-foreground"
          >
            Contacts, companies, and deals in one place — with AI-generated research so every call starts
            prepared.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-8 flex gap-4">
            <Show when="signed-out">
              <Link
                href="/sign-up"
                className={buttonVariants({ variant: "glow", size: "lg", className: "group gap-1.5" })}
              >
                Sign up
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/pipeline"
                className={buttonVariants({ variant: "glow", size: "lg", className: "group gap-1.5" })}
              >
                Go to pipeline
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Show>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex w-full flex-col items-center border-y border-border bg-muted/30 py-16"
        >
          <FeatureSpotlight />
        </motion.div>

        <div className="grid w-full max-w-4xl gap-6 py-24 sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, rotate: i % 2 === 0 ? -0.75 : 0.75 }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <feature.icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Revenue Engine
      </footer>
    </div>
  );
}
