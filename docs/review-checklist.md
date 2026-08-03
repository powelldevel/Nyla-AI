# Nyla pre-implementation review checklist

**Purpose:** This is the approval gate for starting application implementation. Check an item only after reviewing the linked design and recording any exception in an ADR or risk acceptance.

## 1. Scope and product

- [ ] Vision, target organizations, personas, pain points, and value proposition are credible.
- [ ] MVP scope is achievable by one developer; non-goals are explicit and acceptable.
- [ ] Searchable-text PDF-only, no OCR, and initial 25 MiB/300-page limits are approved as hypotheses.
- [ ] Owner/administrator/member capabilities and exactly-one-owner invariant are approved.
- [ ] Workspace-wide document visibility is acceptable for initial customers.
- [ ] A separate read-only/auditor role is correctly deferred.
- [ ] Success measures are definitions/targets, not presented as current results.
- [ ] MVP exit criteria have named reviewers/owners.

Reference: [`01-product-requirements-document.md`](01-product-requirements-document.md)

## 2. User experience

- [ ] Information architecture distinguishes Overview, Library, Ask, Search, Conversations, and Settings for clear reasons.
- [ ] Ask is more than chat: answer hierarchy, inline citations, evidence panel, related questions, feedback, and not-found behavior are specified.
- [ ] Every required screen has desktop/mobile, empty/loading/error, actions, hierarchy, components, and accessibility behavior.
- [ ] Processing/failure states use plain language and never imply a file is searchable before readiness.
- [ ] No fake analytics, generic dashboard filler, decorative AI styling, or numerical confidence percentage is planned.
- [ ] Citation/source verification works by keyboard and with an extracted-text alternative to PDF canvas.
- [ ] WCAG 2.2 AA target and manual screen-reader/zoom/high-contrast tests are funded in the roadmap.

Reference: [`04-ui-ux-specification.md`](04-ui-ux-specification.md)

## 3. Architecture and technical design

- [ ] Modular monolith and component responsibilities are understandable and appropriately minimal.
- [ ] Server Components, Server Actions, Route Handlers, client islands, and Node.js runtime boundaries are approved.
- [ ] Authenticated pages and session-refresh responses are private/no-store; no shared caching risk remains.
- [ ] Upload, ingestion, RAG, auth, deployment, ERD, and lifecycle diagrams match the prose.
- [ ] Supabase Queue + bounded Vercel worker has a planned spike and a documented contingency.
- [ ] Route/API/stream/error contracts and idempotency strategy are implementable.
- [ ] Environment secrets and browser-safe variables are clearly separated.
- [ ] Migration and preview/production promotion strategy is compatible with rollback.

References: [`02-system-architecture.md`](02-system-architecture.md), [`03-technical-design-document.md`](03-technical-design-document.md), [`12-architecture-decision-records.md`](12-architecture-decision-records.md)

## 4. Data and tenancy

- [ ] `workspace_id` is present/derivable and indexed for every tenant resource; composite FKs prevent mismatched tenants.
- [ ] Every required table has purpose, fields, keys, indexes, uniqueness, deletion, tenancy, and RLS documented.
- [ ] RLS is enabled before exposure and grants are explicitly reviewed separately from RLS.
- [ ] Role data is stored in membership rows, not editable user metadata or blindly trusted JWT claims.
- [ ] UPDATE policies use both `USING` and `WITH CHECK`; membership predicates use indexed columns.
- [ ] Retrieval filters workspace and current-ready version inside each semantic/lexical branch before rank/limit.
- [ ] Privileged/security-definer helpers have an explicit justification, fixed search path, least EXECUTE grants, and adversarial tests.
- [ ] pgvector model/dimensions, HNSW/FTS indexes, reprocessing, and dimension migration are understood.
- [ ] Document/conversation/account deletion and historic citation tombstone policy is decided.
- [ ] Backup retention and restore-test obligations are approved.

Reference: [`05-database-and-data-design.md`](05-database-and-data-design.md)

## 5. RAG and applied AI

- [ ] Extraction library spike criteria cover quality, security, runtime, and licensing.
- [ ] Normalization/chunking preserve pages, sections, offsets where practical, and version metadata.
- [ ] Initial chunk/candidate/context values are explicitly hypotheses to evaluate.
- [ ] Hybrid retrieval/RRF/reranking design has a deterministic fallback and measured promotion criterion.
- [ ] Evidence gate handles answerable, partial, ambiguous, conflicting, misleading, and unanswerable cases.
- [ ] Documents are delimited/escaped untrusted content and generation has no tools/data access.
- [ ] OpenAI requests are server-only, minimized, configured `store:false`, and model snapshots/config versions are persisted.
- [ ] Structured output and source-handle validation occur before completed-grounded persistence.
- [ ] Every material answer claim must have a supporting persisted citation; invalid output fails closed.
- [ ] Conversation history never substitutes prior assistant claims for fresh document evidence.

