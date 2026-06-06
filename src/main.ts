import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupOpenApi } from './openapi';
import type { ApplicationConfig } from './shared/config/app.config';
import { createJsonFileLoggerFromEnvironment } from './shared/logging/json-file.logger';

async function bootstrap() {
  const logger = createJsonFileLoggerFromEnvironment();
  const app = await NestFactory.create(AppModule, { logger });
  const appConfig = app
    .get(ConfigService)
    .getOrThrow<ApplicationConfig>('app');

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
    origin: appConfig.frontendOrigin.split(','),
    credentials: true,
  });

  setupOpenApi(app);

  await app.listen(appConfig.port);
  logger.log(
    {
      event: 'application.started',
      port: appConfig.port,
    },
    'Bootstrap',
  );
}
void bootstrap();
