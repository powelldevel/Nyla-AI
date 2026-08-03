# 04 — UI/UX Specification

**Status:** Draft for design review  
**Experience:** Serious organizational knowledge workspace  
**Accessibility target:** WCAG 2.2 AA

## 1. Experience principles

- **Evidence is adjacent to the answer.** Citation markers, source titles, pages, and evidence controls are visible without hunting through menus.
- **The workspace is bigger than chat.** Persistent navigation gives equal standing to Overview, Knowledge Library, Ask Nyla, Search, Conversations, and Settings.
- **Status uses plain language.** “Extracting text” and “Could not read this PDF” are better than worker/queue jargon.
- **Information density is intentional.** Use lists, tables, split views, and sections; avoid a grid of interchangeable rounded cards.
- **Calm visual character.** Neutral surfaces, one restrained accent, strong typography, modest radii, minimal shadow, no glow/gradient/AI mascot.
- **Trust is behavior.** State scope (“Searching 18 ready documents”), disclose source removal, and explicitly say when evidence is insufficient.
- **Mobile preserves tasks.** Collapse navigation and evidence panels without hiding citations or making administration impossible.

## 2. Information architecture

### Public

Marketing → Sign up / Sign in → Password recovery → Auth callback.

### Product

1. **Overview** — orientation, workspace readiness, recent documents/conversations, direct Ask entry.
2. **Knowledge Library** — source inventory, upload, status, details, delete/retry.
3. **Ask Nyla** — synthesis from retrieved evidence with citations.
4. **Search** — direct passage/document discovery without generation.
5. **Conversations** — personal history and continuation.
6. **Workspace Settings** — general configuration and members, admin-only.
7. **Account Settings** — user-level profile and security outside a workspace.

Ask and Search are separate because they serve different intent: Ask synthesizes and incurs model cost; Search exposes ranked evidence directly and is safer for exploratory or exact-term discovery. Overview is not an analytics dashboard—it is a useful launch surface with only real operational data.

## 3. Product shell

Desktop uses a 240 px left navigation, a flexible content canvas, and an optional 360–440 px right evidence panel on Ask/source tasks. The top bar contains workspace switcher, contextual title/actions, and account menu. Main content targets a readable max width except tables/split views.

Mobile uses a compact header with workspace switcher and navigation drawer. Primary content is one column. Evidence opens as a full-height sheet with a clear Back to answer action. Bottom-fixed Ask input may be used only if it does not cover content, keyboard focus, or safe areas.

Navigation items include text labels, not icon-only mystery buttons. The active item is conveyed by shape, text weight, and `aria-current`, not color alone.

## 4. Visual and content system

- Typography: a sober sans-serif UI family; body 14–16 px, answer body 16–18 px, line height 1.5–1.7; headings follow a compact hierarchy.
- Color: neutral background/surfaces, dark readable text, blue/teal accent, semantic red/amber/green with text/icon labels.
- Radius: 6–10 px controls and containers; avoid making every section a card.
- Answer width: 70–80 characters; paragraphs, short sections, lists, and callouts instead of unbroken prose.
- Citation marker: compact linked token such as `[1]`, baseline-aligned, descriptive accessible name (“Source 1: Safety Manual, page 14”).
- Status vocabulary: Uploading, Queued, Extracting text, Preparing sections, Creating search index, Ready, Needs attention, Deleting.
- Dates use user locale with accessible absolute timestamp; relative date may be supplementary.
- Never label content “AI confidence.” Use `Strong source coverage`, `Limited source coverage`, or `No supporting evidence`, driven by auditable evidence rules and accompanied by an explanation.

## 5. Cross-screen state contract

### Loading

Show a layout-stable skeleton for initial loads; use inline progress for actions. After 500 ms, add a text status for longer operations. Ask shows retrieval → composing → verifying phases without pretending to know exact completion percentage. Loading regions use `aria-busy`; polite live regions announce meaningful stage changes, not every token.

### Empty

An empty state states why the page is empty, the role-aware next action, and what will appear. It never shows fabricated example activity. Members who cannot upload see “Ask an administrator to add documents,” not a disabled unexplained button.

