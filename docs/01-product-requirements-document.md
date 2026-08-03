# 01 — Product Requirements Document

**Status:** Draft for approval  
**Owner:** Product  
**Last updated:** 2026-08-03  
**Implementation gate:** No implementation until this document and the review checklist are approved.

## 1. Product vision

Nyla makes an organization's approved knowledge easy to find, understand, and verify. A user should be able to ask a practical question, receive a concise answer grounded only in accessible workspace documents, and inspect the exact pages that support each material claim.

Nyla succeeds when it shortens the path from “I think this is documented somewhere” to “I can act on a verifiable answer.” It is not a general-purpose assistant, a replacement for legal or compliance review, or a thin chat interface over uploaded files.

## 2. Problem statement

Organizational knowledge is fragmented across long policies, manuals, contracts, and training materials. Keyword search often fails when the user's wording differs from the document, while general-purpose language models may answer fluently without access to the governing source. Existing PDF chat experiences commonly hide retrieval, obscure document-processing failures, and make verification laborious.

Organizations need a tenant-isolated workspace that:

- makes document status and provenance visible;
- combines semantic and exact-term retrieval;
- distinguishes evidence from generated explanation;
- cites stable document locations;
- admits when the workspace lacks an answer; and
- provides administrators with understandable controls rather than infrastructure jargon.

## 3. Target users and personas

### 3.1 Primary segments

- Small and medium organizations with 20–500 knowledge workers and document-heavy operations.
- Internal operations, HR, compliance, support, safety, and product teams.
- Portfolio evaluators are an audience for the implementation quality, but they are not a product persona and must not drive fake features.

### 3.2 Personas

These are illustrative product personas, not claims about existing Nyla users or customers.

**Mpho — Operations lead / workspace owner.** Creates the workspace, appoints administrators, controls membership, and is accountable for appropriate document use. Needs assurance that deleted files disappear, usage is bounded, and one customer cannot see another customer's data.

**Aisha — Knowledge administrator.** Uploads policies and manuals, watches processing, diagnoses failures, removes obsolete content, and verifies citations. Needs explicit lifecycle states, reprocessing controls, duplicate warnings, and source previews.

**Daniel — Employee / member.** Asks operational questions under time pressure. Needs a direct, scannable answer, obvious citations, and an honest no-answer state.

**Priya — Auditor or reviewer.** Needs to inspect evidence without changing content. A dedicated read-only role is **not in MVP**: a member already cannot manage documents or workspace settings and can inspect sources. A future auditor role is justified if customers require access to audit logs or restricted conversations without normal asking privileges.

## 4. Roles and permissions

| Capability | Owner | Administrator | Member |
|---|:---:|:---:|:---:|
| View ready documents and sources | Yes | Yes | Yes |
| Ask, search, view own conversations | Yes | Yes | Yes |
| Upload, retry, reprocess, delete documents | Yes | Yes | No |
| Invite/remove members; change member/admin roles | Yes | Yes, except owner | No |
| Edit workspace name/settings | Yes | Yes | No |
| Transfer ownership | Yes | No | No |
| Delete workspace | Yes, re-auth required | No | No |
| View workspace-wide operational usage | Yes | Yes | No |

Invariants: every workspace has exactly one owner; the last owner cannot leave; an administrator cannot promote anyone to owner; users see only conversations they created in MVP; document visibility is workspace-wide because collections and document ACLs are deferred.

## 5. Primary use cases and pain points

| Use case | Existing pain | Nyla outcome |
|---|---|---|
| Find a policy answer | Exact keywords or document name are unknown | Hybrid retrieval finds semantically and lexically relevant passages |
| Verify an answer | Chat response has opaque sources | Each material claim links to page-level evidence |
| Maintain knowledge | Upload status is invisible | Library shows queued, extracting, indexing, ready, failed, deleting |
| Investigate a source | Downloading and searching a PDF breaks flow | Side-by-side source viewer opens to the cited page and highlights text when offsets permit |
| Handle missing knowledge | Model improvises | Nyla says the answer was not found and suggests query refinement or relevant documents |
| Remove obsolete knowledge | Vectors remain after deletion | Document, versions, chunks, citations, and private object follow a defined deletion lifecycle |

