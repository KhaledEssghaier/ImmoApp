# 🔔 Notification Service - Complete Setup Guide

## ✅ Deliverables Checklist

### Backend Components
- ✅ **NestJS Service** with TypeScript
- ✅ **MongoDB Schema** for notifications with TTL and indexes
- ✅ **Redis Pub/Sub** event listener for inter-service communication
- ✅ **Bull Queue** for background job processing
- ✅ **Firebase Cloud Messaging** integration
- ✅ **SMTP/Email** service with HTML templates
- ✅ **Device Token Management** with automatic cleanup
- ✅ **REST API** with JWT and internal API key authentication
- ✅ **Rate Limiting** and retry logic
- ✅ **Deep Link** support in payloads

### Infrastructure
- ✅ **Dockerfile** for containerization
- ✅ **Docker Compose** configuration
- ✅ **.env.example** with all required variables
- ✅ **TypeScript** configuration
- ✅ **ESLint & Prettier** setup

### Testing
- ✅ **Unit Tests** for services
- ✅ **Integration Tests** for event handling
- ✅ **E2E Tests** for API endpoints
- ✅ **Test Script** with curl examples

### Frontend (Flutter)
- ✅ **Notification Service** class with FCM integration
- ✅ **Local Notifications** for foreground display
- ✅ **Background Handler** for push messages
- ✅ **Deep Link Navigation** on notification tap
- ✅ **In-App Notifications** screen with UI
- ✅ **Riverpod Providers** for state management
- ✅ **Mark as Read/Delete** functionality

### Documentation
- ✅ **README** with setup instructions
- ✅ **API Documentation** with curl examples
- ✅ **Event Mapping** documentation
- ✅ **Flutter Integration** guide

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd backend/notification-service
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
MONGO_URI=mongodb://localhost:27017/immobilier_notifications
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-from-auth-service
INTERNAL_API_KEY=generate-a-secure-random-key

# Firebase (Get from Firebase Console)
FCM_PROJECT_ID=your-firebase-project
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Optional: Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@immobilier.com
```

### 3. Run Service

**Development:**
```bash
npm run start:dev
```

**Docker:**
```bash
docker-compose up -d notification-service
```

### 4. Verify Service

```bash
curl http://localhost:3006/api/v1/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔥 Firebase Setup (Detailed)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Enter project name: "immobilier-app"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Cloud Messaging

1. In Project Overview, click settings (⚙️)
2. Go to "Cloud Messaging" tab
3. Note the "Server key" (legacy) - not needed for HTTP v1
4. For HTTP v1, we'll use service account

### Step 3: Generate Service Account Key

1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract these values:
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY` (keep \n as is)
   - `client_email` → `FCM_CLIENT_EMAIL`

### Step 4: Add to Flutter App

**Android** (`android/app/build.gradle`):
```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

**Android** (`android/app/google-services.json`):
- Download from Firebase Console → Project Settings → Your Apps → Download google-services.json

**iOS** (`ios/Runner/GoogleService-Info.plist`):
- Download from Firebase Console → Project Settings → Your Apps → Download GoogleService-Info.plist

**iOS Capabilities**:
- Open Xcode
- Select Runner → Signing & Capabilities
- Add "Push Notifications" capability
- Add "Background Modes" → Enable "Remote notifications"

---

## 📱 Flutter Integration (Detailed)

### Step 1: Add Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.2.0
```

Run:
```bash
flutter pub get
```

### Step 2: Initialize Firebase

In `main.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'services/notification_service.dart';

// Top-level background handler
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Set background handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  runApp(const MyApp());
}
```

### Step 3: Initialize Notification Service

In your app initialization (after login):

```dart
import 'services/notification_service.dart';

class HomeScreen extends ConsumerStatefulWidget {
  @override
  void initState() {
    super.initState();
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    final dio = ref.read(dioProvider); // Your Dio instance
    final notificationService = NotificationService(dio);
    await notificationService.initialize();
  }
}
```

### Step 4: Add Notifications Screen

Add to your navigation:

```dart
import 'features/notifications/presentation/screens/notifications_screen.dart';

