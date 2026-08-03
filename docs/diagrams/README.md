# Nyla diagram index

The architecture diagrams are maintained as Mermaid source inside the documents so they render in GitHub, stay close to the decisions they explain, and change in the same review as the surrounding text.

## Required diagrams

| Diagram | Location | Question answered |
|---|---|---|
| System context | [`02-system-architecture.md`](../02-system-architecture.md#2-system-context) | Who uses Nyla and which external systems does it depend on? |
| High-level components | [`02-system-architecture.md`](../02-system-architecture.md#4-high-level-component-architecture) | Which component owns each responsibility and trust boundary? |
| Upload and ingestion sequence | [`02-system-architecture.md`](../02-system-architecture.md#8-document-upload-and-ingestion) | How does a PDF become a ready searchable version? |
| RAG question sequence | [`02-system-architecture.md`](../02-system-architecture.md#9-rag-question-answering) | How does a question become a citation-valid answer? |
| Authentication and authorization | [`02-system-architecture.md`](../02-system-architecture.md#7-authentication-and-workspace-authorization) | Where are identity and membership checked? |
| Entity relationships | [`02-system-architecture.md`](../02-system-architecture.md#11-database-entity-relationships) | How are tenant, document, conversation, and citation records related? |
| Deployment architecture | [`02-system-architecture.md`](../02-system-architecture.md#14-deployment-topology) | What runs on Vercel, Supabase, and OpenAI? |
| Document lifecycle | [`02-system-architecture.md`](../02-system-architecture.md#12-document-lifecycle) | Which states and transitions are valid? |

## Diagram conventions

- Boxes identify deployable components or durable systems; labels describe responsibility, not vendor marketing.
- Arrows are directional and label protocols or data where ambiguity matters.
- Trust boundaries use Mermaid subgraphs and are explained in adjacent prose.
- Database diagrams show conceptual relationships; the authoritative field and constraint design is in [`05-database-and-data-design.md`](../05-database-and-data-design.md).
- Sequence diagrams show security-relevant validation and failure branches, not only the happy path.
- Mermaid labels containing punctuation use quotes. Avoid experimental syntax so diagrams render in GitHub.

## Review rule

A component, data store, or external provider added to implementation must first appear in the relevant diagram and in an ADR describing why it is needed. Decorative diagrams and unlabeled arrows should not be added.
