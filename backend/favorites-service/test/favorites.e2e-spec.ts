import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('FavoritesController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // For testing, you would need to generate a real JWT token
    // This is a placeholder - in real tests, call your auth service
    authToken = 'Bearer your-test-jwt-token';
    userId = '64b8f5e2c1234567890abcde';
  });

  afterAll(async () => {
    // Clean up test data
    await connection.collection('favorites').deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Clean favorites collection before each test
    await connection.collection('favorites').deleteMany({});
  });

  describe('POST /api/v1/favorites', () => {
    it('should add a favorite successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({
          propertyId: '64b8f5e2c1234567890abcdf',
          source: 'mobile',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('_id');
          expect(res.body.data.propertyId).toBeDefined();
        });
    });

    it('should be idempotent - adding same favorite twice returns 200', async () => {
      const propertyId = '64b8f5e2c1234567890abcdf';

      // Add first time
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId })
        .expect(201);

      // Add second time (idempotent)
      return request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId })
        .expect(200);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/favorites')
        .send({ propertyId: '64b8f5e2c1234567890abcdf' })
        .expect(401);
    });

    it('should validate propertyId field', () => {
      return request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ source: 'mobile' }) // Missing propertyId
        .expect(400);
    });
  });

  describe('DELETE /api/v1/favorites/:propertyId', () => {
    it('should remove a favorite successfully', async () => {
      const propertyId = '64b8f5e2c1234567890abcdf';

      // Add favorite first
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId });

      // Remove it
      return request(app.getHttpServer())
        .delete(`/api/v1/favorites/${propertyId}`)
        .set('Authorization', authToken)
        .expect(204);
    });

    it('should be idempotent - removing non-existent favorite returns 204', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/favorites/64b8f5e2c1234567890abcdf')
        .set('Authorization', authToken)
        .expect(204);
    });
  });

  describe('GET /api/v1/favorites/ids', () => {
    it('should return array of property IDs', async () => {
      // Add multiple favorites
      const propertyIds = [
        '64b8f5e2c1234567890abcd1',
        '64b8f5e2c1234567890abcd2',
        '64b8f5e2c1234567890abcd3',
      ];

      for (const propertyId of propertyIds) {
        await request(app.getHttpServer())
          .post('/api/v1/favorites')
          .set('Authorization', authToken)
          .send({ propertyId });
      }

      return request(app.getHttpServer())
        .get('/api/v1/favorites/ids')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(3);
          expect(res.body.count).toBe(3);
        });
    });
  });

  describe('GET /api/v1/favorites', () => {
    it('should return paginated favorites', async () => {
      // Add test favorites
      const propertyIds = ['64b8f5e2c1234567890abcd1', '64b8f5e2c1234567890abcd2'];

      for (const propertyId of propertyIds) {
        await request(app.getHttpServer())
          .post('/api/v1/favorites')
          .set('Authorization', authToken)
          .send({ propertyId });
      }

      return request(app.getHttpServer())
        .get('/api/v1/favorites?page=1&limit=10')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.pagination).toHaveProperty('page');
          expect(res.body.pagination).toHaveProperty('total');
        });
    });
  });

  describe('POST /api/v1/favorites/sync', () => {
    it('should sync favorites correctly', async () => {
      // Add initial favorites on server
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId: '64b8f5e2c1234567890abcd1' });

      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId: '64b8f5e2c1234567890abcd2' });

      // Client has different set
      const clientIds = [
        '64b8f5e2c1234567890abcd2', // Keep
        '64b8f5e2c1234567890abcd3', // Add
        '64b8f5e2c1234567890abcd4', // Add
      ];

      return request(app.getHttpServer())
        .post('/api/v1/favorites/sync')
        .set('Authorization', authToken)
        .send({ propertyIds: clientIds, source: 'mobile' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.added).toContain('64b8f5e2c1234567890abcd3');
          expect(res.body.data.added).toContain('64b8f5e2c1234567890abcd4');
          expect(res.body.data.removed).toContain('64b8f5e2c1234567890abcd1');
          expect(res.body.data.current.length).toBe(3);
        });
    });
  });

  describe('GET /api/v1/properties/:propertyId/favorites/count', () => {
    it('should return correct favorites count', async () => {
      const propertyId = '64b8f5e2c1234567890abcdf';

      // Add favorite
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', authToken)
        .send({ propertyId });

      return request(app.getHttpServer())
        .get(`/api/v1/properties/${propertyId}/favorites/count`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.propertyId).toBe(propertyId);
          expect(res.body.data.favoritesCount).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('Concurrency Tests', () => {
    it('should handle concurrent add requests without duplicates', async () => {
      const propertyId = '64b8f5e2c1234567890abcdf';

      // Send 10 concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/v1/favorites')
            .set('Authorization', authToken)
            .send({ propertyId }),
        );

      await Promise.all(requests);

      // Check that only 1 favorite was created
      const favorites = await connection
        .collection('favorites')
        .find({ propertyId })
        .toArray();

      expect(favorites.length).toBe(1);
    });
  });
});