## 6. Value proposition

Nyla offers **fast answers without surrendering verification**. Its differentiator is the complete knowledge workflow: governed ingestion, visible provenance, hybrid retrieval, grounded generation, evidence exploration, and feedback. Trust is built through inspectability and honest limits, not through a “smart” persona or fabricated confidence score.

## 7. Product principles

1. **Evidence before eloquence.** A shorter grounded answer is better than a comprehensive unsupported one.
2. **Tenant isolation is a data invariant.** Workspace scope is not a UI filter.
3. **Sources stay visible.** Citations and source details are first-class product elements.
4. **Failure is a designed state.** Processing, retrieval, and generation failures explain what happened and what the user can do.
5. **Administration stays comprehensible.** Show user concepts—document, version, status—not queue internals.
6. **Progressive disclosure.** Lead with the answer; let users expand evidence and technical provenance.
7. **Measure before optimizing.** Chunk sizes, thresholds, models, and rerankers are hypotheses validated by an evaluation set.
8. **Privacy by minimization.** Send and retain only data needed for the requested operation.

## 8. MVP scope

### 8.1 In scope

- Email/password registration, verification, sign-in, sign-out, password reset, and account settings.
- Workspace creation and onboarding; one user may belong to multiple workspaces.
- Owner, administrator, and member roles with database-enforced permissions.
- Workspace member invitation by email, membership listing, role changes, and removal.
- Private PDF upload, up to the configured size/page limits.
- Validation, text extraction, structural chunking, embeddings, full-text index, lifecycle status, retries, and deletion.
- Document library, filters, document details, processing diagnostics, and source viewer.
- Natural-language questions over all ready documents in the active workspace.
- Hybrid retrieval, candidate fusion, initial reranking, grounded answer generation, streaming, inline citations, and evidence panel.
- Explicit unsupported-answer behavior.
- Search results across chunks/documents without requiring generation.
- Personal conversation history and individual conversation view.
- Per-answer helpful/unhelpful feedback plus “unsupported or incorrect” reason.
- Workspace name, members, and conservative usage/status summary based on real events.
- Responsive keyboard-accessible interface with empty, loading, success, and error states.

### 8.2 Explicit non-goals

- DOCX, TXT, images, audio, video, OCR, handwriting, or password-protected PDFs.
- Google Drive, SharePoint, Notion, Confluence, Slack, or Teams connectors.
- Internet search or answers from general model knowledge.
- Autonomous actions, agents, tool execution, or document editing.
- Per-document or collection ACLs; all ready documents are visible to all workspace members.
- SSO/SAML, SCIM, enterprise legal hold, e-discovery, or formal compliance certification.
- Billing, plan enforcement, public sharing, guest/auditor roles, or cross-workspace search.
- Document version comparison, automatic sync, advanced analytics, voice, or multilingual quality guarantees.
- Perfect extraction of every valid PDF; unsupported and scanned PDFs fail safely.

## 9. Functional requirements

Priority uses Must/Should/Could for the MVP release gate.

### 9.1 Identity and tenancy

- **FR-001 Must:** A user can register, verify email, sign in, reset a password, sign out, and revoke their current session.
- **FR-002 Must:** An authenticated user can create a workspace and becomes its owner atomically.
- **FR-003 Must:** A user explicitly selects an active workspace; URLs include a stable workspace slug or ID, and switching never leaks cached prior-workspace data.
- **FR-004 Must:** Authorization is enforced server-side and by RLS for every tenant-owned read and mutation.
- **FR-005 Must:** Owners/admins can invite, list, change, and remove members subject to role invariants.

### 9.2 Documents

