# 05 — Database and Data Design

**Status:** Draft for Nyla data/security review  
**Database:** Supabase-managed PostgreSQL with `vector` extension  
**Tenancy rule:** Every tenant-owned query is scoped to an authenticated `workspace_id` and protected by RLS.

## 1. Data design principles

1. PostgreSQL is the source of truth for identity linkage, tenancy, lifecycle, conversations, citations, and usage.
2. Workspace membership rows—not URL slugs, client state, or editable JWT user metadata—determine authorization.
3. Tenant-owned tables carry `workspace_id` even when it can be reached through a parent. This deliberate denormalization makes RLS and retrieval filters local and indexable; composite foreign keys prevent inconsistency.
4. A document is a logical source; a document version is an immutable uploaded object and processing boundary.
5. Partially processed versions never become searchable. `documents.current_version_id` points only to a ready version.
6. Time is stored as `timestamptz` in UTC; human strings use `text`; IDs use UUID; flexible JSON is limited to evolving metadata, not core relational fields.
7. Foreign keys, RLS predicates, frequent filters, and cascade paths are indexed explicitly because PostgreSQL does not automatically index foreign keys.
8. Public-schema tables have RLS enabled before access grants. Data API exposure is deliberate; backend-only helpers/queue objects live in a non-exposed `private` schema.

## 2. Extensions and schemas

- `public`: product tables exposed only as required through Supabase Data API; RLS on every table.
- `private`: reviewed authorization helpers, maintenance functions, retrieval internals if not directly callable, and operational objects. Revoke default `PUBLIC` access.
- Extensions: `vector`, `pgcrypto` (UUID/digest as needed), `pg_trgm` only if later justified, `pg_stat_statements` for operations, and `pgTAP` in test environments.
- Supabase Queues/`pgmq` is managed through its supported schema/API; client roles receive no queue consumer rights.

Do not pin extension versions in SQL because current Supabase platform behavior uses supported defaults; record observed versions in deployment evidence and test before upgrades.

## 3. Relationship and tenant strategy

