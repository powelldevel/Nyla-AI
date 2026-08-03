# 03 — Technical Design Document

**Status:** Draft for implementation review  
**Architecture style:** Feature-oriented modular monolith  
**Runtime:** Next.js App Router on the Node.js runtime

## 1. Design summary

Nyla is one Next.js TypeScript application with explicit internal layers and a bounded asynchronous ingestion worker. Server Components handle initial authenticated reads, Server Actions handle product-only mutations, and Route Handlers own streaming, uploads, worker callbacks, and HTTP contracts. PostgreSQL is the source of truth; Supabase RLS is a mandatory second authorization layer. OpenAI is accessed only by server-side adapter modules.

The implementation should pin exact dependency versions and commit the lockfile. At implementation kickoff, verify the current stable Next.js/Supabase APIs. For Next.js 16+, session refresh uses `proxy.ts`; if a different supported version is selected, follow that version's official file convention rather than copying a stale example.

## 2. Proposed application architecture

```text
Browser
  -> app routes and feature UI
  -> Server Actions / Route Handlers
       -> application use cases and authorization policies
            -> repositories and domain services
                 -> Supabase user client / privileged worker client
                 -> storage adapter
                 -> retrieval adapter
                 -> OpenAI adapter
```

Dependency direction flows inward. UI imports feature use cases/types, domain code imports no framework/UI modules, and infrastructure adapters implement narrow interfaces. This is not a generic dependency-injection framework; factories assemble dependencies in server-only modules.

## 3. Frontend architecture

### Server-rendered by default

- Marketing, auth shells, workspace layout, overview, library initial list, document details, conversation list, settings, and account pages are Server Components.
- Fetch independent panels concurrently or behind Suspense boundaries. Do not call Nyla's own Route Handlers from Server Components; invoke the data/query layer directly.
- Authenticated routes are dynamic and private. They do not use ISR or shared response caching.

### Client islands

- `UploadDropzone`: local validation, direct-upload progress, cancellation, finalize call.
- `DocumentStatus`: polling or carefully scoped Realtime subscription, with backoff and terminal stop.
- `AskComposer` and `AnswerStream`: submit, abort, reconnect/load persisted state, render progressive parts.
- `EvidencePanel` and `PdfViewer`: focus management, page navigation, authorized URL refresh, highlights.
- `SearchControls`: debounced query, filters, URL-state synchronization.
- `FeedbackControl`, responsive navigation, dialogs, and toasts.

Client props must be serializable and minimal. Rich database rows and secrets do not cross the React Server Component boundary.

### UI foundations

- Tailwind CSS for tokens/utilities; CSS custom properties for semantic color, spacing, and typography.
- Radix primitives (directly or through shadcn/ui copied components) for accessible dialogs, dropdowns, tabs, tooltips, and focus behavior. Do not adopt a full dashboard theme.
- Lucide icons with text labels where meaning is not obvious.
- `react-hook-form` only for complex client forms; native forms plus Server Actions for simple forms.
- `pdfjs-dist` is the initial viewer/extraction candidate, but extraction accuracy, worker/runtime compatibility, license, and malicious-file behavior must be evaluated before selection.

## 4. Backend responsibilities

| Layer | Responsibilities |
|---|---|
| Transport | Parse HTTP/form data, request IDs, CSRF/origin checks, content type, response/stream protocol |
| Application | Authorize use case, enforce limits, coordinate transactions and external effects |
| Domain | Lifecycle rules, role invariants, chunk/citation models, evidence gate, error taxonomy |
| Data | Parameterized queries/RPCs, user-scoped Supabase client, pagination, optimistic locking |
| AI | Embeddings, optional reranker, Responses API, schema parsing, usage capture |
| Storage | Upload intents, object verification, signed reads, deletion |
| Worker | Queue lease, stage checkpoint, heartbeat, retry classification, terminalization |

Client-side code may improve usability but cannot be the only validator, authorization layer, rate limiter, or lifecycle controller.

## 5. Maintainable folder structure

