# CLAUDE.md — Revenue Engine (Sales Pipeline CRM SaaS)

This is the master configuration file for this project. Claude Code reads this file at the **start of every session** — it defines how the project is organized and how work should get done. Keep it current.

The detailed phased build plan lives at `~/.claude/plans/i-want-to-build-dreamy-yeti.md` — check it for the current phase and what's deferred.

## Project Overview

**What this is:** A multi-tenant B2B SaaS sales-pipeline CRM. External customer organizations sign up, pay a subscription, and manage Contacts, Companies, and Deals through a pipeline board with their invited team.

**Core features:**
- Multi-tenant CRM: Contacts, Companies, Deals through pipeline stages (New → Qualified → Proposal → Won/Lost), Kanban board, Activities/notes.
- Org accounts with invited team members and role-based permissions (admin vs. rep).
- Stripe subscription billing — plans, upgrades, account/settings management.
- AI account/market research: Firecrawl-powered scraping + Claude-powered synthesis, auto-triggered as a quick snapshot on new Company creation, and rep-triggered on demand as a full deep-dive (executive summary, key findings w/ sources, financials, leadership, news, competitors, market analysis, talking points). Shown in-app on a Research tab and exported as versioned Markdown/PDF. Runs as background jobs with caching to avoid redundant runs.
- Responsive web app, installable as a PWA. Native mobile wrapper is a future evaluation, not built yet.

**Primary users:** Sales reps and admins at customer organizations (agencies/businesses that buy this CRM).

---

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript), deployed on Vercel.
- **Database:** Postgres (Neon) via Prisma ORM.
- **Multi-tenancy:** Shared database, every tenant-scoped table has an `organizationId` column, scoping enforced in the app/query layer (no Postgres RLS) via a `requireOrgContext()` helper every query/action goes through.
- **Auth / org / invites / roles:** Clerk, using Clerk Organizations (`org:admin`/`org:member` map to admin/rep). Clerk webhook mirrors Organization/User/Membership into Postgres.
- **Billing:** Stripe (Checkout + Customer Portal + webhooks). Not required for the first shippable milestone — early customers onboard manually/invoiced first.
- **Background jobs:** Inngest (step functions for the research pipeline).
- **Research LLM:** Claude API (Anthropic Messages API) for synthesizing scraped content into structured research briefs.
- **Web scraping/search:** Firecrawl (`@mendable/firecrawl-js`), key read from `FIRECRAWL_API_KEY`.
- **File storage:** Vercel Blob, for versioned research Markdown/PDF exports.
- **Testing:** Vitest (unit), Playwright (e2e).

## Accounts already provisioned

Clerk, Stripe, and Vercel accounts already exist for this project. Neon (or another Postgres host) still needs to be set up — do this as part of Phase 2 scaffolding.

## Folder Structure (target, once scaffolded)

| Path | Purpose |
|---|---|
| `/CLAUDE.md` | This file — master config, read at session start |
| `/prisma/schema.prisma` | Data model (Organization, Membership, Company, Contact, Deal, Activity, PipelineStage, ResearchBrief) |
| `/src/app/` | Next.js routes: marketing, auth, the org-scoped app shell, API routes/webhooks |
| `/src/server/` | `db.ts` (Prisma client), `auth.ts` (`requireOrgContext()`), `queries/`, `actions/` — all org-scoped data access |
| `/src/components/` | UI components (pipeline board, shared design system) |
| `/.env` | API keys and secrets — **never commit this file** |

The old `/workflows/`, `/tools/`, `/temp/` WAT-framework layout from this project's earlier n8n-recruitment-automation concept is retired — this repo is now a standard Next.js app.

---

## Secrets & Credentials