// In your router or bottom nav
case 'notifications':
  return const NotificationsScreen();
```

### Step 5: Show Unread Badge

```dart
Consumer(
  builder: (context, ref, child) {
    final unreadCount = ref.watch(unreadCountProvider);
    
    return Badge(
      label: unreadCount.when(
        data: (count) => Text('$count'),
        loading: () => const Text(''),
        error: (_, __) => const Text(''),
      ),
      child: IconButton(
        icon: const Icon(Icons.notifications),
        onPressed: () => context.push('/notifications'),
      ),
    );
  },
)
```

---

## 🔗 Event Publishing (Other Services)

### From Chat Service

```typescript
// chat-service/src/messages/messages.service.ts
import Redis from 'ioredis';

export class MessagesService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async createMessage(data) {
    const message = await this.messageRepository.save(data);

    // Publish event for notification service
    await this.redis.publish('chat.message.created', JSON.stringify({
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      participantIds: message.conversation.participantIds,
      text: message.text,
    }));

    return message;
  }
}
```

### From Property Service

```typescript
// property-service/src/properties/properties.service.ts
import Redis from 'ioredis';

export class PropertiesService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async publishProperty(id: string) {
    const property = await this.propertyRepository.findOne(id);
    property.status = 'published';
    await this.propertyRepository.save(property);

    // Notify followers/subscribers
    await this.redis.publish('property.published', JSON.stringify({
      propertyId: property.id,
      ownerId: property.ownerId,
      ownerName: property.owner.name,
      title: property.title,
      location: property.location,
    }));

    return property;
  }
}
```

---

## 🧪 Testing Guide

### Unit Tests

```bash
npm test
```

Example test:
```typescript
it('should create notification and enqueue push job', async () => {
  const dto = {
    userId: '507f1f77bcf86cd799439011',
    type: NotificationType.MESSAGE,
    title: 'Test',
    body: 'Test notification',
    channel: [NotificationChannel.PUSH],
  };

  await service.create(dto);

  expect(mockQueue.add).toHaveBeenCalledWith('send-push', expect.any(Object));
});
```

### Integration Tests

Test event processing:

```typescript
it('should create notifications for chat message event', async () => {
  const event = {
    conversationId: 'conv123',
    senderId: 'user1',
    senderName: 'John',
    participantIds: ['user1', 'user2'],
    text: 'Hello',
  };

  await eventsService['handleChatMessage'](event);

  expect(notificationsService.create).toHaveBeenCalledTimes(1); // user2 only
});
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual API Testing

Use the provided script:

```bash
chmod +x test-api.sh
./test-api.sh
```

Or use curl:

```bash
# Create notification
curl -X POST http://localhost:3006/api/v1/notifications \
  -H "x-api-key: your-internal-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "type": "message",
    "title": "New Message",
    "body": "You have a new message",
    "channel": ["push", "inapp"]
  }'

# List notifications
curl http://localhost:3006/api/v1/notifications?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Register device
curl -X POST http://localhost:3006/api/v1/devices/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "your-fcm-token",
    "platform": "android"
  }'
```

---

## 📊 Monitoring

### Queue Status

Check Bull queue metrics:

```bash
# Redis CLI
redis-cli

# View queues
LLEN bull:notifications:waiting
LLEN bull:notifications:active
LLEN bull:notifications:completed
LLEN bull:notifications:failed

# View failed jobs
LRANGE bull:notifications:failed 0 -1
```

### Service Logs

```bash
# Docker logs
docker logs -f immobilier-notification-service

# Filter for errors
docker logs immobilier-notification-service 2>&1 | grep ERROR
```

### Database Queries

```javascript
// MongoDB shell
use immobilier_notifications

// Count notifications
db.notifications.countDocuments()

// Recent notifications
db.notifications.find().sort({createdAt: -1}).limit(10)

// Unread count by user
db.notifications.aggregate([
  { $match: { read: false, isDeleted: false } },
  { $group: { _id: "$userId", count: { $sum: 1 } } }
])

// Failed push attempts
db.devices.find({ isInvalid: true })
```

---

## 🔒 Security Checklist

