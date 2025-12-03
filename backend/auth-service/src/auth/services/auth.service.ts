import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { SignupDto } from '../dtos/signup.dto';
import { LoginDto } from '../dtos/login.dto';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from '../../sessions/services/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionsService: SessionsService,
  ) {}

  /**
   * User registration with immediate token issuance
   */
  async signup(signupDto: SignupDto, userAgent?: string, ip?: string) {
    const { email, password, fullName, phone } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email, isDeleted: false });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with configured salt rounds
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.userModel.create({
      email,
      passwordHash,
      fullName,
      phone,
      role: 'user',
      isVerified: false,
      isDeleted: false,
    });

    // Generate tokens for immediate use
    const { accessToken, refreshToken } = await this.generateTokens(user._id as Types.ObjectId, userAgent, ip);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * User login
   */
  async login(loginDto: LoginDto, userAgent?: string, ip?: string) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email, isDeleted: false });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user._id as Types.ObjectId, userAgent, ip);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token with token rotation
   * Old refresh token is invalidated and new one is issued
   */
  async refreshToken(refreshToken: string, userAgent?: string, ip?: string) {
    try {
      // Find session by validating refresh token hash
      const session = await this.sessionsService.findSessionByToken(refreshToken);
      
      if (!session) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user
      const user = await this.userModel.findById(session.userId);
      if (!user || user.isDeleted) {
        throw new UnauthorizedException('User not found');
      }

      // Rotate tokens: Delete old session and create new one
      await this.sessionsService.deleteSession(session._id as Types.ObjectId);
      
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = 
        await this.generateTokens(user._id as Types.ObjectId, userAgent, ip);

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token with user ID (proper implementation)
   * Implements refresh token rotation: old token deleted, new token issued
   */
  async refreshTokenWithUserId(userId: string, refreshToken: string, userAgent?: string, ip?: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Find and validate the session with this refresh token
    const session = await this.sessionsService.findAndValidateSession(userObjectId, refreshToken);
    
    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.userModel.findById(userObjectId);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // REFRESH TOKEN ROTATION:
    // 1. Delete the old session (invalidate old refresh token)
    await this.sessionsService.deleteSession(session._id as Types.ObjectId);

    // 2. Generate new tokens (creates new session)
    const tokens = await this.generateTokens(userObjectId, userAgent, ip);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Logout - delete session and blacklist access token
   */
  async logout(userId: string, refreshToken?: string, accessToken?: string) {
    const userObjectId = new Types.ObjectId(userId);

    if (refreshToken) {
      // Logout from specific device
      const session = await this.sessionsService.findAndValidateSession(userObjectId, refreshToken);
      if (session) {
        await this.sessionsService.deleteSession(session._id as Types.ObjectId);
      }
    } else {
      // Logout from all devices
      await this.sessionsService.deleteAllUserSessions(userObjectId);
    }

    // Blacklist the access token if provided
    if (accessToken) {
      try {
        // Decode token to get expiration
        const decoded = this.jwtService.decode(accessToken) as any;
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await this.sessionsService.blacklistToken(accessToken, expiresAt);
        }
      } catch (error) {
        // Token might be invalid, but we still want to proceed with logout
        console.warn('Failed to blacklist token:', error.message);
      }
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Generate JWT access token and cryptographic refresh token
   * Creates a new session in DB with hashed refresh token
   */
  private async generateTokens(userId: Types.ObjectId, userAgent?: string, ip?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate short-lived JWT access token
    const payload = { 
      sub: userId.toString(), 
      email: user.email, 
      role: user.role 
    };

    const secret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: expiresIn as any,
    });

    // Generate cryptographically secure refresh token (NOT a JWT)
    const refreshToken = this.sessionsService.generateRefreshToken();

    // Store hashed refresh token in database
    await this.sessionsService.createSession(userId, refreshToken, userAgent, ip);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