The conceptual ERD is in [system architecture](02-system-architecture.md#11-database-entity-relationships). The database also uses composite uniqueness such as `unique(id, workspace_id)` on tenant parents, allowing children to reference `(parent_id, workspace_id)`. This guarantees that a child cannot claim workspace A while pointing to a parent in workspace B.

Deletion defaults:

- User/profile deletion is restricted until sole-owned workspaces are transferred/deleted.
- Workspace deletion is an explicit asynchronous lifecycle, not an incidental cascade from a browser request.
- Document logical deletion immediately removes retrieval eligibility; physical child/object deletion is idempotent and reconciled.
- Conversations may cascade messages/citations/feedback after user confirmation.
- Citations to deleted documents can retain non-content tombstone metadata if policy allows, but extracted excerpts and object access are removed.

## 4. Table specifications

Fields listed are important fields, not executable DDL. Exact DDL belongs to reviewed migrations.

### 4.1 `profiles`

- **Purpose:** Application profile corresponding one-to-one with `auth.users`.
- **Fields:** `id uuid`, `display_name text`, `avatar_path text null`, `locale text`, `created_at`, `updated_at`, `deleted_at null`.
- **PK/FK:** PK `id`; FK `id -> auth.users(id)` with coordinated delete.
- **Indexes/uniqueness:** PK; no public email duplicate because Auth owns email.
- **Deletion:** Account workflow first resolves ownership/membership and conversations; profile is soft-marked during workflow, then deleted with Auth user under administrative operation.
- **Tenant ownership:** User-owned, not workspace-owned.
- **RLS:** Authenticated user selects/updates only `id = (select auth.uid())`; limited display data for co-members should come through a security-invoker view/RPC that verifies shared workspace, not broad profile SELECT.

### 4.2 `workspaces`

- **Purpose:** Tenant root and human identity.
- **Fields:** `id uuid`, `name text`, `slug text`, `status text` (`active|deleting`), `created_by uuid`, `created_at`, `updated_at`, `deleted_at null`, `row_version bigint`.
- **PK/FK:** PK `id`; FK `created_by -> profiles(id)` restrict.
- **Indexes/uniqueness:** Unique normalized `slug`; unique `(id, workspace_id)` is unnecessary because this is the root; index `created_by`; partial index on active slug if soft-deleted slugs may be reused.
- **Deletion:** Owner-only asynchronous delete after recent authentication; status becomes `deleting`, which denies normal access before children/storage are cleaned.
- **Tenant ownership:** Self.
- **RLS:** Active members may select; admins update allowed fields with `USING` and `WITH CHECK`; only owner can initiate deletion. Insert occurs through a transaction that also creates owner membership.

### 4.3 `workspace_members`

- **Purpose:** Authoritative user-to-workspace membership and role.
- **Fields:** `id uuid`, `workspace_id uuid`, `user_id uuid`, `role text` (`owner|administrator|member`), `status text` (`active|invited|suspended` if invitations are co-located; preferred invitation table below), `joined_at`, `created_by`, `updated_at`.
- **PK/FK:** PK `id`; FK workspace cascade only during controlled workspace deletion; FK user/profile restrict or coordinated delete; `created_by` set null when inviter removed.
- **Indexes/uniqueness:** Unique `(workspace_id, user_id)`; indexes `(user_id, workspace_id)` and `(workspace_id, role)`; partial unique index or deferred constraint/transaction ensures one owner per workspace.
- **Deletion:** Removing membership deletes the row or records an audit event first; last owner cannot be removed. Conversation retention policy determines whether former-member conversations are deleted or retained inaccessible.
- **Tenant ownership:** `workspace_id`.
- **RLS:** Users can select their own memberships; workspace members may list safe co-member data through a scoped view/RPC. Admin mutations enforce role hierarchy. Avoid recursive policy checks by using one audited `private.has_workspace_role(workspace_id, allowed_roles)` function with fixed empty `search_path`, explicit `(select auth.uid())`, no dynamic SQL, and minimum EXECUTE grant. The function returns only a boolean and lives outside exposed schemas.

### 4.4 `workspace_invitations` (supporting)

- **Purpose:** Pending invitations without manufacturing a profile/user before acceptance.
- **Fields:** `id`, `workspace_id`, `email_normalized`, `role`, `token_hash`, `expires_at`, `accepted_at null`, `created_by`, timestamps.
- **Keys/indexes:** PK; unique active `(workspace_id, email_normalized)` partial index; indexes `token_hash`, `expires_at`, `workspace_id`.
- **Deletion:** Expired/cancelled invites removed after audit retention; token stored only as hash.
- **RLS:** Admin+ list/mutate; acceptance uses a narrowly scoped server transaction that validates token and authenticated email.

### 4.5 `documents`

- **Purpose:** Logical document shown in the library and stable citation/source identity.
- **Fields:** `id`, `workspace_id`, `display_name`, `status`, `current_version_id null`, `uploaded_by`, `created_at`, `updated_at`, `deleted_at null`, `delete_requested_by null`, `row_version`.
- **PK/FK:** PK `id`; FK workspace; FK uploader; deferred FK current version after version table exists. Unique `(id, workspace_id)` for composite children.
- **Indexes/uniqueness:** `(workspace_id, status, updated_at desc)`, `(workspace_id, uploaded_by)`, partial `(workspace_id, updated_at desc) where deleted_at is null`; optional normalized display-name index for library lookup.
- **Deletion:** Mark `deleting`/`deleted_at` first; retrieval requires ready and not deleted. Cleanup versions/chunks/object asynchronously. Preserve only minimum tombstone/audit data after completion.
- **Tenant ownership:** Direct `workspace_id`.
- **RLS:** Active members select non-deleted metadata; admin+ insert/update/delete lifecycle. Members cannot infer deleting/failed details outside safe fields unless allowed by product policy.

### 4.6 `document_versions`

- **Purpose:** Immutable uploaded object and reproducible processing configuration.
- **Fields:** `id`, `workspace_id`, `document_id`, `version_number`, `storage_bucket`, `storage_path`, `original_file_name`, `media_type`, `size_bytes`, `sha256`, `page_count null`, `status`, `extraction_quality jsonb`, `embedding_model`, `embedding_dimensions`, `processing_version`, `extractor_version`, `chunker_version`, `ready_at null`, timestamps.
- **PK/FK:** PK; composite FK `(document_id, workspace_id) -> documents(id, workspace_id)`; unique `(id, workspace_id)`.
- **Indexes/uniqueness:** Unique `(document_id, version_number)`; optional unique `(workspace_id, sha256, size_bytes)` for duplicate detection (not global); `(workspace_id, status, created_at)`; index document FK.
- **Deletion:** Cascades from controlled document cleanup; object deletion must be confirmed separately because database cascade cannot remove Storage bytes.
- **Tenant ownership:** Direct and composite-enforced.
- **RLS:** Same read scope as document; admin+ create/reprocess; storage path never accepted from browser and should be omitted from ordinary client projections.

### 4.7 `document_chunks`

- **Purpose:** Retrieval unit with normalized text, provenance, lexical vector, embedding, and deterministic ordering.
- **Fields:** `id`, `workspace_id`, `document_id`, `document_version_id`, `processing_version`, `chunk_index`, `content text`, `content_sha256`, `token_count`, `page_start`, `page_end`, `section_heading null`, `char_start null`, `char_end null`, `source_locator jsonb`, `search_vector tsvector generated`, `embedding vector(1536)`, `embedding_model`, `created_at`.
- **PK/FK:** PK; composite FKs to document and version with workspace; version deletion cascades chunks.
- **Indexes/uniqueness:** Unique `(document_version_id, processing_version, chunk_index)`; B-tree `(workspace_id, document_version_id, chunk_index)`; `(workspace_id, document_id)`; GIN `search_vector`; HNSW `embedding vector_cosine_ops` after benchmark; indexes for all FKs. A partial ready index cannot reference parent status directly, so retrieval joins/filters current versions and may maintain an `is_active` field only if transactionally guaranteed.
- **Deletion:** Hard-delete with version/document; no orphan embeddings.
- **Tenant ownership:** Direct `workspace_id`, consistency enforced by composite keys.
- **RLS:** Members select only chunks whose workspace membership is active and parent document/current version is ready. Ordinary UI should use scoped RPC/projections rather than expose the full chunk table. Inserts/updates restricted to worker role; client roles get no write policy.

### 4.8 `ingestion_jobs`

- **Purpose:** Authoritative asynchronous state, attempts, leases, checkpoints, and safe diagnostics.
- **Fields:** `id`, `workspace_id`, `document_id`, `document_version_id`, `processing_version`, `job_type`, `stage`, `status`, `attempt_count`, `max_attempts`, `available_at`, `lease_owner null`, `lease_expires_at null`, `checkpoint jsonb`, `error_category null`, `error_code null`, `error_message_safe null`, `started_at null`, `finished_at null`, timestamps.
- **PK/FK:** PK; composite tenant FKs to document/version.
- **Indexes/uniqueness:** Unique `(document_version_id, processing_version, job_type)`; partial `(status, available_at) where status in ('queued','retry')`; `(workspace_id, status, updated_at)`; lease expiry index; all FKs.
- **Deletion:** Retain operational metadata for a defined period after document deletion, then aggregate/delete; checkpoint must not contain extracted text or secrets.
- **Tenant ownership:** Direct.
- **RLS:** Members can see safe document-level status through projection; admin+ can request retry; only trusted worker updates internal fields. Raw provider errors are not in this table.

### 4.9 `conversations`

- **Purpose:** User-owned thread within a workspace.
- **Fields:** `id`, `workspace_id`, `created_by`, `title`, `status`, `last_message_at`, `created_at`, `updated_at`, `deleted_at null`, `row_version`.
- **PK/FK:** PK; workspace and creator FKs; unique `(id, workspace_id)`.
- **Indexes/uniqueness:** `(workspace_id, created_by, last_message_at desc, id)` for cursor pagination; partial active index where `deleted_at is null`; creator FK.
- **Deletion:** Creator soft-deletes immediately, then children hard-delete after undo/retention window; workspace deletion overrides.
- **Tenant ownership:** Direct.
- **RLS:** Creator only in MVP, plus membership must remain active. Admins do not automatically read member conversations.

### 4.10 `messages`

- **Purpose:** Ordered user/assistant content and generation lifecycle.
- **Fields:** `id`, `workspace_id`, `conversation_id`, `author_user_id null`, `role` (`user|assistant`), `status` (`pending|streaming|completed|unsupported|failed|interrupted`), `content text`, `sequence bigint`, `request_key null`, `model null`, `prompt_version null`, `retrieval_config_version null`, `input_tokens null`, `output_tokens null`, `finish_reason null`, `error_code null`, timestamps.
- **PK/FK:** PK; composite conversation/workspace FK; author FK set null on allowed account deletion.
- **Indexes/uniqueness:** Unique `(conversation_id, sequence)`; unique `(author_user_id, request_key)` partial where request key is not null; `(conversation_id, created_at, id)`; workspace/author indexes.
- **Deletion:** Cascades with conversation. Content follows configured retention; failed partial content is not retained as a successful answer.
- **Tenant ownership:** Direct and composite-enforced.
- **RLS:** Inherit creator-only conversation access through membership predicate; inserts are orchestrated server-side to enforce ordering/role. Assistant content is never directly writable by client.

### 4.11 `message_citations`

- **Purpose:** Stable mapping from an assistant claim/marker to exact source chunk/version/page.
- **Fields:** `id`, `workspace_id`, `message_id`, `ordinal`, `marker`, `document_id`, `document_version_id`, `document_chunk_id null`, `page_start`, `page_end`, `section_heading null`, `quote_start null`, `quote_end null`, `excerpt_snapshot null/retention-controlled`, `created_at`.
- **PK/FK:** PK; tenant-composite FKs to message/document/version/chunk. Chunk may become null on deletion only if tombstones are retained; otherwise citation cascades.
- **Indexes/uniqueness:** Unique `(message_id, ordinal)` and `(message_id, marker)`; indexes on message, chunk, `(workspace_id, document_id)`.
- **Deletion:** With message; document deletion either deletes source content fields and leaves minimal tombstone, or deletes citation—policy decision required. Never keep an excerpt beyond document retention by accident.
- **Tenant ownership:** Direct and cross-entity composite-enforced.
- **RLS:** Same as parent message plus active workspace membership. Source URL issuance additionally validates current document access.

### 4.12 `query_feedback`

- **Purpose:** User quality signal tied to a generated answer and its configuration.
- **Fields:** `id`, `workspace_id`, `message_id`, `user_id`, `rating` (`helpful|unhelpful`), `reason null`, `comment null`, `created_at`, `updated_at`.
- **PK/FK:** PK; message/workspace composite FK; user FK.
- **Indexes/uniqueness:** Unique `(message_id, user_id)`; `(workspace_id, created_at)`; `(workspace_id, reason, created_at)`; FK indexes.
- **Deletion:** Deleted/anonymized with user or message according to retention; comments treated as private content and excluded from normal logs.
- **Tenant ownership:** Direct.
- **RLS:** User may select/insert/update own feedback only if they can read the message; admins see aggregates, not raw comments by default.

### 4.13 `usage_events`

- **Purpose:** Append-only operational/product ledger for limits, cost attribution, and privacy-safe analytics.
- **Fields:** `id uuid`, `workspace_id null` for pre-workspace auth events, `actor_user_id null`, `event_type`, `occurred_at`, `correlation_id`, `document_id null`, `conversation_id null`, `model null`, `input_tokens null`, `output_tokens null`, `estimated_cost_micros null`, `duration_ms null`, `result`, `reason_code null`, `properties jsonb` with allowlist, `schema_version`.
- **PK/FK:** PK; workspace/user and optional resource FKs use set null where event retention is legitimate.
- **Indexes/uniqueness:** `(workspace_id, occurred_at desc)`, `(event_type, occurred_at desc)`, correlation ID, optional BRIN on `occurred_at` at volume; unique provider/request event key where available.
- **Deletion:** Time-based retention and aggregation; no raw content, names, signed URLs, or secrets. Partition monthly only after volume/retention warrants it.
- **Tenant ownership:** Workspace when present.
- **RLS:** No browser writes. Admins may read approved aggregates via security-invoker view/RPC, not arbitrary raw events. Worker/server uses a narrow privileged path.

## 5. pgvector design

### Initial representation

- Candidate model: `text-embedding-3-small` with 1536 dimensions and cosine distance.
- Column: `embedding vector(1536) not null` once a chunk batch is complete.
- Store `embedding_model`, dimensions on version, and `processing_version`. Query and chunk embeddings must use the same model/dimension.
- Use the provider's `dimensions` parameter if a shorter representation is later evaluated; never truncate vectors manually without the documented normalization procedure.

Changing dimensions requires a new compatible column/table or expand/backfill migration; it is not an in-place configuration flip. A new processing version is built alongside the current ready version, evaluated, and atomically promoted.

### Vector index

Initial small datasets may use exact cosine scans to establish quality. Before production scale, benchmark:

```sql
create index document_chunks_embedding_hnsw_idx
on public.document_chunks
using hnsw (embedding vector_cosine_ops);
```

Supabase currently recommends HNSW for performance and robustness with changing data, but parameters and filtered recall must be measured. The query must include workspace/current-version predicates; monitor whether post-filtering reduces recall. If necessary, increase candidate count, use iterative scans supported by the installed pgvector version, or partition only after evidence—not by creating one index per tenant.

### Full-text index

Use a stored generated vector from heading plus content:

```sql
search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(section_heading, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) stored
```

Add `GIN (search_vector)`. Use `websearch_to_tsquery('english', normalized_query)` to handle user syntax safely. English configuration is an MVP assumption; multilingual content requires language detection/config evaluation.

## 6. Retrieval function security

The retrieval boundary accepts `p_workspace_id`, query text/vector, candidate limits, and optional authorized document IDs. It must:

1. Require `(select auth.uid()) is not null` for user requests.
2. Verify active membership for `p_workspace_id` inside the database.
3. Filter `document_chunks.workspace_id = p_workspace_id` in **each** vector and lexical subquery before `ORDER BY/LIMIT`.
4. Join `documents` and `document_versions` to require not deleted, document ready, and version equals `current_version_id` with matching processing version/model.
5. Intersect document filters with authorized records; never accept a client-provided list as authorization.
6. Return only safe fields needed for fusion/source display.

Prefer `SECURITY INVOKER`. If index/performance design requires a `SECURITY DEFINER` function, it lives in `private`, fixes `search_path = ''`, schema-qualifies everything, explicitly checks `auth.uid()`/membership, validates limits, revokes default PUBLIC execute, grants only the intended authenticated/server role, and receives dedicated cross-tenant tests. A definer function must not be introduced merely to silence an RLS error.

## 7. RLS policy matrix

| Resource | Member | Administrator | Owner | Worker/server |
|---|---|---|---|---|
| Workspace | Select own | Select/update safe fields | Full lifecycle | Maintenance only |
| Membership | List safe co-members | Invite/change below owner/remove below owner | Includes transfer/delete controls | Invite acceptance transaction |
| Documents/versions | Select accessible | Create/process controls/delete | Same | Stage updates |
| Chunks | Select via ready scoped retrieval/source | Same | Same | Insert/update/delete |
| Jobs | Safe status projection | Safe status + retry request | Same | Lease/checkpoint/terminalize |
| Conversations/messages/citations | Creator only | Own only | Own only | Generation orchestration |
| Feedback | Own | Own + approved aggregates | Same | Aggregation |
| Usage | None or own-safe summary | Approved aggregate | Approved aggregate | Append/aggregate |

Every UPDATE policy has `USING` and `WITH CHECK`. Role targets use `TO authenticated`; that clause alone is never considered authorization. Policy expressions use `(select auth.uid())` to avoid per-row reevaluation, and all membership/workspace predicate columns are indexed.

## 8. Storage policies

- One private bucket, e.g. `workspace-documents`; object paths are immutable and server-generated.
- Upload signed URL issuance requires admin+ membership and a valid upload intent. Browser policy, if direct Storage API is used, parses the first path segment and verifies membership/intent; server finalization still verifies.
- Read signed URLs require active membership and non-deleting document. Expiry is short (for example, 5 minutes; tune for PDF viewer range requests).
- No public bucket, guessable permanent URL, or user-controlled full path.
- Original replacement uses a new version/path, not Storage upsert. This avoids needing broad select/update policies and preserves provenance.

## 9. Transactions and concurrency

- Workspace + owner membership creation: one transaction.
- Owner transfer: lock workspace/membership rows, validate exactly one owner, update roles atomically.
- Upload finalize: lock intent/version, verify terminal/idempotent state, set queued, create job/outbox record atomically; queue publishing uses transactional database integration or a reconciled outbox if atomic publish is unavailable.
- Version promotion: verify expected chunk count, no null embeddings, matching config, then set version ready and document current version in one transaction.
- Message append: lock or allocate sequence atomically; idempotency unique constraint prevents duplicate question.
- Delete: status transition is atomic and immediately disqualifies retrieval; physical cleanup is asynchronous.
- Use short transactions; never hold database locks while calling Storage/OpenAI.

## 10. Query and index verification

Before release:

- Run missing-FK-index queries and Supabase database advisors.
- Use `EXPLAIN (ANALYZE, BUFFERS)` on synthetic multi-tenant data for library list, conversation list, membership check, vector candidates, lexical candidates, citation source, delete cascade, and worker lease.
- Test both small and skewed tenants so a large workspace cannot dominate filtered vector behavior.
- Validate cursor indexes with stable tie-breaker `id`; avoid deep OFFSET pagination.
- Observe `pg_stat_statements`, dead tuples, index size/build time, and autovacuum without logging query parameters containing private text.

## 11. Data retention and backup

Initial policy proposals requiring legal/product approval:

- Original files, chunks, conversations: retained while active; user/workspace deletion triggers removal within a stated operational window.
- Failed upload objects: sweep within 24 hours.
- Ingestion operational records: 30–90 days without raw text.
- Usage/security events: 90–365 days depending purpose and contract, minimized/aggregated.
- Backups follow Supabase plan; deletion propagates out of rolling backups through expiry rather than selective backup mutation, which must be disclosed.

Run quarterly restore rehearsals in an isolated project and verify RLS, object references, vector extension, and queue recovery. A backup is not considered valid until restoration is tested.

## 12. Migration rules

- Use lowercase snake_case identifiers and explicit named constraints/indexes.
- Generate migration filenames through the current Supabase CLI; never invent history entries in a remote database.
- RLS is enabled and policies/grants are included in the same migration that exposes a table.
- New Supabase projects may not expose public tables to Data API automatically; explicitly grant only required tables/actions and treat grants separately from RLS.
- Prefer `not valid` then `validate constraint` for large backfills where appropriate, concurrent index builds when supported by deployment method, and expand/contract compatibility.
- Seed/test data never includes real organizational content.

## 13. Unresolved data decisions

1. Whether historic citations retain a non-content tombstone after document deletion or disappear entirely.
2. Exact conversation and feedback retention and export requirements.
3. Whether production needs regional/data residency beyond the initial selected Supabase/OpenAI region.
4. Whether direct client reads are allowed for selected tables or all product reads go through server/RPC; default is server-first with minimum grants.
5. Whether a provider-independent rerank score needs persistence for evaluation or belongs only in a restricted retrieval trace table added later.
