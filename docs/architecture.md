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

## Configuration

Runtime configuration is split into focused typed groups in
`src/shared/config/app.config.ts`:

```text
app
auth
aws
database
documentStorage
llm
logging
```

Providers should request the smallest config group they need through
`ConfigService.getOrThrow<T>(...)`. Avoid injecting or recreating a broad
all-settings object when a focused group communicates the dependency better.

Examples:

```text
JwtStrategy -> auth
MongooseModule -> database
DocumentsModule -> documentStorage
StorageService -> aws + documentStorage
LlmProviderService -> llm
main.ts -> app
```

Keep direct `process.env` reads inside config construction, startup-only logger
creation, or very small bootstrap seams. Controllers and business services
should use typed config groups through dependency injection.

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

1. Accept a request class extending `BaseRequest`.
2. Put endpoint request fields directly on that request class.
3. Return `BaseResponse` when success/failure is enough and there is no useful
   endpoint-specific data to return.
4. Return a response class extending `BaseResponse` when endpoint data is needed.
5. Put endpoint response fields directly on that response class.
6. Use `ResponseFactory.success(...)`, `ResponseFactory.successWith(...)`, or
   `ResponseFactory.failure(...)`.

Example:

```text
DeleteDocumentRequest extends BaseRequest
ListDocumentsResponse extends BaseResponse
```

This `BaseResponse` rule applies to any command where success/failure is the
whole result, not only delete operations. For example, delete, clear, mark,
acknowledge, or reset-style commands should return plain `BaseResponse` unless
the caller needs a specific value back. Do not create empty endpoint-specific
response classes or `Result` wrappers just to say the operation succeeded.

This project intentionally uses `data-contracts` folders and role-based class
names instead of the Nest-default `Dto` suffix. Use names such as `Request`,
`Response`, `Summary`, and `Info` so generated frontend API types read like
normal application contracts. Avoid `Payload` and `Result` classes unless they
represent a reusable concept rather than a generic wrapper.

Contract filenames should match their exported class names in kebab case. For
example, `DeleteDocumentRequest` belongs in `delete-document-request.ts`. Keep
one exported contract class per file unless there is a clear reason to do
otherwise.

The base response shape is:

```json
{
  "correlationId": "optional-correlation-id",
  "errors": [],
  "isSuccess": true
}
```

Responses with endpoint data should use named fields:

```json
{
  "correlationId": "optional-correlation-id",
  "errors": [],
  "isSuccess": true,
  "documents": []
}
```

Commands with no endpoint data should return only the base shape:

```json
{
  "correlationId": "optional-correlation-id",
  "errors": [],
  "isSuccess": true
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

## Deployed AWS Shape

Milestone 02 moves the app toward this deployment shape without requiring live
AWS mutations during development:

```text
Browser
  -> CloudFront
    -> S3 private static frontend origin
    -> /api/* Application Load Balancer origin
      -> ECS Fargate NestJS backend
        -> MongoDB Atlas
        -> S3 document bucket
        -> Cognito JWKS validation
        -> OpenAI
```

CloudFront is the public HTTPS boundary for the first deployed demo. The
frontend can use `VITE_API_BASE_URL=/api`, which avoids mixed-content issues and
keeps browser traffic on one origin. The backend still enables CORS for local
development and for future custom-domain deployments.

ECS injects secret values from AWS Secrets Manager into the normal process
environment. The app continues to read `MONGODB_URI` and `OPENAI_API_KEY`
through typed config validation rather than fetching secrets inside business
services.
