# Engineering Workflow

## Local Setup

```bash
npm run setup:local
npm run start:dev
```

Manual equivalent:

```bash
npm ci
test -f .env || cp .env.example .env
mkdir -p var/uploads var/logs openapi
```

MongoDB must be available at the `MONGODB_URI` in `.env`.

## Checks

```bash
npm run verify
```

Focused commands:

```bash
npm run build
npm test
npm run test:e2e
npm run contract:export
```

## Contract Changes

When backend request or response shapes change:

```bash
npm run contract:sync
```

This exports OpenAPI and regenerates the sibling frontend client.

## Safety Rules

- Do not commit `.env`, secrets, tokens, connection strings, or local logs.
- Do not use real PHI in local fixtures, logs, screenshots, prompts, or support
  artifacts unless the compliance scope and approved handling process are
  explicit.
- Keep local auth as the default unless Cognito behavior is being tested.
- Keep controllers thin and use services/repositories for behavior and
  persistence.
- AI-agent specific workflow notes live in
  [codex/ENGINEERING_DELIVERY_WORKFLOW.md](codex/ENGINEERING_DELIVERY_WORKFLOW.md).
