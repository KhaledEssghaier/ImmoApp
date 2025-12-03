export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  microservices: {
    auth: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
    },
    property: {
      host: process.env.PROPERTY_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.PROPERTY_SERVICE_PORT || '3002', 10),
    },
    user: {
      host: process.env.USER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.USER_SERVICE_PORT || '3003', 10),
    },
    favorite: {
      host: process.env.FAVORITE_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.FAVORITE_SERVICE_PORT || '3004', 10),
    },
    chat: {
      host: process.env.CHAT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CHAT_SERVICE_PORT || '3005', 10),
    },
    notification: {
      host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3006', 10),
    },
    billing: {
      host: process.env.BILLING_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.BILLING_SERVICE_PORT || '3012', 10),
    },
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '200', 10), // Increased from 100 to 200
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
});
