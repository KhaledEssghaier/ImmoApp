import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../schemas/admin-user.schema';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated audit logs' })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get('export')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file stream' })
  async exportCsv(@Query() query: QueryAuditDto, @Res() res: Response) {
    const stream = await this.auditService.exportToCsv(query);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    
    stream.pipe(res);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Returns audit log details' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