```text
src/
  app/
    (marketing)/
      page.tsx
    (auth)/
      sign-in/page.tsx
      sign-up/page.tsx
      callback/route.ts
    (product)/
      w/[workspaceSlug]/
        layout.tsx
        page.tsx
        library/page.tsx
        library/[documentId]/page.tsx
        ask/page.tsx
        search/page.tsx
        conversations/page.tsx
        conversations/[conversationId]/page.tsx
        settings/{general,members}/page.tsx
      account/page.tsx
    api/
      uploads/{intent,finalize}/route.ts
      answers/stream/route.ts
      search/route.ts
      sources/[citationId]/route.ts
      internal/ingestion/route.ts
      health/{live,ready}/route.ts
    error.tsx
    global-error.tsx
    not-found.tsx
    unauthorized.tsx
    forbidden.tsx
  features/
    auth/{actions,components,schemas}.ts
    workspaces/{actions,components,queries,schemas}.ts
    documents/{actions,components,queries,schemas}.ts
    ask/{components,stream-client,schemas}.ts
    search/{components,queries,schemas}.ts
    conversations/{actions,components,queries}.ts
  server/
    auth/{session,authorize,permissions}.ts
    db/{client,repositories,transactions}.ts
    storage/{ports,supabase-storage}.ts
    ingestion/{consumer,stages,retries,ports}.ts
    retrieval/{normalize,hybrid,fusion,rerank,assemble}.ts
    ai/{openai-client,embeddings,generation,schemas,prompts}.ts
    citations/{validate,resolve}.ts
    rate-limit/{policy,store}.ts
    telemetry/{logger,metrics,redaction}.ts
  shared/
    components/
    config/
    errors/
    types/
    validation/
  tests/
    fixtures/
    factories/
    evals/
supabase/
  migrations/
  tests/
  seed.sql
proxy.ts
```

Barrel exports are kept narrow to avoid accidental client imports of server modules. Every file under `src/server` imports `server-only` at its public boundary.

## 6. Route and navigation design

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Marketing landing page |
| `/sign-up`, `/sign-in`, `/forgot-password` | Anonymous | Identity flows |
| `/auth/callback` | Callback | PKCE code exchange; validates return path |
| `/onboarding` | Authenticated | Create or join first workspace |
| `/w/:slug` | Member | Workspace overview |
| `/w/:slug/library` | Member; mutations admin+ | Document library |
| `/w/:slug/library/:documentId` | Member | Details and source viewer entry |
| `/w/:slug/ask` | Member | Ask Nyla |
| `/w/:slug/search` | Member | Direct knowledge search |
| `/w/:slug/conversations` | Member | Own conversation history |
| `/w/:slug/conversations/:id` | Creator | Individual conversation |
| `/w/:slug/settings/general` | Admin+ | Workspace settings |
| `/w/:slug/settings/members` | Admin+ | Members and invitations |
| `/account` | Authenticated | Personal profile/security |

Workspace slugs are presentation locators, not authorization. The server resolves slug → workspace ID under membership and uses the ID thereafter. Sensitive IDs use non-sequential UUIDs, but opacity is never treated as access control.

## 7. API boundaries

### Route Handlers

| Method/path | Input | Output | Notes |
|---|---|---|---|
| `POST /api/uploads/intent` | workspace, name, size, declared MIME, optional SHA-256 | upload intent, signed upload data, expiry | Admin+; reserves quota; no raw file through app server |
| `POST /api/uploads/finalize` | intent/version ID, object checksum | `202` document status | Verifies private object before enqueue |
| `POST /api/answers/stream` | workspace, question, conversation?, idempotency key | SSE event stream | Member; rate limited; persists lifecycle |
| `GET /api/search` | workspace, q, cursor, document filters | ranked result page | Member; no raw vector accepted |
| `GET /api/sources/:citationId` | optional mode | metadata or short-lived signed URL | Re-authorizes message/citation/document chain |
| `POST /api/internal/ingestion` | scheduler/worker signature | processed count and safe statuses | Not user-authenticated; secret/HMAC, network/rate controls |
| `GET /api/health/live` | none | process liveness | No dependency details |
| `GET /api/health/ready` | internal/monitor auth | dependency readiness | Sanitized; not publicly detailed |

Internal UI mutations not needing a durable external HTTP API use Server Actions: create workspace, edit settings, membership actions, retry/delete/reprocess document, rename/delete conversation, submit feedback, and account profile update.

