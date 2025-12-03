import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminUserDocument } from '../../schemas/admin-user.schema';
import { AdminSession, AdminSessionDocument } from '../../schemas/admin-session.schema';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
    @InjectModel(AdminSession.name) private adminSessionModel: Model<AdminSessionDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createDto: CreateAdminUserDto): Promise<AdminUser> {
    // Check if email already exists
    const existing = await this.adminUserModel.findOne({ email: createDto.email }).exec();
    if (existing) {
      throw new ConflictException('Admin user with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const adminUser = new this.adminUserModel({
      email: createDto.email,
      passwordHash,
      name: createDto.name,
      role: createDto.role || 'moderator',
      permissions: createDto.permissions || [],
      isActive: true,
    });

    return adminUser.save();
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: AdminUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.adminUserModel
        .find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adminUserModel.countDocuments(),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<AdminUser> {
    const user = await this.adminUserModel.findById(id).select('-passwordHash').exec();
    if (!user) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateDto: UpdateAdminUserDto): Promise<AdminUser> {
    const user = await this.adminUserModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }

    if (updateDto.name) user.name = updateDto.name;
    if (updateDto.role) user.role = updateDto.role;
    if (updateDto.permissions) user.permissions = updateDto.permissions;
    if (updateDto.isActive !== undefined) user.isActive = updateDto.isActive;
    if (updateDto.password) {
      user.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    await user.save();

    // Return without password hash
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.adminUserModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }

    // Revoke all sessions for this user
    await this.adminSessionModel.updateMany(
      { userId: id },
      { revoked: true },
    );
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string): Promise<{ accessToken: string; user: any }> {
    // Find user
    const user = await this.adminUserModel.findOne({ email: loginDto.email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    // Create JWT
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    const accessToken = this.jwtService.sign(payload);

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = new this.adminSessionModel({
      userId: user._id,
      token: accessToken,
      ip,
      userAgent,
      expiresAt,
      revoked: false,
    });
    await session.save();

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }

  async logout(token: string): Promise<void> {
    await this.adminSessionModel.findOneAndUpdate(
      { token },
      { revoked: true },
    );
  }

  async validateSession(token: string): Promise<AdminUser | null> {
    const session = await this.adminSessionModel.findOne({ token, revoked: false }).exec();
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await this.adminUserModel.findById(session.userId).exec();
    return user?.isActive ? user : null;
  }
}
