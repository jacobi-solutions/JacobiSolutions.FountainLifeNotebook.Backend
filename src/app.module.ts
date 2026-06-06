import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { AwsModule } from './modules/aws/aws.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthModule } from './modules/health/health.module';
import { McpModule } from './modules/mcp/mcp.module';
import { appConfig, validateConfig } from './shared/config/app.config';
import { GlobalExceptionFilter } from './shared/http/global-exception.filter';
import { RequestContextMiddleware } from './shared/http/request-context.middleware';
import { RequestResponseLoggingInterceptor } from './shared/http/request-response-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? '', {
      dbName: process.env.MONGODB_DATABASE,
    }),
    AwsModule,
    AuthModule,
    AccountsModule,
    DocumentsModule,
    AssistantModule,
    McpModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestResponseLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
