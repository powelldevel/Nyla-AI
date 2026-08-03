# 12 — Architecture Decision Records

**Status:** Initial decisions proposed for approval  
**Convention:** Accepted ADRs are immutable; superseding decisions add a new ADR and link the prior one.

## ADR-001 — Next.js App Router modular monolith

**Status:** Proposed

**Context:** One developer needs public pages, authenticated server rendering, interactive streams/uploads, and server-only provider access without operating separate frontend/API services.

**Decision:** Use a current stable Next.js App Router release with React, TypeScript, Tailwind, Server Components for reads, Server Actions for internal mutations, and Route Handlers for streaming/uploads/worker/HTTP boundaries. Default to Node.js runtime. Organize a feature-oriented modular monolith with explicit server/domain/adapters.

**Alternatives:** Pages Router; separate SPA + API; microservices; Edge-first runtime.

**Consequences:** One deploy and coherent types/transactions reduce overhead. Discipline is required to prevent server/client leakage and giant components. Authenticated routes must be dynamic/private; framework upgrades are pinned/tested. Independent worker scaling may later require a split ADR.

## ADR-002 — Supabase for database, Auth, Storage, and Queue

**Status:** Proposed

**Context:** Nyla needs managed identity, relational data, private objects, durable work, local tooling, and minimal infrastructure.

**Decision:** Use one environment-separated Supabase project per environment class for Auth, PostgreSQL, private Storage, and Supabase Queues. Use current SSR cookie/PKCE integration. Deliberately configure Data API grants and RLS.

**Alternatives:** Firebase; Auth0/Clerk + managed Postgres/S3/queue; self-hosted stack; Vercel-only third-party mix.

**Consequences:** Fewer vendors and strong Postgres/RLS integration. Platform coupling and product/API churn require current-doc verification and adapters. Service-role bypass risk demands strict server isolation. Paid plan features/limits and regional availability must be confirmed.

## ADR-003 — PostgreSQL full-text search plus pgvector

**Status:** Proposed

**Context:** Retrieval needs transactional tenant metadata, exact policy terms/codes, semantic similarity, and inspectable citations.

**Decision:** Store normalized chunks, a generated weighted `tsvector` with GIN, and OpenAI embeddings in pgvector with cosine distance. Start with exact scan at tiny scale and benchmark HNSW before production. Persist model/dimensions/config versions.

**Alternatives:** Dedicated Pinecone/Weaviate/Qdrant; OpenAI vector stores/File Search; vector-only Postgres.

**Consequences:** One source of truth, transactional deletion, metadata/RLS filters, and portfolio visibility. Postgres vector scale/filter tuning is Nyla's responsibility. Dimension changes require migrations/reprocessing. A dedicated store is considered only after measured limits, with tenant/filter/citation parity required.

## ADR-004 — Vercel deployment with gated preview promotion

**Status:** Proposed

**Context:** The application should deploy simply from GitHub, support Next.js streaming/server functions, previews, and a credible production workflow.

**Decision:** Deploy Next.js to Vercel using Git integration for previews and a CI-gated production artifact/promotion workflow. Use Node.js functions, environment-separated secrets, health checks, and redacted observability. Database migrations use expand/contract before artifact promotion.

**Alternatives:** AWS container stack; Fly.io/Render; self-hosted Next.js; Edge-first Vercel.

**Consequences:** Excellent framework fit and low operational burden. Function/scheduler duration, concurrency, region, and plan limits constrain ingestion and must be proven. Rollback is easy only while schema remains backward compatible.

## ADR-005 — Asynchronous, staged document ingestion

**Status:** Proposed

**Context:** PDF parsing and embedding can exceed request time, fail transiently, and must expose progress/retry without duplicating results.

**Decision:** Upload returns `202`; Supabase Queue holds a versioned job; a secured scheduled Node worker leases and checkpoints bounded stages/batches. State and deterministic keys make at-least-once delivery safe. Permanent failures stop; transient failures back off.

**Alternatives:** Synchronous request ingestion; fire-and-forget Vercel function; external workflow/queue service; Supabase Edge-only worker.

**Consequences:** Responsive uploads, observable progress, recovery, and safe retries. More lifecycle/state complexity and scheduler latency. A spike must prove maximum MVP files; otherwise split to a dedicated worker/workflow service through a new ADR.

## ADR-006 — PDF-only searchable-text MVP

**Status:** Proposed

**Context:** Multiple formats/OCR multiply parsers, provenance, security, evaluation, and UI states before the core RAG experience is proven.

**Decision:** Accept PDFs with extractable text only, with configured 25 MiB/300-page initial limits. Detect scanned/encrypted/corrupt/limit cases and fail with useful guidance. No OCR.

**Alternatives:** PDF/DOCX/TXT together; OCR for scans; provider-managed file parsing.

**Consequences:** Narrow, testable security/quality surface and reliable page citations. Many real documents are excluded. Schema remains version/format-capable, but each new format needs its own threat/eval decision.

## ADR-007 — Hybrid retrieval and explicit reranking

**Status:** Proposed

**Context:** Semantic search handles paraphrases but can miss exact codes/names; lexical search has the inverse weakness. Raw score scales are not comparable.

