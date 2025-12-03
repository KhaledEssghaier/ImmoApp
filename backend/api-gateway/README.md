# API Gateway - Real Estate Microservices

Complete NestJS API Gateway for the real estate application with Flutter mobile app.

## 🏗️ Project Structure

```
api-gateway/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── gateway/
│   │   ├── gateway.controller.ts
│   │   ├── gateway.module.ts
│   │   └── gateway.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── Dockerfile
└── package.json
```

## 🚀 Features

✅ **API Gateway Pattern** - Central entry point for all microservices  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Role-Based Access Control (RBAC)** - User, Admin, Agent roles  
✅ **Rate Limiting** - Protect against abuse (100 requests/60s)  
✅ **Global Error Handling** - Standardized error responses  
✅ **Request Logging** - Comprehensive request/response logging  
✅ **API Versioning** - URI-based versioning (v1, v2, etc.)  
✅ **CORS Support** - Cross-origin resource sharing  
✅ **Health Checks** - Monitor microservices health  
✅ **Docker Support** - Containerized deployment  

## 📦 Installation

```bash
# Install dependencies
npm install

# Configure environment
# Edit .env file with your settings
```

## 🔧 Configuration

Edit `.env` file:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d

# Microservices URLs
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
PROPERTY_SERVICE_HOST=localhost
PROPERTY_SERVICE_PORT=3002
...
```

## 🎯 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Docker
```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Stop services
docker-compose down
```

## 📚 API Endpoints

### Authentication Routes
- `POST /api/v1/auth/register` - Register new user (Public)
- `POST /api/v1/auth/login` - User login (Public)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset (Public)
- `POST /api/v1/auth/reset-password` - Reset password (Public)

### User Routes
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users` - Get all users (Admin only)

### Property Routes
- `GET /api/v1/properties` - Get all properties (Public)
- `GET /api/v1/properties/:id` - Get property by ID (Public)
- `POST /api/v1/properties` - Create property (Protected)
- `PUT /api/v1/properties/:id` - Update property (Protected)
- `DELETE /api/v1/properties/:id` - Delete property (Protected)
- `GET /api/v1/properties/owner/my-properties` - Get my properties

### Favorite Routes
- `GET /api/v1/favorites` - Get user favorites
- `POST /api/v1/favorites/:propertyId` - Add to favorites
- `DELETE /api/v1/favorites/:propertyId` - Remove from favorites

### Chat Routes
- `GET /api/v1/chat/conversations` - Get conversations
- `GET /api/v1/chat/conversations/:id/messages` - Get messages
- `POST /api/v1/chat/send` - Send message

### Notification Routes
- `GET /api/v1/notifications` - Get notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Health Check
- `GET /api/v1/health` - Check gateway and services health (Public)

## 🔐 Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🛡️ Security Features

- **JWT Token Validation** - All protected routes verify JWT
- **Role Guards** - Restrict access based on user roles
- **Rate Limiting** - 100 requests per 60 seconds per IP
- **Input Validation** - Automatic DTO validation
- **CORS Protection** - Whitelist allowed origins
- **Error Sanitization** - Don't expose internal errors

## 📊 Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": ["Error message"],
  "timestamp": "2025-11-14T10:30:00.000Z",
  "path": "/api/v1/properties"
}
```

## 🏥 Health Check Response

```json
{
  "success": true,
  "message": "API Gateway is healthy",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "services": {
    "auth": "healthy",
    "property": "healthy",
    "user": "unhealthy",
    "favorite": "healthy",
    "chat": "healthy",
    "notification": "healthy"
  }
}
```

## 🐳 Docker Deployment

The `docker-compose.yml` includes:
- API Gateway (port 3000)
- Auth Service (port 3001)
- Property Service (port 3002)
- MongoDB (port 27017)
- Mongo Express (port 8081) - Database UI

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Gateway port | 3000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | Token expiration | 1d |
| AUTH_SERVICE_HOST | Auth service host | localhost |
| AUTH_SERVICE_PORT | Auth service port | 3001 |
| PROPERTY_SERVICE_HOST | Property service host | localhost |
| PROPERTY_SERVICE_PORT | Property service port | 3002 |
| THROTTLE_TTL | Rate limit window (s) | 60 |
| THROTTLE_LIMIT | Max requests per window | 100 |
| CORS_ORIGIN | Allowed origins | - |

## 🔄 Request Flow

```
Flutter App → API Gateway → Microservice
            ↓
        JWT Validation
        Role Check
        Rate Limiting
        Logging
            ↓
        Forward to Service
            ↓
        Response
```

## 🌟 Best Practices

1. **Always use environment variables** for sensitive data
2. **Enable rate limiting** in production
3. **Use HTTPS** in production
4. **Rotate JWT secrets** regularly
5. **Monitor health endpoints**
6. **Keep dependencies updated**
7. **Use proper logging levels**

## 📄 License

MIT
