# 09 — Observability and Evaluation Plan

**Status:** Draft for operational review  
**Goal:** Detect user-impacting failures, security anomalies, quality drift, and cost growth without turning private content into telemetry.

## 1. Observability model

Nyla uses four connected signals:

- **Structured logs:** discrete request/job/security events with IDs, stages, results, and safe error classes.
- **Metrics:** rates, distributions, gauges, and budgets aggregated by environment/operation/model/config.
- **Traces:** request → authorization → retrieval branches → rerank → generation and job → stages/provider calls, with no raw content attributes.
- **Product/evaluation events:** privacy-safe behavior events and offline golden-set results.

Every interactive request gets `request_id`; a question also has `answer_request_id`; ingestion has `job_id`; outbound calls capture provider request ID where allowed. `correlation_id` joins them without putting user content in span/log names.

## 2. Safe structured logging schema

Common fields:

```text
timestamp, level, environment, service, event_name, schema_version
request_id, correlation_id, trace_id
workspace_id_pseudo, actor_id_pseudo, role, authorization_result
document_id, document_version_id, job_id, conversation_id, message_id
stage, status, attempt, retryable, error_class, safe_error_code
duration_ms, queue_age_ms, candidate_count, selected_count
model, config_version, input_tokens, output_tokens
http_route_template, http_method, status_code
```

Pseudonymous user/workspace values are HMACs with a rotateable telemetry key when exported externally; operational database IDs may remain in tightly controlled internal logs if needed for incident resolution.

### Never log by default

Raw PDF/chunk/page text; questions; answers; feedback comments; file/display names; email/name; passwords; JWT/cookies/auth headers; OpenAI/Supabase/worker keys; complete provider payloads; embeddings; signed URLs/storage paths with tokens; arbitrary request bodies; SQL parameters containing text.

Redaction happens before log export. Tests feed representative secrets, URLs, and private fields through the logger and assert absence. Debug content capture, if ever needed, is an explicit short-lived incident feature with approval, access audit, environment scope, and automatic expiry—not a log-level switch.

## 3. Metrics catalog

### Ingestion

- `uploads_started_total`, `uploads_finalized_total`, `upload_failures_total{reason}`
- `ingestion_jobs_total{stage,result}`, `ingestion_stage_duration_ms{stage}`
- `ingestion_queue_depth`, `ingestion_oldest_age_ms`, `ingestion_retry_total{stage,reason}`
- `extraction_failures_total{category}`, `extraction_empty_page_ratio` distribution
- `embedding_batches_total{result,model}`, `embedding_tokens_total`, `embedding_latency_ms`
- `documents_processing{status}`, `documents_stuck_total{stage}`
- deletion queue age and orphan reconciliation counts

### Retrieval and generation

- `questions_total{outcome}`, `searches_total{mode}`
- `retrieval_duration_ms{branch}`, candidate/selected count distributions
- `empty_retrieval_total`, `evidence_gate_total{outcome,rule_version}`
- `rerank_duration_ms{mode,result}`, fallback rate
- `generation_time_to_first_byte_ms`, `generation_duration_ms{model,outcome}`
- `generation_tokens_total{model,direction}`, `citation_validation_total{result,reason}`
- `answer_stream_disconnect_total{phase}`, pending-message age
- estimated API cost by workspace/model/operation from versioned pricing config; label as estimate and reconcile where provider data exists

### Security/product

- authorization denials by route/capability (carefully rate-limited to avoid cardinality)
- 401/403/404/409/422/429/5xx rates; worker-auth failures; signed URL issuance/failures
- rate-limit events by operation and workspace pseudonym
- feedback helpful/unhelpful/reason aggregates and citation-open rate
- activation funnel and processing outcome based only on real events

Avoid high-cardinality metric labels such as raw workspace IDs, request IDs, filenames, questions, error messages, or URLs. IDs belong in logs/traces, not metric dimensions.

## 4. Service-level indicators and objectives

Initial SLOs are proposals to validate after staging baseline, not claims:

| Journey | SLI | Initial objective |
|---|---|---|
| Authenticated product reads | successful non-5xx responses / eligible requests | Set after baseline; exclude deliberate 4xx |
| Search | p95 server duration and success | PRD target under 2 s, validate by corpus/region |
| Ask responsiveness | p95 accepted-to-first-byte | PRD target under 4 s, separate completion |
| Ingestion | terminal ready or explained permanent failure within size-banded window | Define per page/byte band after load tests |
| Source verification | authorized citation opens successfully | High-priority availability indicator |
| Tenant isolation | cross-tenant canary leakage | Zero tolerance |
| Citation integrity | completed-grounded answers passing validator | 100% by construction; failure changes outcome |

Track error budgets only after objectives and exclusions are reviewed. Do not hide slow/no-answer cases by excluding them from denominators.

## 5. Alerts and runbooks