**Decision:** Retrieve workspace-filtered vector and FTS candidates in parallel, fuse with reciprocal-rank fusion, deduplicate/diversify, and rerank a bounded pool. Always keep deterministic reranking; ship model reranking only after measured quality benefit.

**Alternatives:** Vector-only; keyword-only; weighted sum of raw scores; dedicated learned reranking provider.

**Consequences:** Better expected coverage and transparent fallback at modest implementation complexity. More parameters/eval responsibility and latency if model reranking is enabled. All branches repeat tenant/current-ready filters.

## ADR-008 — Workspace-based multi-tenancy with three roles

**Status:** Proposed

**Context:** Organizations need isolated knowledge and administration. Per-document ACLs would complicate every query and source path.

**Decision:** Workspace is the tenant/access boundary. Roles are owner, administrator, and member; all members can read all ready workspace documents. Tenant-owned tables carry `workspace_id`; RLS plus server capabilities enforce access. No read-only/auditor role in MVP.

**Alternatives:** Database/schema per tenant; user-owned documents; collections/document ACLs; four-role model with viewer.

**Consequences:** Simple, testable MVP and efficient retrieval. Unsuitable for departments with restricted documents; such customers are out of initial scope. Adding collections is a security/data/retrieval redesign, not a UI toggle. Auditor role is revisited only with distinct permissions.

## ADR-009 — Persisted citation records rendered from validated handles

**Status:** Proposed

**Context:** Parsed citation text such as `[1]` is unstable and model-generated page numbers can be invented. Historic answers need reproducible source mapping.

**Decision:** Context uses request-local opaque handles mapped by the server to selected chunks. Model returns structured claim-handle links. Server validates and persists `message_citations` with document version/page/heading; UI renders markers from records.

**Alternatives:** Store Markdown citations only; resolve document names/pages generated by model; recompute sources on view; cite whole documents.

**Consequences:** Stable, verifiable, authorization-aware sources and good evaluation data. More schema/validation complexity and a required policy for deleted-source tombstones/excerpts.

## ADR-010 — OpenAI access only from trusted server code

**Status:** Proposed

**Context:** Browser provider calls expose keys/cost controls and allow bypass of retrieval, prompt, validation, and audit.

**Decision:** OpenAI SDK is imported only in server-only adapters. Use Embeddings API and Responses API with `store:false`, date-pinned configurable generation model, server-side rate/token budgets, and validated structured output. Browser receives only Nyla SSE events.

**Alternatives:** Direct browser OpenAI calls; Supabase database extension/Edge calls for everything; OpenAI File Search as the full RAG system.

**Consequences:** Secrets/policy/cost/provenance remain controlled. Nyla bears server latency and provider adapter maintenance. Selected private content crosses to OpenAI, requiring approved terms/region/disclosure.

## ADR-011 — Application-owned conversation persistence

**Status:** Proposed

**Context:** Users need history, deletion, tenant authorization, feedback, and stable citations; provider state should not become a second source of truth.

**Decision:** Persist conversations/messages/citations in PostgreSQL under creator-only RLS. Send a bounded recent context/summary plus fresh evidence per question. Do not rely on provider-stored conversation state.

**Alternatives:** Stateless answers; store only provider response IDs; provider-managed threads; entire-history prompts.

**Consequences:** Full control over tenancy/retention/evaluation and portable models. Nyla must manage sequence, summaries, token budgets, deletion, and interrupted streams. Follow-ups always retrieve fresh evidence.

## ADR-012 — Conservative answerability and no numeric confidence

**Status:** Proposed

**Context:** Similarity/model probabilities are not calibrated user-facing truth, and a confident percentage can falsely imply correctness.

**Decision:** A versioned evidence gate chooses answer/limited/not-found; all answer claims cite validated evidence. UI may use explanatory source-coverage labels only after usability validation and never exposes a percentage.

**Alternatives:** Always answer; show cosine-derived confidence; let model self-report confidence.

**Consequences:** Higher trust and measurable false-refusal trade-off. Users may receive more no-answer responses; evaluation tunes coverage without allowing general-knowledge guessing.

## ADR-013 — Minimal dependency set and replaceable AI adapters

**Status:** Proposed

**Context:** A portfolio product can become unmaintainable if each concern adds a service/framework.

**Decision:** Add libraries only for clear needs: validation, accessible primitives, PDF parsing/viewing, tokenization, tests, and provider SDKs. Keep storage, retrieval, embeddings, rerank, and generation behind narrow interfaces. No generic repository/DI/event framework unless repeated complexity proves it.

**Alternatives:** LangChain/LlamaIndex as core orchestration; microservices; bespoke everything; multiple observability/rate-limit vendors from day one.

**Consequences:** Transparent pipeline and smaller supply chain, but Nyla implements orchestration/evaluation itself. Replaceable adapters require disciplined boundaries, not premature abstraction.

## Decision review triggers

- New file type/OCR/connector.
- Per-document/collection access controls or auditor role.
- Worker spike fails plan limits or queue SLO.
- PostgreSQL retrieval misses approved latency/recall at measured scale.
- Provider/model/region/data terms change.
- External/mobile API or shared conversations are introduced.
- Billing, enterprise SSO, legal hold, or formal compliance becomes in scope.
