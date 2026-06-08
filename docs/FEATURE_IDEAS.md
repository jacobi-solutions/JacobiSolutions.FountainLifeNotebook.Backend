# Backend Feature Ideas

These are candidate follow-ups, not commitments.

- Add richer document ingestion for source types beyond the current PDF/text
  demo path.
- Add document ingestion status, retry, and failure visibility if ingestion
  becomes asynchronous.
- Add an "ask a clinician" escalation workflow that stores the source-backed AI
  answer, citations, and patient question for human review.
- Add a doctor visit prep or physician briefing artifact endpoint if the
  frontend Studio brief becomes a real feature. It should store source
  selections, generated output, citations, and review status rather than only
  returning transient text.
- Add clinician-provided and system-generated source types with provenance
  fields distinct from patient uploads.
- Treat the notebook as a patient medical-data source library that can eventually
  include documents, generated reports, clinician notes, doctor-review artifacts,
  and audio-derived transcripts.
- Add NotebookLM-style source guides, whole-notebook guides, generated FAQs,
  source comparison, timelines, and cited patient summaries once source
  provenance is reliable.
- Add audio-session ingestion for recorded calls or visits through an
  asynchronous transcription pipeline and transcript-backed sources.
- Add Epic-inspired action handoffs such as turning an AI answer into a doctor
  review request, visit agenda item, follow-up item, or clinician chart-prep
  summary.
- Expand observability around upload, extraction, Bedrock ingestion, retrieval,
  and assistant streaming.
- Add production-grade audit, retention, deletion, and compliance behavior after
  data requirements are formally scoped.
- Add more targeted contract tests around high-risk request/response changes.
- Add a page-faithful original-file or PDF viewer if source review needs exceed
  extracted document chunks.
- Add queues or workers only if ingestion or retrieval latency justifies moving
  work out of synchronous requests.
