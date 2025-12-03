import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { MailService } from './services/mail.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Session, SessionSchema } from '../sessions/schemas/session.schema';
import { BlacklistedToken, BlacklistedTokenSchema } from '../sessions/schemas/blacklisted-token.schema';
import { SessionsService } from '../sessions/services/sessions.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionsService, JwtStrategy, PasswordResetService, MailService],
  exports: [AuthService, PasswordResetService],
})
export class AuthModule {}
