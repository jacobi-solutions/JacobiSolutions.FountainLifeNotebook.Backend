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

Architecture conventions and layer rules are captured in [docs/architecture.md](docs/architecture.md).

## Local Setup

### Option A: One Command With Docker

This is the easiest path for someone who does not want to install MongoDB or Node.js locally.
It assumes the backend and frontend repos are cloned as siblings:

```text
Ramin/
  FountainLifeNotebook.Backend/
  fountain-life-notebook.frontend/
```

Start Docker Desktop, then run from this backend repo:

```bash
docker compose -f docker-compose.local.yml up
```

Open the app:

```text
http://localhost:5173
```

API health check:

```text
http://localhost:3000/api/health
```

Stop the app:

```bash
docker compose -f docker-compose.local.yml down
```

Reset local Mongo data and uploaded files:

```bash
docker compose -f docker-compose.local.yml down -v
```

### Option B: VS Code Debugger

Open the workspace file from this backend repo:

```text
FountainLifeNotebook.code-workspace
```

Then use VS Code's Run and Debug panel:

- `Full Stack: Debug Backend + Frontend` starts Docker Mongo, runs the backend through `npm run start:debug`, starts the frontend through `npm run dev`, and opens Chrome at `http://localhost:5173`.
- `Backend: Debug API + Docker Mongo` starts Docker Mongo and runs only the backend debugger.
- `Backend: Debug API` runs only the backend debugger, reads `.env`, and expects the configured Mongo connection to already be available.

The debugger uses the same normal npm scripts you would run in the terminal. Backend breakpoints work in TypeScript controller, service, repository, and agent files.

If Docker fails or you want to use a MongoDB sandbox, copy `.env.example` to `.env`, set `MONGODB_URI` to the sandbox connection string, and run `Backend: Debug API` instead of the Docker Mongo launch profile.

### Option C: Manual Local Development

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

For manual local development, start MongoDB first. The simplest Docker-only Mongo command is:

```bash
docker run --name fountain-life-notebook-mongo -p 27017:27017 -d mongo:8.0
```

When finished:

```bash
docker stop fountain-life-notebook-mongo
docker rm fountain-life-notebook-mongo
```

For a production-shaped configuration, set `APP_ENV=production`, `AUTH_MODE=cognito`, `DOCUMENT_STORAGE_PROVIDER=s3`, `LLM_PROVIDER=openai`, and provide the required Cognito, S3, MongoDB, and OpenAI settings. Startup validation fails fast if any production provider is missing.

## Local Logs

Backend logs are written as JSON lines to both the console and the local log file:

```text
var/logs/backend-YYYY-MM-DD.log
```

The folder is created automatically at startup. The default minimum level is `Information`, and the default filename rolls daily.

Useful commands:

```bash
tail -f var/logs/backend-$(date +%F).log
jq . var/logs/backend-$(date +%F).log
```

Logging can be configured with:

```bash
LOG_APPLICATION_NAME=FountainLifeNotebook.Backend
LOG_DIRECTORY=var/logs
LOG_FILE_NAME=backend-%DATE%.log
LOG_LEVEL=Information
```

`%DATE%` is replaced with the log entry date in `YYYY-MM-DD` format. Use a fixed value such as `backend.log` if daily files are not wanted. Supported levels are `Fatal`, `Error`, `Warning`, `Information`, `Debug`, and `Verbose`.

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