### Error

Keep user input, show a plain-language message and request ID, and offer retry only when safe. Field errors sit beside fields and are summarized at form start. Destructive or auth errors do not expose resource existence across workspaces.

### Success

Use an inline status or short toast for completed mutations. Important outcomes remain on the page; do not rely on a disappearing toast for document failure or deletion.

### Permissions

Hide actions the role can never perform, but explain unavailable contextual actions. Direct navigation to a forbidden page receives a dedicated unauthorized/forbidden state.

## 6. Core component inventory

`AppShell`, `WorkspaceSwitcher`, `SideNav`, `PageHeader`, `Breadcrumbs`, `Command/SearchInput`, `QuestionComposer`, `AnswerSection`, `CitationMarker`, `EvidenceList`, `EvidenceItem`, `SourceViewer`, `PdfPageControls`, `DocumentTable`, `DocumentStatusBadge`, `ProcessingTimeline`, `UploadDropzone`, `FilterBar`, `ConversationList`, `MemberTable`, `RoleSelect`, `EmptyState`, `InlineAlert`, `ConfirmDialog`, `Skeleton`, `Toast`, `FeedbackControl`, `RequestIdDisclosure`.

Components expose semantic props such as `status`, `headingLevel`, and `describedBy`. They do not accept arbitrary raw HTML from models or documents.

## 7. Screen specifications

Each screen below includes the required user goal, actions, hierarchy/components, responsive layout, states, and accessibility. Cross-screen rules in section 5 apply in addition to the specific notes.

### 7.1 Marketing landing page

- **User goal:** Understand Nyla's grounded-knowledge value and decide whether to create an account.
- **Primary action:** Create workspace / Sign up. **Secondary:** Sign in; inspect “How it works,” security, and citation example.
- **Hierarchy/components:** Concise proposition; product screenshot/wireframe showing answer plus sources; three-step upload/search/verify explanation; security and scope; final CTA. No fake customer logos or metrics.
- **Desktop:** Two-column opening area, then editorial sections. **Mobile:** Single column; screenshot remains legible or becomes an annotated stacked example.
- **Empty/loading/error:** Static content; CTA failure routes to accessible error page. Images reserve dimensions.
- **Accessibility:** One H1, skip link, descriptive image alt text, reduced motion, clear link purpose, no autoplay.

### 7.2 Sign-up

- **User goal:** Create and verify an account.
- **Primary action:** Sign up. **Secondary:** Sign in; read terms/privacy.
- **Hierarchy/components:** Email, password, password requirements, submit, verification explanation. Social login is absent unless explicitly added later.
- **Desktop/mobile:** Narrow centered form; on mobile use full width with keyboard-safe spacing.
- **Empty/loading/error:** Preserve email, never password; inline field errors; duplicate-account message does not create an enumeration vulnerability; success becomes “Check your email” with resend cooldown.
- **Accessibility:** Programmatic labels, `autocomplete`, error summary/focus, reveal-password control with state announcement.

### 7.3 Sign-in

- **User goal:** Access existing workspaces securely.
- **Primary action:** Sign in. **Secondary:** Password reset; sign up.
- **Hierarchy/components:** Email, password, submit, recovery link, generic auth error.
- **Desktop/mobile:** Same focused form model as sign-up.
- **Empty/loading/error:** Disable only duplicate submission; keep email; generic invalid-credential response; expired-link path explains recovery.
- **Accessibility:** Correct autocomplete tokens, Enter submission, visible focus, status announcement.

### 7.4 Workspace onboarding

- **User goal:** Create the first workspace or choose an existing invitation.
- **Primary action:** Create workspace / Accept invite. **Secondary:** Sign out.
- **Hierarchy/components:** Welcome, pending invitations if real, workspace name/derived editable slug, data-handling summary, create button.
- **Desktop:** 600–720 px step panel with progress labels. **Mobile:** Single step per view; no decorative wizard.
- **Empty/loading/error:** If no invitations, only creation is shown. Name conflict suggests a new slug. Atomic creation failure stays on step.
- **Accessibility:** Step semantics, explicit required fields, focus on first error, no time limit.

