import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Report, ReportDocument } from '../../schemas/report.schema';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { AssignReportDto } from './dto/assign-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReportsService {
  private readonly apiGatewayUrl: string;
  private readonly internalKey: string;

  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('apiGateway.url');
    this.internalKey = this.configService.get<string>('apiGateway.internalKey');
  }

  async create(createReportDto: CreateReportDto): Promise<Report> {
    // Fetch target snapshot from appropriate service
    const targetSnapshot = await this.fetchTargetSnapshot(
      createReportDto.targetType,
      createReportDto.targetId,
    );

    const report = new this.reportModel({
      ...createReportDto,
      targetSnapshot,
      status: 'open',
    });

    return report.save();
  }

  async findAll(query: QueryReportsDto): Promise<{ data: Report[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, targetType, assignedTo, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async assign(id: string, assignDto: AssignReportDto, adminId: string): Promise<Report> {
    const report = await this.reportModel.findByIdAndUpdate(
      id,
      {
        assignedTo: assignDto.assignedTo,
        status: 'in_review',
      },
      { new: true },
    );

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async updateStatus(id: string, updateDto: UpdateReportStatusDto): Promise<Report> {
    const report = await this.reportModel.findByIdAndUpdate(
      id,
      { status: updateDto.status },
      { new: true },
    );

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async exportToCsv(query: QueryReportsDto): Promise<NodeJS.ReadableStream> {
    const { status, targetType, assignedTo } = query;

    const filter: any = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    if (assignedTo) filter.assignedTo = assignedTo;

    const reports = await this.reportModel.find(filter).sort({ createdAt: -1 }).exec();

    const { stringify } = require('csv-stringify');

    const csvStream = stringify({
      header: true,
      columns: {
        id: 'ID',
        reporterId: 'Reporter ID',
        targetType: 'Target Type',
        targetId: 'Target ID',
        reason: 'Reason',
        description: 'Description',
        status: 'Status',
        assignedTo: 'Assigned To',
        createdAt: 'Created At',
      },
    });

    // Write all report data to the CSV stream
    reports.forEach((doc) => {
      csvStream.write({
        id: doc._id.toString(),
        reporterId: doc.reporterId,
        targetType: doc.targetType,
        targetId: doc.targetId,
        reason: doc.reason,
        description: doc.description || '',
        status: doc.status,
        assignedTo: doc.assignedTo || 'N/A',
        createdAt: doc.createdAt.toISOString(),
      });
    });

    // End the stream
    csvStream.end();

    return csvStream;
  }

  private async fetchTargetSnapshot(targetType: string, targetId: string): Promise<any> {
    try {
      let url: string;
      if (targetType === 'property') {
        url = `${this.apiGatewayUrl}/api/v1/properties/${targetId}`;
      } else if (targetType === 'user') {
        url = `${this.apiGatewayUrl}/api/v1/users/${targetId}`;
      } else {
        return null;
      }

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'X-Internal-Key': this.internalKey },
        }),
      );

      return (response as any)?.data || null;
    } catch (error) {
      console.error(`Failed to fetch ${targetType} snapshot:`, error.message);
      return null;
    }
  }
}
