import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ModerationAction, ModerationActionDocument } from '../../schemas/moderation-action.schema';
import { Report, ReportDocument } from '../../schemas/report.schema';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';
import { BanUserDto } from './dto/ban-user.dto';
import { RemovePropertyDto } from './dto/remove-property.dto';
import { WarningDto } from './dto/warning.dto';
import { RestoreDto } from './dto/restore.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ModerationService {
  private readonly apiGatewayUrl: string;
  private readonly propertyServiceUrl: string;
  private readonly notificationServiceUrl: string;
  private readonly authServiceUrl: string;
  private readonly internalKey: string;
  private readonly notificationKey: string;

  constructor(
    @InjectModel(ModerationAction.name) private actionModel: Model<ModerationActionDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('apiGateway.url') || 'http://localhost:3000';
    this.propertyServiceUrl = this.configService.get<string>('propertyService.url') || 'http://localhost:3002';
    this.notificationServiceUrl = this.configService.get<string>('notificationService.url') || 'http://localhost:3006';
    this.authServiceUrl = this.configService.get<string>('authService.url') || 'http://localhost:3001';
    this.internalKey = this.configService.get<string>('apiGateway.internalKey') || 'internal-service-key-change-me';
    this.notificationKey = this.configService.get<string>('notificationInternal.key') || this.internalKey;
  }

  async banUser(dto: BanUserDto, performedBy: string): Promise<ModerationAction> {
    // Call user service via API Gateway to ban user
    let userBanned = false;
    let errorMessage = null;
    
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/users/${dto.userId}/ban`,
          {
            durationDays: dto.durationDays,
            reason: dto.reason,
          },
          {
            headers: { 'X-Internal-Key': this.internalKey },
          },
        ),
      );
      userBanned = true;
    } catch (error) {
      // Log the error but continue to record the moderation action
      errorMessage = error.response?.data?.message || error.message;
      console.warn(`User service call failed: ${errorMessage}. Recording action anyway.`);
    }

    // Record moderation action
    const expiresAt = dto.durationDays
      ? new Date(Date.now() + dto.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const action = new this.actionModel({
      actionType: 'ban_user',
      performedBy,
      targetType: 'user',
      targetId: dto.userId,
      reason: dto.reason,
      durationDays: dto.durationDays,
      expiresAt,
      relatedReportId: dto.relatedReportId,
      metadata: {
        ...dto.metadata,
        userServiceCallSuccess: userBanned,
        ...(errorMessage && { userServiceError: errorMessage }),
      },
    });

    const savedAction = await action.save();

    // Update related report if exists
    if (dto.relatedReportId) {
      await this.reportModel.findByIdAndUpdate(dto.relatedReportId, {
        status: 'resolved',
      });
    }

    return savedAction;
  }

  async unbanUser(targetId: string, reason: string, performedBy: string): Promise<ModerationAction> {
    // Call user service via API Gateway to unban user
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiGatewayUrl}/api/v1/users/${targetId}/unban`,
          { reason },
          {
            headers: { 'X-Internal-Key': this.internalKey },
          },
        ),
      );
    } catch (error) {
      throw new BadRequestException(`Failed to unban user: ${error.response?.data?.message || error.message}`);
    }

    const action = new this.actionModel({
      actionType: 'unban_user',
      performedBy,
      targetType: 'user',
      targetId,
      reason,
    });

    return action.save();
  }

  async removeProperty(dto: RemovePropertyDto, performedBy: string): Promise<ModerationAction> {
    // Directly mark property as deleted in property database
    let propertyRemoved = false;
    let errorMessage = null;
    let propertyOwnerId: string | null = null;
    let propertyTitle: string | null = null;
    let notificationSent = false;
    
    try {
      // Try to update property directly in the database
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.propertyServiceUrl}/admin/properties/${dto.propertyId}/soft-delete`,
          { 
            reason: dto.reason,
            deletedBy: 'admin',
          },
          {
            headers: { 
              'x-api-key': this.internalKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      propertyRemoved = true;
      
      // Extract property info from response
      if (response.data?.ownerId) {
        propertyOwnerId = response.data.ownerId;
        propertyTitle = response.data.title || 'Your property';
        
        // Send notification to property owner
        try {
          await firstValueFrom(
            this.httpService.post(
              `${this.notificationServiceUrl}/api/v1/notifications`,
              {
                userId: propertyOwnerId,
                type: 'admin',
                title: 'Property Removed by Admin',
                message: `Your property "${propertyTitle}" has been removed by an administrator. Reason: ${dto.reason}`,
                data: {
                  actionType: 'property_removed',
                  propertyId: dto.propertyId,
                  reason: dto.reason,
                  relatedReportId: dto.relatedReportId,
                },
                channel: ['inapp', 'push'],
              },
              {
                headers: {
                  'x-api-key': this.notificationKey,
                  'Content-Type': 'application/json',
                },
              },
            ),
          );
          notificationSent = true;
          console.log(`Notification sent to property owner ${propertyOwnerId} for removed property ${dto.propertyId}`);
        } catch (notifError) {
          console.error('Failed to send property removal notification:', notifError.response?.data || notifError.message);
        }
      }
    } catch (error) {
      // If admin endpoint doesn't exist, try alternative approach
      errorMessage = error.response?.data?.message || error.message;
      console.warn(`Property admin endpoint failed: ${errorMessage}. Trying alternative...`);
      
      // Alternative: Mark as removed through direct database update if we have mongoose access
      // For now, just record the action for manual processing
      propertyRemoved = false;
    }

    const action = new this.actionModel({
      actionType: 'remove_property',
      performedBy,
      targetType: 'property',
      targetId: dto.propertyId,
      reason: dto.reason,
      relatedReportId: dto.relatedReportId,
      metadata: {
        ...dto.metadata,
        propertyServiceCallSuccess: propertyRemoved,
        requiresManualIntervention: !propertyRemoved,
        notificationSent,
        propertyOwnerId,
        propertyTitle,
        ...(errorMessage && { propertyServiceError: errorMessage }),
      },
    });

    const savedAction = await action.save();

    // Update related report if exists
    if (dto.relatedReportId) {
      await this.reportModel.findByIdAndUpdate(dto.relatedReportId, {
        status: 'resolved',
      });
    }

    return savedAction;
  }

  async restoreProperty(targetId: string, reason: string, performedBy: string): Promise<ModerationAction> {
    // Call property service via API Gateway to restore property
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiGatewayUrl}/api/v1/properties/${targetId}/restore`,
          { reason },
          {
            headers: { 'X-Internal-Key': this.internalKey },
          },
        ),
      );
    } catch (error) {
      throw new BadRequestException(`Failed to restore property: ${error.response?.data?.message || error.message}`);
    }

    const action = new this.actionModel({
      actionType: 'restore_property',
      performedBy,
      targetType: 'property',
      targetId,
      reason,
    });

    return action.save();
  }

  async issueWarning(dto: WarningDto, performedBy: string): Promise<ModerationAction> {
    // Send warning notification to user
    let notificationSent = false;
    let notificationError = null;
    
    if (dto.targetType === 'user') {
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `${this.notificationServiceUrl}/api/v1/notifications`,
            {
              userId: dto.targetId,
              type: 'admin',
              title: 'Warning from Admin',
              message: dto.reason,
              data: {
                actionType: 'warning',
                relatedReportId: dto.relatedReportId,
              },
              channel: ['inapp', 'push'],
            },
            {
              headers: { 
                'x-api-key': this.notificationKey,
                'Content-Type': 'application/json',
              },
            },
          ),
        );
        notificationSent = true;
        console.log('Notification sent successfully:', response.data);
      } catch (error) {
        notificationError = error.response?.data?.message || error.message;
        console.error(`Notification service call failed:`, {
          error: notificationError,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    }
    
    const action = new this.actionModel({
      actionType: 'warning',
      performedBy,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      relatedReportId: dto.relatedReportId,
      metadata: {
        ...dto.metadata,
        notificationSent,
        ...(notificationError && { notificationError }),
      },
    });

    const savedAction = await action.save();

    // Update related report if exists
    if (dto.relatedReportId) {
      await this.reportModel.findByIdAndUpdate(dto.relatedReportId, {
        status: 'resolved',
      });
    }

    return savedAction;
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: ModerationAction[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.actionModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.actionModel.countDocuments(),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<ModerationAction> {
    const action = await this.actionModel.findById(id).exec();
    if (!action) {
      throw new NotFoundException(`Moderation action with ID ${id} not found`);
    }
    return action;
  }

  async getBannedUsers(page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number }> {
    try {
      // Fetch banned users from auth service
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.authServiceUrl}/users/banned`,
          {
            headers: { 'X-Internal-Key': this.internalKey },
            params: { page, limit },
          },
        ),
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch banned users:', error.response?.data || error.message);
      // Return empty list if auth service is not available
      return { data: [], total: 0 };
    }
  }
}
