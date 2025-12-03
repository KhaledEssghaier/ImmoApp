import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUser, AdminUserSchema } from '../../schemas/admin-user.schema';
import { AdminSession, AdminSessionSchema } from '../../schemas/admin-session.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AdminSession.name, schema: AdminSessionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