### 7.5 Empty workspace

- **User goal:** Understand why Ask/Search have no content and reach first value.
- **Primary action:** Admin: Upload PDF. Member: Contact an administrator. **Secondary:** Learn supported PDF requirements; manage members for owner/admin.
- **Hierarchy/components:** “Add your first source,” supported/unsupported formats, privacy note, three-step flow. Ask input may be visible but disabled with explanation.
- **Desktop/mobile:** Centered guidance within normal product shell, not a separate onboarding universe.
- **Empty/loading/error:** This is the canonical empty state; if a document is processing, replace with processing summary and allow browsing library.
- **Accessibility:** Disabled control is not the only explanation; link to library has clear name.

### 7.6 Product overview

- **User goal:** Resume useful work and understand workspace readiness.
- **Primary action:** Ask a question. **Secondary:** Upload (admin), search, open recent conversation/document.
- **Hierarchy/components:** Question input; ready/processing/failed document counts based on real records; recent documents; recent own conversations; actionable failures; suggested questions derived from ready content.
- **Desktop:** Wide Ask entry, then two-column recent lists. **Mobile:** Ask first, stacked lists with “View all.”
- **Empty/loading/error:** Empty workspace component; section-level skeletons/errors so one failure does not blank page; no fake chart.
- **Accessibility:** Sections have headings; status counts include labels; suggestion buttons announce full question.

### 7.7 Knowledge library

- **User goal:** Find, inspect, and manage source documents.
- **Primary action:** Admin: Upload PDF; member: open document. **Secondary:** Search/filter, retry/reprocess/delete where permitted.
- **Hierarchy/components:** Header/action; search and status/uploader/date filters; document table/list; pagination; bulk actions deferred.
- **Desktop:** Table columns: Name, Status, Version, Pages, Uploaded by, Updated, actions. **Mobile:** Row becomes a structured list item; status and name remain first, actions in labeled menu.
- **Empty/loading/error:** Role-aware empty state; skeleton rows; filters with zero results offer Clear filters; per-row action failure stays on row.
- **Accessibility:** Real table semantics on desktop; sort buttons state direction; action menus identify document; status includes text.

### 7.8 Upload flow

- **User goal:** Add a valid PDF and know what happens next.
- **Primary action:** Choose/drop and upload. **Secondary:** Cancel before finalize; view requirements.
- **Hierarchy/components:** Dropzone/button; selected file summary; validation messages; upload progress; privacy/visibility statement; completion link.
- **Desktop:** Modal or dedicated compact panel from library; use dedicated page/sheet if progress must survive navigation. **Mobile:** Full-page flow; native file picker is primary.
- **Empty/loading/error:** Client type/size errors before network; upload progress with bytes; network retry creates/resumes a valid intent; finalize error distinguishes uploaded-but-not-queued and reconciles safely.
- **Accessibility:** Drop is optional; keyboard file button; progress has label/value; errors link to file control; cancel confirms only after bytes sent.

### 7.9 Processing state

- **User goal:** See that work is progressing and whether Ask can use the document.
- **Primary action:** Return to library or view details. **Secondary:** Delete/cancel where safe.
- **Hierarchy/components:** Current plain-language stage, completed stages, start time, filename, “Not searchable yet,” auto-refresh indicator.
- **Desktop/mobile:** Timeline is vertical on mobile and compact horizontal/vertical on desktop; no fake exact percentage for indeterminate stages.
- **Empty/loading/error:** Stale status after expected threshold changes to “Taking longer than usual” and offers refresh; connection failure says status cannot be refreshed, not that ingestion failed.
- **Accessibility:** `role=status` for stage changes with polite announcements; timeline order and icons have text.

### 7.10 Failed processing state

