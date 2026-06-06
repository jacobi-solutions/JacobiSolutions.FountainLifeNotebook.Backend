import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { ApiContractModule } from '../src/api-contract.module';
import { createOpenApiDocument } from '../src/openapi';

async function run() {
  const outputPath = resolve(process.argv[2] ?? 'openapi/fountain-life-api.json');
  const app = await NestFactory.create(ApiContractModule, { logger: false });
  const document = createOpenApiDocument(app);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void run();
