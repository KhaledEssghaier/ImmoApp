import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly httpAgent: HttpAgent;
  private readonly httpsAgent: HttpsAgent;

  constructor(private configService: ConfigService) {
    // Optimized HTTP agents with larger connection pool
    this.httpAgent = new HttpAgent({
      keepAlive: true,
      maxSockets: 200,
      maxFreeSockets: 20,
      keepAliveMsecs: 30000,
      timeout: 30000,
    });

    this.httpsAgent = new HttpsAgent({
      keepAlive: true,
      maxSockets: 200,
      maxFreeSockets: 20,
      keepAliveMsecs: 30000,
      timeout: 30000,
    });
  }

  private getServiceUrl(serviceName: string): string {
    const host = this.configService.get(`microservices.${serviceName}.host`);
    const port = this.configService.get(`microservices.${serviceName}.port`);
    return `http://${host}:${port}`;
  }

  private async forwardRequest(
    serviceUrl: string,
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: `${serviceUrl}${path}`,
        headers: {},
        timeout: 30000, // Increased to 30 seconds for MongoDB connection delays
        httpAgent: this.httpAgent,
        httpsAgent: this.httpsAgent,
        validateStatus: (status) => status < 500, // Don't retry on client errors
      };

      if (authHeader) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers['Authorization'] = authHeader;
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      this.logger.log(`Forwarding ${method} request to: ${config.url}`);

      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error forwarding request to ${serviceUrl}${path}:`,
        error.message,
      );

      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          error.response.data || 'Service error',
          error.response.status,
        );
      }

      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async forwardToAuth(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('auth');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToProperty(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('property');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToUser(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('user');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToFavorite(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('favorite');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToChat(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('chat');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToNotification(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('notification');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async forwardToBilling(
    path: string,
    method: Method,
    data?: any,
    authHeader?: string,
  ): Promise<any> {
    const serviceUrl = this.getServiceUrl('billing');
    return this.forwardRequest(serviceUrl, path, method, data, authHeader);
  }

  async checkServicesHealth(): Promise<any> {
    const services = ['auth', 'property', 'user', 'favorite', 'chat', 'notification'];
    
    // Parallel health checks for faster response
    const healthChecks = services.map(async (service) => {
      try {
        const serviceUrl = this.getServiceUrl(service);
        await axios.get(`${serviceUrl}/health`, { 
          timeout: 5000,
          httpAgent: this.httpAgent,
          httpsAgent: this.httpsAgent,
        });
        return { service, status: 'healthy' };
      } catch (error) {
        return { service, status: 'unhealthy' };
      }
    });

    const results = await Promise.all(healthChecks);
    const healthStatus: any = {};
    results.forEach(({ service, status }) => {
      healthStatus[service] = status;
    });

    return healthStatus;
  }
}
