# Fountain Life Notebook Backend

NestJS API for the Fountain Life interview NotebookLM-style app.

## Stack Shape

- HTTP layer: NestJS controllers with Swagger-decorated DTOs and a global `/api` prefix.
- Auth: local interview mode by default, Cognito JWT mode available with `AUTH_MODE=cognito`.
- Services: controller orchestration stays thin; business behavior lives in module services.
- Persistence: Mongoose schemas and repository classes backed by a shared `BaseRepository`.
- Contracts: OpenAPI is exported to `openapi/fountain-life-api.json` for frontend type generation.
- Cross-cutting: request correlation middleware, global exception filter, validation pipe, CORS, Helmet, and request/response logging with redaction.
- MCP: JSON-RPC style MCP controller and registry are present for exposing app tools.
- Secrets/storage: AWS Secrets Manager and S3 service wrappers are available, but the interview app should stay local-first unless a cloud feature is explicitly needed.

## Local Setup

```bash
npm ci
cp .env.example .env
npm run start:dev
```

The default `.env.example` uses local auth:

```bash
AUTH_MODE=local
MONGODB_URI=mongodb://localhost:27017/fountain-life-notebook
```

Protected endpoints receive a deterministic local user from `LOCAL_AUTH_*` environment variables or `X-Local-*` request headers. To use Cognito instead, set `AUTH_MODE=cognito` and provide `AWS_REGION`, `COGNITO_CLIENT_ID`, and `COGNITO_USER_POOL_ID`.

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
