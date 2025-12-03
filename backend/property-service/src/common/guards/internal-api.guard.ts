import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    const validApiKey = this.configService.get<string>('INTERNAL_API_KEY') || 'internal-service-key-change-me';

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing internal API key');
    }

    return true;
  }
}
