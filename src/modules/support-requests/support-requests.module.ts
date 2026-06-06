import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportRequest, SupportRequestSchema } from './schemas/support-request.schema';
import { SupportRequestsRepository } from './support-requests.repository';
import { SupportRequestsService } from './support-requests.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: SupportRequest.name, schema: SupportRequestSchema }])],
  providers: [SupportRequestsRepository, SupportRequestsService],
  exports: [SupportRequestsService],
})
export class SupportRequestsModule {}
