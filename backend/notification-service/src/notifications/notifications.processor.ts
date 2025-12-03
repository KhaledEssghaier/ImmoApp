import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DevicesService } from '../devices/devices.service';
import { FcmService } from '../fcm/fcm.service';
import { EmailService } from '../email/email.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private devicesService: DevicesService,
    private fcmService: FcmService,
    private emailService: EmailService,
  ) {}

  @Process('send-push')
  async handlePushNotification(job: Job) {
    const { userId, title, body, payload } = job.data;

    try {
      this.logger.log(`Processing push notification for user ${userId}`);

      // Get user's devices
      const devices = await this.devicesService.findByUserId(userId);

      if (devices.length === 0) {
        this.logger.warn(`No devices found for user ${userId}`);
        return { sent: 0, message: 'No devices registered' };
      }

      // Send to all devices
      const results = await Promise.allSettled(
        devices.map((device) =>
          this.fcmService.sendToDevice(device.deviceToken, {
            title,
            body,
            data: payload || {},
          }),
        ),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Push sent to ${successful}/${devices.length} devices for user ${userId}`,
      );

      // Handle failed tokens - mark for cleanup
      const failedTokens = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedTokens.push(devices[index].deviceToken);
        }
      });

      if (failedTokens.length > 0) {
        await this.devicesService.removeInvalidTokens(failedTokens);
      }

      return { sent: successful, failed, total: devices.length };
    } catch (error) {
      this.logger.error(
        `Failed to process push notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-email')
  async handleEmailNotification(job: Job) {
    const { userId, title, body, payload } = job.data;

    try {
      this.logger.log(`Processing email notification for user ${userId}`);

      // TODO: Fetch user email from user service or database
      // For now, we'll skip if no email in payload
      if (!payload?.email) {
        this.logger.warn(`No email address for user ${userId}`);
        return { sent: false, message: 'No email address' };
      }

      await this.emailService.sendNotificationEmail(
        payload.email,
        title,
        body,
        payload,
      );

      this.logger.log(`Email sent successfully to ${payload.email}`);
      return { sent: true };
    } catch (error) {
      this.logger.error(
        `Failed to process email notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('fan-out')
  async handleFanOut(job: Job) {
    const { userIds, title, body, payload, type } = job.data;

    try {
      this.logger.log(`Processing fan-out to ${userIds.length} users`);

      // Process in batches
      const batchSize = 100;
      let processed = 0;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map((userId) =>
            this.fcmService.sendToUser(userId, {
              title,
              body,
              data: payload || {},
            }),
          ),
        );

        processed += batch.length;
        this.logger.log(`Fan-out progress: ${processed}/${userIds.length}`);
      }

      return { processed, total: userIds.length };
    } catch (error) {
      this.logger.error(`Failed to process fan-out: ${error.message}`, error.stack);
      throw error;
    }
  }
}