- **FR-010 Must:** Owners/admins can upload a PDF through a server-authorized private Storage path.
- **FR-011 Must:** Nyla validates extension, MIME signature, size, page count, encryption, and parseability before indexing.
- **FR-012 Must:** The library shows file name, size, uploader, upload time, current version, and lifecycle state.
- **FR-013 Must:** The document detail shows processing steps, failure category, safe message, retry/reprocess actions when permitted, and version metadata.
- **FR-014 Must:** Owners/admins can delete a document after confirmation; it immediately becomes unavailable to retrieval and completes asynchronous physical cleanup.
- **FR-015 Should:** Content-hash duplicates in the same workspace are detected before processing and require explicit confirmation or reuse.

### 9.3 Ask and search

- **FR-020 Must:** A member can submit a non-empty question of bounded length against the active workspace.
- **FR-021 Must:** Retrieval considers only chunks from ready versions in that workspace.
- **FR-022 Must:** Answers stream progressively while citation markers remain stable.
- **FR-023 Must:** Every material factual claim is supported by one or more persisted citations, or the response is replaced with an unsupported-answer message.
- **FR-024 Must:** A citation opens a source preview at the page and section; highlighted text is best-effort and must not fabricate a range.
- **FR-025 Must:** Empty or weak retrieval returns “I couldn't find this in the documents available to this workspace” and does not use general knowledge.
- **FR-026 Must:** Search returns ranked passages grouped by document, with query terms, page, heading, snippet, and filters.
- **FR-027 Should:** Ask shows document-derived suggested questions only after at least one document is ready; suggestions are labeled examples, not analytics.
- **FR-028 Should:** Users can expand evidence, see related documents, copy an answer without hidden instructions, and copy source links.

### 9.4 Conversations and feedback

- **FR-030 Must:** A question creates or appends to a user-owned conversation and persists user message, assistant message, generation state, and citations.
- **FR-031 Must:** Users can list, rename, open, and delete their conversations.
- **FR-032 Must:** Follow-up questions include a bounded recent conversation summary plus a standalone rewritten retrieval query; no prior assistant claim is treated as source evidence.
- **FR-033 Must:** Users can rate an answer and select a reason; one current feedback record per user/message is retained with change history in events.

## 10. Non-functional requirements

- **NFR-001 Security:** No cross-workspace data access in application, RLS, Storage, retrieval RPC, signed URL, or background worker paths. Adversarial RLS tests are release-blocking.
- **NFR-002 Privacy:** Raw document text and questions are excluded from normal logs. OpenAI requests use `store: false`; data-processing terms and region are reviewed before launch.
- **NFR-003 Availability:** A transient provider or worker failure is retryable without duplicate versions, chunks, messages, or charges where idempotency can prevent them.
- **NFR-004 Performance:** Product SLOs are initially objectives, not claims: p95 authenticated page server response under 1.5 s excluding large previews; p95 search under 2 s; answer first byte under 4 s; worker status visible within 15 s. Targets are revised from measured baselines.
- **NFR-005 Scale:** Initial design supports tens of workspaces, low thousands of documents, and low millions of chunks without architectural replacement; indexes and limits are verified under representative load.
- **NFR-006 Accessibility:** WCAG 2.2 AA target; full keyboard operation, visible focus, semantic landmarks, 4.5:1 normal-text contrast, status not conveyed by color alone, and reduced-motion support.
- **NFR-007 Compatibility:** Current and previous major versions of Chrome, Edge, Safari, and Firefox; responsive at 320 CSS px and above.
- **NFR-008 Maintainability:** Strict TypeScript, schema validation at boundaries, feature-oriented modules, migration review, deterministic tests, and documented operational runbooks.
- **NFR-009 Observability:** Correlation IDs join request, job, provider, and evaluation telemetry without logging raw content.
- **NFR-010 Cost control:** Configurable upload/query limits, per-workspace rate limits, usage event ledger, token budgets, and circuit breakers.

## 11. User stories and acceptance criteria

### US-01 — Create a workspace

As a new user, I want to create a named workspace so that my organization's knowledge is isolated.

Acceptance criteria:

- A valid name creates the workspace, unique membership, owner role, and active-workspace selection in one transaction.
- A failed transaction leaves none of those rows behind.
- Another user cannot enumerate or access the new workspace by ID or slug.
- The empty workspace explains that an administrator must upload a PDF before Ask is useful.

