import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log('Email service initialized');
    } else {
      this.logger.warn('SMTP not configured, email notifications disabled');
    }
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    body: string,
    payload?: any,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured');
      return;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM', 'noreply@immobilier.com');

      const html = this.buildEmailTemplate(subject, body, payload);

      await this.transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  private buildEmailTemplate(
    subject: string,
    body: string,
    payload?: any,
  ): string {
    const actionUrl = payload?.route
      ? `${this.configService.get<string>('API_GATEWAY_URL')}${payload.route}`
      : null;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #3ABAEC 0%, #2196F3 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #3ABAEC;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p>${body}</p>
      ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Immobilier App. All rights reserved.</p>
      <p>You received this email because you have notifications enabled.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
