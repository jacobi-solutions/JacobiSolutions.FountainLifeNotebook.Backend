# Fountain Life Notebook Backend

NestJS API for the Fountain Life interview NotebookLM-style app.

## Stack Shape

- HTTP layer: NestJS controllers with Swagger-decorated DTOs and a global `/api` prefix.
- Runtime modes: local interview mode by default; production requires Cognito auth, S3 document storage, and OpenAI.
- Auth: local interview mode by default, Cognito JWT mode available with `AUTH_MODE=cognito`.
- Services: controller orchestration stays thin; business behavior lives in module services.
- Persistence: Mongoose schemas and repository classes backed by a shared `BaseRepository`.
- Contracts: OpenAPI is exported to `openapi/fountain-life-api.json` for frontend type generation.
- Cross-cutting: request correlation middleware, global exception filter, validation pipe, CORS, Helmet, and request/response logging with redaction.
- Assistant orchestration: `AssistantRegistry` routes assistant keys to handlers, with the notebook handler backed by retrieval plus an LLM provider.
- Documents: uploads flow through `DocumentIngestionService`; storage can be local or S3 with `DOCUMENT_STORAGE_PROVIDER`.
- MCP: JSON-RPC style MCP controller and registry expose app tools, starting with assistant discovery.
- Secrets/storage: AWS Secrets Manager and S3 service wrappers are available, while local storage remains the default for fast development.

## Local Setup

```bash
npm ci
cp .env.example .env
npm run start:dev
```

The default `.env.example` uses local auth:

```bash
AUTH_MODE=local
DOCUMENT_STORAGE_PROVIDER=local
MONGODB_URI=mongodb://localhost:27017/fountain-life-notebook
```

Protected endpoints receive a deterministic local user from `LOCAL_AUTH_*` environment variables or `X-Local-*` request headers. To use Cognito instead, set `AUTH_MODE=cognito` and provide `AWS_REGION`, `COGNITO_CLIENT_ID`, and `COGNITO_USER_POOL_ID`.

For a production-shaped configuration, set `APP_ENV=production`, `AUTH_MODE=cognito`, `DOCUMENT_STORAGE_PROVIDER=s3`, `LLM_PROVIDER=openai`, and provide the required Cognito, S3, MongoDB, and OpenAI settings. Startup validation fails fast if any production provider is missing.

## Contracts

When request or response shapes change:

```bash
npm run contract:export
```

Then regenerate the frontend client from `/Users/shanedrye/jacobi/Ramin/fountain-life-notebook.frontend`:

```bash
npm run contract:generate
```

## Checks

```bash
npm run verify
```

This runs the build, unit tests, e2e tests, and OpenAPI export.
