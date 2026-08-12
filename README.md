# Nyla

Nyla is an evidence-first organizational knowledge workspace. It is designed to ingest approved documents, retrieve relevant passages with hybrid search, and produce grounded answers with verifiable page-level citations.

The repository is currently at **P0-01: engineering foundation**. It contains a professional planning-status page, strict project boundaries, typed environment and error foundations, automated tests, and CI. Authentication, Supabase, document processing, retrieval, and AI have not been implemented.

## Technology foundation

- Next.js App Router, React, strict TypeScript, and Tailwind CSS
- ESLint and Prettier for static quality
- Vitest and React Testing Library for unit/component tests
- Playwright and axe for browser and accessibility smoke tests
- Zod for typed environment boundaries
- GitHub Actions and Dependabot for repository quality gates

The approved future architecture adds Supabase Auth, PostgreSQL, pgvector, private Storage, OpenAI APIs from trusted server code, and Vercel deployment. Those integrations remain deliberately out of scope for P0-01.

## Local setup

Prerequisites:

- Node.js `24.15.0` (pinned in `.nvmrc`)
- npm `11.12.1` (pinned in `package.json`)

Install and run the planning page:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The environment file is optional for the planning page. The sample contains empty placeholders only; do not commit real credentials.

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command                 | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Start the local Next.js development server                        |
| `npm run build`         | Create a production build                                         |
| `npm run start`         | Serve the production build                                        |
| `npm run lint`          | Run ESLint with zero warnings allowed                             |
| `npm run typecheck`     | Run strict TypeScript checks                                      |
| `npm run format`        | Format supported files with Prettier                              |
| `npm run format:check`  | Verify formatting without changing files                          |
| `npm run test`          | Run Vitest unit and component tests                               |
| `npm run test:coverage` | Run Vitest with a coverage report                                 |
| `npm run test:e2e`      | Run Playwright browser and accessibility smoke tests              |
| `npm run check`         | Run formatting, lint, typecheck, unit tests, and production build |

Install the Playwright Chromium binary once before the first local end-to-end run:

```bash
npx playwright install chromium
```

## Architecture overview

```text
src/
  app/                 Next.js routes, layouts, and global styles
  components/          Shared layout and UI primitives
  features/            Feature-owned UI and logic
  lib/                 Environment, validation, errors, and future adapters
  server/              Explicit server-only application boundaries
  types/               Cross-cutting shared types
tests/
  unit/                Deterministic unit and component tests
  integration/         Future local-service contract tests
  e2e/                 Playwright journey and accessibility smoke tests
```

Server Components are the default. Browser-exposed environment values are parsed separately from server secrets, and trusted server modules use the `server-only` boundary. Empty folders mark approved future module boundaries; they do not contain integrations or product behavior.

## Documentation map

| Document                                                                                  | Review focus                                             |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`01-product-requirements-document.md`](docs/01-product-requirements-document.md)         | Problem, users, scope, requirements, metrics             |
| [`02-system-architecture.md`](docs/02-system-architecture.md)                             | Components, flows, trust boundaries, topology            |
| [`03-technical-design-document.md`](docs/03-technical-design-document.md)                 | Implementable application design and contracts           |
| [`04-ui-ux-specification.md`](docs/04-ui-ux-specification.md)                             | Information architecture, screens, states, accessibility |
| [`05-database-and-data-design.md`](docs/05-database-and-data-design.md)                   | Normalized schema, indexes, lifecycle, RLS               |
| [`06-rag-pipeline-design.md`](docs/06-rag-pipeline-design.md)                             | Ingestion, retrieval, reranking, generation, citations   |
| [`07-security-and-privacy-design.md`](docs/07-security-and-privacy-design.md)             | Threat model and concrete safeguards                     |
| [`08-testing-and-quality-strategy.md`](docs/08-testing-and-quality-strategy.md)           | Test pyramid, RAG evaluation, release gates              |
| [`09-observability-and-evaluation-plan.md`](docs/09-observability-and-evaluation-plan.md) | Telemetry, alerts, privacy-safe operations               |
| [`10-implementation-roadmap.md`](docs/10-implementation-roadmap.md)                       | Sequential phases and implementation-sized tickets       |
| [`11-risk-register.md`](docs/11-risk-register.md)                                         | Product and engineering risks with owners and triggers   |
| [`12-architecture-decision-records.md`](docs/12-architecture-decision-records.md)         | Initial architecture decisions and consequences          |
| [`13-portfolio-mvp-scope.md`](docs/13-portfolio-mvp-scope.md)                             | Narrow portfolio delivery scope and explicit deferrals   |
| [`P0-01 implementation record`](docs/implementation/P0-01-repository-foundation.md)       | Foundation decisions, contents, limits, and follow-up    |
| [`diagrams/README.md`](docs/diagrams/README.md)                                           | Diagram index and conventions                            |
| [`review-checklist.md`](docs/review-checklist.md)                                         | Product and architecture review gate                     |

## Security baseline

- Real environment files, dependency folders, build output, coverage, logs, and Playwright artifacts are ignored.
- Public and server environment schemas are separated; server secrets are never referenced from client code.
- Repository dependencies and runtime versions are pinned and committed with a lockfile.
- Global responses receive initial anti-framing, MIME-sniffing, referrer, permissions, and opener headers.
- Rendering uses normal escaped React content; there is no raw HTML injection.

More restrictive CSP and HSTS policies require deployment-origin and runtime validation and are intentionally deferred until the relevant deployment/security ticket.

## Current status

- Planning package: complete
- P0-01 repository foundation: in progress pending review
- Product implementation: not started

The next recommended ticket after P0-01 is **P0-02: local Supabase and migration/test harness**. It must be approved separately before any database or authentication work begins.
