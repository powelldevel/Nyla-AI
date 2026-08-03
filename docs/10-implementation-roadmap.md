# 10 — Implementation Roadmap

**Status:** Draft for sequencing review  
**Planning basis:** One experienced developer, with part-time product/security/design review. Estimates are ranges for focused engineering time, not commitments.

## 1. Delivery principles

- Work phases are sequential gates. Discovery/spikes may overlap lightly, but six major features are not built simultaneously.
- Each ticket produces a reviewable vertical or enabling slice with tests and documentation.
- Security, accessibility, observability, and evaluation are built into the relevant phase; Phase 7 hardens them rather than introducing them from nothing.
- A feature is not “done” because the happy-path UI renders. It needs authorization, states, tests, telemetry, and operational behavior.
- Re-estimate after Phase 0 spikes and after the first end-to-end ingestion benchmark.

## 2. Indicative schedule

| Phase | Focused range | Gate |
|---|---:|---|
| 0 | 1–2 weeks | Approved architecture, spikes, repo gates |
| 1 | 2–3 weeks | Authenticated tenant shell and tested RLS foundation |
| 2 | 2–3 weeks | Secure document library/upload lifecycle shell |
| 3 | 3–5 weeks | Recoverable PDF ingestion to ready chunks |
| 4 | 2–4 weeks | Evaluated tenant-safe hybrid retrieval/search |
| 5 | 3–4 weeks | Grounded streaming answers and citations |
| 6 | 2–3 weeks | Complete responsive, accessible product workflows |
| 7 | 2–4 weeks | Release-grade security, resilience, eval, performance |
| 8 | 1–2 weeks | Production deployment and operational readiness |
| 9 | 1–2 weeks | Honest portfolio narrative and demo |

Total indicative focused range: 19–32 weeks. Provider reviews, design iteration, part-time work, or unexpected extraction/RLS issues can extend calendar time.

## 3. Phase 0 — Planning and repository setup

**Goal:** Convert approved documentation into a safe implementation foundation and retire the highest-uncertainty technical questions.

**Dependencies:** Approval of PRD scope, target deployment plans/regions, and permission to begin implementation.

**Tickets:**

- **P0-01 Repository quality gates and architecture skeleton (recommended first ticket).** Initialize pinned Node/package manager, Next.js TypeScript App Router, formatting/lint/typecheck/test/build scripts, minimal folder boundaries, CI, dependency/secret scanning, and a documentation link. Render only a neutral placeholder; do not implement auth or product features. Estimate 3–5 focused days including CI troubleshooting.
- **P0-02 Local Supabase and migration/test harness.** Initialize through current CLI, environment separation, empty schema migration workflow, pgTAP/RLS test runner, and deterministic seed identities. Estimate 3–5 days.
- **P0-03 PDF extraction/security spike.** Evaluate candidate libraries on the fixture corpus and Vercel Node limits; publish decision evidence. Estimate 4–7 days.
- **P0-04 Worker/queue continuation spike.** Prove Queue lease, secured scheduled invocation, checkpoint, killed-run recovery, and plan duration constraints. Estimate 4–7 days.
- **P0-05 RAG evaluation harness skeleton.** Create synthetic source fixtures, question schema, config/result format, and deterministic retrieval metric runner without production UI. Estimate 3–5 days.
- **P0-06 Threat-model and privacy decision review.** Resolve region/provider data controls, retention, malware-scanning stance, and critical incident owner. Estimate 2–4 review days spread across stakeholders.

**Deliverables:** Pinned repository and CI; local database harness; spike reports/ADRs; initial synthetic eval corpus; resolved blocking review questions.

**Definition of done:** CI passes from clean checkout; no product feature is claimed; current platform APIs are verified; extractor/worker options have evidence; implementation scope/risks are updated.

**Tests required:** Clean install/build; lint/typecheck/unit smoke; migration up from empty; sample RLS test; secret scan; extraction fixture benchmark; worker duplicate/kill experiment.

