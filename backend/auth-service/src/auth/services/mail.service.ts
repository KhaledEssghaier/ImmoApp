import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development: Use Gmail SMTP
    // For production: Use SendGrid, AWS SES, or other email services
    
    const emailUser = process.env.EMAIL_USER || 'khaledessghaier01@gmail.com';
    const emailPassword = process.env.EMAIL_PASSWORD || 'qocvbukeopplasjd';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log(`Mail service initialized with: ${emailUser}`);
  }

  async sendPasswordResetCode(
    toEmail: string,
    userName: string,
    code: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Immo App" <${process.env.EMAIL_USER || 'noreply@immo.com'}>`,
      to: toEmail,
      subject: 'Your Password Reset Code - Immo App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3ABAEC 0%, #2A8DB8 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .code-box {
              background: #f8f9fa;
              border: 2px dashed #3ABAEC;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 25px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #3ABAEC;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Code</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>You requested to reset your password. Use the verification code below to continue:</p>
              
              <div class="code-box">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">Your Verification Code</div>
                <div class="code">${code}</div>
                <div style="color: #6c757d; font-size: 12px; margin-top: 10px;">Enter this code in the app</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>Best regards,<br><strong>The Immo App Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Immo App. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${userName},

You requested to reset your password. Use the verification code below:

${code}

This code will expire in 10 minutes.
Never share this code with anyone.

If you didn't request this password reset, please ignore this email.

Best regards,
The Immo App Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset code sent to ${toEmail}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    resetUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Immo App" <${process.env.EMAIL_USER || 'noreply@immo.com'}>`,
      to: toEmail,
      subject: 'Reset Your Password - Immo App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3ABAEC 0%, #2A8DB8 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #3ABAEC 0%, #2A8DB8 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>You recently requested to reset your password for your Immo App account. Click the button below to reset it:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3ABAEC;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you access the link above</li>
                </ul>
              </div>
              
              <p>If you're having trouble clicking the button, copy and paste the URL into your web browser.</p>
              
              <p>Best regards,<br><strong>The Immo App Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Immo App. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${userName},

You recently requested to reset your password for your Immo App account.

Reset your password by clicking this link: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password won't change until you access the link above.

Best regards,
The Immo App Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${toEmail}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}:`, error);
      throw error;
    }
  }
}
