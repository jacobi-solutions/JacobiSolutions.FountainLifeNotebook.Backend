# Fountain Life Notebook Backend

NestJS API for the Fountain Life Notebook interview app.

This repo is meant to be reviewed with the sibling frontend and infra repos:

```text
Ramin/
  JacobiSolutions.FountainLifeNotebook.Backend/
  jacobi-solutions.fountain-life-notebook.frontend/
  JacobiSolutions.FountainLifeNotebook.Infra/
```

## Interview Review Path

For a quick codebase review:

1. Read [docs/architecture.md](docs/architecture.md) for the backend layering
   rules.
2. Skim `src/modules/documents`, `src/modules/assistants`, and
   `src/shared/config`.
3. Run or inspect the app with the Docker command below.
4. Run `npm run verify` before judging final readiness.

## Run The Full App Locally

Fastest path, from this backend repo:

```bash
docker compose -f docker-compose.local.yml up
```

Open:

```text
http://localhost:5173
```

Useful URLs:

```text
Frontend:   http://localhost:5173
API health: http://localhost:3000/api/health
API docs:   http://localhost:3000/api/docs
API base:   http://localhost:3000/api
```

Stop it:

```bash
docker compose -f docker-compose.local.yml down
```

Reset local Docker data:

```bash
docker compose -f docker-compose.local.yml down -v
```

Docker starts MongoDB, this backend, and the sibling frontend. Node.js and
MongoDB do not need to be installed locally for this path.

## Manual Backend Run

Use this if you only want the API.

Prerequisites:

- Node.js 22 or newer
- MongoDB at `mongodb://localhost:27017/fountain-life-notebook`

```bash
npm ci
test -f .env || cp .env.example .env
npm run start:dev
```

If you need a quick local MongoDB:

```bash
docker run --name fountain-life-notebook-mongo -p 27017:27017 -d mongo:8.0
```

The default `.env.example` uses local auth, local document storage, mock LLM
responses, and local retrieval. Cognito, S3, and Bedrock are not required for
local development.

## Checks

```bash
npm run verify
```

This runs build, unit tests, e2e tests, and OpenAPI export.

Focused commands:

```bash
npm run build
npm test
npm run test:e2e
npm run contract:export
```

## API Contracts

OpenAPI is exported to:

```text
openapi/fountain-life-api.json
```

When backend request or response shapes change:

```bash
npm run contract:sync
```

That exports OpenAPI and regenerates the sibling frontend client. It assumes the
backend and frontend repos are checked out as siblings with the folder names
shown above.

## What To Look At

- `src/main.ts`: global `/api` prefix, validation, CORS, Helmet, Swagger.
- `src/shared/config`: fail-fast typed environment configuration.
- `src/modules/auth`: local interview auth and Cognito JWT mode.
- `src/modules/documents`: upload, extraction, storage, and chunk persistence.
- `src/modules/assistants`: notebook assistant orchestration and streaming.
- `src/shared/repositories`: Mongo repository conventions.

## Local Defaults

The local path is intentionally self-contained:

```text
AUTH_MODE=local
DOCUMENT_STORAGE_PROVIDER=local
LLM_PROVIDER=mock
RETRIEVAL_PROVIDER=local
PORT=3000
```

For the full list, see [.env.example](.env.example).

## Deployment Context

The deployed backend runs on ECS Fargate behind an ALB, stores documents in S3,
uses Cognito for auth, reads MongoDB Atlas from Secrets Manager, and uses
Bedrock/Knowledge Bases for deployed retrieval. Terraform lives in the sibling
infra repo.

## Troubleshooting

- If Docker startup looks idle, wait for both container `npm ci` installs to
  finish.
- If the API cannot connect to Mongo in manual mode, confirm `MONGODB_URI` in
  `.env`.
- If frontend types look stale after backend contract work, run
  `npm run contract:sync`.
