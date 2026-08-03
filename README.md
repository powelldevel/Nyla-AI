# Nyla

Nyla is a planned secure organizational knowledge assistant. It will ingest an organization's documents, retrieve relevant passages with hybrid search, and produce answers that are explicitly grounded in evidence with page-level citations.

This repository currently contains the pre-implementation product and engineering design. **No application implementation has begun.** The documents are a review gate: implementation should start only after the checklist in [`docs/review-checklist.md`](docs/review-checklist.md) is approved.

## Product position

Nyla is a knowledge workspace, not a generic PDF chat widget. The MVP combines a document library, processing visibility, natural-language questions, keyword search, source exploration, conversation history, feedback, and workspace administration.

The intended stack is:

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth, PostgreSQL, pgvector, Storage, Queues, and Row-Level Security
- OpenAI Embeddings API and Responses API, called only from trusted server code
- Vercel for the web application and bounded background worker endpoints
- GitHub for source control and CI review gates

## Documentation map

| Document | Review focus |
|---|---|
| [`01-product-requirements-document.md`](docs/01-product-requirements-document.md) | Problem, users, scope, requirements, metrics |
| [`02-system-architecture.md`](docs/02-system-architecture.md) | Components, flows, trust boundaries, topology |
| [`03-technical-design-document.md`](docs/03-technical-design-document.md) | Implementable application design and contracts |
| [`04-ui-ux-specification.md`](docs/04-ui-ux-specification.md) | Information architecture, screens, states, accessibility |
| [`05-database-and-data-design.md`](docs/05-database-and-data-design.md) | Normalized schema, indexes, lifecycle, RLS |
| [`06-rag-pipeline-design.md`](docs/06-rag-pipeline-design.md) | Ingestion, retrieval, reranking, generation, citations |
| [`07-security-and-privacy-design.md`](docs/07-security-and-privacy-design.md) | Threat model and concrete safeguards |
| [`08-testing-and-quality-strategy.md`](docs/08-testing-and-quality-strategy.md) | Test pyramid, RAG evaluation, release gates |
| [`09-observability-and-evaluation-plan.md`](docs/09-observability-and-evaluation-plan.md) | Telemetry, alerts, privacy-safe operations |
| [`10-implementation-roadmap.md`](docs/10-implementation-roadmap.md) | Sequential phases and implementation-sized tickets |
| [`11-risk-register.md`](docs/11-risk-register.md) | Product and engineering risks with owners and triggers |
| [`12-architecture-decision-records.md`](docs/12-architecture-decision-records.md) | Initial architecture decisions and consequences |
| [`diagrams/README.md`](docs/diagrams/README.md) | Diagram index and conventions |
| [`review-checklist.md`](docs/review-checklist.md) | Approval gate before implementation |

## Baseline decisions

- The MVP accepts searchable-text PDFs only; scanned PDFs are detected and rejected with a useful explanation. OCR is deferred.
- A workspace is the tenant boundary. Every tenant-owned row carries or resolves to `workspace_id`, and every request is checked in both application code and database RLS.
- Browser code receives only the Supabase publishable key. The Supabase secret/service-role key and OpenAI key remain server-only.
- Files are private in a workspace-prefixed Storage path and are viewed through short-lived signed URLs after authorization.
- Ingestion is asynchronous and idempotent. Supabase Queues holds work; a bounded Node.js worker processes recoverable stages and checkpoints progress.
- Retrieval is workspace-filtered hybrid search: PostgreSQL full-text plus pgvector cosine similarity, fused with reciprocal-rank fusion and optionally reranked.
- Answers use the OpenAI Responses API with `store: false`, structured output, application-managed conversations, and citation validation before persistence.
- A missing or weak evidence set produces an explicit “not found in this workspace” response, never an ungrounded answer from model knowledge.
- No numerical confidence percentage is shown. The interface communicates evidence quality using understandable states and source coverage.

## Assumptions requiring review

1. Initial customers accept a US-hosted deployment and OpenAI processing; regulated-region and contractual requirements must be confirmed before launch.
2. The first production plan can use Vercel and Supabase paid tiers that support scheduled/background workloads, backups, and appropriate function limits.
3. PDFs are limited to 25 MiB and 300 pages for the MVP; actual limits will be tuned from operational evidence.
4. English is the evaluation language for MVP. Unicode text is preserved, but multilingual retrieval quality is not yet guaranteed.
5. The first generation-model snapshot and reranker are selected only after the golden evaluation set is run; model identifiers remain configuration, not business logic.

## Review and implementation gate

Reviewers should resolve all blocking items in [`docs/review-checklist.md`](docs/review-checklist.md), approve the product scope, validate the RLS model with adversarial tests, and approve the data-processing posture. The recommended first implementation ticket is **P0-01: establish the repository quality gates and architecture skeleton without product features**, detailed in the roadmap.

## Status

Planning foundation drafted on 2026-08-03. Application status: **not started**.