### API versioning

The MVP web UI and server ship together, so internal routes are not prefixed `v1`. Stream event names and persisted job payloads carry an explicit schema version because clients/workers can overlap deployments. If external clients are introduced, expose `/api/v1` separately.

## 8. Data contracts

### Common error envelope

```ts
type ApiError = {
  error: {
    code: string;              // e.g. DOCUMENT_NOT_READY
    message: string;           // safe, localized later
    requestId: string;
    retryable: boolean;
    fieldErrors?: Record<string, string[]>;
  };
};
```

No stack, SQL message, object path, provider response, membership fact about another tenant, or secret is returned.

### Document summary

```ts
type DocumentSummary = {
  id: string;
  displayName: string;
  status: 'uploading' | 'queued' | 'extracting' | 'chunking' |
    'embedding' | 'indexing' | 'ready' | 'failed' | 'deleting';
  sizeBytes: number;
  pageCount: number | null;
  currentVersion: number | null;
  uploadedAt: string;
  uploadedBy: { id: string; displayName: string };
  failure?: { category: string; userMessage: string; retryable: boolean };
};
```

### Stream events

```ts
type AnswerEvent =
  | { type: 'metadata'; requestId: string; messageId: string }
  | { type: 'delta'; sequence: number; text: string }
  | { type: 'citation'; marker: string; citationId: string; label: string }
  | { type: 'complete'; answerStatus: 'grounded' | 'unsupported'; usage?: SafeUsage }
  | { type: 'error'; error: ApiError['error'] };
```

The client orders deltas by sequence and never renders raw provider events. Citation IDs are Nyla records generated only after validation.

### Structured generation candidate

```ts
type GroundedCandidate = {
  outcome: 'answer' | 'not_found';
  answerSections: Array<{
    heading?: string;
    claims: Array<{ text: string; sourceHandles: string[] }>;
  }>;
  caveats: string[];
  relatedQuestions: string[];
};
```

The schema limits string/array lengths. It is parsed and validated server-side even when the provider promises schema adherence.

## 9. Validation strategy

- Zod schemas at Server Action, Route Handler, queue payload, provider output, and environment boundaries.
- Database check/foreign-key/unique constraints repeat domain invariants.
- File checks use declared metadata only for early rejection; final acceptance uses bytes/signature and parser results.
- Normalize Unicode, trim control characters, cap question length and token count, and reject null bytes.
- Identifiers are validated as UUID/slug, then resolved under authorized scope.
- Environment parsing happens once at startup in separate `serverEnv` and `publicEnv` modules; unknown/missing production values fail deployment.

## 10. Authentication and authorization

- Supabase SSR uses PKCE and cookie-backed sessions with the current official package at implementation time.
- Cookies are `Secure` in production, `HttpOnly` where library constraints permit, `SameSite=Lax`, scoped minimally, and refreshed through the framework proxy.
- State-changing requests verify same-origin/allowed Origin in addition to SameSite cookies; OAuth callbacks validate state/PKCE and safe return paths.
- `authorize(workspaceId, capability)` loads an active membership and role from the database. It never trusts `user_metadata`, a client role, or a stale workspace role embedded in a JWT.
- RLS policies target `authenticated` and include membership predicates. UPDATE has both `USING` and `WITH CHECK`.
- Sensitive actions (ownership transfer/workspace deletion) require recent authentication and explicit confirmation.

## 11. File upload and storage design

1. Admin requests an upload intent with metadata and a unique idempotency key.
2. Server validates quota/role, creates `document`, `document_version`, and intent/job reservation.
3. Object path is server-derived: `workspaces/{workspace_id}/documents/{document_id}/versions/{version_id}/original.pdf`.
4. Browser uploads directly to the private bucket using a short-lived signed target; overwrite/upsert is disabled for originals.
5. Finalize verifies object existence, size, checksum/ETag policy, and intent ownership, then enqueues exactly once.
6. Expired intents and orphaned objects are swept by a maintenance job.

Initial limits: 25 MiB, 300 pages, PDF signature `%PDF-`, no encryption/password, extraction time/bomb limits, and configurable total workspace storage. Client `accept` is convenience only.

