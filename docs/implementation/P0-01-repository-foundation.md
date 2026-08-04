# P0-01 — Repository Foundation

**Status:** Implemented on a feature branch; pending pull-request review

**Scope:** Engineering quality gates and architecture skeleton only

## What was built

- A pinned Next.js App Router, React, strict TypeScript, and Tailwind foundation.
- A professional planning-status page with honest delivery states and a link to the documentation package.
- Feature-oriented folders for routes, shared UI, features, adapters, server-only services, types, and layered tests.
- Separate Zod schemas for browser-safe and server-only environment values. All values are optional for the foundation page, and `.env.example` contains empty placeholders only.
- Reusable typed application errors for validation, authentication, authorization, conflicts, missing resources, rate limits, and internal failures.
- ESLint, Prettier, Vitest, React Testing Library, Playwright, axe, and coverage configuration.
- Unit tests for environment boundaries and typed errors, a component test for the real planning state, and browser/accessibility smoke tests.
- GitHub Actions jobs for clean installation, formatting, linting, typechecking, coverage, builds, and browser tests.
- Dependabot configuration, a pull-request template, expanded ignore rules, and initial response security headers.

## Architecture decisions applied

1. **App Router modular monolith.** Routes remain thin and render feature-owned components. Server Components are the default; P0-01 adds no client boundary.
2. **Explicit server boundary.** Server environment access imports `server-only`. Public parsing references only `NEXT_PUBLIC_*` values and cannot return server secrets.
3. **Feature boundaries before features.** Empty tracked directories reserve the reviewed structure without creating placeholder integrations or speculative abstractions.
4. **Pinned, minimal dependencies.** Runtime, package manager, and direct packages use exact versions. No Supabase, OpenAI, PDF, database, state-management, or generic AI framework is installed.
5. **Honest UI and tests.** The page reports planning complete and engineering foundation in progress. It contains no fake documents, analytics, benchmarks, users, or product-ready claims.
6. **Security headers in stages.** Safe baseline headers apply globally. CSP, HSTS, and deployment-specific origin policies wait for tested production origins and runtime requirements rather than using permissive placeholders.

## Environment contract prepared

Public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_EMBEDDING_MODEL`

These names are schema preparation only. No provider client reads or uses them in P0-01.

## Remaining work

- Review and merge P0-01 through the normal pull-request gate.
- Configure repository-level GitHub secret scanning/push protection and branch protection if not already enabled.
- Implement P0-02 only after approval: local Supabase CLI, migration workflow, and database/RLS test harness.
- Establish deployment-specific CSP, HSTS, environment requirements, and Vercel checks in the relevant later tickets.
- Add integration fixtures when a real local service boundary exists.

## Limitations

- The planning page is the only route with rendered content.
- Environment values are optional because no integration consumes them; later provider tickets must make required values fail fast in the correct environment.
- Empty architecture folders communicate intended ownership but intentionally contain no business behavior.
- Automated axe checks are a smoke test, not a substitute for keyboard, zoom, high-contrast, and screen-reader review as the application grows.
- There is no authentication, database, Storage, PDF processing, retrieval, conversation, embedding, or AI functionality.

## Validation evidence

Validation was run locally on Node.js `24.15.0` with npm `11.12.1`:

| Check                                     | Result                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `npm install`                             | Passed; lockfile produced, 475 packages audited, 0 vulnerabilities reported    |
| `npm run format` / `npm run format:check` | Passed                                                                         |
| `npm run lint`                            | Passed with zero warnings                                                      |
| `npm run typecheck`                       | Passed after Next route-type generation                                        |
| `npm run test`                            | Passed: 3 files, 12 assertions                                                 |
| `npm run test:coverage`                   | Passed: 96.66% statements, 86.66% branches, 100% functions, 96.66% lines       |
| `npm run test:e2e`                        | Passed: planning-page smoke and zero-violation axe scan in Chromium            |
| `npm run build`                           | Passed with Next.js 16.3.0; `/` and `/_not-found` prerendered as static routes |
| `npm run check`                           | Passed end to end                                                              |
| Secret-pattern and raw-HTML scan          | No findings; no `dangerouslySetInnerHTML` usage                                |

Desktop and 390 px mobile screenshots were reviewed locally for layout, overflow, and content integrity. The React component review found no unnecessary Client Components, effects, or hydration-sensitive behavior.

## Recommended next ticket

**P0-02 — Local Supabase and migration/test harness**, subject to separate approval. It should introduce local Supabase tooling and an empty migration/RLS testing workflow without starting authentication or product features.