- All API keys and secrets live in `.env` at the project root (`.env.example` documents the required keys without values).
- `.env` is listed in `.gitignore` and must never be committed.
- Never hardcode credentials in app code — reference environment variables instead.
- Required keys (added as each phase needs them): `DATABASE_URL`, `CLERK_SECRET_KEY`/`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (Phase 4), `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY`, `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` (Phase 5), `BLOB_READ_WRITE_TOKEN` (Phase 5).

## Multi-Tenancy Rule (critical — do not violate)

Every Prisma query touching a tenant-scoped table must go through `src/server/queries/*` helpers that take `organizationId` as a mandatory first argument, resolved via `requireOrgContext()`. No query helper should accept an implicit or global scope. This is the only isolation mechanism between customer organizations (no Postgres RLS) — treat it as a security boundary, not a convention.

## Conventions

- **Naming:** standard Next.js App Router conventions; server actions in `src/server/actions/<domain>.ts`, query helpers in `src/server/queries/<domain>.ts`.
- **Error handling:** background job steps (Inngest) mark `status=FAILED` on error rather than throwing silently; UI surfaces a retry affordance.
- **Version control:** this repo, via git (initialized in Phase 2).

## Debugging Notes

Log recurring issues and their fixes here so they don't get re-solved from scratch.

- **Prisma 7 dropped `datasource.url` in `schema.prisma`.** Connection config now lives in `prisma.config.ts` (`defineConfig({ datasource: { url: env("DATABASE_URL") } })`), and `PrismaClient` requires an explicit driver adapter — we use `@prisma/adapter-pg` + `pg` in `src/server/db.ts`. `prisma.config.ts` must `import "dotenv/config"` itself since the CLI's config loader does not auto-load `.env`.
- **Vercel skips npm lifecycle scripts by default** (npm's `allow-scripts` gate), so `prisma generate` never ran on deploy until we added an explicit `"postinstall": "prisma generate"` to `package.json`. Without it, `@prisma/client` builds successfully locally (where `prisma generate` was run manually) but fails to type-check/build on Vercel with "no exported member 'PrismaClient'".
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** (same file convention, default-exported function can keep any name). Old tutorials/docs referencing `middleware.ts` are stale for this Next version.
- **Clerk "Core 3" (released 2026-03-03) removed `<SignedIn>`/`<SignedOut>`/`<Protect>`** from `@clerk/nextjs` — replaced by a single `<Show when="signed-in">` / `<Show when="signed-out">` / `<Show when={{role:...}}>` component. Old Clerk examples using the removed components will throw at build time.
- **shadcn/ui's Base UI `Select` doesn't auto-derive the trigger label from `SelectItem` children** the way Radix's did — pass an `items={[{value, label}]}` array to `<Select items={...}>` or the trigger displays the raw value (e.g. a database id) instead of the human-readable label.
- **shadcn `init -d` can write a self-referential `--font-sans: var(--font-sans)` into `globals.css`**, breaking font loading under Tailwind v4 (`@theme inline` resolves at parse time, not runtime). Fix: use literal font-family strings (`"Geist", "Geist Fallback", ...`) instead of `var(...)`, and keep the `next/font` variable classNames on `<html>`, not `<body>`.
- **`next-pwa`/`@ducanh2912/next-pwa` don't work with Turbopack** (Next 16's default bundler) — they inject a service worker via a webpack plugin (`config.webpack = ...` in `next.config.ts`), which Turbopack never executes, so the plugin silently no-ops. PWA support (`public/manifest.json`, `public/sw.js`, registration) is hand-rolled instead: cache-first for `/_next/static/*` and image/font assets, network-only for everything else (pages/API), registered from `src/components/service-worker-registration.tsx`.
- **`src/proxy.ts`'s static-file bypass regex deliberately excludes `.json`** (via a `js(?!on)` negative lookahead, so `.json` "API-like" paths still go through Clerk's `auth.protect()`). This silently 404s any real public `.json` file for signed-out visitors — `/manifest.json` had to be added to the explicit `isPublicRoute` list rather than relying on the extension bypass.

## Optimization Backlog

- Per-org customizable pipeline stages (MVP ships with a fixed 5-stage default).
- Rate-limiting/monitoring Firecrawl credit usage for auto-snapshot at scale (every Company creation across every tenant burns credits).
- Capping scraped-source count / truncating content before Claude synthesis to control deep-dive cost.

## Open Questions / Decisions Needed

- None currently — see the phased plan's "Risks / Open Questions" section for items to revisit before launch (Clerk pricing at scale, Stripe test→live cutover).

---
*Keep this file current — when you add a workflow, tool, or fix a gnarly bug, note it here.*

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
