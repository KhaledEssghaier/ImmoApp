import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AdminUsersService } from '../src/modules/admin-users/admin-users.service';
import { AdminRole } from '../src/schemas/admin-user.schema';

describe('Admin Service E2E Tests', () => {
  let app: INestApplication;
  let adminUsersService: AdminUsersService;
  let authToken: string;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('admin');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    
    await app.init();

    adminUsersService = moduleFixture.get<AdminUsersService>(AdminUsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should create a superadmin user', async () => {
      const admin = await adminUsersService.create({
        email: 'test-admin@example.com',
        password: 'TestPassword123!',
        name: 'Test Admin',
        role: AdminRole.SUPERADMIN,
      });

      expect(admin).toBeDefined();
      expect(admin.email).toBe('test-admin@example.com');
      adminId = (admin as any)._id.toString();
    });

    it('should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/users/login')
        .send({
          email: 'test-admin@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('test-admin@example.com');
      authToken = response.body.accessToken;
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/admin/users/login')
        .send({
          email: 'test-admin@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should get current admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test-admin@example.com');
    });
  });

  describe('Reports Management', () => {
    let reportId: string;

    it('should create a report', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reporterId: '507f1f77bcf86cd799439011',
          targetType: 'property',
          targetId: '507f1f77bcf86cd799439012',
          reason: 'Spam content',
          description: 'This property contains spam',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe('open');
      reportId = response.body._id;
    });

    it('should get all reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get a single report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(reportId);
    });

    it('should assign a report', async () => {
      const response = await request(app.getHttpServer())
        .post(`/admin/reports/${reportId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assignedTo: adminId,
        })
        .expect(200);

      expect(response.body.assignedTo).toBe(adminId);
      expect(response.body.status).toBe('in_review');
    });

    it('should update report status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'resolved',
        })
        .expect(200);

      expect(response.body.status).toBe('resolved');
    });
  });

  describe('Moderation Actions', () => {
    it('should issue a warning', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/actions/warning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetType: 'user',
          targetId: '507f1f77bcf86cd799439011',
          reason: 'Violating community guidelines',
        })
        .expect(201);

      expect(response.body.actionType).toBe('warning');
    });

    it('should get all moderation actions', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/actions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Audit Logs', () => {
    it('should get audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit?action=CREATE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.mongodb).toBe('connected');
    });
  });
});