**Risks:** Spending time on polished scaffolding; choosing libraries from a single happy PDF; assuming paid-plan limits. Mitigate with time-boxed spikes and written exit criteria.

## 4. Phase 1 — Foundation and authentication

**Goal:** Establish secure identity, workspace tenancy, roles, and product shell before documents or AI.

**Dependencies:** Phase 0 repository/database decisions; Supabase project environments and SMTP plan.

**Tickets:**

- **P1-01 Core schema:** profiles, workspaces, memberships, invitations; indexes, constraints, RLS, grants.
- **P1-02 Supabase SSR:** server/browser clients, PKCE callback, proxy session refresh, cache headers, environment validation.
- **P1-03 Auth screens:** sign-up, verify, sign-in, recovery, sign-out, generic errors, accessibility.
- **P1-04 Workspace creation/switching:** atomic owner creation, slug resolution, active-workspace routing, empty shell.
- **P1-05 Capability authorization:** server policy service plus RLS parity tests; 401/403/404 states.
- **P1-06 Member invitations/roles:** invite acceptance, role hierarchy, removal, owner invariants and audit events.
- **P1-07 Product shell:** responsive navigation, workspace switcher, account menu, loading/error boundaries.

**Deliverables:** A user can authenticate, create/switch a tenant, and manage membership within role rules; no document/AI features.

**Definition of done:** Real user-scoped database paths pass two-workspace adversarial tests; authenticated responses are not shared-cached; member/admin/owner UX matches role matrix.

**Tests required:** Auth callback/reset; CSRF/origin; RLS CRUD matrix; ownership concurrency; workspace switch stale-cache E2E; mobile/keyboard/axe; session refresh/logout/revocation cases.

**Risks:** SSR package churn, recursive RLS, stale JWT assumptions, email deliverability. Use pinned current guidance, database membership authority, and local mail testing.

## 5. Phase 2 — Workspace and document library

**Goal:** Securely accept private PDFs and make document lifecycle visible without yet performing full indexing.

**Dependencies:** Phase 1 tenancy/capabilities; private Storage bucket and upload limits.

**Tickets:**

- **P2-01 Document/version/job schema:** tenant composite FKs, status constraints, RLS/projections, indexes.
- **P2-02 Private Storage policies:** immutable path builder, signed upload/read brokers, expiry and tamper tests.
- **P2-03 Upload intent/finalize:** direct upload, idempotency, object verification, orphan cleanup.
- **P2-04 Library list:** cursor pagination, search/status filters, role-aware actions, real empty/loading/error states.
- **P2-05 Document details/status:** metadata, safe processing timeline, polling/Realtime decision implementation.
- **P2-06 Delete request:** immediate retrieval exclusion invariant (future-proof), async cleanup placeholder/job, reconciliation.

**Deliverables:** Admin uploads an authorized PDF to private storage; members see safe document metadata/status; invalid/tampered uploads fail.

**Definition of done:** No public URLs or browser secret keys; direct object/path manipulation fails; abandoned objects are observable/cleaned; document states render on mobile and desktop.

**Tests required:** Upload matrix, size/MIME/signature metadata paths, RLS/Storage policies, duplicate finalize, signed URL expiration, delete idempotency, accessibility/E2E.

**Risks:** Direct-upload reconciliation and Storage policy mistakes. Use server-derived paths, final verification, short expiries, and adversarial tests.

## 6. Phase 3 — Document ingestion

**Goal:** Convert accepted searchable-text PDFs into deterministic, versioned, ready chunks and embeddings through recoverable background processing.

**Dependencies:** Extractor/worker spike decisions; Phase 2 document lifecycle; OpenAI isolated project/key/budget.

**Tickets:**

