import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';
import { QueryAuditDto } from './dto/query-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(auditLogData: Partial<AuditLog>): Promise<AuditLog> {
    const log = new this.auditLogModel(auditLogData);
    return log.save();
  }

  async findAll(query: QueryAuditDto): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      actorId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = action;
    if (resourceType) filter['resource.type'] = resourceType;
    if (resourceId) filter['resource.id'] = resourceId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AuditLog> {
    return this.auditLogModel.findById(id).exec();
  }

  async exportToCsv(query: QueryAuditDto): Promise<NodeJS.ReadableStream> {
    const { actorId, action, resourceType, resourceId, startDate, endDate } = query;

    const filter: any = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = action;
    if (resourceType) filter['resource.type'] = resourceType;
    if (resourceId) filter['resource.id'] = resourceId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const cursor = this.auditLogModel.find(filter).sort({ createdAt: -1 }).cursor();

    const { Readable } = require('stream');
    const { stringify } = require('csv-stringify');

    const csvStream = stringify({
      header: true,
      columns: ['id', 'actorId', 'action', 'resourceType', 'resourceId', 'ip', 'createdAt'],
    });

    const readable = new Readable({
      async read() {
        const doc = await cursor.next();
        if (doc) {
          this.push({
            id: doc._id.toString(),
            actorId: doc.actorId,
            action: doc.action,
            resourceType: doc.resource?.type || 'N/A',
            resourceId: doc.resource?.id || 'N/A',
            ip: doc.ip || 'N/A',
            createdAt: doc.createdAt.toISOString(),
          });
        } else {
          this.push(null);
        }
      },
    });

    return readable.pipe(csvStream);
  }
}
