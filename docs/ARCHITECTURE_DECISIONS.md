# Backend Architecture Decisions

This file records high-level decisions visible in the codebase and supporting
docs. Use [architecture.md](architecture.md) for deeper backend layering rules.

## Local Auth Default

- Decision: local interview auth is the default backend auth mode, with Cognito
  available through configuration.
- Why we chose it: reviewers can run the app locally without AWS setup.
- Tradeoffs considered: local auth is not production auth; deployed
  environments still need Cognito configuration and coverage.
- Evidence/source: `.env.example`, `src/modules/auth`, and
  `src/shared/config`.

## Shared README Shape

- Decision: each repo uses the same README structure with one compact milestone
  branch table.
- Why we chose it: interview reviewers get consistent navigation while still
  seeing how the project evolved.
- Tradeoffs considered: milestone notes stay high-level; deeper context belongs
  in supporting docs and the milestone branch code itself.
- Evidence/source: `README.md` and the `milestone/*` branches.

## Transparent Local Setup

- Decision: `npm run setup:local` wraps normal setup without hiding the manual
  commands.
- Why we chose it: reviewers can start faster while still seeing exactly what
  the script does.
- Tradeoffs considered: the script intentionally does not install or start
  MongoDB, so the database remains an explicit prerequisite.
- Evidence/source: `README.md`, `scripts/setup-local.sh`, `package.json`, and
  `.env.example`.

## Backend-Owned API Contracts

- Decision: backend controllers expose Swagger-decorated contracts and export
  OpenAPI to `openapi/fountain-life-api.json`.
- Why we chose it: the frontend can generate typed API functions from the
  backend source of truth.
- Tradeoffs considered: backend contract changes need a deliberate
  export/generate step before the frontend is current.
- Evidence/source: `scripts/export-openapi.ts`, `src/api-contract.module.ts`,
  `openapi/fountain-life-api.json`, and `package.json`.

## Uploaded Documents Are Viewed Through A Detail API

- Decision: the frontend reads an uploaded document through a document-detail API
  that returns document metadata plus ordered extracted chunks.
- Why we chose it: the notebook workspace needs to let reviewers peruse uploaded
  source text without leaving the app or relying only on a short preview.
- Tradeoffs considered: this exposes extracted text rather than a page-faithful
  PDF/original-binary viewer. The current API keeps ownership and notebook scope
  in the backend path, while richer source rendering can be added later.
- Evidence/source: `src/modules/documents/documents.controller.ts`,
  `src/modules/documents/documents.service.ts`,
  `src/modules/documents/data-contracts/document-detail.ts`, and
  `openapi/fountain-life-api.json`.

## Thin Controllers And Service Boundaries

- Decision: controllers own HTTP concerns; services and repositories own
  behavior and persistence.
- Why we chose it: route shape stays separate from business behavior and
  persistence, which makes review easier.
- Tradeoffs considered: simple operations use more files than a single
  controller prototype would.
- Evidence/source: [architecture.md](architecture.md), `src/modules/*`, and
  `src/shared/repositories`.

## Configurable Local And Deployed Providers

- Decision: auth, document storage, retrieval, and LLM behavior are selected
  through configuration.
- Why we chose it: the same codebase can run locally with lightweight providers
  and deploy with Cognito, S3, and Bedrock.
- Tradeoffs considered: provider boundaries must stay explicit so local defaults
  do not hide production configuration problems.
- Evidence/source: `.env.example`, `src/shared/config`,
  `src/modules/documents`, `src/modules/assistants`, and
  `src/modules/knowledge-base`.

## Notebook And User Isolation

- Decision: user-owned and notebook-owned operations flow through authenticated
  user context, membership checks, and repository filters.
- Why we chose it: document and notebook access must not leak across users or
  notebooks.
- Tradeoffs considered: every document and assistant path needs notebook/user
  context, which adds parameters and tests but keeps access checks explicit.
- Evidence/source: [architecture.md](architecture.md),
  `src/modules/notebooks`, `src/modules/documents`, and
  `src/modules/assistants`.

## Simple Workspace Membership Before Full Sharing

- Decision: notebooks store explicit members with roles (`owner`, `clinician`,
  `patient`, and `viewer`), and only owners can invite members or delete
  notebooks.
- Why we chose it: the demo needs separate user-scoped workspaces while still
  allowing a patient, clinician, or reviewer account to share one notebook
  without building a full collaboration product.
- Tradeoffs considered: this is role-based access, not a complete sharing
  workflow. It does not yet include fine-grained permissions, notifications,
  audit workflows, or doctor-review task queues.
- Evidence/source: `src/modules/notebooks/schemas/notebook.schema.ts`,
  `src/modules/notebooks/notebooks.service.ts`,
  `src/modules/notebooks/notebooks.repository.ts`, and
  `src/modules/notebooks/notebooks.service.spec.ts`.

## Cognito Invite Delivery In Deployed Mode

- Decision: notebook invites use Cognito `AdminCreateUser` when Cognito is
  configured, while local development keeps a local invite fallback.
- Why we chose it: deployed demo users can be invited through AWS-managed
  temporary-password email without adding a custom email service or magic-link
  flow.
- Tradeoffs considered: Cognito's default invite email is generic and does not
  model a polished product invitation. A custom email/link flow remains a future
  product decision.
- Evidence/source: `src/modules/notebooks/notebook-invitation.service.ts`,
  `src/modules/notebooks/data-contracts/invite-notebook-member-request.ts`,
  `src/modules/notebooks/data-contracts/invite-notebook-member-response.ts`,
  and `src/shared/config`.
