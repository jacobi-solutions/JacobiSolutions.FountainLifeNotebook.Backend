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
  data-contracts/
  schemas/
```

This is intentional. Nest projects are usually easier to navigate when each
business capability owns its controllers, services, contracts, schemas, and
repositories together.

Cross-cutting code lives under `src/shared`:

```text
src/shared/data-contracts
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

- Controllers own HTTP concerns only: route shape, guards, request/response
  contracts, status codes, and request/response wrapping.
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

## Request State Safety

Most Nest providers in this app use the default provider scope, which is
singleton-like for the running application instance. This is normal for Nest and
is safe only when services do not store mutable request-specific state.

Do not store user, request, document selection, conversation, or correlation
state on service instance fields:

```ts
// Avoid this.
private currentUserId: string;
```

Pass request-specific values through method parameters instead:

```ts
listDocuments(user: AuthenticatedUser) {
  return this.documentsRepository.findByOwner(user.subject);
}
```

User isolation should flow through:

```text
CurrentUser decorator -> controller parameter -> service method parameter -> repository owner filter
```

Repositories must include the owner/user filter when reading or mutating
user-owned data. This is the primary guard against cross-user data leaks or
corruption.

Request-scoped providers are available in Nest, but they are intentionally not
the default here because they add overhead and can make the dependency graph
harder to reason about. Prefer explicit request parameters unless a feature has a
clear need for request-scoped dependency injection.

## Contracts

The API intentionally uses command-style POST endpoints for app operations. The
health check may use GET.

Route names should be explicit command names because they drive generated client
method names through OpenAPI operation IDs:

```text
POST /api/accounts/get-current-account -> getCurrentAccount
POST /api/documents/delete-document -> deleteDocument
```

Each normal JSON endpoint should:

1. Accept a request class extending `BaseRequest<TPayload>`.
2. Return a response class extending `BaseResponse<TData>`.
3. Use `ResponseFactory.success(...)` or `ResponseFactory.failure(...)`.

Example:

```text
DeleteDocumentRequest extends BaseRequest<DeleteDocumentPayload>
DeleteDocumentResponse extends BaseResponse<DeleteDocumentResult>
```

This project intentionally uses `data-contracts` folders and role-based class
names instead of the Nest-default `Dto` suffix. Use names such as `Request`,
`Response`, `Payload`, `Result`, `Summary`, and `Info` so generated frontend API
types read like normal application contracts.

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

Use schemas for Mongo/Mongoose persistence models. Use data contracts for API
requests and responses. Avoid exposing raw persistence models directly from
controllers.

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
