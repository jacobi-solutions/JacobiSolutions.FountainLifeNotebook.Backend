# Backend Architecture

This backend follows NestJS feature-module conventions while keeping the layer
boundaries familiar to a controller/service/repository architecture.

## Core Shape

Feature code is grouped by module:

```text
src/modules/documents/
  documents.controller.ts
  documents.service.ts
  document-ingestion.service.ts
  dto/
  schemas/
```

This is intentional. Nest projects are usually easier to navigate when each
business capability owns its controllers, services, contracts, schemas, and
repositories together.

Cross-cutting code lives under `src/shared`:

```text
src/shared/contracts
src/shared/http
src/shared/logging
src/shared/models
src/shared/repositories
```

## Layer Rules

Use these boundaries unless a feature has a clear reason to do otherwise:

```text
Controller -> Application Service -> Focused Services -> Repositories/Clients
```

- Controllers own HTTP concerns only: route shape, guards, request DTOs, response
  DTOs, status codes, and request/response wrapping.
- Controllers call application-facing services. They should not call
  repositories, clients, storage providers, or unrelated feature internals.
- Services own business behavior and orchestration.
- Services may call other services when the callee has a focused responsibility.
- Avoid circular service calls between feature application services. Extract a
  smaller focused service when two features need shared behavior.
- Repositories own database persistence only.
- Repositories should not call other services, external APIs, or HTTP clients.
- External API wrappers should be named clients or providers, not repositories.

Recommended naming:

| Name         | Responsibility                              |
| ------------ | ------------------------------------------- |
| `Controller` | HTTP boundary                               |
| `Service`    | Business/application behavior               |
| `Repository` | Database persistence                        |
| `Client`     | External API wrapper                        |
| `Provider`   | Runtime strategy selected by config         |
| `Handler`    | Command or assistant-specific orchestration |
| `Registry`   | Lookup table for named handlers/tools       |

## Contracts

The API intentionally uses command-style POST endpoints for app operations. The
health check may use GET.

Each normal JSON endpoint should:

1. Accept a request class extending `BaseRequestDto<TPayload>`.
2. Return a response class extending `BaseResponseDto<TData>`.
3. Use `ResponseFactory.success(...)` or `ResponseFactory.failure(...)`.

Example:

```text
DeleteDocumentRequestDto extends BaseRequestDto<DeleteDocumentPayloadDto>
DeleteDocumentResponseDto extends BaseResponseDto<DeleteDocumentResultDto>
```

The `Dto` suffix is a Nest convention because these classes also drive
validation and OpenAPI generation. If a future team prefers `DeleteDocumentRequest`
instead of `DeleteDocumentRequestDto`, that is a naming decision rather than an
architecture change.

The base response shape is:

```json
{
  "correlationId": "optional-correlation-id",
  "errors": [],
  "isSuccess": true,
  "data": {}
}
```

Breaking failures should return `isSuccess: false` and one or more errors with
an `errorCode` and `errorMessage`.

## Persistence Models

Persistence models should extend `BaseModel`.

`BaseModel` provides:

```text
id
createdDateUtc
lastUpdatedDateUtc
```

The public `id` is a generated GUID string. MongoDB still has its own internal
`_id` unless a schema explicitly overrides it.

Use schemas for Mongo/Mongoose persistence models. Use DTOs for API contracts.
Avoid exposing raw persistence models directly from controllers.

## Current Vertical Slices

Document upload:

```text
DocumentsController
  -> DocumentsService
    -> DocumentIngestionService
      -> DocumentTextExtractorService
      -> LocalDocumentStorageService or S3DocumentStorageService
      -> DocumentRecordsRepository
      -> DocumentChunksRepository
```

Notebook chat:

```text
AssistantController
  -> AssistantService
    -> AssistantRegistry
      -> NotebookAssistantHandler
        -> NotebookAgentService
          -> NotebookRetrievalService
            -> DocumentChunksRepository
          -> LlmProviderService
            -> mock answer or OpenAI
```

These longer flows are acceptable when each step has a clear responsibility.
If a future feature becomes hard to explain in this format, simplify the service
boundaries before adding more abstractions.