## 12. Background job strategy

Use Supabase Queues (Postgres `pgmq`) for durable messages and a secured Node.js Route Handler invoked by a scheduler. Each invocation leases a small batch and performs one or more bounded stages within the configured max duration.

Stages are `validate`, `extract`, `chunk`, `embed_batch`, `finalize`, and `delete`. Large stages create continuation messages with a cursor. The `ingestion_jobs` row contains the authoritative state, lease owner/expiry, attempt count by stage, checkpoint, and processing version.

### Idempotency

- Unique `(document_version_id, processing_version)` job.
- Deterministic chunk key `(document_version_id, processing_version, chunk_index)`.
- Upload finalize unique by intent/version.
- Answer request unique `(user_id, idempotency_key)` within a retention window.
- Database writes use transactions and conflict-aware upserts; queue delivery is assumed at least once even if the underlying product advertises stronger behavior.

### Retry policy

- Exponential backoff with full jitter; suggested start 5 s and cap 15 min, values configurable.
- Provider 429/5xx/network timeout: retry within stage budget and respect `Retry-After`.
- Parse corruption, encryption, no text, invalid signature, configured limits: permanent failure.
- Maximum automatic attempts default to 5 per transient stage. Exhaustion moves to failed/dead-letter diagnostic state.
- Manual retry creates a new attempt/checkpoint event; reprocess increments `processing_version` and never mutates a ready version in place.

## 13. Retrieval, generation, and streaming

- Retrieval implementation is detailed in [`06-rag-pipeline-design.md`](06-rag-pipeline-design.md).
- PostgreSQL RPC accepts query vector/text and authorized workspace ID, applies ready/current filters inside both vector and FTS branches, and returns chunk IDs plus separate ranks.
- Use reciprocal-rank fusion in application code or a reviewed SQL function. Never combine raw cosine and text rank as if they share a scale.
- The initial OpenAI embedding candidate is `text-embedding-3-small` at 1536 dimensions. Model/dimension are configuration and persisted on every processing version.
- The generation model is a date-pinned, eval-approved model via `NYLA_GENERATION_MODEL`; `gpt-5.4-mini-2026-03-17` is an initial candidate, not an untested commitment.
- Use the Responses API with `store: false` and structured output. Conversation state stays in Nyla.
- Server emits SSE through a Nyla-specific protocol. Abort provider work when feasible after client cancellation, but persist an unambiguous terminal/interrupted state.

## 14. Rate limiting and abuse controls

Enforce limits by user, workspace, IP for anonymous auth endpoints, and operation class. Initial configurable policy—not a performance claim:

- Ask: burst 5/min/user, 30/min/workspace; daily token/cost soft and hard budgets.
- Search: 60/min/user.
- Upload intents: 10/hour/admin and workspace storage/page quotas.
- Auth: Supabase/provider controls plus application/IP throttles for high-risk flows.
- Worker: global concurrency, per-workspace fairness, and provider-specific concurrency.

For a single-instance prototype, Postgres advisory/counter rows can enforce limits. Before multi-instance production, use an atomic durable rate-limit store; do not rely on function memory. Rate-limit decisions log IDs/counts, not content.

## 15. Caching

- Public marketing pages and static assets may use CDN caching.
- Authenticated pages, auth callbacks, source URL issuance, and membership-sensitive APIs use `private, no-store`.
- Per-request memoization may deduplicate session/membership and data loads.
- Query embedding cache is optional and keyed by HMAC(normalized query + model + workspace) with short TTL; avoid storing plaintext in cache keys. Do not implement until measured benefit.
- Retrieval result caching is deferred because document versions and permissions make invalidation security-sensitive.
- Signed PDF URLs expire in minutes and are never put in analytics or logs.

## 16. Logging and observability

Every request/job has `request_id`/`correlation_id`; fields include route/use case, workspace/user pseudonymous IDs, role decision, job/stage, document/version ID, durations, counts, provider/model, token usage, retry/error class, and status. Redaction removes auth headers, cookies, tokens, signed URLs, file names, raw question/answer/chunk/page text, and stack details from client responses. See [`09-observability-and-evaluation-plan.md`](09-observability-and-evaluation-plan.md).