- **User goal:** Understand the failure and resolve it.
- **Primary action:** Retry transient failure or upload a replacement. **Secondary:** Delete; copy request ID; view supported-file help.
- **Hierarchy/components:** “Needs attention,” safe category (scanned/no text, encrypted, corrupt, too large, temporary provider failure), consequence, next action, processing timeline.
- **Desktop/mobile:** Error summary leads; technical details collapsed and sanitized.
- **Empty/loading/error:** Retry shows in-progress state and is idempotent; permanent errors do not offer pointless retry; failure loading still offers back navigation.
- **Accessibility:** Move focus to error heading after failed transition; never use color/icon alone.

### 7.11 Document details

- **User goal:** Assess a document's provenance, readiness, and management options.
- **Primary action:** View source. **Secondary:** Retry/reprocess/delete (admin), copy document link.
- **Hierarchy/components:** Name/status; metadata (version, uploader, dates, bytes/pages, extraction quality); processing timeline; source preview; related conversations deferred unless based on real links.
- **Desktop:** Main details plus right metadata/action rail. **Mobile:** Status/name, actions, sections stacked; destructive action at end/menu.
- **Empty/loading/error:** Processing and failed variants use dedicated components; removed document shows tombstone to authorized historic citation users; 404 masks cross-tenant existence.
- **Accessibility:** Definition list for metadata; deletion dialog names file and impact; status changes announced.

### 7.12 Document source viewer

- **User goal:** Read the original source at a cited page and compare it with evidence.
- **Primary action:** Navigate/read cited page. **Secondary:** Page controls, zoom, download if policy allows, copy source link, return to answer.
- **Hierarchy/components:** Document/version title; page/zoom controls; PDF canvas/text layer; evidence excerpt and heading; citation context.
- **Desktop:** Split view with PDF 2/3 and evidence rail 1/3; resizable within accessible bounds. **Mobile:** PDF and evidence tabs/sheet; cited excerpt appears before expensive page render.
- **Empty/loading/error:** Skeleton for signed URL/viewer; expired URL refreshes once; unsupported rendering offers authorized download if allowed; deleted source shows “Source removed.” Highlight absence is stated, not guessed.
- **Accessibility:** PDF canvas alone is insufficient—provide extracted text excerpt, page label, keyboard page controls, zoom labels, focus return. Warn that full PDF accessibility depends on source tagging.

### 7.13 Ask Nyla

- **User goal:** Get a concise, grounded answer and verify it.
- **Primary action:** Ask/submit. **Secondary:** choose suggestion, stop generation, open citation, search sources, copy, feedback, report unsupported.
- **Hierarchy/components:** Scope line; composer; answer with summary/sections/caveats; inline citations; evidence-quality label; evidence panel; related questions; feedback. Conversation turns remain subordinate to the current answer.
- **Desktop:** Answer canvas plus persistent/collapsible evidence panel; composer near top for new conversation and bottom for follow-ups. **Mobile:** one column; citations open full-height evidence sheet; sticky composer respects keyboard/safe area.
- **Empty/loading/error:** No documents redirects/explains; retrieval/composing/verifying phases; no-evidence state explicitly says not found; interrupted stream offers safe retry; citation-validation failure never displays unverified draft as success.
- **Accessibility:** Streaming live region is throttled and can be paused; final answer receives focus only on user preference, not automatically; citations have descriptive names; Stop is keyboard reachable; copy excludes hidden metadata.

### 7.14 Search results

- **User goal:** Find relevant passages or documents without a generated answer.
- **Primary action:** Open result/source. **Secondary:** filter by document/date/status, switch to Ask with query, clear filters.
- **Hierarchy/components:** Search field; result count phrased approximately only when accurate; filters; grouped results with title/page/heading/snippet; why this matched (keyword/semantic) only if explainable.
- **Desktop:** Filter rail or horizontal bar plus results. **Mobile:** filters in sheet with active-filter chips; results full width.
- **Empty/loading/error:** Empty query shows search guidance; zero results suggests spelling/filter changes; loading retains prior results with clear updating state; provider embedding failure may fall back to lexical search and disclose degraded mode.
- **Accessibility:** Search landmark; result heading hierarchy; highlighted terms retain contrast and are not the only relevance cue; filter sheet traps/restores focus.

### 7.15 Conversation history

