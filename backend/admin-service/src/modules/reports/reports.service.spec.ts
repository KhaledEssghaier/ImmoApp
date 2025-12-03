import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ReportsService } from './reports.service';
import { Report } from '../../schemas/report.schema';
import { AuditLog } from '../../schemas/audit-log.schema';
import { of } from 'rxjs';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockReportModel: any;
  let mockHttpService: any;

  beforeEach(async () => {
    mockReportModel = {
      new: jest.fn().mockResolvedValue({}),
      constructor: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      exec: jest.fn(),
      save: jest.fn(),
    };

    mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getModelToken(Report.name),
          useValue: mockReportModel,
        },
        {
          provide: getModelToken(AuditLog.name),
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'apiGateway.url') return 'http://localhost:3000';
              if (key === 'apiGateway.internalKey') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report with target snapshot', async () => {
      const createDto = {
        reporterId: '507f1f77bcf86cd799439011',
        targetType: 'property',
        targetId: '507f1f77bcf86cd799439012',
        reason: 'Spam content',
        description: 'This property is spam',
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: { id: '507f1f77bcf86cd799439012', title: 'Test Property' },
        }),
      );

      const saveMock = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        ...createDto,
        status: 'open',
      });

      mockReportModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await service.create(createDto as any);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      const mockReports = [
        { _id: '1', reason: 'Spam', status: 'open' },
        { _id: '2', reason: 'Inappropriate', status: 'in_review' },
      ];

      mockReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockReports),
            }),
          }),
        }),
      });

      mockReportModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });
});
