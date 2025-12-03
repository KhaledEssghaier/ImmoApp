# Chat Service - Real-time Messaging for Real Estate App

Production-ready real-time chat service built with NestJS, Socket.IO, MongoDB, and Redis.

## 🚀 Features

### Backend
- ✅ **Real-time messaging** with Socket.IO (WebSocket)
- ✅ **Horizontal scaling** with Redis adapter
- ✅ **Optimistic UI support** with local IDs
- ✅ **Read receipts** with user tracking
- ✅ **Typing indicators** with debounce
- ✅ **Presence tracking** (online/offline status)
- ✅ **Message editing** (within 15 minutes)
- ✅ **Message deletion** (owner only)
- ✅ **Rate limiting** (20 messages/60 seconds per user)
- ✅ **JWT authentication** for Socket.IO and REST
- ✅ **Attachment support** (via Media Service integration)
- ✅ **Unread counts** per conversation
- ✅ **Multi-device support** with socket tracking
- ✅ **Notification integration** via Redis pub/sub
- ✅ **Message history** with pagination
- ✅ **REST API fallback** for synchronization

### Frontend (Flutter)
- ✅ **Socket.IO client** with auto-reconnection
- ✅ **Optimistic UI** for instant feedback
- ✅ **Offline message queue** with local storage
- ✅ **Retry mechanism** for failed messages
- ✅ **Typing indicators** with 3-second debounce
- ✅ **Read receipts** with visibility tracking
- ✅ **Infinite scroll** pagination
- ✅ **Attachment uploads** before sending
- ✅ **Riverpod state management**

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 + TypeScript |
| Real-time | Socket.IO 4.6+ |
| Database | MongoDB 7+ |
| Cache/Broker | Redis 7+ |
| Authentication | JWT + Passport |
| Validation | class-validator |
| Testing | Jest + socket.io-client |
| Documentation | Swagger/OpenAPI |
| Container | Docker + Docker Compose |

## 🏗️ Architecture

```
┌─────────────────┐
│  Flutter Client │
│  (Socket.IO)    │
└────────┬────────┘
         │ WebSocket
         ▼
┌──────────────────────┐
│   API Gateway        │ ← JWT Validation
│   (Port 3000)        │ ← Rate Limiting
└────────┬─────────────┘
         │ HTTP Forward
         ▼
┌──────────────────────┐
│   Chat Service       │
│   (Port 3005)        │
│  - Socket.IO Gateway │
│  - REST API          │
└─────┬──────────┬─────┘
      │          │
      ▼          ▼
┌──────────┐  ┌────────┐
│ MongoDB  │  │ Redis  │
│          │  │ - Pub/ │
│ Messages │  │   Sub  │
│ Convs    │  │ - Pres │
└──────────┘  └────────┘
                  │
                  ▼
          ┌────────────────┐
          │ Notification   │
          │    Service     │
          └────────────────┘
```

## 📊 Database Schema

### Conversations Collection

```javascript
{
  "_id": ObjectId,
  "participantIds": [ObjectId, ObjectId],
  "propertyId": ObjectId | null,
  "lastMessage": {
    "text": "Hello!",
    "senderId": ObjectId,
    "createdAt": ISODate
  },
  "unreadCounts": {
    "userId1": 5,
    "userId2": 0
  },
  "isGroup": false,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indices:**
- `participantIds` (multikey) + `updatedAt` (desc)

### Messages Collection

```javascript
{
  "_id": ObjectId,
  "conversationId": ObjectId,
  "senderId": ObjectId,
  "text": "Message content",
  "attachments": [
    {
      "mediaId": ObjectId,
      "url": "https://..."
    }
  ],
  "meta": {
    "edited": false,
    "editedAt": null
  },
  "readBy": [ObjectId, ObjectId],
  "createdAt": ISODate
}
```

**Indices:**
- `conversationId` + `createdAt` (desc)

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | auth: `{token}` | Connect with JWT |
| `join_conversation` | `{conversationId}` | Join conversation room |
| `leave_conversation` | `{conversationId}` | Leave conversation room |
| `message_send` | `{conversationId, text, attachments?, localId?}` | Send message |
| `message_edit` | `{messageId, newText}` | Edit message (owner only) |
| `message_delete` | `{messageId}` | Delete message (owner only) |
| `message_read` | `{conversationId, messageIds[]}` | Mark messages read |
| `typing` | `{conversationId, isTyping}` | Typing indicator |
| `presence_subscribe` | `{userId}` | Subscribe to user presence |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message_new` | `{message, localId?}` | New message broadcast |
| `message_updated` | `{message}` | Message edited |
| `message_deleted` | `{messageId}` | Message deleted |
| `message_read_update` | `{conversationId, userId, messageIds[]}` | Read receipt update |
| `typing` | `{conversationId, userId, isTyping}` | Someone is typing |
| `presence_update` | `{userId, online}` | User online/offline |
| `error` | `{message}` | Error notification |
| `joined_conversation` | `{conversationId}` | Join confirmation |

## 📡 REST API Endpoints

### Conversations

