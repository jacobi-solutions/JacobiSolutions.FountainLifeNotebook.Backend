import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupOpenApi } from './openapi';
import { createJsonFileLoggerFromEnvironment } from './shared/logging/json-file.logger';

async function bootstrap() {
  const logger = createJsonFileLoggerFromEnvironment();
  const app = await NestFactory.create(AppModule, { logger });

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
    ],
    credentials: true,
  });

  setupOpenApi(app);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    {
      event: 'application.started',
      port: Number(process.env.PORT ?? 3000),
    },
    'Bootstrap',
  );
}
void bootstrap();
