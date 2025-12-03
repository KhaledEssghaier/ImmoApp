import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let internalApiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Set test credentials
    internalApiKey = process.env.INTERNAL_API_KEY || 'test-api-key';
    authToken = 'test-jwt-token'; // In real test, generate valid JWT
  });

  describe('/api/v1/notifications (POST)', () => {
    it('should create notification with valid API key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/notifications')
        .set('x-api-key', internalApiKey)
        .send({
          userId: '507f1f77bcf86cd799439011',
          type: 'message',
          title: 'Test Notification',
          body: 'This is a test',
          channel: ['push', 'inapp'],
        })
        .expect(201);
    });

    it('should reject without API key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/notifications')
        .send({
          userId: '507f1f77bcf86cd799439011',
          type: 'message',
          title: 'Test Notification',
          body: 'This is a test',
        })
        .expect(401);
    });
  });

  describe('/api/v1/notifications (GET)', () => {
    it('should get notifications for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);
    });

    it('should reject without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/notifications')
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