- **User goal:** Find and resume a prior personal conversation.
- **Primary action:** Open conversation. **Secondary:** search titles, rename, delete, start new.
- **Hierarchy/components:** New conversation button; cursor-paginated list grouped by date; title, last activity, answer state, optional document count.
- **Desktop:** List with compact action menu. **Mobile:** touch-friendly rows, secondary metadata collapsed.
- **Empty/loading/error:** Empty explains conversations are created by asking; skeleton list; page error preserves New conversation action; deleted item is removed with undo only if deletion is soft/recoverable.
- **Accessibility:** Menu names include conversation title; relative dates have absolute accessible text; deletion confirmation states scope.

### 7.16 Individual conversation

- **User goal:** Review evidence and continue the thread.
- **Primary action:** Ask follow-up. **Secondary:** open citations, rename/delete conversation, copy/feedback per answer.
- **Hierarchy/components:** Title/actions; chronological turns; each assistant answer has its own citations/evidence; composer; context disclosure (“Follow-ups use recent conversation plus workspace sources”).
- **Desktop:** Same answer/evidence split as Ask. **Mobile:** stacked turns and evidence sheet.
- **Empty/loading/error:** Pending answer reconnects by message ID; failed answer shows retry; removed document citations are tombstones; long history uses progressive loading without losing current focus.
- **Accessibility:** Each turn is an article with speaker heading; heading levels remain consistent; keyboard shortcut does not override screen-reader conventions.

### 7.17 Workspace members

- **User goal:** Understand and control access.
- **Primary action:** Invite member. **Secondary:** change role, resend/cancel invite, remove member, transfer ownership (owner only).
- **Hierarchy/components:** Role explanation; members table; pending invitations; invite form; audit-relevant confirmation copy.
- **Desktop:** Tables with inline role selector/action menu. **Mobile:** member cards/list with labeled controls.
- **Empty/loading/error:** Owner always appears; invitation failure preserves address; duplicate/pending invite gives idempotent message; prevent removing last owner/self in invalid state.
- **Accessibility:** Role control label includes member; confirmation describes permission change; email is not clipped without accessible full value.

### 7.18 Workspace settings

- **User goal:** Update workspace identity and understand destructive controls.
- **Primary action:** Save general settings. **Secondary:** transfer ownership; delete workspace (owner only).
- **Hierarchy/components:** Workspace name/slug; defaults/limits read-only where not configurable; danger zone separated by heading and spacing.
- **Desktop:** Narrow form with sticky save only if necessary. **Mobile:** one column; save remains visible but not overlaying fields.
- **Empty/loading/error:** Dirty-state warning; slug conflict inline; save uses optimistic concurrency; deletion requires re-auth and typed confirmation.
- **Accessibility:** Field help associated via `aria-describedby`; error summary; danger actions not distinguished only by red.

### 7.19 Account settings

- **User goal:** Manage personal profile and security.
- **Primary action:** Save profile/change password through verified flow. **Secondary:** sign out all sessions, delete account request.
- **Hierarchy/components:** Display name/email; password/security; workspace memberships; account deletion consequences.
- **Desktop/mobile:** Narrow sections; no workspace nav ambiguity.
- **Empty/loading/error:** Email change requires verification; session revocation confirms effect; account deletion blocked/explained if sole owner until transfer/delete.
- **Accessibility:** Autocomplete, explicit current/new password labels, confirmations, no secret values in URL.

### 7.20 Error pages

- **User goal:** Recover without losing trust.
- **Primary action:** Retry or return to safe location. **Secondary:** copy request ID; sign in when relevant.
- **Hierarchy/components:** Specific title, plain explanation, primary recovery, request ID disclosure; no raw stack.
- **Desktop/mobile:** Minimal centered content within safe shell if shell is reliable; global error includes full document structure.
- **States:** 404, 409 stale state, 429 rate limit with retry guidance, 500, 503 dependency unavailable, offline/client connectivity.
- **Accessibility:** Error heading gets focus after navigation; actions are links/buttons with exact destination; no auto-refresh loop.

### 7.21 Unauthorized and forbidden states

