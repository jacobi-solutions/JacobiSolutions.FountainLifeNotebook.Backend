# Backend Technical Debt

Known deferred work and review notes.

## Local And Interview Workflow

- The local setup assumes MongoDB is available separately. The README documents
  this, but the setup script intentionally does not install or start MongoDB.
- The Docker Compose local path exists, but the recommended interview workflow is
  the terminal setup because that is the verified local path.
- Local auth is intentionally convenient; production auth needs Cognito-mode
  coverage before any real deployment review.
- Contract generation is explicit. Backend API changes need `npm run
  contract:sync` to keep the frontend client current.

## Product And Architecture Debt

- Server-side file allow-listing and magic-byte checks should be added before
  broader upload support.
- The current document model should become a more general source/provenance
  model before clinician uploads, generated reports, audio transcripts, and
  doctor review notes are added.
- Background ingestion and worker infrastructure are deferred until product load
  or latency justifies them.
- Retrieval needs stronger bounds for large libraries, then a vector-backed path
  when local retrieval is no longer enough.
- Document viewing currently returns extracted ordered chunks. Original binary
  viewing, page layout fidelity, and page-level source anchors are deferred.
- Assistant keys, selected notebook ids, selected document ids, and role access
  need to fail fast before retrieval or LLM work.
- Durable doctor-review request and correction models are not implemented yet.
- Audio ingestion needs an asynchronous transcription pipeline before it can be
  more than a prototype.
- Notebook membership is intentionally simple. Fine-grained sharing,
  role-specific clinical views, invite acceptance tracking, notifications, and
  doctor-review task routing are deferred.
- Cost controls are deferred: per-patient limits, upload limits, LLM caps,
  transcription caps, and admin-visible usage metrics.

## Compliance And Data Protection Debt

- Compliance scope is not decided. Before real patient data, determine whether
  HIPAA, business associate obligations, FTC health-app breach rules, state
  privacy laws, SOC 2, or other frameworks are in scope.
- PHI data inventory and data-flow mapping are not complete.
- Audit logging needs to cover source access, uploads, deletes, chat questions,
  AI generation, doctor review access, doctor replies, corrections, and exports
  without logging PHI values directly.
- Retention and deletion policies need to include raw uploads, extracted text,
  chunks, embeddings, audio files, transcripts, conversations, doctor review
  artifacts, audit logs, backups, and vendor-side retention.
- Vendor review and BAA decisions are still needed for cloud, database, object
  storage, LLM, embedding, transcription, monitoring, analytics, email, SMS,
  auth, and support tooling.
- Prompt and LLM data controls need to define approved providers, retention,
  training use, logging, source-snippet minimization, and clinical-risk review.
- Incident response and breach-notification workflows need to be defined before
  production patient data.
