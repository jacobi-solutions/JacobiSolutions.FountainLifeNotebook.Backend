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
});
