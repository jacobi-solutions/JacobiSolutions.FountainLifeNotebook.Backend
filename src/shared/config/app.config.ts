import { registerAs } from '@nestjs/config';

export interface FountainLifeConfig {
  authMode: 'cognito' | 'local';
  awsRegion: string;
  cognitoClientId: string;
  cognitoIssuer: string;
  cognitoUserPoolId: string;
  documentStorageRoot: string;
  frontendOrigin: string;
  llmProvider: 'mock' | 'openai';
  mongodbDatabase: string;
  mongodbUri: string;
  openAiApiKey?: string;
  openAiModel: string;
  port: number;
  storageBucketName?: string;
}

export const appConfig = registerAs('fountainLife', (): FountainLifeConfig => {
  const authMode = process.env.AUTH_MODE === 'cognito' ? 'cognito' : 'local';
  const awsRegion = process.env.AWS_REGION ?? 'us-east-1';
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID ?? '';

  return {
    authMode,
    awsRegion,
    cognitoClientId: process.env.COGNITO_CLIENT_ID ?? '',
    cognitoIssuer: `https://cognito-idp.${awsRegion}.amazonaws.com/${cognitoUserPoolId}`,
    cognitoUserPoolId,
    documentStorageRoot: process.env.DOCUMENT_STORAGE_ROOT ?? 'var/uploads',
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    llmProvider: process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'mock',
    mongodbDatabase: process.env.MONGODB_DATABASE ?? 'fountain-life-notebook',
    mongodbUri: process.env.MONGODB_URI ?? '',
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    port: Number(process.env.PORT ?? 3000),
    storageBucketName: process.env.STORAGE_BUCKET_NAME,
  };
});

export function validateConfig(config: Record<string, unknown>) {
  const authMode = config.AUTH_MODE === 'cognito' ? 'cognito' : 'local';
  const required = ['MONGODB_DATABASE', 'MONGODB_URI'];

  if (authMode === 'cognito') {
    required.push('AWS_REGION', 'COGNITO_CLIENT_ID', 'COGNITO_USER_POOL_ID');
  }

  if (config.LLM_PROVIDER === 'openai') {
    required.push('OPENAI_API_KEY', 'OPENAI_MODEL');
  }

  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return config;
}
