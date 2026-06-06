# Engineering Delivery Workflow (Fountain Life Notebook Backend)

Central policy:
- Read `/Users/shanedrye/jacobi/codex/ENGINEERING_DELIVERY_WORKFLOW.md` first.
- This file is a Fountain Life Notebook backend overlay for repo-specific commands and risks.
- If this file conflicts with the central workflow, the central workflow wins unless the user explicitly overrides it.

## Purpose

- Keep the Nest API aligned with Fountain Life Notebook's document Q&A service boundaries.
- Validate config, API contracts, auth, and persistence before merge.
- Preserve the documented backend architecture and layer boundaries.

## Required Reading

Before backend implementation work, read:

1. `/Users/shanedrye/jacobi/codex/ENGINEERING_DELIVERY_WORKFLOW.md`
2. `/Users/shanedrye/jacobi/Ramin/codex/ENGINEERING_DELIVERY_WORKFLOW.md`
3. `/Users/shanedrye/jacobi/Ramin/FountainLifeNotebook.Backend/docs/architecture.md`

## Repo Scope

Repository root:
- `/Users/shanedrye/jacobi/Ramin/FountainLifeNotebook.Backend`

Key areas:
- `src/modules/auth` for local interview auth and optional Cognito JWT validation
- `src/modules/accounts` for Mongo-backed account registration
- `src/modules/assistant` for assistant-facing APIs and streaming

## Default Fast Loop

Run from this repo root:

1. `npm run verify`

## Architecture Rules

- Follow `/Users/shanedrye/jacobi/Ramin/FountainLifeNotebook.Backend/docs/architecture.md`.
- Keep controllers thin; put business behavior in services.
- Keep persistence in repositories or persistence-focused providers.
- Keep configuration fail-fast and document required variables in `.env.example`.
- Keep local auth as the default unless Cognito is explicitly needed.
- Do not commit secrets or local-only credential files.

## Contract Rule

If an API request or response changes:
- update Swagger-decorated DTOs
- update frontend client/service usage intentionally
- run the backend build and the affected frontend typecheck/build