- **P3-01 Queue/job consumer:** secured scheduler route, lease/heartbeat, stage checkpoints, retry/dead letter, concurrency.
- **P3-02 Binary validation:** magic/detected MIME, encryption, page/object/resource limits, safe error taxonomy.
- **P3-03 Page extraction:** selected library adapter, page/block output, time/memory limits, extraction-quality gate.
- **P3-04 Normalization/structure:** whitespace, headers/footers, headings, offsets/locators with deterministic tests.
- **P3-05 Chunker:** token-aware structural split, metadata/hashes, version configuration, golden snapshots/property tests.
- **P3-06 Embeddings:** provider adapter, conservative batching, rate/backoff, token usage, deterministic upserts.
- **P3-07 Atomic finalization:** completeness validation, current ready version promotion, partial-version exclusion.
- **P3-08 Failure/retry/reprocess UI:** categorized admin actions and stale-job messaging.
- **P3-09 Deletion/reconciliation:** chunks/embeddings/object cleanup, old deleting/orphan detection.

**Deliverables:** Valid text PDFs progress to ready; scanned/encrypted/corrupt files fail usefully; killed/duplicate worker runs recover without duplicate chunks.

**Definition of done:** Representative max-limit fixture progresses within bounded stages; ready is atomic; all metadata/version fields are present; processing telemetry/alerts exist.

**Tests required:** Malicious/edge PDF corpus; deterministic chunks; duplicate/kill/retry; provider faults; queue fairness; completeness/tenant/RLS; deletion reconciliation; load by page/byte band.

**Risks:** Parser security/quality, Vercel duration/memory, provider rate limits, high embedding cost. Enforce ceilings/checkpoints/batching/budgets and retain a worker-split contingency.

## 7. Phase 4 — Retrieval

**Goal:** Deliver tenant-safe direct search and an evaluated hybrid evidence-selection pipeline.

**Dependencies:** Ready chunks/embeddings; initial annotated evaluation corpus.

**Tickets:**

- **P4-01 FTS column/index and lexical query:** safe `websearch_to_tsquery`, heading weights, search tests.
- **P4-02 Vector query/index:** cosine RPC/function, workspace/current-ready filters inside branch, HNSW benchmark.
- **P4-03 Fusion/dedupe/diversity:** RRF, exact-term features, adjacent overlap handling, versioned config.
- **P4-04 Reranker experiment:** deterministic baseline versus bounded model reranker; latency/cost/quality decision.
- **P4-05 Evidence gate/context assembly:** answer/limited/not-found rules, token budget, escaped opaque handles.
- **P4-06 Search UI/API:** ranked passages, filters, source navigation, lexical-degraded disclosure.
- **P4-07 Retrieval evaluation:** expand to 50+ questions, establish approved category thresholds and baseline.

**Deliverables:** Search works for exact and paraphrased queries; retrieval never leaks cross-tenant canary; evaluation report selects initial configuration.

**Definition of done:** Tenant/readiness filters are verified in query plans and tests; selected context is reproducible; reranker decision is evidence-based; search screen meets UX/accessibility spec.

**Tests required:** Recall/precision/rank metrics by category; SQL plan/load; two-tenant canaries; codes/negation/quotes; zero/ambiguous/conflict; filter tampering; mobile/keyboard/axe.

**Risks:** Filtered vector recall, arbitrary thresholds, reranker latency. Measure skewed tenants, keep RRF fallback, and gate config changes on evals.

## 8. Phase 5 — Answer generation and citations

**Goal:** Produce persistent, streamed, citation-valid answers with explicit unsupported behavior.

**Dependencies:** Phase 4 evidence pipeline; approved provider privacy/model configuration.

**Tickets:**

- **P5-01 Conversation/message schema:** creator-only RLS, ordering, status lifecycle, idempotency.
- **P5-02 Generation prompt/schema:** untrusted evidence contract, structured output, versioning, provider adapter `store:false`.
- **P5-03 Citation validator/persistence:** opaque handle map, claim coverage, stable ordinals, transactional message/citations.
- **P5-04 Streaming endpoint/client:** Nyla SSE protocol, abort, disconnect/reload, terminal state.
- **P5-05 Ask experience:** structured answer, inline citations, evidence panel, limited/not-found/error states.
- **P5-06 Source viewer:** authorized citation resolution, PDF page, extracted evidence alternative, expired/deleted state.
- **P5-07 Conversation history/follow-ups:** pagination, rename/delete, bounded query rewrite/history, fresh evidence.
- **P5-08 Feedback/report:** reason taxonomy, RLS, analytics linkage without content logging.
- **P5-09 Generation evaluation:** correctness/faithfulness/citation/injection/cost/latency comparison and model snapshot approval.

