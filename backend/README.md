# Backend Architecture - Real Estate Application

Complete microservices architecture for the real estate mobile application with Flutter.

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  Flutter App    │
│  (Port 57283)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│    API Gateway          │
│    (Port 3000)          │
│  - JWT Authentication   │
│  - Rate Limiting        │
│  - Request Routing      │
│  - Health Checks        │
└────────┬────────────────┘
         │
    ┌────┴────────────────────────────────────────────┐
    │                                                  │
    ▼                                                  ▼
┌─────────────┐  ┌──────────────┐         ┌──────────────────┐
│ Auth Service│  │Property Svc  │         │   Chat Service   │
│  (Port 3001)│  │ (Port 3002)  │         │   (Port 3005)    │
└──────┬──────┘  └──────┬───────┘         └────┬─────────────┘
       │                │                      │
       └────────────────┼──────────────────────┘
                        │
                ┌───────┴────────┐
                ▼                ▼
         ┌──────────────┐   ┌─────────┐
         │MongoDB Atlas │   │  Redis  │
         │   (Cloud)    │   │(Port 6379)│
         └──────────────┘   └─────────┘
```

## 📦 Services

### 1. API Gateway (Port 3000)
- **Role**: Central entry point for all client requests
- **Features**:
  - JWT token validation
  - Role-based access control (USER, ADMIN, AGENT)
  - Rate limiting (100 req/60s)
  - Request logging
  - CORS handling
  - API versioning (v1)
  - Health monitoring

### 2. Auth Service (Port 3001)
- **Role**: User authentication and authorization
- **Features**:
  - User registration
  - Login/Logout
  - JWT token generation
  - Password reset
  - Email verification
  - Refresh tokens

### 3. Property Service (Port 3002)
- **Role**: Property management
- **Features**:
  - CRUD operations for properties
  - Property search and filtering
  - Image upload
  - Property status management
  - Owner properties listing

### 4. User Service (Port 3003) - Coming Soon
- User profile management
- User preferences
- Avatar upload

### 5. Favorite Service (Port 3004) - Coming Soon
- Add/remove favorites
- List user favorites
- Favorite notifications

### 6. Chat Service (Port 3005) ✅ **COMPLETED**
- **Role**: Real-time messaging and chat
- **Features**:
  - Real-time messaging with Socket.IO
  - Conversation management
  - Message history with pagination
  - Read receipts
  - Typing indicators
  - Presence tracking (online/offline)
  - Message editing (15-minute window)
  - Message deletion
  - Attachment support via Media Service
  - Rate limiting (20 messages/60s)
  - Optimistic UI support
  - Redis pub/sub for notifications
  - Horizontal scaling with Redis adapter
  - Multi-device support
- **Tech**: NestJS + Socket.IO + MongoDB + Redis
- **Documentation**: [chat-service/README.md](./chat-service/README.md)

### 7. Notification Service (Port 3006) ✅ **COMPLETED**
- **Role**: Push notifications and alerts
- **Features**:
  - In-app notifications
  - Push notifications via Firebase Cloud Messaging
  - Email notifications (optional)
  - Notification history
  - Mark as read/unread
  - Notification preferences
  - Real-time delivery via Redis pub/sub
  - Queue processing with Bull
- **Tech**: NestJS + Firebase + MongoDB + Redis + Bull

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- **MongoDB Atlas** account (cloud database)
- npm or yarn
- Redis (for chat & notifications)
- Docker (optional)

### Development Setup

#### 1. Configure MongoDB Atlas
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster and database: `immobilier_app`
3. Get connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app
   ```
4. Whitelist your IP address in Network Access
5. Update `MONGODB_URI` in all service `.env` files

#### 2. Install Dependencies
```bash
cd backend
cd api-gateway && npm install
cd ../auth-service && npm install
cd ../property-service && npm install
cd ../chat-service && npm install
cd ../notification-service && npm install
```

#### 3. Configure Environment Variables
Update `.env` file in each service with:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your secret key (must match across all services)
- `REDIS_HOST`: Redis connection (default: localhost)

