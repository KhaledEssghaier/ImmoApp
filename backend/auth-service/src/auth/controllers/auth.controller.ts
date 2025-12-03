import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Headers, Ip, Get, Query } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { PasswordResetService } from '../services/password-reset.service';
import { SignupDto } from '../dtos/signup.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RequestPasswordResetDto, ResetPasswordDto, VerifyResetCodeDto } from '../dto/password-reset.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async signup(
    @Body() signupDto: SignupDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.signup(signupDto, userAgent, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.login(loginDto, userAgent, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    // We need to decode the refresh token to get userId
    // For now, let's decode the JWT if it's JWT-based refresh token
    // Or better: make refresh token a JWT with userId
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      userAgent,
      ip,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req, @Body() body: RefreshTokenDto, @Headers('authorization') auth?: string) {
    // Extract access token from Authorization header
    const accessToken = auth?.replace('Bearer ', '');
    return this.authService.logout(req.user.userId, body.refreshToken, accessToken);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code via email' })
  @ApiResponse({ status: 200, description: 'Password reset code sent if account exists' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordResetService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit reset code' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(dto.email, dto.code);
  }

  @Public()
  @Post('password-reset/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verified code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
