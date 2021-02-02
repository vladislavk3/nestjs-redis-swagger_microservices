import { Module } from '@nestjs/common';
import { StatusCodesService } from './status-codes.service';

@Module({
  providers: [StatusCodesService],
  exports: [StatusCodesService],
})
export class StatusCodesModule {}
