# Fountain Life Notebook Backend Plan

## Goal

Build a local NotebookLM-style interview app on the copied NestJS backend.

## Scope

- Keep the app local-first and avoid AWS deployment work.
- Preserve the existing controller/service/repository boundaries.
- Add document upload, document deletion, document indexing, and document-grounded chat.
- Prefer deterministic local behavior so reviewers can run the project without paid LLM tokens.

## Likely Backend Work

- Add a `documents` module with Mongo persistence for uploaded document metadata and extracted text chunks.
- Add local file upload parsing for text-first formats before expanding to richer formats.
- Replace the assistant stub with a retrieval-backed answer service.
- Add LangChain or LangGraph orchestration around retrieval and answer generation.
- Add a local mock LLM path by default, with optional real provider configuration only if time allows.
- Export the OpenAPI contract to `openapi/fountain-life-api.json` when API shapes change.

## Checks

- Run `npm run verify` from `/Users/shanedrye/jacobi/Ramin/JacobiSolutions.FountainLifeNotebook.Backend`.
- If request or response DTOs change, run frontend contract generation from `/Users/shanedrye/jacobi/Ramin/jacobi-solutions.fountain-life-notebook.frontend`.
