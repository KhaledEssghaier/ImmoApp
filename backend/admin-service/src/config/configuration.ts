export default () => ({
  port: parseInt(process.env.PORT || '3010', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/immobilier_admin',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  apiGateway: {
    url: process.env.API_GATEWAY_URL || 'http://localhost:3000/api/v1',
    internalKey: process.env.API_GATEWAY_INTERNAL_KEY || 'internal-key',
  },
  
  notificationService: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  },
  
  propertyService: {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3002',
  },
  
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  
  notificationInternal: {
    key: process.env.NOTIFICATION_INTERNAL_KEY || process.env.API_GATEWAY_INTERNAL_KEY || 'internal-key',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  },
  
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-change-me',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    dest: process.env.UPLOAD_DEST || './uploads',
  },
  
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
  },
  
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    alertEmail: process.env.ALERT_EMAIL || 'admin@example.com',
  },
  
  security: {
    allowedIps: process.env.ALLOWED_ADMIN_IPS?.split(',') || [],
  },
});
