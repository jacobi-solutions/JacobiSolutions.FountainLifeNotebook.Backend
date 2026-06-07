import { validateConfig } from './app.config';

describe('validateConfig', () => {
  it('accepts the local interview configuration shape', () => {
    const config = {
      AUTH_MODE: 'local',
      DOCUMENT_STORAGE_PROVIDER: 'local',
      LLM_PROVIDER: 'mock',
      MONGODB_DATABASE: 'fountain-life-notebook',
      MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
    };

    expect(validateConfig(config)).toBe(config);
  });

  it('accepts node-style log level aliases', () => {
    const config = {
      AUTH_MODE: 'local',
      DOCUMENT_STORAGE_PROVIDER: 'local',
      LLM_PROVIDER: 'mock',
      LOG_LEVEL: 'info',
      MONGODB_DATABASE: 'fountain-life-notebook',
      MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
    };

    expect(validateConfig(config)).toBe(config);
  });

  it('requires production deployments to use Cognito, S3, and Bedrock', () => {
    expect(() =>
      validateConfig({
        APP_ENV: 'production',
        AUTH_MODE: 'local',
        DOCUMENT_STORAGE_PROVIDER: 'local',
        LLM_PROVIDER: 'mock',
        MONGODB_DATABASE: 'fountain-life-notebook',
        MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
      }),
    ).toThrow('Production requires AUTH_MODE=cognito.');
  });

  it('requires production deployments to use Bedrock Knowledge Bases for retrieval', () => {
    expect(() =>
      validateConfig({
        APP_ENV: 'production',
        AUTH_MODE: 'cognito',
        AWS_REGION: 'us-east-1',
        BEDROCK_MODEL_ID: 'amazon.nova-lite-v1:0',
        COGNITO_CLIENT_ID: 'client-id',
        COGNITO_USER_POOL_ID: 'pool-id',
        DOCUMENT_STORAGE_PROVIDER: 's3',
        LLM_PROVIDER: 'bedrock',
        MONGODB_DATABASE: 'fountain-life-notebook',
        MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
        STORAGE_BUCKET_NAME: 'documents',
      }),
    ).toThrow('Production requires RETRIEVAL_PROVIDER=bedrock-kb.');
  });

  it('requires S3 bucket configuration when S3 document storage is enabled', () => {
    expect(() =>
      validateConfig({
        AWS_REGION: 'us-east-1',
        AUTH_MODE: 'local',
        DOCUMENT_STORAGE_PROVIDER: 's3',
        LLM_PROVIDER: 'mock',
        MONGODB_DATABASE: 'fountain-life-notebook',
        MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
      }),
    ).toThrow('Missing required configuration: STORAGE_BUCKET_NAME');
  });

  it('requires Bedrock model configuration when Bedrock is enabled', () => {
    expect(() =>
      validateConfig({
        AWS_REGION: 'us-east-1',
        AUTH_MODE: 'local',
        DOCUMENT_STORAGE_PROVIDER: 'local',
        LLM_PROVIDER: 'bedrock',
        MONGODB_DATABASE: 'fountain-life-notebook',
        MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
      }),
    ).toThrow('Missing required configuration: BEDROCK_MODEL_ID');
  });

  it('requires Bedrock Knowledge Base configuration when KB retrieval is enabled', () => {
    expect(() =>
      validateConfig({
        AWS_REGION: 'us-east-1',
        AUTH_MODE: 'local',
        BEDROCK_MODEL_ID: 'amazon.nova-lite-v1:0',
        DOCUMENT_STORAGE_PROVIDER: 's3',
        LLM_PROVIDER: 'bedrock',
        MONGODB_DATABASE: 'fountain-life-notebook',
        MONGODB_URI: 'mongodb://localhost:27017/fountain-life-notebook',
        RETRIEVAL_PROVIDER: 'bedrock-kb',
        STORAGE_BUCKET_NAME: 'documents',
      }),
    ).toThrow(
      'Missing required configuration: BEDROCK_KNOWLEDGE_BASE_DATA_SOURCE_ID, BEDROCK_KNOWLEDGE_BASE_ID',
    );
  });
});
