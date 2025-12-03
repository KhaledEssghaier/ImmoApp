# Notification Service

Complete notification service for real-estate application with push notifications, email, and in-app notifications.

## Features

- 📱 **Push Notifications**: Firebase Cloud Messaging (FCM) for Android, iOS, and Web
- 📧 **Email Notifications**: SMTP/SendGrid integration
- 🔔 **In-App Notifications**: Persistent storage with MongoDB
- 🔄 **Event-Driven**: Redis Pub/Sub for real-time event processing
- 📊 **Queue System**: Bull for reliable background jobs
- 🎯 **Deep Linking**: Navigate to specific screens from notifications
- 🔐 **Secure**: JWT authentication and internal API key protection
- 📈 **Scalable**: Fan-out support for bulk notifications

## Tech Stack

- **Backend**: NestJS + TypeScript
- **Database**: MongoDB
- **Cache/Queue**: Redis + Bull
- **Push**: Firebase Cloud Messaging
- **Email**: Nodemailer (SMTP/SendGrid)
- **Frontend**: Flutter

## Quick Start

### 1. Installation

```bash
cd notification-service
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
```env
MONGO_URI=mongodb://mongo:27017/immobilier_notifications
REDIS_URL=redis://redis:6379
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
JWT_SECRET=your-jwt-secret
INTERNAL_API_KEY=your-internal-api-key
```

### 3. Run Development Server

```bash
npm run start:dev
```

Service will start on `http://localhost:3006`

### 4. Run with Docker

```bash
docker-compose up -d notification-service
```

## API Endpoints

### Internal API (Requires `x-api-key` header)

**Create Notification**
```bash
POST /api/v1/notifications
Headers: x-api-key: your-internal-api-key
Body:
{
  "userId": "507f1f77bcf86cd799439011",
  "type": "message",
  "title": "New Message",
  "body": "You have a new message",
  "payload": {
    "conversationId": "conv123",
    "route": "/conversations/conv123"
  },
  "channel": ["push", "inapp"]
}
```

**Bulk Create**
```bash
POST /api/v1/notifications/bulk
Headers: x-api-key: your-internal-api-key
Body:
{
  "notifications": [...]
}
```

### User API (Requires JWT Bearer token)

**List Notifications**
```bash
GET /api/v1/notifications?page=1&limit=20&unreadOnly=false
Headers: Authorization: Bearer <jwt-token>
```

**Get Unread Count**
```bash
GET /api/v1/notifications/unread-count
Headers: Authorization: Bearer <jwt-token>
```

**Mark as Read**
```bash
POST /api/v1/notifications/:id/read
Headers: Authorization: Bearer <jwt-token>
```

**Mark All as Read**
```bash
POST /api/v1/notifications/mark-all-read
Headers: Authorization: Bearer <jwt-token>
```

**Delete Notification**
```bash
POST /api/v1/notifications/:id/delete
Headers: Authorization: Bearer <jwt-token>
```

**Register Device Token**
```bash
POST /api/v1/devices/register
Headers: Authorization: Bearer <jwt-token>
Body:
{
  "deviceToken": "fcm-device-token",
  "platform": "android"
}
```

**List Devices**
```bash
GET /api/v1/devices
Headers: Authorization: Bearer <jwt-token>
```

**Remove Device**
```bash
DELETE /api/v1/devices/:id
Headers: Authorization: Bearer <jwt-token>
```

## Event Sources

The service listens to Redis channels for events from other services:

### `chat.message.created`
```json
{
  "conversationId": "conv123",
  "messageId": "msg456",
  "senderId": "user1",
  "senderName": "John Doe",
  "participantIds": ["user1", "user2"],
  "text": "Hello!"
}
```

### `property.published`
```json
{
  "propertyId": "prop123",
  "ownerId": "user1",
  "ownerName": "John Doe",
  "title": "Beautiful House",
  "location": "New York"
}
```

### `property.viewed`
```json
{
  "propertyId": "prop123",
  "ownerId": "user1",
  "viewerId": "user2",
  "viewerName": "Jane Smith"
}
```

### `user.followed`
```json
{
  "followerId": "user1",
  "followerName": "John Doe",
  "followedId": "user2"
}
```

### `payment.succeeded`
```json
{
  "paymentId": "pay123",
  "userId": "user1",
  "amount": 99.99,
  "propertyId": "prop123",
  "promotionType": "featured"
}
```

### `system.alert`
```json
{
  "title": "System Maintenance",
  "body": "Scheduled maintenance tonight",
  "userIds": ["user1", "user2"],
  "route": "/system/announcements"
}
```

## Publishing Events (from other services)

```typescript
// Example: Publishing from Chat Service
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

await redis.publish('chat.message.created', JSON.stringify({
  conversationId: conversation.id,
  messageId: message.id,
  senderId: message.senderId,
  senderName: message.sender.name,
  participantIds: conversation.participantIds,
  text: message.text,
}));
```

## Firebase Setup

1. Create Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Generate service account key:
   - Project Settings → Service Accounts
   - Generate New Private Key
4. Extract credentials:
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY`
   - `client_email` → `FCM_CLIENT_EMAIL`

## Flutter Integration

### 1. Add Dependencies

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.2.0
```

### 2. Initialize Firebase

```dart
import 'package:firebase_core/firebase_core.dart';
import 'notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Set background message handler
  FirebaseMessaging.onBackgroundMessage(
    firebaseMessagingBackgroundHandler
  );
  
  runApp(MyApp());
}
```

### 3. Initialize Notification Service

```dart
final notificationService = NotificationService(dio);
await notificationService.initialize();
```

### 4. Handle Notifications

The service automatically:
- Requests permissions
- Registers device token
- Displays foreground notifications
- Handles notification taps
- Navigates to deep links

### 5. Display In-App Notifications

Add the notifications screen to your app and navigate to it from your main menu.

## Testing

**Run Unit Tests**
```bash
npm test
```

**Run E2E Tests**
```bash
npm run test:e2e
```

**Test Push Notification**
```bash
# Using curl
curl -X POST http://localhost:3006/api/v1/notifications \
  -H "x-api-key: your-internal-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "type": "message",
    "title": "Test",
    "body": "Test notification",
    "channel": ["push", "inapp"]
  }'
```

## Docker Compose Integration

Add to your `docker-compose.dev.yml`:

```yaml
notification-service:
  build: ./notification-service
  ports:
    - "3006:3006"
  environment:
    - MONGO_URI=mongodb://mongo:27017/immobilier_notifications
    - REDIS_URL=redis://redis:6379
    - FCM_PROJECT_ID=${FCM_PROJECT_ID}
    - FCM_PRIVATE_KEY=${FCM_PRIVATE_KEY}
    - FCM_CLIENT_EMAIL=${FCM_CLIENT_EMAIL}
    - JWT_SECRET=${JWT_SECRET}
    - INTERNAL_API_KEY=${INTERNAL_API_KEY}
  depends_on:
    - mongo
    - redis
```

## Monitoring & Observability

The service logs:
- All notification creations
- Push send success/failures
- Invalid token removals
- Event processing
- Queue job status

Monitor Redis queues:
```bash
# View queue status
redis-cli LLEN bull:notifications:waiting
redis-cli LLEN bull:notifications:active
redis-cli LLEN bull:notifications:failed
```

## Production Checklist

- [ ] Set strong `INTERNAL_API_KEY`
- [ ] Configure proper JWT secret
- [ ] Set up Firebase production project
- [ ] Configure SMTP/SendGrid for emails
- [ ] Enable MongoDB TTL index
- [ ] Set up Redis persistence
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up log aggregation

## License

MIT