## 17. Environment variables

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser allowed | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser allowed | RLS-constrained public client key |
| `SUPABASE_SECRET_KEY` | Server only | Narrow worker/admin operations; never browser |
| `OPENAI_API_KEY` | Server only | Embeddings and Responses API |
| `NYLA_EMBEDDING_MODEL` | Server | Reviewed embedding model |
| `NYLA_EMBEDDING_DIMENSIONS` | Server | Must match vector column/processing version |
| `NYLA_GENERATION_MODEL` | Server | Date-pinned eval-approved generation model |
| `NYLA_RERANK_MODE` | Server | `none`, heuristic, or approved provider/model |
| `INTERNAL_WORKER_SECRET` | Server/scheduler | Authenticates worker invocation; rotateable |
| `APP_BASE_URL` | Server | Canonical redirects and origin validation |
| `LOG_LEVEL`, `OTEL_*` | Server | Telemetry configuration |

Production secrets live in Vercel/Supabase secret stores, are environment-separated and rotated. `.env.example` contains names only when implementation begins.

## 18. Feature flags

Start with typed server-side configuration, not a vendor: `hybrid_retrieval`, `reranking`, `suggested_questions`, `realtime_status`, and `citation_repair`. Flags have owner, purpose, default, expiry/removal condition, and cannot weaken security/RLS. Evaluation events record flag/config versions.

## 19. Database migrations and deployment

- Create migrations with the current Supabase CLI, review SQL, run database advisors and pgTAP/RLS tests.
- Prefer additive, backward-compatible migrations. Add nullable/new structures first, backfill in bounded batches, validate, switch reads/writes, then remove old fields later.
- New public-schema tables are explicitly granted only if needed and always have RLS before exposure. Internal queue/helper objects live in non-exposed schemas where supported.
- CI: format/lint → typecheck → unit → database/RLS integration → API → build → E2E/accessibility smoke → eval smoke.
- PRs get isolated preview deployments and non-production Supabase data. Production uses the same tested artifact, promoted after migration/health gates.
- Rollback application independently when schema remains backward compatible. Destructive schema rollback uses a reviewed restore/forward-fix plan.

## 20. Local development

- Node version and package manager are pinned.
- Supabase CLI runs local Auth/Postgres/Storage; migrations and deterministic seed fixtures create two workspaces and adversarial users.
- OpenAI adapter supports recorded/synthetic fixtures for ordinary tests; live API tests are opt-in, budgeted, and never use customer data.
- PDF fixtures include valid text, multi-page headings, corrupt, encrypted, scan-like, oversized-generated metadata, injection text, and duplicate content.
- A local worker command invokes the same stage functions as the production worker transport.

## 21. Testing approach

Unit test domain rules and pure RAG transforms; integration test repository/RPC/storage adapters; database-test every RLS policy/constraint; contract-test provider and stream schemas; E2E-test the critical user journeys; run golden evals on any model/prompt/chunk/retrieval change. Details and gates are in [`08-testing-and-quality-strategy.md`](08-testing-and-quality-strategy.md).

## 22. Technical risks and spikes

1. **PDF extraction quality/security:** spike three representative libraries against the fixture corpus before committing.
2. **Bounded Vercel worker:** prove a 300-page document can progress through continuation stages within plan limits and recover from killed invocations.
3. **RLS-aware vector index:** benchmark filtered HNSW recall/latency by workspace sizes; verify plans with `EXPLAIN (ANALYZE, BUFFERS)` on synthetic data.
4. **Structured streaming with citations:** prototype stable citation handles and incomplete-stream recovery before polishing the chat UI.
5. **Supabase SSR API churn:** pin versions, follow current SSR/proxy guidance, and test refresh/cache headers.
6. **Deletion completeness:** build a reconciliation query/job and test partial cleanup before claiming deletion semantics.

## 23. Definition of technically ready for implementation

- PRD scope and role matrix approved.
- Data model/RLS policy matrix reviewed with denial cases.
- Provider region, retention, and model candidates approved.
- PDF extractor and worker spikes have acceptance criteria and owners.
- All blocking unresolved questions in the review checklist have decisions or recorded ADR deferrals.