### US-02 — Upload and monitor a PDF

As an administrator, I want to upload a PDF and understand its state.

Acceptance criteria:

- The UI validates obvious type/size issues before upload; the server independently repeats validation.
- A private object and document/version record are linked through a single upload intent.
- The state moves only through allowed transitions and updates without a full-page refresh.
- A scanned, encrypted, corrupt, oversize, or unsupported PDF fails with a safe categorized message and appropriate next action.

### US-03 — Ask a grounded question

As a member, I want an answer derived from my workspace documents.

Acceptance criteria:

- The retrieval audit records candidate chunk IDs, rank signals, and selected context without duplicating raw chunk text in logs.
- The displayed answer contains stable citation markers that resolve to authorized document/version/page records.
- Claims unsupported by selected context fail citation validation and do not appear as a successful answer.
- If evidence is insufficient, Nyla says so and offers search/refinement without adding external facts.

### US-04 — Verify a citation

As a member, I want to inspect the source behind a claim.

Acceptance criteria:

- Activating a citation opens the evidence panel and focuses the cited item.
- The source shows file name, version, page, heading, and excerpt; it can open the PDF at the page through a short-lived signed URL.
- Authorization is rechecked when the source is opened; a stale citation never bypasses membership changes.
- Keyboard and screen-reader users receive the same source context.

### US-05 — Delete obsolete knowledge

As an administrator, I want to remove a document so it cannot influence future answers.

Acceptance criteria:

- Confirmation names the document and consequences.
- The transaction marks the document `deleting` and removes it from retrieval immediately.
- Cleanup removes chunks/embeddings and the storage object idempotently, then marks a tombstone/deletion event.
- Historic messages remain but citations show “source removed”; raw excerpts are removed according to retention policy.

### US-06 — Manage members safely

As an owner, I want to delegate administration without losing ownership control.

Acceptance criteria:

- Owners and administrators can invite; only the owner can transfer ownership.
- An admin cannot edit/remove the owner or assign owner.
- Removing a user immediately blocks new authorized requests; session/JWT staleness cannot grant workspace access because membership is checked in the database.
- Duplicate invitations and memberships are rejected idempotently.

### US-07 — Review conversation history

As a member, I want to revisit my prior answers.

Acceptance criteria:

- Only the creator can read or delete a conversation in MVP.
- Lists use cursor pagination and never return messages from another workspace.
- In-progress and failed assistant messages have distinct, recoverable states.

## 12. User journeys

### 12.1 First value

Register → verify email → create workspace → empty-state guidance → upload PDF → view processing milestones → document becomes ready → select suggested question or ask → read structured answer → open citation → give feedback.

Failure branch: upload validation or extraction fails → document detail explains category → administrator replaces, retries transient failure, or deletes.

### 12.2 Returning member

Sign in → land in active workspace overview → see ready-document freshness → ask from global input or open Search → review answer → expand evidence → open related document → continue conversation.

### 12.3 Knowledge maintenance

Administrator opens library → filters failed/old documents → reviews version/status → uploads replacement as new version (post-MVP UI may initially require delete/re-upload) → confirms ready → deletes obsolete document → verifies it no longer appears in search.

## 13. Success measures and analytics

These are definitions and targets to establish after baseline collection, not fabricated current results.

### 13.1 North-star outcome

**Verified answer completion rate:** percentage of eligible questions for which the user receives a citation-valid answer and either opens a source or marks it helpful. It balances answer utility and verification rather than rewarding raw query volume.

### 13.2 Product measures

