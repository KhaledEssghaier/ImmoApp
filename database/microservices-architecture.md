# Microservices Architecture for Immobilier App

## Overview

This document outlines the microservices architecture for the real estate mobile application, including service boundaries, database distribution, and communication patterns.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│  - JWT Validation                                                │
│  - Rate Limiting                                                 │
│  - Request Routing                                               │
│  - Load Balancing                                                │
│  - Analytics & Logging                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
     ────────┴────────────────────────────────
     │       │       │        │        │       │
     ▼       ▼       ▼        ▼        ▼       ▼
┌────────┬────────┬────────┬────────┬────────┬────────┐
│ Auth   │Property│Favorite│ Chat   │Notif.  │ Admin  │
│Service │Service │Service │Service │Service │Service │
└────────┴────────┴────────┴────────┴────────┴────────┘
     │       │       │        │        │       │
     ▼       ▼       ▼        ▼        ▼       ▼
┌────────┬────────┬────────┬────────┬────────┬────────┐
│Auth DB │Prop.DB │Fav. DB │Chat DB │Notif DB│Admin DB│
└────────┴────────┴────────┴────────┴────────┴────────┘
```

---

## 📦 Microservices Breakdown

### 1. Auth Service
**Responsibility:** User authentication, authorization, and session management

**Database:** `auth_db`
- **Collections:**
  - `users`
  - `sessions`

**API Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update user profile
- `DELETE /auth/me` - Soft delete user account
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

**Technology Stack:**
- Node.js / Express.js (or FastAPI/Flask for Python)
- JWT for token management
- bcrypt for password hashing
- Redis for token blacklisting

**Port:** 3001

---

### 2. Property Service
**Responsibility:** Property listings management and search

**Database:** `property_db`
- **Collections:**
  - `properties`
  - `reports`

**API Endpoints:**
- `GET /properties` - List properties (with filters)
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property listing
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Soft delete property
- `GET /properties/search` - Search properties (full-text)
- `GET /properties/nearby` - Geospatial search
- `GET /properties/owner/:userId` - Get owner's properties
- `POST /reports` - Report property/user
- `GET /reports` - Get reports (admin only)

**Technology Stack:**
- Node.js / Express.js
- MongoDB text search
- GeoJSON for location queries
- AWS S3 / Cloudinary for image storage

**Port:** 3002

---

### 3. Favorites Service
**Responsibility:** User favorites management

**Database:** `favorites_db`
- **Collections:**
  - `favorites`

**API Endpoints:**
- `GET /favorites` - Get user's favorites
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:propertyId` - Remove from favorites
- `GET /favorites/check/:propertyId` - Check if property is favorited
- `GET /favorites/count/:propertyId` - Get favorite count for property

**Technology Stack:**
- Node.js / Express.js (lightweight service)
- Redis cache for frequent checks

**Port:** 3003

---

### 4. Chat Service
**Responsibility:** Real-time messaging between users

**Database:** `chat_db`
- **Collections:**
  - `chats`
  - `messages`

**API Endpoints:**
- `GET /chats` - Get user's chats
- `GET /chats/:id` - Get chat details
- `POST /chats` - Create new chat
- `GET /chats/:id/messages` - Get chat messages
- `POST /chats/:id/messages` - Send message
- `PUT /messages/:id/read` - Mark message as read
- `DELETE /messages/:id` - Delete message

**Real-time:**
- WebSocket support for instant messaging
- Socket.IO or similar for real-time updates

**Technology Stack:**
- Node.js / Express.js
- Socket.IO for WebSockets
- Redis pub/sub for scaling

**Port:** 3004

---

### 5. Notifications Service
**Responsibility:** Push notifications and in-app notifications

**Database:** `notifications_db`
- **Collections:**
  - `notifications`

**API Endpoints:**
- `GET /notifications` - Get user's notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

**Push Notifications:**
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNS)

**Technology Stack:**
- Node.js / Express.js
- Firebase Admin SDK
- Bull/BullMQ for job queues

**Port:** 3005

---

### 6. Admin Service (Optional)
**Responsibility:** Admin panel operations

**Database:** Accesses all databases via internal APIs
- No dedicated database
- Uses other services' APIs

**API Endpoints:**
- `GET /admin/users` - List all users
- `PUT /admin/users/:id/ban` - Ban user
- `GET /admin/properties/pending` - Get pending approvals
- `PUT /admin/properties/:id/approve` - Approve property
- `GET /admin/reports` - Get all reports
- `PUT /admin/reports/:id/resolve` - Resolve report
- `GET /admin/analytics` - Get platform analytics

**Technology Stack:**
- Node.js / Express.js
- Service-to-service communication

**Port:** 3006

---

## 🔐 API Gateway Configuration

**Responsibilities:**
1. **Authentication:** Validate JWT tokens before routing
2. **Rate Limiting:** Prevent abuse (e.g., 100 requests/minute per user)
3. **Routing:** Forward requests to appropriate microservices
4. **Load Balancing:** Distribute load across service instances
5. **CORS:** Handle cross-origin requests
6. **Logging:** Centralized request/response logging
7. **Error Handling:** Standardized error responses

**Technology Stack:**
- Kong / NGINX / Express Gateway
- Redis for rate limiting
- ELK Stack for logging

