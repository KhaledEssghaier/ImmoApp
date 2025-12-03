import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const mongoStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    if (mongoStatus === 'disconnected') {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          mongodb: 'disconnected',
        },
      };
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
