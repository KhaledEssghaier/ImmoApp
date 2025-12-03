import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Search Service Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return service health', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('mongodb');
          expect(res.body.services).toHaveProperty('redis');
        });
    });
  });

  describe('Main Search', () => {
    it('/search (POST) should perform basic search', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/search (POST) should search with query', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          query: 'villa',
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/search (POST) should apply price filters', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          filters: {
            priceMin: 100000,
            priceMax: 500000,
          },
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          // Verify all results are within price range
          res.body.data.forEach((property: any) => {
            expect(property.price).toBeGreaterThanOrEqual(100000);
            expect(property.price).toBeLessThanOrEqual(500000);
          });
        });
    });

    it('/search (POST) should filter by property type', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          filters: {
            propertyType: 'HOUSE',
          },
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          // Verify all results match property type
          res.body.data.forEach((property: any) => {
            expect(property.type).toBe('HOUSE');
          });
        });
    });

    it('/search (POST) should sort by price ascending', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          sort: 'price_asc',
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          const prices = res.body.data.map((p: any) => p.price);
          const sortedPrices = [...prices].sort((a, b) => a - b);
          expect(prices).toEqual(sortedPrices);
        });
    });

    it('/search (POST) should sort by price descending', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          sort: 'price_desc',
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          const prices = res.body.data.map((p: any) => p.price);
          const sortedPrices = [...prices].sort((a, b) => b - a);
          expect(prices).toEqual(sortedPrices);
        });
    });

    it('/search (POST) should handle pagination', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          page: 2,
          limit: 5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(2);
          expect(res.body.pagination.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('/search (POST) should validate invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          page: -1, // Invalid page
          limit: 1000, // Too high
        })
        .expect(400);
    });
  });

  describe('Autocomplete', () => {
    it('/search/suggest (GET) should return suggestions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/suggest')
        .query({ q: 'vil', limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('/search/suggest (GET) should return empty array for empty query', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/suggest')
        .query({ q: '', limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Polygon Search', () => {
    it('/search/polygon (POST) should search within polygon', () => {
      const polygon = [
        { lng: 10.0, lat: 36.0 },
        { lng: 10.5, lat: 36.0 },
        { lng: 10.5, lat: 36.5 },
        { lng: 10.0, lat: 36.5 },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/search/polygon')
        .send({
          polygon,
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/search/polygon (POST) should validate polygon format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search/polygon')
        .send({
          polygon: [], // Invalid - need at least 3 points
          page: 1,
          limit: 10,
        })
        .expect(400);
    });
  });

  describe('Geospatial Search', () => {
    it('/search (POST) should perform geo search', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          geo: {
            lat: 36.8,
            lng: 10.2,
            radiusKm: 10,
          },
          page: 1,
          limit: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          // Properties should have distance field
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('distance');
          }
        });
    });
  });

  describe('Complex Queries', () => {
    it('/search (POST) should handle complex multi-filter search', () => {
      return request(app.getHttpServer())
        .post('/api/v1/search')
        .send({
          query: 'modern',
          filters: {
            priceMin: 100000,
            priceMax: 500000,
            propertyType: 'APARTMENT',
            status: 'FOR_SALE',
            bedroomsMin: 2,
            bedroomsMax: 4,
            bathroomsMin: 1,
            surfaceMin: 80,
            features: ['parking', 'elevator'],
            city: 'Tunis',
          },
          geo: {
            lat: 36.8,
            lng: 10.2,
            radiusKm: 5,
          },
          sort: 'price_asc',
          page: 1,
          limit: 20,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.pagination).toBeDefined();
          expect(res.body.filters).toBeDefined();
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to search endpoint', async () => {
      // Make multiple rapid requests
      const requests = Array(35).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/search')
          .send({ page: 1, limit: 10 })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000); // Increase timeout for this test
  });

  describe('Get Property by ID', () => {
    it('/search/:id (GET) should return property details', async () => {
      // First, get a property ID from search
      const searchRes = await request(app.getHttpServer())
        .post('/api/v1/search')
        .send({ page: 1, limit: 1 });

      if (searchRes.body.data.length === 0) {
        // Skip if no properties
        return;
      }

      const propertyId = searchRes.body.data[0]._id;

      return request(app.getHttpServer())
        .get(`/api/v1/search/${propertyId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', propertyId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('price');
        });
    });

    it('/search/:id (GET) should return 404 for invalid ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/invalid-id-format')
        .expect(404);
    });
  });
});
