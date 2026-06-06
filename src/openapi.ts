import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fountain Life Notebook API')
    .setDescription(
      'NestJS API for the Fountain Life interview NotebookLM-style app.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
}

export function setupOpenApi(app: INestApplication) {
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app));
}
