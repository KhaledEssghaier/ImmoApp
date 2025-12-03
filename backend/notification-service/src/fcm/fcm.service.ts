import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>('FCM_PROJECT_ID');
      const privateKey = this.configService
        .get<string>('FCM_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');
      const clientEmail = this.configService.get<string>('FCM_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('FCM credentials not configured, push notifications disabled');
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.logger.log('Firebase Cloud Messaging initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize FCM: ${error.message}`);
    }
  }

  async sendToDevice(
    token: string,
    notification: { title: string; body: string; data?: any },
  ): Promise<string> {
    if (!this.app) {
      throw new Error('FCM not initialized');
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: this.sanitizeData(notification.data || {}),
        token,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon.png',
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send push: ${error.message}`);
      
      // Check if token is invalid
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        throw new Error('INVALID_TOKEN');
      }
      
      throw error;
    }
  }

  async sendToUser(
    userId: string,
    notification: { title: string; body: string; data?: any },
  ): Promise<any> {
    // This would require getting user tokens from DevicesService
    // For now, this is a placeholder
    this.logger.log(`Send to user ${userId}: ${notification.title}`);
    return { userId, sent: true };
  }

  async sendToMultipleDevices(
    tokens: string[],
    notification: { title: string; body: string; data?: any },
  ): Promise<admin.messaging.BatchResponse> {
    if (!this.app) {
      throw new Error('FCM not initialized');
    }

    if (tokens.length === 0) {
      return {
        responses: [],
        successCount: 0,
        failureCount: 0,
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: this.sanitizeData(notification.data || {}),
        tokens,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(
        `Multicast sent: ${response.successCount}/${tokens.length} successful`,
      );
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to send multicast: ${error.message}`);
      throw error;
    }
  }

  private sanitizeData(data: any): { [key: string]: string } {
    // FCM requires all data values to be strings
    const sanitized: { [key: string]: string } = {};
    
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        sanitized[key] =
          typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      }
    }
    
    return sanitized;
  }
}
