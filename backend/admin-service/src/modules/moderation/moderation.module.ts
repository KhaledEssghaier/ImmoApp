import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationAction, ModerationActionSchema } from '../../schemas/moderation-action.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { Report, ReportSchema } from '../../schemas/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModerationAction.name, schema: ModerationActionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    HttpModule,
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
