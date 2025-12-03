import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip, headers } = request;

    const before = Date.now();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            if (user && this.shouldAudit(method, url)) {
              const auditLog = new this.auditLogModel({
                actorId: user.userId || user.sub,
                action: `${method} ${url}`,
                resource: this.extractResource(url, body),
                before: body,
                after: data,
                ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
                userAgent: headers['user-agent'],
                metadata: {
                  duration: Date.now() - before,
                  statusCode: 200,
                },
              });

              await auditLog.save();
            }
          } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
          }
        },
        error: async (error) => {
          try {
            if (user && this.shouldAudit(method, url)) {
              const auditLog = new this.auditLogModel({
                actorId: user.userId || user.sub,
                action: `${method} ${url}`,
                resource: this.extractResource(url, body),
                before: body,
                after: { error: error.message },
                ip: ip || headers['x-forwarded-for'],
                userAgent: headers['user-agent'],
                metadata: {
                  duration: Date.now() - before,
                  statusCode: error.status || 500,
                  errorMessage: error.message,
                },
              });

              await auditLog.save();
            }
          } catch (auditError) {
            this.logger.error(`Failed to create audit log: ${auditError.message}`);
          }
        },
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Only audit write operations and sensitive reads
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const sensitiveRoutes = ['/admin/users', '/admin/reports', '/admin/actions'];
    
    return (
      writeMethods.includes(method) ||
      sensitiveRoutes.some((route) => url.includes(route))
    );
  }

  private extractResource(url: string, body: any): { type: string; id: string } {
    // Extract resource type and ID from URL
    const urlParts = url.split('/').filter(Boolean);
    
    if (urlParts.includes('properties')) {
      return { type: 'property', id: body?.propertyId || urlParts[urlParts.indexOf('properties') + 1] || 'unknown' };
    }
    if (urlParts.includes('users')) {
      return { type: 'user', id: body?.userId || urlParts[urlParts.indexOf('users') + 1] || 'unknown' };
    }
    if (urlParts.includes('reports')) {
      return { type: 'report', id: urlParts[urlParts.indexOf('reports') + 1] || 'unknown' };
    }
    
    return { type: 'unknown', id: 'unknown' };
  }
}