**Port:** 3000 (public-facing)

---

## 🔄 Inter-Service Communication

### Synchronous (HTTP/REST)
Used for:
- Fetching user details from Auth Service
- Getting property details from Property Service
- Real-time operations

**Example:**
```javascript
// Favorites Service needs user info
const user = await authServiceClient.get(`/users/${userId}`);
```

### Asynchronous (Message Queue)
Used for:
- Sending notifications
- Processing background tasks
- Event-driven updates

**Technology:** RabbitMQ / Apache Kafka / Redis Pub/Sub

**Example Events:**
- `property.created` → Notify followers
- `message.received` → Send push notification
- `favorite.added` → Update property stats

---

## 🗄️ Database Distribution

| Microservice | Database Name | Collections | Size Estimate |
|--------------|---------------|-------------|---------------|
| Auth Service | `auth_db` | users, sessions | Medium |
| Property Service | `property_db` | properties, reports | Large |
| Favorites Service | `favorites_db` | favorites | Large |
| Chat Service | `chat_db` | chats, messages | Very Large |
| Notifications Service | `notifications_db` | notifications | Large |

---

## 🚀 Deployment Strategy

### Development
```yaml
version: '3.8'
services:
  api-gateway:
    image: nginx:alpine
    ports:
      - "3000:80"
  
  auth-service:
    build: ./services/auth
    ports:
      - "3001:3001"
    environment:
      - MONGO_URI=mongodb://auth_db:27017/auth_db
  
  property-service:
    build: ./services/property
    ports:
      - "3002:3002"
    environment:
      - MONGO_URI=mongodb://property_db:27017/property_db
  
  # ... other services
```

### Production (Kubernetes)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: immobilier/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: auth-db-secret
              key: uri
```

---

## 📊 Scaling Considerations

### Horizontal Scaling
- Each microservice can scale independently
- Use Kubernetes HPA (Horizontal Pod Autoscaler)
- Load balance with NGINX/Kong

### Database Scaling
- **Read replicas** for heavy read operations (properties, messages)
- **Sharding** for very large collections (messages, notifications)
- **Caching** with Redis for frequent queries

### Caching Strategy
```javascript
// Redis cache for property details
const cachedProperty = await redis.get(`property:${id}`);
if (cachedProperty) return JSON.parse(cachedProperty);

const property = await propertyDB.findById(id);
await redis.setex(`property:${id}`, 3600, JSON.stringify(property));
return property;
```

---

## 🔒 Security Best Practices

1. **JWT Tokens:**
   - Access token: 15 minutes expiry
   - Refresh token: 30 days expiry
   - Store refresh tokens in `sessions` collection

2. **API Gateway:**
   - All external requests go through gateway
   - Services only accept internal requests

3. **Service-to-Service Auth:**
   - Use API keys or mutual TLS
   - Whitelist service IPs

4. **Data Encryption:**
   - Encrypt sensitive data at rest
   - Use TLS for all communications

---

## 📈 Monitoring & Observability

### Logging
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- Centralized logging from all services
- Structured JSON logs

### Metrics
- **Prometheus + Grafana**
- Monitor: Request rate, error rate, latency
- Set up alerts for anomalies

### Tracing
- **Jaeger** for distributed tracing
- Track requests across microservices

---

## 🔄 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Microservices

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, property, favorites, chat, notifications]
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t immobilier/${{ matrix.service }}:latest ./services/${{ matrix.service }}
      - name: Push to registry
        run: docker push immobilier/${{ matrix.service }}:latest
      - name: Deploy to K8s
        run: kubectl apply -f k8s/${{ matrix.service }}/
```

---

## 📝 Service Communication Example

### Scenario: User favorites a property

1. **Client** → API Gateway
   ```
   POST /api/favorites
   Authorization: Bearer <token>
   Body: { "propertyId": "..." }
   ```

2. **API Gateway** → Auth Service
   ```
   Validate JWT token
   Get userId from token
   ```

3. **API Gateway** → Favorites Service
   ```
   POST /favorites
   Body: { "userId": "...", "propertyId": "..." }
   ```

4. **Favorites Service** → Property Service
   ```
   GET /properties/{id}
   Verify property exists
   ```

5. **Favorites Service** → Notifications Service (async)
   ```
   Event: favorite.added
   Data: { userId, propertyId, ownerId }
   ```

6. **Notifications Service** → Creates notification for property owner

---

## 🎯 Benefits of This Architecture

✅ **Scalability:** Each service scales independently  
✅ **Fault Isolation:** One service failure doesn't crash entire app  
✅ **Technology Flexibility:** Use different tech stacks per service  
✅ **Team Autonomy:** Teams can work independently on services  
✅ **Deployment:** Deploy services independently without downtime  
✅ **Maintainability:** Smaller, focused codebases  

---

## ⚠️ Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Data consistency | Use eventual consistency, saga pattern |
| Service discovery | Use Kubernetes DNS or Consul |
| API versioning | Version endpoints: `/v1/properties` |
| Testing complexity | Use contract testing, integration tests |
| Network latency | Use caching, async communication |

---

## 📚 Additional Resources

- [Microservices Patterns](https://microservices.io/patterns/index.html)
- [MongoDB Microservices Best Practices](https://www.mongodb.com/basics/microservices)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Author:** Architecture Team
