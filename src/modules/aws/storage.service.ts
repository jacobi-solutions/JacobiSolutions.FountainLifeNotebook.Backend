import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FountainLifeConfig } from '../../shared/config/app.config';

export interface PutObjectRequest {
  body: Buffer | Uint8Array | string;
  bucket?: string;
  contentType?: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly defaultBucketName?: string;

  constructor(configService: ConfigService) {
    const config = configService.getOrThrow<FountainLifeConfig>('fountainLife');
    this.client = new S3Client({ region: config.awsRegion });
    this.defaultBucketName = config.storageBucketName;
  }

  async putObject(request: PutObjectRequest): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: request.body,
        Bucket: this.resolveBucket(request.bucket),
        ContentType: request.contentType,
        Key: request.key,
      }),
    );
  }

  async deleteObject(key: string, bucket?: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.resolveBucket(bucket),
        Key: key,
      }),
    );
  }

  getDownloadUrl(key: string, expiresInSeconds = 900, bucket?: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.resolveBucket(bucket),
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  private resolveBucket(bucket?: string) {
    const resolvedBucket = bucket ?? this.defaultBucketName;
    if (!resolvedBucket) {
      throw new Error('No S3 bucket was provided and STORAGE_BUCKET_NAME is not configured.');
    }

    return resolvedBucket;
  }
}