- [ ] Change `INTERNAL_API_KEY` to secure random value
- [ ] Use strong `JWT_SECRET` matching auth service
- [ ] Store FCM credentials securely (use secrets manager in production)
- [ ] Enable CORS with specific origins only
- [ ] Use HTTPS in production
- [ ] Implement rate limiting per user
- [ ] Validate all input DTOs
- [ ] Sanitize notification content
- [ ] Use MongoDB role with minimal permissions
- [ ] Enable Redis authentication
- [ ] Log security events
- [ ] Set up monitoring alerts

---

## 🐛 Troubleshooting

### Issue: FCM sends fail with "Invalid token"

**Solution:**
- Check FCM credentials in `.env`
- Verify service account has Cloud Messaging permissions
- Ensure Firebase project has Cloud Messaging enabled

### Issue: Notifications not received on Flutter app

**Solution:**
1. Check device token is registered: `GET /api/v1/devices`
2. Verify FCM token in Flutter: `print(await FirebaseMessaging.instance.getToken())`
3. Check notification service logs for push send attempts
4. Test with Firebase Console "Cloud Messaging" → "Send test message"

### Issue: Background notifications not working on iOS

**Solution:**
- Enable "Push Notifications" capability in Xcode
- Enable "Background Modes" → "Remote notifications"
- Add `FirebaseMessaging.onBackgroundMessage` handler in `main.dart`
- Test on physical device (simulator doesn't support push)

### Issue: Redis events not processed

**Solution:**
- Verify Redis connection: `redis-cli PING`
- Check service subscribed: Look for "Subscribed to channels" in logs
- Test publishing: `redis-cli PUBLISH chat.message.created '{"test": true}'`
- Ensure event payload matches expected schema

---

## 📈 Performance Optimization

### For High Volume

1. **Enable Redis Clustering**
2. **Use MongoDB Replica Set**
3. **Increase Bull Concurrency:**
   ```typescript
   @Process({ name: 'send-push', concurrency: 10 })
   ```
4. **Batch FCM Sends:**
   ```typescript
   await fcmService.sendToMultipleDevices(tokens, notification);
   ```
5. **Add Rate Limiting:**
   - Max 5 push per minute per user
   - Queue instead of blocking
6. **Enable MongoDB Indexes:**
   ```javascript
   db.notifications.createIndex({ userId: 1, createdAt: -1 })
   db.notifications.createIndex({ userId: 1, read: 1, isDeleted: 1 })
   ```

---

## ✅ Acceptance Criteria Verification

### Backend

- ✅ Notification Service subscribes to Redis and creates docs: **IMPLEMENTED** (EventsService)
- ✅ Device tokens registered and stored: **IMPLEMENTED** (DevicesModule)
- ✅ Push jobs enqueue and send via FCM: **IMPLEMENTED** (NotificationProcessor + FcmService)
- ✅ Invalid tokens pruned automatically: **IMPLEMENTED** (DevicesService.removeInvalidTokens)
- ✅ REST endpoints work: **IMPLEMENTED** (NotificationsController + DevicesController)

### Frontend

- ✅ Flutter registers device token: **IMPLEMENTED** (NotificationService.registerDeviceToken)
- ✅ Receives push in foreground/background: **IMPLEMENTED** (FCM handlers)
- ✅ Taps open proper route and mark read: **IMPLEMENTED** (Deep link handling)
- ✅ In-app list shows history: **IMPLEMENTED** (NotificationsScreen)

---

## 🎉 Done!

Your notification service is now fully functional with:

- ✅ Push notifications (FCM)
- ✅ Email notifications (SMTP)
- ✅ In-app notifications (MongoDB)
- ✅ Event-driven architecture (Redis Pub/Sub)
- ✅ Background job processing (Bull)
- ✅ Device token management
- ✅ Deep linking support
- ✅ Complete Flutter integration
- ✅ Tests and documentation

For questions or issues, refer to the README.md or check the logs!

**Next Steps:**
1. Deploy to production
2. Set up monitoring/alerting
3. Configure user notification preferences
4. Implement notification templates
5. Add analytics tracking
