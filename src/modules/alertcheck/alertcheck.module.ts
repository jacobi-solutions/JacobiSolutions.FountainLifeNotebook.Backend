import { Module } from '@nestjs/common';
import { AlertcheckController } from './alertcheck.controller';
import { AlertcheckService } from './alertcheck.service';

@Module({
  controllers: [AlertcheckController],
  providers: [AlertcheckService],
})
export class AlertcheckModule {}