- **User goal:** Understand whether to sign in, switch workspace, or contact an administrator.
- **Primary action:** 401: Sign in. 403: Switch workspace or return to overview. **Secondary:** request access outside MVP via contact guidance.
- **Hierarchy/components:** No resource title/details that reveal existence; identity/workspace switch affordance if safe.
- **Desktop/mobile:** Same product shell only if identity is valid; otherwise public auth shell.
- **Empty/loading/error:** Session refresh attempted once; repeated failure signs out safely; no redirect loop.
- **Accessibility:** “Unauthorized” is not the only user-facing word; focus heading; clear distinction between authentication and permission.

## 8. Interaction details for answer verification

### Answer structure

1. Direct answer in one to three sentences.
2. Sections only when the question has multiple parts.
3. Inline citations immediately after supported claims.
4. Caveats/limitations.
5. Related questions drawn from retrieved topics, capped at three.
6. Feedback controls.

### Evidence panel

Evidence items are ordered by first citation use, not opaque retrieval score. Each shows source number, file, version, page, heading, excerpt, and actions. Multiple citations can support one claim. Expanding an item never changes answer text. “Related documents” are retrieval-derived and labeled as related, not supporting, unless cited.

### Evidence quality language

- **Strong source coverage:** all material claims cite corroborating/highly relevant evidence and validation passed.
- **Limited source coverage:** answer is narrow, caveats are prominent, and each included claim is cited, but sources are incomplete/ambiguous.
- **No supporting evidence:** no generated factual answer is presented.

These labels are rules-based UI summaries, validated in research, and may be removed if users misinterpret them. No percentage appears.

### Report unsupported answer

“Report an issue” opens reasons: citation does not support claim, answer missed relevant source, wrong interpretation, source is outdated, other. Optional comment is capped and treated as private content. Submitting never claims an immediate correction; it records review data tied to message, retrieval config, prompt, and source IDs.

## 9. Responsive behavior

- Breakpoints follow content pressure, not named devices: compact below ~768 px, standard from ~768 px, wide split view from ~1200 px.
- Tables transform into semantic lists rather than horizontally scrolling critical content; source/PDF views may allow controlled horizontal pan.
- Dialogs become sheets/full-screen flows when keyboard or viewport would be constrained.
- Minimum target size 44×44 CSS px where practical. Hover-only actions become always discoverable on touch.
- Test 320×568, 390×844, 768×1024, 1280×800, and 1440×900 plus zoom at 200%.

## 10. Accessibility verification checklist

- Logical DOM/focus order matches visual layout, including evidence panel.
- Skip link, landmarks, unique page title, one H1, and correct heading nesting.
- Full keyboard operation for upload, filters, menus, viewer controls, citations, feedback, and dialogs.
- Focus is trapped/restored for modal surfaces; route changes announce page title.
- Text contrast, non-text contrast, reduced motion, high zoom/reflow, and Windows High Contrast checked.
- Status and validation messages are programmatically associated; streaming announcements are not overwhelming.
- Model output is rendered as controlled text/allowed structures, never unsafe HTML.
- Automated axe checks plus manual keyboard and screen-reader passes (NVDA/Chrome and VoiceOver/Safari where available).

## 11. Content guidelines

- Say “documents in this workspace,” not “my knowledge.”
- Say “I couldn't find this in the documents available to this workspace,” not “I don't know” alone.
- Say “Needs attention” in lists and give the precise category on details.
- Avoid anthropomorphic promises (“Nyla understands everything”) and compliance guarantees.
- Use sentence case, specific verbs, and short confirmations.
- Preserve document titles as uploaded but sanitize display and provide a human-editable display name later.

## 12. UX acceptance gates

- A new admin can reach a cited answer without hidden navigation or unexplained state.
- A member can explain which document/page supports a claim.
- No core screen depends on fabricated analytics or content.
- Every long-running state communicates searchability and a next step.
- Empty, loading, success, permission, partial, and failure states are represented in design prototypes.
- Keyboard, screen-reader, 200% zoom, and compact-mobile critical journeys pass before production beta.
