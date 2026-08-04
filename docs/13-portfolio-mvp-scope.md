# 13 — Portfolio MVP Scope

**Status:** Approved delivery slice for portfolio implementation

**Purpose:** Narrow the broader product design into a credible, demonstrable MVP without changing Nyla's long-term architecture principles.

## 1. Portfolio outcome

The Portfolio MVP demonstrates one complete evidence-first workflow: an authenticated user adds searchable-text PDFs to one workspace, sees their processing state, asks questions, receives grounded answers with verifiable citations, and can revisit basic conversation history in a responsive web application deployed to Vercel.

The MVP is a portfolio-quality implementation and evaluation artifact. It must not be described as enterprise-ready, universally accurate, or proven at production scale without measured evidence.

## 2. Included scope

### Access and workspace

- Email-based authentication using the approved Supabase Auth design.
- One workspace per portfolio user experience.
- Tenant-safe authorization and Row-Level Security remain required even though workspace switching, invitations, and multi-workspace UX are deferred.

### Documents

- PDF upload for searchable-text PDFs within configured file and page limits.
- Clear queued, processing, ready, and failed states.
- A document library with basic metadata, status, source access, and deletion.
- Original files in private Supabase Storage.

### Retrieval and answers

- Deterministic text extraction and chunking with page provenance.
- OpenAI embeddings stored in PostgreSQL with pgvector.
- Workspace-filtered PostgreSQL full-text and vector retrieval combined as hybrid search.
- Grounded answers generated only from selected authorized evidence.
- Persisted, validated citations that resolve to the relevant document and page.
- Honest not-found behavior when the available evidence is insufficient.

### Experience and delivery

- Basic user-owned conversation history sufficient to revisit prior questions and answers.
- Responsive, keyboard-usable UI for the critical authentication, document, ask, citation, and history journeys.
- Deployment to Vercel with environment-separated configuration, CI gates, and documented limitations.

## 3. Explicitly deferred

The Portfolio MVP does not include:

- Billing, subscriptions, metering UI, or plan management.
- OCR or support for scanned/image-only PDFs.
- User-facing multiple document versions, version comparison, or restoration.
- Advanced analytics, business-intelligence dashboards, or fabricated performance metrics.
- Workspace invitations, member administration, or collaborative role-management workflows.
- Enterprise administration such as SSO, SCIM, legal hold, audit portals, or customer-managed encryption keys.
- External integrations, connectors, web search, or third-party content synchronization.
- Agent workflows, autonomous tools, actions, or model access to database, Storage, browser, or external systems.

## 4. Scope clarifications

- “One workspace” narrows the user experience; it does not remove `workspace_id`, RLS, or cross-tenant tests from the underlying security model.
- The data model may preserve internal processing provenance, but the Portfolio MVP does not expose multiple document versions as a product capability.
- Basic history means listing, opening, and deleting the authenticated user's own conversations. Sharing, export, folders, and advanced search are deferred.
- Responsive UI means the critical journeys work at supported mobile and desktop widths; it does not authorize a fake dashboard or non-functional controls.
- Vercel deployment is included only after the security, provider, migration, test, and rollback gates in the roadmap are satisfied.

## 5. Evidence required for completion

- Automated tests demonstrate tenant isolation, ingestion recovery, retrieval behavior, citation validity, browser journeys, and accessibility smoke coverage.
- A synthetic evaluation corpus measures retrieval, grounded-answer, citation, not-found, and prompt-injection cases without customer data.
- Reported quality, latency, and cost values include the tested configuration and conditions; no target is presented as an achieved benchmark before measurement.
- The public narrative names every deferred capability and known limitation.

## 6. Change control

Adding a deferred item requires an approved scope update, roadmap impact, and—where security, data, provider, or retrieval behavior changes—an ADR and threat/evaluation review. Scope is reduced before security or evidence gates are weakened.