| Measure | Definition | Guardrail |
|---|---|---|
| Activation | Workspace reaches first ready document and first cited answer within 7 days | Segment failures by ingestion vs retrieval |
| Citation-open rate | Answer views with at least one citation opened | Do not assume low rate means distrust |
| Helpful rate | Helpful / rated completed answers | Report rating coverage |
| Unsupported-answer rate | Intentional no-answer / completed questions | Track false refusals through evaluation |
| Retrieval zero-result rate | Queries with no candidates above gate | Segment by workspace/document readiness |
| Processing success rate | Ready versions / terminal ingestion attempts | Exclude user-cancelled jobs |
| Time to ready | Upload accepted to ready | Report by pages/bytes |
| Repeat use | Active users with a qualified session in consecutive weeks | No vanity DAU target before discovery |

### 13.3 Event taxonomy

Events include `account_registered`, `workspace_created`, `member_invited`, `upload_started`, `upload_accepted`, `ingestion_stage_changed`, `document_ready`, `document_failed`, `question_submitted`, `retrieval_completed`, `answer_completed`, `answer_unsupported`, `citation_opened`, `search_submitted`, `feedback_submitted`, and `document_delete_requested`.

Every event uses a generated event ID, UTC timestamp, actor ID where applicable, workspace ID, coarse result/reason, and correlation ID. Do not include raw queries, answers, chunks, file names, or signed URLs in the analytics payload. A separate tightly controlled debug workflow may retrieve content by authorized record ID.

## 14. Constraints, assumptions, and dependencies

### Constraints

- One developer must be able to build and operate the MVP.
- Vercel functions require bounded execution; ingestion stages must checkpoint and continue rather than rely on one unbounded request.
- pgvector index dimensions and model dimensions must match; changing embedding model/dimensions requires versioned re-embedding.
- PDFs vary widely; extracted text quality cannot be inferred solely from successful parsing.
- No client is trusted to assert workspace membership, role, storage path, selected chunk IDs, or usage.

### Assumptions

- Searchable-text, English PDFs cover enough initial portfolio scenarios.
- Workspace-wide document visibility is acceptable for MVP.
- Customers accept human-readable status and evidence labels instead of numeric confidence.
- A 25 MiB/300-page initial limit is usable and protects worker cost; it is configurable.
- Paid Supabase/Vercel capabilities required by the production environment are budgeted.

### Dependencies

- Supabase availability for Auth, Postgres, Storage, and Queues.
- OpenAI Embeddings and Responses APIs and approved data-processing configuration.
- Vercel Node.js runtime, scheduled invocation, deployment, and observability limits.
- PDF extraction library quality and license.
- Transactional email/SMTP for production authentication emails.

## 15. Product risks

- Fluent but unsupported answers erode trust faster than explicit no-answer responses.
- Extraction failure may look like retrieval failure unless document quality is measured.
- Workspace-wide visibility may block customers with departmental restrictions.
- Sparse early feedback makes online quality metrics noisy.
- A portfolio audience may encourage breadth over a reliable core; roadmap gates counter this.

The complete scored register is in [`11-risk-register.md`](11-risk-register.md).

## 16. Future roadmap

### Near term after MVP evidence

- DOCX/TXT; OCR with clear quality labeling; document replacement/version comparison.
- Role-based collections and an auditor/read-only role if customer access patterns justify them.
- Workspace-wide conversation sharing with explicit permissions.
- Advanced evaluation dashboards based on real telemetry.

### Integrations

- Google Drive, SharePoint, Notion, Confluence, Slack, and Teams, introduced one connector at a time with sync/deletion semantics.

### Longer term

- Multilingual retrieval and answer evaluation.
- SSO/SCIM, regional deployments, customer-managed retention, and audit export.
- Voice interaction only after source verification remains usable in the modality.

## 17. MVP exit criteria

MVP may enter production beta only when:

- all Must requirements pass acceptance tests;
- cross-workspace RLS, Storage, RPC, cache, and signed-URL tests pass;
- the golden RAG suite meets approved thresholds with no critical prompt-injection leaks;
- backups, restore rehearsal, deletion workflow, alerts, rate limits, and incident contacts are operational;
- privacy terms, region, retention, and model snapshots are approved;
- an accessibility audit has no critical/serious blockers; and
- the review checklist is signed off by Product, Engineering, Security/Privacy, and UX reviewers (roles may be held by the same person, but review lenses remain distinct).
