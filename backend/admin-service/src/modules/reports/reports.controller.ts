import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { AssignReportDto } from './dto/assign-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AdminRole } from '../../schemas/admin-user.schema';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all reports with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated reports' })
  findAll(@Query() query: QueryReportsDto) {
    return this.reportsService.findAll(query);
  }

  @Get('export')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Export reports to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file stream' })
  async exportCsv(@Query() query: QueryReportsDto, @Res() res: Response) {
    const stream = await this.reportsService.exportToCsv(query);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');
    
    stream.pipe(res);
  }

  @Get(':id')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Returns report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post(':id/assign')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Assign report to an admin' })
  @ApiResponse({ status: 200, description: 'Report assigned successfully' })
  assign(
    @Param('id') id: string,
    @Body() assignDto: AssignReportDto,
    @CurrentAdmin() admin: any,
  ) {
    return this.reportsService.assign(id, assignDto, admin.sub);
  }

  @Post(':id/status')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update report status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateReportStatusDto) {
    return this.reportsService.updateStatus(id, updateDto);
  }
}
