import { registerAs } from '@nestjs/config';
import {
  normalizeMinimumLogLevel,
  type MinimumLogLevel,
} from '../logging/json-file.logger';

const APP_ENVIRONMENTS = ['local', 'test', 'production'] as const;
const AUTH_MODES = ['cognito', 'local'] as const;
const DOCUMENT_STORAGE_PROVIDERS = ['local', 's3'] as const;
const LLM_PROVIDERS = ['mock', 'openai'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export type AuthMode = (typeof AUTH_MODES)[number];
export type DocumentStorageProvider =
  (typeof DOCUMENT_STORAGE_PROVIDERS)[number];
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export interface ApplicationConfig {
  environment: AppEnvironment;
  frontendOrigin: string;
  port: number;
}

export interface AuthConfig {
  authMode: AuthMode;
  cognitoClientId: string;
  cognitoIssuer: string;
  cognitoUserPoolId: string;
  localUser: {
    email: string;
    subject: string;
    username: string;
  };
}

export interface AwsConfig {
  region: string;
}

export interface DatabaseConfig {
  databaseName: string;
  uri: string;
}

export interface DocumentStorageConfig {
  documentStorageProvider: DocumentStorageProvider;
  documentStorageRoot: string;
  storageBucketName?: string;
}

export interface LlmConfig {
  llmProvider: LlmProvider;
  openAiApiKey?: string;
  openAiModel: string;
}

export interface LoggingConfig {
  logApplicationName: string;
  logDirectory: string;
  logFileName: string;
  logLevel: MinimumLogLevel;
}

export const applicationConfig = registerAs('app', (): ApplicationConfig => ({
  environment: readEnum(
    process.env.APP_ENV,
    APP_ENVIRONMENTS,
    'local',
    'APP_ENV',
  ),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  port: Number(process.env.PORT ?? 3000),
}));

export const awsConfig = registerAs('aws', (): AwsConfig => ({
  region: process.env.AWS_REGION ?? 'us-east-1',
}));

export const authConfig = registerAs('auth', (): AuthConfig => {
  const authMode = readEnum(
    process.env.AUTH_MODE,
    AUTH_MODES,
    'local',
    'AUTH_MODE',
  );
  const awsRegion = process.env.AWS_REGION ?? 'us-east-1';
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID ?? '';
  const localEmail =
    process.env.LOCAL_AUTH_EMAIL ?? 'local.user@fountainlife.local';
  const localSubject = process.env.LOCAL_AUTH_USER_ID ?? 'local-user';

  return {
    authMode,
    cognitoClientId: process.env.COGNITO_CLIENT_ID ?? '',
    cognitoIssuer: `https://cognito-idp.${awsRegion}.amazonaws.com/${cognitoUserPoolId}`,
    cognitoUserPoolId,
    localUser: {
      email: localEmail,
      subject: localSubject,
      username:
        process.env.LOCAL_AUTH_USERNAME ?? localEmail ?? localSubject,
    },
  };
});

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  databaseName: process.env.MONGODB_DATABASE ?? 'fountain-life-notebook',
  uri: process.env.MONGODB_URI ?? '',
}));

export const documentStorageConfig = registerAs(
  'documentStorage',
  (): DocumentStorageConfig => ({
    documentStorageProvider: readEnum(
      process.env.DOCUMENT_STORAGE_PROVIDER,
      DOCUMENT_STORAGE_PROVIDERS,
      'local',
      'DOCUMENT_STORAGE_PROVIDER',
    ),
    documentStorageRoot: process.env.DOCUMENT_STORAGE_ROOT ?? 'var/uploads',
    storageBucketName: process.env.STORAGE_BUCKET_NAME,
  }),
);

export const llmConfig = registerAs('llm', (): LlmConfig => ({
  llmProvider: readEnum(
    process.env.LLM_PROVIDER,
    LLM_PROVIDERS,
    'mock',
    'LLM_PROVIDER',
  ),
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
}));

export const loggingConfig = registerAs('logging', (): LoggingConfig => ({
  logApplicationName:
    process.env.LOG_APPLICATION_NAME ?? 'FountainLifeNotebook.Backend',
  logDirectory: process.env.LOG_DIRECTORY ?? 'var/logs',
  logFileName: process.env.LOG_FILE_NAME ?? 'backend-%DATE%.log',
  logLevel: normalizeMinimumLogLevel(process.env.LOG_LEVEL),
}));

export const configLoaders = [
  applicationConfig,
  authConfig,
  awsConfig,
  databaseConfig,
  documentStorageConfig,
  llmConfig,
  loggingConfig,
];

export function validateConfig(config: Record<string, unknown>) {
  const appEnvironment = readEnum(
    config.APP_ENV,
    APP_ENVIRONMENTS,
    'local',
    'APP_ENV',
  );
  const authMode = readEnum(config.AUTH_MODE, AUTH_MODES, 'local', 'AUTH_MODE');
  const documentStorageProvider = readEnum(
    config.DOCUMENT_STORAGE_PROVIDER,
    DOCUMENT_STORAGE_PROVIDERS,
    'local',
    'DOCUMENT_STORAGE_PROVIDER',
  );
  const llmProvider = readEnum(
    config.LLM_PROVIDER,
    LLM_PROVIDERS,
    'mock',
    'LLM_PROVIDER',
  );
  normalizeMinimumLogLevel(config.LOG_LEVEL);
  const required = ['MONGODB_DATABASE', 'MONGODB_URI'];

  if (authMode === 'cognito') {
    required.push('AWS_REGION', 'COGNITO_CLIENT_ID', 'COGNITO_USER_POOL_ID');
  }

  if (documentStorageProvider === 's3') {
    required.push('AWS_REGION', 'STORAGE_BUCKET_NAME');
  }

  if (llmProvider === 'openai') {
    required.push('OPENAI_API_KEY', 'OPENAI_MODEL');
  }

  if (appEnvironment === 'production') {
    if (authMode !== 'cognito') {
      throw new Error('Production requires AUTH_MODE=cognito.');
    }

    if (documentStorageProvider !== 's3') {
      throw new Error('Production requires DOCUMENT_STORAGE_PROVIDER=s3.');
    }

    if (llmProvider !== 'openai') {
      throw new Error('Production requires LLM_PROVIDER=openai.');
    }
  }

  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return config;
}

function readEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue,
  key: string,
): TValue {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be one of: ${allowedValues.join(', ')}`);
  }

  const normalized = value.trim().toLowerCase();
  if (!allowedValues.includes(normalized as TValue)) {
    throw new Error(`${key} must be one of: ${allowedValues.join(', ')}`);
  }

  return normalized as TValue;
}
