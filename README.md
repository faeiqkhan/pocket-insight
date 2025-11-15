# Pocket Insight — Documentation

A complete, developer-focused guide for the Pocket Insight front-end application. This document is written like a concise handbook you can read through as if it were a short book: it explains the purpose of the project, how it is organized, how to run and extend it, and practical guidance for contributing and deploying.

---

Table of contents

1. Introduction
2. Philosophy & goals
3. Quick start
4. Project architecture
5. Folder structure (guided tour)
6. Key dependencies and why they were chosen
7. Pages and user flows
8. Core components and UI primitives
9. State, data fetching, and backend integration
10. Local development workflow
11. Production build & deployment
12. Tests, linting & type checks
13. Troubleshooting & common issues
14. Contributing guidelines
15. Roadmap & next steps
16. Appendix: Environment variables and SQL migrations

---

1. Introduction

Pocket Insight is a single-page application (SPA) for personal expense tracking with lightweight analytics. It focuses on simple, modern UI patterns, a component-driven design system, and optional cloud-backed storage via Supabase.

This documentation explains the codebase and provides practical steps to run, develop, and extend the project.


2. Philosophy & goals

- Fast and delightful developer experience (Vite + TypeScript).
- Reusable, accessible UI primitives built on Radix + Tailwind CSS.
- Local-first UX with optional cloud sync via Supabase.
- Small, testable pieces: hooks, contexts, and low-level UI primitives.


3. Quick start

Prerequisites:
- Node.js (recommended LTS) and npm, or pnpm/yarn if preferred.

Install dependencies (PowerShell):

npm install

Create environment variables (see Appendix). Run dev server:

npm run dev

Open the app in the browser (Vite prints the URL; usually http://localhost:5173).

Build for production:

npm run build
npm run preview


4. Project architecture

High-level layers:

- UI layer — `src/components` and `src/components/ui` contain presentational and primitive components.
- Pages / Routes — `src/pages` contains route-level screens (Dashboard, AddExpense, History, Analytics, Auth, Index, NotFound).
- Domain utilities — `src/lib` holds calculations, category definitions, storage helpers, and generic utilities.
- Integrations — `src/integrations/supabase` contains the Supabase client and typed interfaces.
- State & orchestration — `src/contexts` (AuthContext) and React Query manage auth and server data.


5. Folder structure (guided tour)

- `public/` — static assets
- `src/main.tsx` — React entry, global providers, and router mounting
- `src/App.tsx` — top-level routes and layout wiring
- `src/pages/*` — route pages
- `src/components/` — reusable components (BottomNav, ExpenseCard, UserMenu, ProtectedRoute, NavLink)
- `src/components/ui/` — low-level shadcn-style primitives (button, input, dialog, toast, etc.)
- `src/contexts/` — context providers (e.g., `AuthContext.tsx`)
- `src/hooks/` — custom hooks (use-mobile, use-toast)
- `src/integrations/supabase/` — Supabase client and types
- `src/lib/` — utilities and helpers
- `supabase/migrations/` — SQL migration files


6. Key dependencies and why they were chosen

- React + TypeScript: typed UI and great DX.
- Vite: blazing-fast dev server and build.
- Tailwind CSS: utility-first styling.
- Radix UI + shadcn-style primitives: accessible, composable UI building blocks.
- @tanstack/react-query: server-state, caching, and background updates.
- Supabase JS: Postgres-backed auth and storage.
- react-hook-form + zod: form handling and validation.
- Recharts: charts for analytics.


7. Pages and user flows

- Index (Landing): landing or redirect.
- Auth: sign-in / sign-up flows (Supabase-backed).
- Dashboard: recent activity and quick actions.
- AddExpense: form to add expenses (category, amount, date, notes).
- History: list of past expenses.
- Analytics: charts and breakdowns by category and date.
- NotFound: 404 route.

Common flow examples:
- Sign in -> session stored in `AuthContext` -> React Query fetches user expenses -> pages render.
- Add expense -> local validation -> Supabase insert -> React Query invalidates queries to refresh UI.


8. Core components and UI primitives

- ExpenseCard: shows expense details and actions.
- BottomNav: mobile navigation.
- UserMenu: account actions and sign-out.
- ProtectedRoute: guards authenticated routes.
- `src/components/ui/*`: low-level primitives; reuse them for consistent UI.


9. State, data fetching, and backend integration

- `AuthContext` manages user session and auth helpers.
- `src/integrations/supabase/client.ts` initializes Supabase client using Vite env vars.
- Use React Query for queries and mutations. Invalidate queries after mutations to keep UI fresh.
- Local storage helpers in `src/lib` provide offline resilience and optimistic UX patterns.


10. Local development workflow

- Start: `npm install` then `npm run dev`.
- Lint: `npm run lint`.
- Type check: `tsc --noEmit`.
- Add pages by creating files under `src/pages` and wiring routes in `App.tsx`.


11. Production build & deployment

- Build: `npm run build` creates `dist/`.
- Preview: `npm run preview`.
- Deploy `dist/` to static hosts (Vercel, Netlify) or S3+CloudFront.
- Ensure environment variables are configured in the hosting platform.


12. Tests, linting & type checks

- ESLint configured (`npm run lint`).
- Add unit and component tests using Vitest + React Testing Library (recommended).
- Add CI workflow to run lint and type checks on PRs.


13. Troubleshooting & common issues

- Supabase connection issues: verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Tailwind not applied: ensure `index.css` includes Tailwind directives and `tailwind.config.ts` content globs cover `src/**/*`.
- SPA routing 404s: configure hosting to rewrite unknown paths to `index.html`.
- Type errors: run `tsc` and adjust types in `src/integrations/supabase/types.ts` or `src/lib/types.ts`.


14. Contributing guidelines

- Fork, branch, and open PRs against `main`.
- Run linting and type checks before commit.
- Keep PRs focused and add descriptions and related issue references.
- Add migration SQL to `supabase/migrations/` when changing DB schema.


15. Roadmap & next steps

- Add tests and CI pipeline.
- Add offline sync and conflict resolution.
- Expand analytics and export features.
- Add budgets and alerts.
- Support multi-user workspaces.


16. Appendix: Environment variables and SQL migrations

Recommended `.env.example` variables:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Check `src/integrations/supabase/client.ts` for exact variable names used by the client.

Migrations:
- See `supabase/migrations/` for SQL files. Apply them in your Supabase project.


If you want, I can also:
- generate a `.env.example` and add it to the repo;
- add `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`;
- expand any section into its own markdown document (architecture.md, deployment.md, API.md).

Tell me which of these you'd like next.
