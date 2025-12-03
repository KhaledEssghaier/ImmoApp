# Chat Service Testing Guide

## Prerequisites

```bash
npm install socket.io-client
```

## Test Script Usage

### 1. Get JWT Token

First, login to get a JWT token:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jean.dupont@example.com", "password": "Password123!"}'
```

Copy the `accessToken` from the response.

### 2. Update Test Script

Edit `test-clients.js` and replace `YOUR_JWT_TOKEN_HERE` with your actual token.

### 3. Run Test

```bash
node test-clients.js
```

Expected output:
```
🚀 Starting two chat clients...

✅ Client 1 connected: abc123
✅ Client 2 connected: def456

⏳ Test will run for 10 seconds...

📤 Client 1 sending message...

💬 Client 2 received message: {
  from: '673762f5e85740f6248f2801',
  text: 'Hello from Client 1!',
  localId: 'local-1699876543210'
}

⌨️  Client 2 typing...

⌨️  Client 1: User 673762f5e85740f6248f2802 is typing...

📤 Client 2 sending message...

💬 Client 1 received message: {
  from: '673762f5e85740f6248f2802',
  text: 'Hello from Client 2! How are you?',
  localId: 'local-1699876544210'
}

✅ Client 2 marking message as read...

📖 Read receipt update: {
  userId: '673762f5e85740f6248f2802',
  messageCount: 1
}

🔌 Disconnecting clients...
```

## Manual Testing with Browser Console

```javascript
// Connect
const socket = io('http://localhost:3005/chat', {
  auth: { token: 'YOUR_JWT_TOKEN' },
  transports: ['websocket']
});

// Listen for events
socket.on('connect', () => console.log('Connected!'));
socket.on('message_new', (data) => console.log('New message:', data));
socket.on('typing', (data) => console.log('Typing:', data));
socket.on('error', (err) => console.error('Error:', err));

// Join conversation
socket.emit('join_conversation', { conversationId: 'YOUR_CONVERSATION_ID' });

// Send message
socket.emit('message_send', {
  conversationId: 'YOUR_CONVERSATION_ID',
  text: 'Hello from browser!',
  localId: 'local-' + Date.now()
});

// Send typing
socket.emit('typing', {
  conversationId: 'YOUR_CONVERSATION_ID',
  isTyping: true
});

// Mark read
socket.emit('message_read', {
  conversationId: 'YOUR_CONVERSATION_ID',
  messageIds: ['MESSAGE_ID_1', 'MESSAGE_ID_2']
});
```

## REST API Testing

### Create Conversation

```bash
curl -X POST http://localhost:3005/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["673762f5e85740f6248f2802"],
    "propertyId": "673762f5e85740f6248f2900"
  }'
```

### Get Conversations

```bash
curl -X GET http://localhost:3005/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Messages

```bash
curl -X GET "http://localhost:3005/conversations/CONVERSATION_ID/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Messages as Read

```bash
curl -X POST http://localhost:3005/conversations/CONVERSATION_ID/messages/mark-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "CONVERSATION_ID",
    "messageIds": ["MESSAGE_ID_1", "MESSAGE_ID_2"]
  }'
```

## Testing with Postman

Import the following collection:

```json
{
  "info": {
    "name": "Chat Service",
    "_postman_id": "chat-service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Conversation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"participantIds\": [\"USER_ID\"], \"propertyId\": \"PROPERTY_ID\"}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3005/conversations",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3005",
          "path": ["conversations"]
        }
      }
    },
    {
      "name": "Get Conversations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3005/conversations",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3005",
          "path": ["conversations"]
        }
      }
    }
  ]
}
```

## Monitoring

### Check Redis Keys

```bash
redis-cli

# List all socket connections
KEYS user:*:sockets

# Check user online status
GET user:USER_ID:online

# Check rate limits
KEYS rate:message:*
```

### Check MongoDB

```bash
mongosh immobilier_chat

# Count messages
db.messages.countDocuments()

# Find recent messages
db.messages.find().sort({createdAt: -1}).limit(10)

# Check unread counts
db.conversations.find({}, {unreadCounts: 1, lastMessage: 1})
```

### Check Logs

```bash
# Docker
docker-compose logs -f chat-service

# PM2
pm2 logs chat-service

# Direct
tail -f logs/chat-service.log
```

## Troubleshooting

### Socket won't connect

1. Check JWT token is valid:
```bash
# In Node.js
const jwt = require('jsonwebtoken');
const decoded = jwt.decode('YOUR_TOKEN');
console.log('Expires:', new Date(decoded.exp * 1000));
```

2. Enable debug mode:
```bash
DEBUG=socket.io* node test-clients.js
```

### Messages not receiving

1. Verify joined conversation:
```javascript
socket.emit('join_conversation', { conversationId });
socket.on('joined_conversation', (data) => {
  console.log('Joined:', data);
});
```

2. Check Redis pub/sub:
```bash
redis-cli
PUBSUB CHANNELS
# Should show socket.io channels
```

### Rate limiting

If hitting rate limits (20 msg/min):
```bash
redis-cli
DEL rate:message:USER_ID
```
