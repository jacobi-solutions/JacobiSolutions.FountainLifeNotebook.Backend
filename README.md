# Fountain Life Notebook Backend

## Project Summary / Repo Layout

Fountain Life Notebook is an interview project split across three repositories:
a NestJS backend API, a React Router frontend, and Terraform infrastructure for
the AWS deployment path. The milestone branches preserve the build-out history.

This backend repo provides the NestJS API for the interview app and is meant to
be reviewed with the sibling frontend and infra repos:

```text
FountainLifeNotebook/
  JacobiSolutions.FountainLifeNotebook.Backend/
  jacobi-solutions.fountain-life-notebook.frontend/
  JacobiSolutions.FountainLifeNotebook.Infra/
```

## Project Map / Milestone Summary

| Milestone | Major idea | Backend | Frontend | Infra |
| --- | --- | --- | --- | --- |
| 00 Starter Stack | App shells, local defaults, repo boundaries. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F00-starter-stack) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F00-starter-stack) | starts in Milestone 2 |
| 01 Core Notebook | Local notebook workflow, documents, notebooks, generated contracts, local auth. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F01-core-notebook) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F01-core-notebook) | starts in Milestone 2 |
| 02 AWS Ready Foundation | Cognito, S3/CloudFront, ECS, Secrets Manager, deployment variables. Infra starts here. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F02-aws-ready-foundation) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F02-aws-ready-foundation) | [infra](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Infra/tree/milestone%2F02-aws-ready-foundation) |
| 03 Bedrock KB Notebooks | Bedrock Knowledge Bases, notebook retrieval, notebook/user isolation. | [backend](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Backend/tree/milestone%2F03-bedrock-kb-notebooks) | [frontend](https://github.com/jacobi-solutions/jacobi-solutions.fountain-life-notebook.frontend/tree/milestone%2F03-bedrock-kb-notebooks) | [infra](https://github.com/jacobi-solutions/JacobiSolutions.FountainLifeNotebook.Infra/tree/milestone%2F03-bedrock-kb-notebooks) |

## At A Glance

- Purpose: backend API, auth boundary, document ingestion, persistence,
  assistant orchestration, and OpenAPI contracts.
- Running app: current demo deployment at
  [https://d10nrh49pw7gmt.cloudfront.net](https://d10nrh49pw7gmt.cloudfront.net)
- Fast-track setup: `npm run setup:local`, then `npm run start:dev`.
- Local dependency: MongoDB at the `MONGODB_URI` in `.env`.
- Main review areas: `src/modules/documents`, `src/modules/assistants`,
  `src/modules/knowledge-base`, `src/modules/auth`, and `src/shared/config`.
- More detail: [run locally](#details-run-locally),
  [backend only](#details-backend-only), [checks](#details-checks),
  [contracts](#details-api-contracts), [architecture](#details-what-to-look-at),
  [deployment context](#details-deployment-context),
  [supporting docs](#details-supporting-docs).

## Interview Review Path

For a quick codebase review:

1. Read [docs/architecture.md](docs/architecture.md) for the backend layering
   rules.
2. Skim `src/modules/documents`, `src/modules/assistants`, and
   `src/shared/config`.
3. Run or inspect the app with the terminal commands below.
4. Run `npm run verify` before judging final readiness.

## Details: Run Locally

Prerequisites:

- Node.js 22 or newer
- MongoDB at `mongodb://localhost:27017/fountain-life-notebook`, or another
  MongoDB URI set in the backend `.env`

Terminal 1, from this backend repo:

```bash
npm run setup:local
npm run start:dev
```

Terminal 2, from the sibling frontend repo:

```bash
cd ../jacobi-solutions.fountain-life-notebook.frontend
npm run setup:local
npm run dev
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

The setup script is only a shortcut for normal local setup. The manual
equivalent is:

```bash
npm ci
test -f .env || cp .env.example .env
mkdir -p var/uploads var/logs openapi
```

For normal local mode, no `.env` edits are needed if MongoDB is available at the
default URI. If your MongoDB is somewhere else, edit this line in the backend
`.env` before starting the API:

```text
MONGODB_URI=mongodb://localhost:27017/fountain-life-notebook
```

## Details: Backend Only

Use this if you only want the API.

Prerequisites:

- Node.js 22 or newer
- MongoDB at `mongodb://localhost:27017/fountain-life-notebook`

```bash
npm run setup:local
npm run start:dev
```

The default `.env.example` uses local auth, local document storage, mock LLM
responses, and local retrieval. Cognito, S3, and Bedrock are not required for
local development.

## Details: Optional Docker

This repo includes `docker-compose.local.yml` for a containerized local stack,
and the deployed app is built around containerized backend infrastructure. The
Compose path has not been the primary verified local interview workflow, so we
recommend the terminal setup above.

If you want to try it from this backend repo:

```bash
docker compose -f docker-compose.local.yml up
```

## Details: Checks

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

## Details: API Contracts

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

## Details: What To Look At

- `src/main.ts`: global `/api` prefix, validation, CORS, Helmet, Swagger.
- `src/shared/config`: fail-fast typed environment configuration.
- `src/modules/auth`: local interview auth and Cognito JWT mode.
- `src/modules/documents`: upload, extraction, document viewing, storage, and
  chunk persistence.
- `src/modules/assistants`: notebook assistant orchestration and streaming.
- `src/modules/knowledge-base`: Bedrock Knowledge Base ingestion and retrieval
  integration.
- `src/shared/repositories`: Mongo repository conventions.

## Details: Local Defaults

The local path is intentionally self-contained:

```text
AUTH_MODE=local
DOCUMENT_STORAGE_PROVIDER=local
LLM_PROVIDER=mock
RETRIEVAL_PROVIDER=local
PORT=3000
```

For the full list, see [.env.example](.env.example).

## Details: Deployment Context

The deployed backend runs on ECS Fargate behind an ALB, stores documents in S3,
uses Cognito for auth, reads MongoDB Atlas from Secrets Manager, and uses
Bedrock/Knowledge Bases for deployed retrieval. The current demo frontend is
[https://d10nrh49pw7gmt.cloudfront.net](https://d10nrh49pw7gmt.cloudfront.net).
Terraform lives in the sibling infra repo.

## Details: Supporting Docs

- [Architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Feature ideas](docs/FEATURE_IDEAS.md)
- [Technical debt](docs/TECH_DEBT.md)
- [Engineering workflow](CONTRIBUTING.md)
- [Backend architecture](docs/architecture.md)

## Details: Troubleshooting

- If the API cannot connect to Mongo in manual mode, confirm `MONGODB_URI` in
  `.env`.
- If frontend types look stale after backend contract work, run
  `npm run contract:sync`.