#### 4. Start Redis
```bash
# Windows (if installed)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

#### 5. Start All Services

**Option A: Simple Script (Recommended)**
```bash
cd backend
.\start-all-simple.ps1
```
Opens each service in a separate terminal window with visible logs.

**Option B: Manual Start**
```bash
# Terminal 1 - API Gateway
cd api-gateway && npm run start:dev

# Terminal 2 - Auth Service
cd auth-service && npm run start:dev

# Terminal 3 - Property Service
cd property-service && npm run start:dev

# Terminal 4 - Chat Service
cd chat-service && npm run start:dev

# Terminal 5 - Notification Service
cd notification-service && npm run start:dev
```

#### 6. Stop All Services
```bash
cd backend
.\stop-all.ps1
```

### Startup Scripts

**`start-all-simple.ps1`** - Opens each service in its own terminal window
- ✅ See logs for each service separately
- ✅ Easy debugging
- ✅ Recommended for development

**`start-all.ps1`** - Runs all services as background jobs
- ✅ All services in one terminal
- ⚠️ Logs hidden by default

**`stop-all.ps1`** - Stops all Node.js services

See [README-SCRIPTS.md](./README-SCRIPTS.md) for detailed script documentation.

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1/`

### Authentication
```
POST   /auth/register          Register new user
POST   /auth/login             User login
POST   /auth/refresh           Refresh access token
POST   /auth/logout            User logout
POST   /auth/forgot-password   Request password reset
POST   /auth/reset-password    Reset password
```

### Users
```
GET    /users/me               Get current user
PUT    /users/me               Update current user
GET    /users/:id              Get user by ID
GET    /users                  Get all users (Admin)
```
### Notifications
```
GET    /notifications              Get user notifications (paginated)
POST   /notifications              Create notification (Internal API)
POST   /notifications/bulk         Create bulk notifications (Internal API)
PUT    /notifications/:id/read     Mark as read
PUT    /notifications/mark-all-read Mark all as read
DELETE /notifications/:id          Delete notification
```

**Note**: POST endpoints require `x-api-key` header for internal service authentication.T   /properties                        Create property
PUT    /properties/:id                    Update property
DELETE /properties/:id                    Delete property
GET    /properties/owner/my-properties    Get my properties
```

### Favorites
```
GET    /favorites                   Get user favorites
POST   /favorites/:propertyId       Add to favorites
DELETE /favorites/:propertyId       Remove from favorites
```

### Chat
```
GET    /chat/conversations                Get conversations
GET    /chat/conversations/:id/messages   Get messages (paginated)
POST   /chat/conversations                Create conversation
POST   /chat/send                         Send message (deprecated - use Socket.IO)
```

**Socket.IO Events** (Namespace: `/chat`):
- `message_send` - Send message
- `message_edit` - Edit message
- `message_delete` - Delete message
- `message_read` - Mark messages read
- `typing` - Typing indicator
- `join_conversation` - Join room
- `leave_conversation` - Leave room

See [chat-service/README.md](./chat-service/README.md) for complete Socket.IO documentation.

### Notifications
```
GET    /notifications           Get notifications
PUT    /notifications/:id/read  Mark as read
DELETE /notifications/:id       Delete notification
```

### Health Check
```
GET    /health                  Check all services health
```

## 🔐 Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <jwt-token>
```

Get token by calling `/api/v1/auth/login`:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## 🛡️ Security

- **JWT Authentication**: All protected routes validate JWT tokens
- **Role-Based Access**: USER, ADMIN, AGENT roles with different permissions
- **Rate Limiting**: 100 requests per 60 seconds per IP
- **Input Validation**: Automatic DTO validation with class-validator
- **CORS**: Configured to allow Flutter app origin
- **Password Hashing**: bcrypt for password security
- **Environment Variables**: Sensitive data in .env files

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String, // 'USER', 'ADMIN', 'AGENT'
  phone: String,
  avatar: String,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Properties Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: String, // 'APARTMENT', 'HOUSE', 'VILLA', etc.
  status: String, // 'AVAILABLE', 'SOLD', 'RENTED'
  price: Number,
  surface: Number,
  rooms: Number,
  bathrooms: Number,
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: String
  },
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  images: [String],
  features: [String],
  ownerId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test specific service
