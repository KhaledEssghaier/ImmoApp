import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from '../../sessions/services/sessions.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret',
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: any, payload: any) {
    // Extract token from Authorization header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (token) {
      // Check if token is blacklisted
      const isBlacklisted = await this.sessionsService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return { userId: payload.sub };
  }
}
