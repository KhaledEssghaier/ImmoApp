import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Session, SessionDocument } from '../schemas/session.schema';
import { BlacklistedToken, BlacklistedTokenDocument } from '../schemas/blacklisted-token.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(BlacklistedToken.name) private blacklistedTokenModel: Model<BlacklistedTokenDocument>,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a cryptographically secure refresh token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Create a new session with refresh token
   */
  async createSession(
    userId: Types.ObjectId,
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<SessionDocument> {
    // Hash the refresh token before storing
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') || 12;
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

    // Calculate expiration date
    const expDays = this.configService.get<number>('refresh.expDays') || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expDays);

    // Create session
    const session = await this.sessionModel.create({
      userId,
      refreshTokenHash,
      userAgent,
      ip,
      createdAt: new Date(),
      expiresAt,
    });

    return session;
  }

  /**
   * Find session by user ID and validate refresh token
   * This is used during refresh token rotation
   */
  async findAndValidateSession(userId: Types.ObjectId, refreshToken: string): Promise<SessionDocument | null> {
    // Find all active sessions for this user
    const sessions = await this.sessionModel.find({
      userId,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    // Check each session's hash against the provided token
    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isValid) {
        return session;
      }
    }

    return null;
  }

  /**
   * Find session by refresh token (without knowing userId)
   * Used when user doesn't have valid access token
   */
  async findSessionByToken(refreshToken: string): Promise<SessionDocument | null> {
    // Find all active sessions (not expired)
    const sessions = await this.sessionModel.find({
      expiresAt: { $gt: new Date() },
    });

    // Check each session's hash against the provided token
    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isValid) {
        return session;
      }
    }

    return null;
  }

  /**
   * Delete a specific session (for logout)
   */
  async deleteSession(sessionId: Types.ObjectId): Promise<void> {
    await this.sessionModel.deleteOne({ _id: sessionId });
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   */
  async deleteAllUserSessions(userId: Types.ObjectId): Promise<void> {
    await this.sessionModel.deleteMany({ userId });
  }

  /**
   * Delete expired sessions (cleanup job)
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: Types.ObjectId): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      userId,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  /**
   * Blacklist an access token (for logout)
   * If token is already blacklisted, this is a no-op (idempotent)
   */
  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    try {
      await this.blacklistedTokenModel.create({
        token,
        expiresAt,
        blacklistedAt: new Date(),
      });
    } catch (error) {
      // Ignore duplicate key error (E11000) - token already blacklisted
      if (error.code !== 11000) {
        throw error;
      }
      // Token already blacklisted, this is fine (idempotent operation)
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.blacklistedTokenModel.findOne({ token });
    return !!blacklisted;
  }
}