**Deliverables:** End-to-end ask → retrieve → answer/not-found → verify source → feedback; persistent conversations.

**Definition of done:** No completed grounded message bypasses validator; unknown handles impossible to persist; disconnects recover; injection suite passes; selected model/prompt has documented eval.

**Tests required:** Structured contract/provider faults; citation semantic/manual set; SSE lifecycle; history authorization; prompt injection/misleading/unanswerable; E2E source verification; cost/latency.

**Risks:** Fluent unsupported output, structured-stream complexity, source highlighting mismatch. Prefer conservative fallback, validate before success, and label best-effort highlights.

## 9. Phase 6 — UX refinement

**Goal:** Complete the serious knowledge-workspace experience across screens, states, responsive layouts, and accessibility.

**Dependencies:** Functional vertical slice through Phase 5; usability prototypes/feedback.

**Tickets:**

- **P6-01 Overview:** real readiness/recent lists, suggested-question policy, no fake analytics.
- **P6-02 Library/source refinement:** filters, status language, source split view, mobile transforms.
- **P6-03 Ask verification refinement:** answer hierarchy, evidence-quality wording, focus/keyboard/live regions.
- **P6-04 Settings/account/error coverage:** all required screens and destructive confirmations.
- **P6-05 Design-system audit:** tokens, typography, density, consistent primitives/content.
- **P6-06 Accessibility remediation:** manual keyboard/screen reader/zoom/high contrast/reduced motion.
- **P6-07 Usability study:** 5–8 representative users/tasks if feasible; prioritize trust and verification issues.

**Deliverables:** Complete screen/state inventory matching UX spec; accessibility report; addressed high-impact usability findings.

**Definition of done:** Critical journeys work at tested mobile/desktop sizes and 200% zoom; no serious accessibility blocker; users can locate and interpret evidence.

**Tests required:** Visual regression, viewport matrix, axe, NVDA/VoiceOver smoke, keyboard, offline/slow network, long names/answers/many citations.

**Risks:** Cosmetic churn and accessibility deferred to polish. Time-box visual refinements and treat semantic/focus defects as functional blockers.

## 10. Phase 7 — Testing and evaluation hardening

**Goal:** Demonstrate that the system remains secure, reliable, useful, and operable under representative failure and load.

**Dependencies:** Feature-complete beta candidate.

**Tickets:**

- **P7-01 Full RLS/Storage/RPC security audit** and manual privileged-code review.
- **P7-02 Golden set expansion/adjudication** with held-out cases and judge-human calibration.
- **P7-03 Load/query-plan tuning** for skewed tenants, worker bursts, delete, connection budgets.
- **P7-04 Resilience game days** for provider/DB/Storage outage, killed workers, retry storm, stream disconnect.
- **P7-05 Web/application security review:** CSP, CSRF, XSS, SSRF, BOLA, secrets, dependencies/SBOM.
- **P7-06 Data lifecycle verification:** deletion, orphan sweep, backup restore, source tombstones/retention.
- **P7-07 Release evidence automation:** consolidated test/eval/security/artifact report.

**Deliverables:** Release candidate evidence, approved thresholds/exceptions, remediated critical findings, restore/deletion/game-day records.

**Definition of done:** MVP exit criteria and quality gates pass; remaining risks are explicit with owner/date; no critical/high unaccepted issue.

**Tests required:** Entire strategy in document 08, including manual security/accessibility/eval review.

**Risks:** Late architecture changes from load/security findings. Earlier phase tests reduce risk; maintain schedule contingency and prefer scope reduction over weakened controls.

