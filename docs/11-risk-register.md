# 11 — Risk Register

**Status:** Active Nyla planning register  
**Scale:** Likelihood (L) and impact (I) from 1 low to 5 high; exposure = L × I. Scores are planning judgments, not measured probabilities.

## 1. Highest-priority risks

The five greatest engineering risks are R-01 tenant leakage, R-02 unfaithful answers/citations, R-03 PDF extraction/security, R-04 bounded background execution, and R-05 retrieval quality under filtered scale.

| ID | Risk | L | I | Exposure | Early warning / trigger | Mitigation | Contingency | Owner | Status |
|---|---|---:|---:|---:|---|---|---|---|---|
| R-01 | Cross-workspace data leaks through RLS, retrieval RPC, cache, Storage, citation, or privileged worker | 3 | 5 | 15 | Foreign canary, unexpected auth denial pattern, unscoped query/definer function | Direct tenant columns + composite FKs; RLS; filters before rank/limit; private URLs; no authenticated shared cache; two-tenant adversarial suite; privileged-code review | Disable affected route/worker, revoke URLs/keys/sessions, investigate as critical incident, notify per obligations | Security/Backend | Open |
| R-02 | Fluent answer is unsupported or citation does not support adjacent claim | 4 | 5 | 20 | Citation-failure/unsupported report, faithfulness regression, judge-human disagreement | Evidence gate; structured claims/handles; no general knowledge/tools; citation validation; golden set; conservative no-answer; visible evidence | Disable generation or switch to Search-only/stricter gate; rollback model/prompt/config | Applied AI/Product | Open |
| R-03 | Malicious or poorly structured PDFs cause parser exploit, resource exhaustion, or misleading extraction | 4 | 5 | 20 | Parser CVE/crash, high empty/replacement ratio, memory/time kill, incorrect page citations | Maintained parser spike; private immutable bytes; signature/encryption/object/page/time/memory limits; no PDF script/network; extraction-quality gate; hostile fixture corpus | Quarantine/fail affected files; pause ingestion; patch/swap parser; lower limits; reprocess versions | Security/Ingestion | Open |
| R-04 | Vercel execution ceilings or scheduler behavior leave large ingestion jobs stuck or expensive | 4 | 4 | 16 | Queue age/stuck stages, killed functions, duplicate work/cost, max-duration fixtures fail | Supabase Queue; one bounded stage/batch; checkpoint/lease/heartbeat; plan-limit spike; concurrency/backoff; idempotency | Split worker into dedicated deployment/workflow service through ADR; temporarily reduce limits | Platform/Ingestion | Open |
| R-05 | Hybrid/filtered vector retrieval has low recall or poor latency as tenants/chunks grow | 4 | 4 | 16 | Recall@k/category regression, p95 growth, HNSW plan/post-filter misses, large-tenant skew | FTS + vector; RRF; HNSW benchmark; candidate tuning; exact small-set baseline; query plans; per-size evals; rerank only if useful | Increase candidates/iterative scans; reindex/tune; temporarily lexical-first; evaluate alternative vector store only after evidence | Applied AI/Data | Open |

## 2. Full register

