import { registerAs } from '@nestjs/config';

const APP_ENVIRONMENTS = ['local', 'test', 'production'] as const;
const AUTH_MODES = ['cognito', 'local'] as const;
const DOCUMENT_STORAGE_PROVIDERS = ['local', 's3'] as const;
const LLM_PROVIDERS = ['mock', 'openai'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export type AuthMode = (typeof AUTH_MODES)[number];
export type DocumentStorageProvider =
  (typeof DOCUMENT_STORAGE_PROVIDERS)[number];
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export interface FountainLifeConfig {
  appEnvironment: AppEnvironment;
  authMode: AuthMode;
  awsRegion: string;
  cognitoClientId: string;
  cognitoIssuer: string;
  cognitoUserPoolId: string;
  documentStorageProvider: DocumentStorageProvider;
  documentStorageRoot: string;
  frontendOrigin: string;
  llmProvider: LlmProvider;
  mongodbDatabase: string;
  mongodbUri: string;
  openAiApiKey?: string;
  openAiModel: string;
  port: number;
  storageBucketName?: string;
}

export const appConfig = registerAs('fountainLife', (): FountainLifeConfig => {
  const appEnvironment = readEnum(
    process.env.APP_ENV,
    APP_ENVIRONMENTS,
    'local',
    'APP_ENV',
  );
  const authMode = readEnum(
    process.env.AUTH_MODE,
    AUTH_MODES,
    'local',
    'AUTH_MODE',
  );
  const documentStorageProvider = readEnum(
    process.env.DOCUMENT_STORAGE_PROVIDER,
    DOCUMENT_STORAGE_PROVIDERS,
    'local',
    'DOCUMENT_STORAGE_PROVIDER',
  );
  const awsRegion = process.env.AWS_REGION ?? 'us-east-1';
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID ?? '';

  return {
    appEnvironment,
    authMode,
    awsRegion,
    cognitoClientId: process.env.COGNITO_CLIENT_ID ?? '',
    cognitoIssuer: `https://cognito-idp.${awsRegion}.amazonaws.com/${cognitoUserPoolId}`,
    cognitoUserPoolId,
    documentStorageProvider,
    documentStorageRoot: process.env.DOCUMENT_STORAGE_ROOT ?? 'var/uploads',
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    llmProvider: readEnum(
      process.env.LLM_PROVIDER,
      LLM_PROVIDERS,
      'mock',
      'LLM_PROVIDER',
    ),
    mongodbDatabase: process.env.MONGODB_DATABASE ?? 'fountain-life-notebook',
    mongodbUri: process.env.MONGODB_URI ?? '',
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    port: Number(process.env.PORT ?? 3000),
    storageBucketName: process.env.STORAGE_BUCKET_NAME,
  };
});

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