```http
GET    /conversations              # List user conversations
POST   /conversations              # Create new conversation
GET    /conversations/:id          # Get conversation details
GET    /conversations/:id/participants  # Get participants
POST   /conversations/:id/mark-read     # Mark all as read
```

### Messages

```http
GET    /conversations/:id/messages?limit=50&before=<messageId>  # Get messages (paginated)
POST   /conversations/:id/messages/mark-read  # Mark specific messages read
```

### Health

```http
GET    /         # Service info
GET    /health   # Health check
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone repository
cd backend/chat-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start MongoDB and Redis (if not using Docker)
mongod --dbpath /path/to/data
redis-server

# Start in development mode
npm run start:dev
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f chat-service

# Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3005
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/immobilier_chat

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
MESSAGE_RATE_LIMIT=20           # Messages per window
MESSAGE_RATE_WINDOW=60000       # Window in milliseconds

# Message Editing
MESSAGE_EDIT_WINDOW_MINUTES=15

# Notification Service
NOTIFICATION_REDIS_CHANNEL=events:message.created

# Media Service
MEDIA_SERVICE_URL=http://localhost:3007
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing with Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3005/chat', {
  auth: { token: 'YOUR_JWT_TOKEN' },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join conversation
  socket.emit('join_conversation', { 
    conversationId: '673762f5e85740f6248f2803' 
  });
  
  // Send message
  socket.emit('message_send', {
    conversationId: '673762f5e85740f6248f2803',
    text: 'Hello from Node.js!',
    localId: 'local-123'
  });
});

socket.on('message_new', (data) => {
  console.log('New message:', data);
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```

### Testing Two Clients

```bash
# Terminal 1
node test-client-1.js

# Terminal 2
node test-client-2.js
```

## 📈 Performance & Scaling

### Horizontal Scaling

The service uses Redis adapter for Socket.IO, enabling multiple instances:

```bash
# Start 3 instances
npm run start:prod -- --port 3005 &
npm run start:prod -- --port 3015 &
npm run start:prod -- --port 3025 &

# All instances share same Redis, can communicate across servers
```

### Rate Limiting

- **Per-user rate limit**: 20 messages per 60 seconds
- **Implemented in**: Redis counters with TTL
- **Response**: `error` event emitted to client

### Presence Tracking

Redis keys:
- `user:{userId}:sockets` - Set of active socket IDs
- `user:{userId}:online` - Boolean online status
- `socket:{socketId}:user` - Socket to user mapping

### Notification Flow

1. Message saved to MongoDB
2. Event published to Redis channel `events:message.created`
3. Notification Service listens to channel
4. Pushes notifications to offline users via FCM/APNs

## 🔐 Security

### Authentication

- **Socket.IO**: JWT token via `handshake.auth.token` or `query.token`
- **REST API**: JWT Bearer token in `Authorization` header
- **Token validation**: On every connection and request

### Authorization

- **Conversations**: Only participants can access
- **Messages**: Only participants can read
- **Edit/Delete**: Only message owner
- **Rate limiting**: Per-user Redis counters

### Input Validation

- **Message text**: Max 5000 characters
- **Attachments**: Validated via Media Service
- **All DTOs**: class-validator decorators

## 📝 Flutter Integration

See [FLUTTER_CLIENT.md](./FLUTTER_CLIENT.md) for complete Flutter implementation including:
- Socket connection with auto-reconnection
- Optimistic UI with local IDs
- Offline message queue
- Retry mechanism for failed messages
- Typing indicators
- Read receipts
- Infinite scroll pagination

## 🐛 Troubleshooting

### Socket won't connect

```bash
# Check Redis connection
redis-cli ping

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check JWT token expiration
jwt decode YOUR_TOKEN

# Enable debug logs
DEBUG=socket.io* npm run start:dev
```

### Messages not broadcasting

```bash
# Verify Redis adapter is working
redis-cli
PUBSUB CHANNELS socket.io*

# Should show channels if adapter is active
```

### Rate limiting issues

```bash
# Check Redis rate limit keys
redis-cli
KEYS rate:message:*
TTL rate:message:USER_ID
```

## 📚 API Documentation

Swagger docs available at: `http://localhost:3005/api`

## 🤝 Integration with Other Services

### API Gateway

Forward chat requests:

```typescript
// In API Gateway
app.use('/api/v1/chat', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/chat': '' }
}));
```

### Notification Service

Subscribe to Redis channel:

```typescript
redisSubscriber.subscribe('events:message.created');
redisSubscriber.on('message', async (channel, message) => {
  const data = JSON.parse(message);
  // Send push notification to offline users
  await sendPushNotification(data);
});
```

### Media Service

Upload before sending:

```typescript
// 1. Upload file to Media Service
const media = await uploadFile(file);

// 2. Send message with mediaId
socket.emit('message_send', {
  conversationId: 'xxx',
  text: 'Check this out!',
  attachments: [{ mediaId: media.id, url: media.url }]
});
```

## 📄 License

MIT

## 👥 Support

For issues or questions:
- Check logs: `docker-compose logs -f chat-service`
- Verify MongoDB: `docker exec -it mongodb mongosh`
- Test Redis: `docker exec -it redis redis-cli ping`