Reference: [`06-rag-pipeline-design.md`](06-rag-pipeline-design.md)

## 6. Security and privacy

- [ ] Threat model covers tenants, malicious users/documents, dependencies, operators, providers, and denial of service.
- [ ] Cross-workspace canary tests span RLS, RPC, Storage, application, cache, citation, and worker paths.
- [ ] Private Storage, immutable server-derived paths, short signed URLs, and revocation limitations are approved.
- [ ] Service-role/OpenAI/worker/deploy secrets cannot enter browser builds, logs, source, or preview jobs.
- [ ] Direct and indirect prompt-injection defenses rely on containment/validation, not only instructions.
- [ ] CSP, CSRF/origin, XSS/output handling, SSRF, BOLA, rate limiting, and security headers are planned.
- [ ] Malicious PDF limits and malware-scanning stance are explicitly approved/disclosed.
- [ ] Audit events are sufficient and content-minimized.
- [ ] Launch region, OpenAI/Supabase data terms, provider retention, user retention, deletion, backups, and privacy notice are approved.
- [ ] Incident severity/owner/provider contacts/notification process exist before beta.

Reference: [`07-security-and-privacy-design.md`](07-security-and-privacy-design.md)

## 7. Testing, evaluation, and observability

- [ ] Static/unit/database/RLS/API/upload/retrieval/citation/E2E/accessibility/security/load tests have owners and CI placement.
- [ ] Golden corpus contains no customer data and includes all specified categories, canaries, and prompt injections.
- [ ] At least 50 labeled questions and a held-out split are planned before beta.
- [ ] Retrieval relevance, precision/recall, correctness, faithfulness, citation quality, unsupported rate, latency, and cost have definitions.
- [ ] Automated/judge/human responsibilities and judge calibration are clear.
- [ ] Numeric quality/SLO thresholds will be set from a representative baseline, not invented now.
- [ ] Zero-tolerance gates for cross-tenant canaries and invalid citation handles are approved.
- [ ] Logging schema and redaction tests exclude raw content, identity, secrets, embeddings, and signed URLs.
- [ ] Upload/extraction/embedding/retrieval/generation/empty-result/token/cost/rate-limit/auth/feedback/citation metrics and alerts are covered.
- [ ] Runbooks and staging game days cover tenant leak, provider outage, queue stall, retry/cost storm, deletion, and restore.

References: [`08-testing-and-quality-strategy.md`](08-testing-and-quality-strategy.md), [`09-observability-and-evaluation-plan.md`](09-observability-and-evaluation-plan.md)

## 8. Roadmap, risks, and operations

- [ ] Phase order is feasible and high-risk spikes precede dependent features.
- [ ] Estimates are rechecked against developer availability and paid-plan constraints.
- [ ] Each phase has dependencies, deliverables, definition of done, tests, and risks.
- [ ] Recommended first ticket P0-01 is approved but has not been executed.
- [ ] Five greatest engineering risks have owners, triggers, mitigations, and contingencies.
- [ ] One-developer support/availability expectations are honest for beta.
- [ ] New services/features/roles/file types require ADR/threat/evaluation review.
- [ ] Portfolio plan uses measured results and synthetic data, with limitations visible.

References: [`10-implementation-roadmap.md`](10-implementation-roadmap.md), [`11-risk-register.md`](11-risk-register.md)

## 9. Blocking unresolved decisions

Record decisions and link ADR/risk before approval:

| Decision | Owner | Resolution / link |
|---|---|---|
| Initial customer/data classification and launch region | Product/Privacy | |
| OpenAI project data controls, retention, region, and approved generation snapshot | Privacy/Applied AI | |
| Supabase/Vercel production plans and worker/scheduler limits | Platform | |
| PDF parser and viewer library after spike | Ingestion/Security | |
| Malware-scanning requirement or documented absence | Security/Privacy | |
| Document/conversation/feedback/audit/backup retention | Product/Privacy | |
| Deleted-source citation tombstone behavior | Product/Privacy | |
| Downloads allowed for all workspace members | Product/Security | |
| Numeric staging SLO and RAG promotion thresholds | Engineering/Product | |
| Incident owner and beta support expectations | Product/Tech lead | |

## 10. Sign-off

One person may hold multiple roles, but each review lens should be completed explicitly.

| Review lens | Reviewer | Date | Outcome / conditions |
|---|---|---|---|
| Product | | | |
| Architecture/Engineering | | | |
| Applied AI | | | |
| Security/Privacy | | | |
| UX/Accessibility | | | |
| Operations/Quality | | | |

### Implementation authorization

- [ ] All blocking decisions are resolved.
- [ ] Conditional approvals have owners and due dates.
- [ ] Product owner explicitly authorizes Phase 0 implementation.

Until the final box is checked, Nyla remains documentation-only and the first ticket is a proposal.