| ID | Risk | L | I | Exposure | Early warning / trigger | Mitigation | Contingency | Owner | Status |
|---|---|---:|---:|---:|---|---|---|---|---|
| R-06 | Supabase SSR, Data API exposure, or Next.js framework changes invalidate auth/cache design | 3 | 4 | 12 | Deprecation/changelog, refresh bugs, shared-cache header regression | Pin dependencies; verify current docs/changelog; integration tests for cookies/cache; upgrade PRs | Hold/rollback version; patch within supported path; block deploy | Platform | Open |
| R-07 | OpenAI outage/rate change/model update causes errors, cost growth, or quality drift | 4 | 4 | 16 | 429/5xx, latency/cost alert, model retirement, eval regression | Date-pinned configurable models; backoff/budgets; provider adapter; golden eval; `store:false`; no silent fallback | Search-only/degraded mode; rollback snapshot/config; queue embeddings; evaluate alternate model/provider via ADR | Applied AI/Platform | Open |
| R-08 | Deletion leaves chunks, files, signed access, citations, or backups longer than users expect | 3 | 5 | 15 | Old `deleting`, orphan reconciliation, valid URL after removal, policy mismatch | Immediate retrieval exclusion; idempotent cleanup; short URLs; reconciliation; retention disclosure; restore-aware policy | Disable source access, run targeted cleanup, notify/incident if contractual breach | Data/Privacy | Open |
| R-09 | Service-role/secret key reaches browser, logs, preview, or repository | 2 | 5 | 10 | Secret scan, client-bundle inspection, suspicious API usage | Separate env schemas; server-only modules; Vercel secrets; push protection; redaction; least privilege/rotation | Revoke/rotate immediately, inspect access, rebuild/deploy, incident review | Security/Platform | Open |
| R-10 | Workspace-wide document visibility is insufficient for real customers and forces access-model redesign | 3 | 4 | 12 | Discovery requests for departmental/confidential collections | State limitation early; target suitable beta; keep tenant keys/provenance clean | Add collection/document ACL design via ADR/RLS/retrieval overhaul before onboarding affected customers | Product/Architecture | Accepted for MVP |
| R-11 | Evaluation corpus is too small/synthetic, so reported quality does not generalize | 4 | 4 | 16 | Production feedback diverges, metrics unstable, category blind spots | 50+ stratified seed; held-out cases; human adjudication; representative permitted samples; no aggregate-only gate | Narrow product claims/scope; expand labels; stricter no-answer; targeted retrieval fixes | Applied AI/Product | Open |
| R-12 | Model reranker adds cost/latency without enough quality gain | 3 | 3 | 9 | Small/no eval improvement, p95/cost increase, frequent fallback | Compare with deterministic RRF baseline; timeout/budget; feature flag | Ship deterministic mode; revisit with better labels/model | Applied AI | Open |
| R-13 | Auth email deliverability or account recovery failures block activation | 3 | 3 | 9 | Bounce/delivery delay/support reports | Custom production SMTP, domain records, provider monitoring, resend cooldown, accessible recovery | Alternate verified provider; manual support process without bypassing identity proof | Product/Platform | Open |
| R-14 | Abuse or retry loops exhaust OpenAI/database/Storage budget | 3 | 4 | 12 | Token/cost slope, duplicate provider calls, workspace burst | Atomic limits/budgets; idempotency; bounded retries/concurrency; circuit breakers; cost telemetry | Pause expensive operations/workspace, lower limits, rotate compromised key | Platform | Open |
| R-15 | Accessibility/source viewer fails users because PDFs are untagged or stream UI is noisy | 3 | 4 | 12 | Manual audit failures, feedback, focus/live-region regressions | Extracted text alternative; keyboard controls; throttled announcements; WCAG/manual tests; source accessibility disclosure | Offer authorized download/HTML excerpt; pause problematic live announcements; remediate before release | UX/Frontend | Open |
| R-16 | One developer cannot operate production incidents/security/privacy obligations | 4 | 4 | 16 | Alert fatigue, slow patching, missed restores, unresolved queue age | Small beta; clear support/SLO limits; managed services; runbooks/automation; budget; minimal services | Pause onboarding/expensive features; schedule maintenance; obtain operational/security support | Product/Tech lead | Open |
| R-17 | Conversation/history data retention creates privacy risk or customer objection | 3 | 4 | 12 | Deletion/export request, legal review issue, growing sensitive corpus | Creator-only RLS; minimal logs; explicit retention/deletion controls; no provider state; policy review | Shorten/default-delete history; disable persistence for affected segment via reviewed design | Privacy/Product | Open |
| R-18 | Database migrations/index builds cause downtime or incompatibility | 2 | 4 | 8 | Long lock/build, preview/prod drift, rollback failure | Expand/contract; concurrent/validated operations; backup; advisors; representative data; same artifact promotion | Roll back app if compatible; forward-fix; restore only with reviewed incident plan | Data/Platform | Open |

## 3. Risk acceptance rules

- Critical impact risks cannot be silently accepted. Acceptance names accountable owner, rationale, controls, expiry/review date, and affected customers.
- Any observed cross-tenant leak, secret exposure, parser code execution, or successful unknown citation persistence stops release and activates incident handling.
- Changes in scope, provider, file type, access model, or deployment topology require a register review.
- Review weekly during implementation/beta and at every phase gate; monthly after stable launch.

## 4. Assumption-to-risk links

- Searchable-text English PDFs → R-03, R-11, R-15.
- Workspace-wide visibility → R-01, R-10.
- Bounded Vercel worker → R-04, R-14, R-16.
- OpenAI single provider → R-02, R-07, R-12.
- One-developer operations → R-06, R-14, R-16, R-18.
- Initial regional/provider posture unresolved → R-08, R-17 and the privacy decision gate.

## 5. Review questions

1. Which customer/data class is safe for the initial deployment region and provider terms?
2. What operational availability/support is honest for a one-developer beta?
3. Does the max-file scope need to shrink if the worker spike misses its bound?
4. What minimum human-reviewed evaluation set is credible for portfolio claims?
5. Who can declare/close a security incident and contact affected beta users?