| Condition | Severity | Initial trigger approach | Runbook action |
|---|---|---|---|
| Cross-tenant canary/authorization invariant | Critical | Any event | Disable affected retrieval/source route, preserve evidence, incident response |
| Citation validation accepted-invalid invariant | Critical | Any | Stop grounded answer completion, inspect deploy/config |
| Worker auth failures | High | Sustained or unexpected source | Rotate secret, block source, inspect scheduler |
| Queue oldest age | High | Exceeds size-banded operating window | Check scheduler/worker/provider/DB, safely increase drain |
| Extraction/embedding failure spike | High | Rate/deviation with minimum volume | Segment category/provider/deploy; pause retries if storm |
| Ask/search 5xx or latency spike | High | Multi-window burn-rate | Inspect dependency spans, feature fallback/circuit breaker |
| Empty retrieval/unsupported shift | Medium | Significant baseline deviation | Check document readiness/config/model/index, run eval sample |
| Token/cost budget anomaly | High/Medium | Workspace/global budget or slope | Rate limit/circuit break, verify loop/retry/model config |
| Stuck pending messages/deleting documents | Medium | Age threshold | Reconcile/terminalize idempotently |
| RLS/DB advisor/security scan finding | High by severity | New critical/high | Block release or hotfix |

Each runbook contains user impact, dashboards/queries, safe diagnostic IDs, likely causes, containment, recovery, verification, escalation/provider contacts, and post-incident tasks.

## 6. Dashboards

### Operations overview

Traffic/success/latency by route; dependency error/latency; queue depth/age; worker stage outcomes; database connections/query latency; current deploy/config version.

### Ingestion

Funnel upload → queued → extracting → embedding → ready/failed; duration by page/byte band; failure categories; retries/dead letters; orphan/deletion reconciliation.

### RAG quality and cost

Question outcomes; empty retrieval; evidence gate; rerank fallback; citation validation; feedback and citation opens; latency/token/cost by model/config. Drill-down uses record IDs and restricted access, not content.

### Security

Auth anomalies, authorization denials, rate limits, worker-auth failures, member/role/destructive audit events, secret/dependency findings, canary state.

Dashboards distinguish no traffic from zero errors and annotate deployments/config/model changes.

## 7. RAG evaluation in production

### Offline continuous evaluation

- Run the golden suite on every RAG-affecting PR and scheduled against current production configuration.
- Store aggregate and case IDs, configuration versions, scores, latency/tokens/cost, judge versions, and approval—not customer text.
- Alert on category regression and held-out injection/citation cases.

### Online signals

- Helpful/unhelpful, reason, report-unsupported, citation open, follow-up/rephrase, intentional not-found, empty retrieval, and abandonment.
- Signals are diagnostic, not ground truth. For example, citation opening can mean healthy verification or distrust.
- Sample only with explicit privacy basis for human review. Access to a reported answer/source follows least privilege and is audited.

### Drift review

Weekly during beta, then monthly: compare outcome/empty retrieval/feedback/citation failure by config, document size/type/extraction-quality band, and query category proxies. Trigger a golden-set rerun and source-quality inspection before tuning thresholds.

## 8. Cost accounting

Record actual input/output/embedding tokens returned by provider per request/job, model snapshot, retry attempt, and workspace. A version-controlled pricing table estimates cost in micros and includes effective dates; estimates are labeled and reconciled with provider billing. Alert on retry-amplified cost, a model/config change, unusual context size, or per-workspace budget.

Do not expose fake savings or precise bills to customers before reconciliation and billing requirements exist.

## 9. Data retention and access

- Application logs: proposed 14–30 days searchable, longer aggregate metrics; security needs may justify separate retention.
- Traces: sampled and short-lived, with errors retained longer only if still content-free.
- Metrics: 13 months of aggregates if cost permits; no raw content.
- Eval artifacts: synthetic corpus/results in source/build artifacts; human review records per policy.
- Audit events: approved security/legal retention, access-controlled.

Production telemetry access requires named accounts, MFA, least privilege, and access review. Exports use encrypted transport/storage. Deletion/anonymization rules cover telemetry pseudonyms and any linked operational IDs.

## 10. Operational readiness checklist

- Correlation propagation verified across browser/server/database/worker/provider.
- Redaction tests and manual log sample pass.
- Required metrics appear under success, failure, no-traffic, and retry scenarios.
- Alerts route to a real owner and fire in staging game day.
- Runbooks exercised for provider outage, queue stall, citation failure, cost spike, and suspected tenant leak.
- Dashboard deploy/config annotations work.
- Backup restore and deletion reconciliation emit observable results.
- Telemetry quotas/sampling cannot silently drop critical security events.

## 11. Open observability decisions

1. Whether Vercel's native observability is sufficient for beta or an OpenTelemetry-compatible vendor is required.
2. Final log/trace/audit retention and region.
3. On-call coverage and escalation expectations for a one-developer portfolio deployment.
4. Which approved workflow permits human inspection of user-reported content.
5. Numeric SLO and RAG metric thresholds after the first representative staging baseline.
