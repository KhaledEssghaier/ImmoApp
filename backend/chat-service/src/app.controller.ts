import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getRoot() {
    return {
      service: 'Chat Service',
      version: '1.0.0',
      status: 'running',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
