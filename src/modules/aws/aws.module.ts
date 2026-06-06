import { Module } from '@nestjs/common';
import { SecretsService } from './secrets.service';
import { StorageService } from './storage.service';

@Module({
  providers: [SecretsService, StorageService],
  exports: [SecretsService, StorageService],
})
export class AwsModule {}