## 11. Phase 8 — Production deployment

**Goal:** Launch a controlled production beta with safe migrations, telemetry, limits, backups, and rollback.

**Dependencies:** Phase 7 approval; production Supabase/Vercel/OpenAI projects/plans and domain/email configuration.

**Tickets:**

- **P8-01 Production infrastructure/config:** regions, secrets, custom domain/TLS, SMTP, budgets, private bucket, queue/scheduler.
- **P8-02 Migration/deploy pipeline:** expand migration, backup, preview artifact tests, production promotion/rollback.
- **P8-03 Observability:** dashboards, alerts, redaction validation, deploy annotations, on-call routing.
- **P8-04 Operational runbooks/game day:** queue stall, provider outage, tenant leak, key rotation, delete reconciliation, restore.
- **P8-05 Controlled beta:** small allowlist, feedback channel, daily quality/cost review, explicit support boundary.

**Deliverables:** Live beta, deployment/rollback record, monitoring/runbooks, verified backups and budgets.

**Definition of done:** Health and critical journey smoke pass in production with synthetic tenant; alerts route correctly; no real customer documents used in smoke; beta users receive accurate privacy/product limitations.

**Tests required:** Post-deploy smoke, auth email, RLS canary, upload/ask/source synthetic journey, security headers, alert synthetic, rollback rehearsal.

**Risks:** Environment drift, migration incompatibility, absent on-call capacity. Use identical artifact, expand/contract migrations, small allowlist, and clear availability expectations.

## 12. Phase 9 — Portfolio presentation

**Goal:** Explain the problem, decisions, implementation, evidence, and limits honestly to technical reviewers.

**Dependencies:** Stable beta and sanitizable synthetic demo data.

**Tickets:**

- **P9-01 Case study:** problem, scope/non-goals, architecture, threat model, trade-offs, measured results with conditions.
- **P9-02 Demo workspace:** synthetic policies/manuals, scripted answerable/unanswerable/injection/source-verification journeys.
- **P9-03 Architecture/eval visuals:** current diagrams, retrieval comparison, latency/cost/quality reports using real measured values.
- **P9-04 Public repository hygiene:** setup, screenshots, license, contribution/security notes, no secrets/customer data.
- **P9-05 Demo resilience:** seeded reset, clear failure fallback, recorded walkthrough if live provider unavailable.

**Deliverables:** Public case study/demo and reproducible reviewer instructions.

**Definition of done:** Claims are backed by measured evidence; limitations/non-goals are visible; demo proves citations/no-answer/tenant security without exposing production data.

**Tests required:** Fresh reviewer setup, secret/history scan, link/image/accessibility check, demo script rehearsal, synthetic data license review.

**Risks:** Overclaiming production readiness or cherry-picking. Include configuration/test conditions, failed experiments, and remaining risks.

## 13. Recommended first implementation ticket

### P0-01 — Repository quality gates and architecture skeleton

**Do only after documentation approval.**

**Scope:**

- Pin a supported Node version and one package manager.
- Initialize a current stable Next.js App Router TypeScript project with Tailwind.
- Add strict TypeScript, ESLint, Prettier, Vitest, and CI jobs for install/lint/typecheck/test/build.
- Create only the agreed top-level module folders and `server-only` boundary convention.
- Add dependency/secret scanning and a pull-request template linking the review checklist.
- Render a plain Nyla planning placeholder and link to `/docs`; do not implement auth, Supabase schema, upload, UI mock dashboard, or AI calls.

**Acceptance criteria:** Clean checkout passes all scripts in CI; lockfile and versions are committed; client build contains no server placeholder secret; README commands are correct; no product implementation is present.

**Why first:** It creates reproducible quality gates for every later ticket without pre-empting unapproved product/data decisions.

## 14. Roadmap change control

At each phase gate, update actual effort, discoveries, architecture decisions, risk scores, and next-phase scope. A new provider/service, file type, role, connector, or access-control dimension requires an ADR and threat/evaluation impact review before entering a sprint.
