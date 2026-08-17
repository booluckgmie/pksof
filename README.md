# Prokhas Group Performance Dashboard

React + TypeScript + Vite dashboard covering the 19 BRS-specified screens across Corporate
Performance, Financial Health, and Resource & People, with role-based pillar isolation and a
maker-checker (Submit → Verify → Publish) data-entry workflow.

## Data layer

KPI/entity/period reference data lives in `src/data/*.ts`. Live dashboard figures and the
submission workflow are backed by Supabase (`src/lib/workflow.tsx`, `src/lib/api/*.ts`) —
see [supabase/README.md](./supabase/README.md) for schema setup.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in your Supabase project URL + publishable key
pnpm dev
```

Run the migration and seed in `supabase/` (via the Supabase SQL Editor, or the Supabase CLI)
before starting the app, or every screen will show "no submissions published yet".

## Scripts

- `pnpm dev` — local dev server
- `pnpm build` — typecheck + production build
- `pnpm lint` — Oxlint