cd api-gateway && npm run test
```

## 📝 Environment Variables

### API Gateway (.env)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
PROPERTY_SERVICE_HOST=localhost
PROPERTY_SERVICE_PORT=3002
### Auth Service (.env)
```env
PORT=3001
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Property Service (.env)
```env
PORT=3002
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app?retryWrites=true&w=majority
## 🐳 Docker Services

The `docker-compose.yml` includes:

- **api-gateway**: Port 3000
- **auth-service**: Port 3001
- **property-service**: Port 3002
- **chat-service**: Port 3005
- **notification-service**: Port 3006
- **redis**: Port 6379

**Note**: MongoDB is hosted on **MongoDB Atlas** (cloud), not in Docker.

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
MESSAGE_RATE_LIMIT=20
MESSAGE_RATE_WINDOW=60
```

### Notification Service (.env)
```env
PORT=3006
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app?retryWrites=true&w=majority

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase Cloud Messaging
FCM_PROJECT_ID=your-firebase-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security
INTERNAL_API_KEY=your-internal-api-key-for-service-to-service-calls
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```T=3002
MONGODB_URI=mongodb://localhost:27017/immobilier_app
JWT_SECRET=your-secret-key
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
### Database Management
- **MongoDB Atlas Console**: https://cloud.mongodb.com
- **MongoDB Compass**: Connect with Atlas connection string
- **VS Code Extension**: MongoDB for VS Code

The `docker-compose.yml` includes:

- **api-gateway**: Port 3000
- **auth-service**: Port 3001
- **property-service**: Port 3002
- **mongodb**: Port 27017
- **mongo-express**: Port 8081 (Database UI)

Access Mongo Express at: http://localhost:8081
- Username: `admin`
- Password: `admin123`

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Response:
```json
{
  "success": true,
  "message": "API Gateway is healthy",
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

### Logs
```bash
# View all services logs
docker-compose logs -f

# View specific service
docker-compose logs -f api-gateway
```

## 🔧 Development Tools

### Hot Reload
All services support hot reload in development:
```bash
npm run start:dev
```

### Database Management
- **Mongo Express**: http://localhost:8081
- **MongoDB Compass**: Connect to `mongodb://localhost:27017`

### API Testing
- **Postman Collection**: Import from `postman/collection.json`
- **Swagger**: http://localhost:3000/api (Coming soon)

## 📚 Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: MongoDB 7
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **HTTP Client**: Axios
- **Rate Limiting**: @nestjs/throttler
- **Logging**: Winston (Coming soon)
- **Testing**: Jest

## ✅ Completed Features

- [x] API Gateway with JWT authentication
- [x] Auth Service (login, register, JWT)
- [x] Property Service (CRUD operations)
- [x] Chat Service with Socket.IO & Redis
- [x] Notification Service with FCM & Bull Queue
- [x] MongoDB Atlas integration
- [x] Redis pub/sub for real-time features
- [x] Rate limiting & security guards
- [x] Startup scripts for all services

## 🚧 Coming Soon

## 📞 Support

For issues or questions:
- Check service logs in their terminal windows
- Verify MongoDB Atlas connection in service startup logs
- Test endpoints: Use Postman or Thunder Client
- Stop services: `.\stop-all.ps1`
- Restart services: `.\start-all-simple.ps1`

### Common Issues

**Port already in use:**
```powershell
.\stop-all.ps1
netstat -ano | findstr :3000
```

**MongoDB connection failed:**
- Check connection string in `.env` files
- Verify IP whitelist in MongoDB Atlas
- Test connection at https://cloud.mongodb.com

**Redis connection failed:**
```powershell
# Start Redis
redis-server
# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```
- [ ] Search with Elasticsearch
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment

## 📞 Support

For issues or questions:
- Check service logs: `docker-compose logs -f`
- Verify MongoDB connection: `docker exec -it mongodb mongosh`
- Test endpoints: Use Postman collection

## 📄 License

MIT


Testing User : 
Email:jean.dupont@example.com  
password:Password123!

Run all Backend Services :
cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend'; .\start-all-simple.ps1