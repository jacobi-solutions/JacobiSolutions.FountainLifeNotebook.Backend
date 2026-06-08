import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AlertcheckModule } from './modules/alertcheck/alertcheck.module';
import { AssistantsModule } from './modules/assistants/assistants.module';
import { AwsModule } from './modules/aws/aws.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthModule } from './modules/health/health.module';
import { McpModule } from './modules/mcp/mcp.module';
import { NotebooksModule } from './modules/notebooks/notebooks.module';
import {
  configLoaders,
  type DatabaseConfig,
  validateConfig,
} from './shared/config/app.config';
import { GlobalExceptionFilter } from './shared/http/global-exception.filter';
import { RequestContextMiddleware } from './shared/http/request-context.middleware';
import { RequestResponseLoggingInterceptor } from './shared/http/request-response-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configLoaders,
      validate: validateConfig,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = configService.getOrThrow<DatabaseConfig>('database');
        return {
          dbName: database.databaseName,
          uri: database.uri,
        };
      },
    }),
    AwsModule,
    AuthModule,
    AlertcheckModule,
    AccountsModule,
    DocumentsModule,
    NotebooksModule,
    AssistantsModule,
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
