# Redis Schema for Chat Service

## Overview
This document describes the Redis data structures used in the chat service for real-time features, presence management, caching, and rate limiting.

## Data Structures

### 1. User Presence & Socket Management

#### User Online Status
```
Key: user:{userId}:online
Type: String
Value: "true" | "false"
TTL: None (persists until explicitly set)
Purpose: Track if user is currently online
```

Example:
```redis
SET user:507f1f77bcf86cd799439011:online "true"
GET user:507f1f77bcf86cd799439011:online
# Returns: "true"
```

#### User Active Sockets
```
Key: user:{userId}:sockets
Type: Set
Members: socketId1, socketId2, ...
Purpose: Track all active socket connections for a user (multiple devices/tabs)
```

Example:
```redis
SADD user:507f1f77bcf86cd799439011:sockets "abc123socketId"
SADD user:507f1f77bcf86cd799439011:sockets "def456socketId"
SMEMBERS user:507f1f77bcf86cd799439011:sockets
# Returns: ["abc123socketId", "def456socketId"]
SCARD user:507f1f77bcf86cd799439011:sockets
# Returns: 2
```

#### Socket to User Mapping
```
Key: socket:{socketId}:user
Type: String
Value: userId
Purpose: Reverse lookup - find user ID from socket ID
```

Example:
```redis
SET socket:abc123socketId:user "507f1f77bcf86cd799439011"
GET socket:abc123socketId:user
# Returns: "507f1f77bcf86cd799439011"
```

---

### 2. Typing Indicators

#### User Typing Status
```
Key: typing:{conversationId}:{userId}
Type: String
Value: "1"
TTL: 5 seconds (auto-expire)
Purpose: Track if user is currently typing in a conversation
```

Example:
```redis
SET typing:conv123:user456 "1" EX 5
GET typing:conv123:user456
# Returns: "1" (or nil if expired)
```

#### Get All Users Typing in Conversation
```
Pattern: typing:{conversationId}:*
Purpose: Find all users currently typing in a conversation
```

Example:
```redis
KEYS typing:conv123:*
# Returns: ["typing:conv123:user456", "typing:conv123:user789"]
```

---

### 3. Message Rate Limiting

#### User Message Rate Limit
```
Key: rate:message:{userId}
Type: String (counter)
Value: Number of messages sent
TTL: 60 seconds (1 minute window)
Purpose: Prevent message spam - limit messages per user per minute
```

Example:
```redis
INCR rate:message:507f1f77bcf86cd799439011
# Returns: 1 (first message)
PEXPIRE rate:message:507f1f77bcf86cd799439011 60000
# Set TTL to 60 seconds

INCR rate:message:507f1f77bcf86cd799439011
# Returns: 2 (second message)

GET rate:message:507f1f77bcf86cd799439011
# Returns: "2"
```

Configuration:
- Limit: 20 messages per window (configurable via `MESSAGE_RATE_LIMIT`)
- Window: 60,000ms (1 minute) (configurable via `MESSAGE_RATE_WINDOW`)

---

### 4. Message Caching (Recommended Addition)

#### Recent Messages Cache
```
Key: messages:{conversationId}:recent
Type: List (LPUSH/RPUSH)
Value: JSON serialized message objects
Max Length: 100 messages
TTL: 1 hour
Purpose: Cache recent messages to reduce database queries
```

Example:
```redis
LPUSH messages:conv123:recent '{"id":"msg1","content":"Hello","senderId":"user1","timestamp":"2025-11-16T10:00:00Z"}'
LTRIM messages:conv123:recent 0 99  # Keep only 100 most recent
EXPIRE messages:conv123:recent 3600  # 1 hour TTL

LRANGE messages:conv123:recent 0 49  # Get 50 most recent messages
```

---

### 5. Unread Message Counts (Recommended Addition)

#### User Unread Count Per Conversation
```
Key: unread:{userId}:{conversationId}
Type: String (counter)
Value: Number of unread messages
TTL: None (persists until read)
Purpose: Track unread message counts for users
```

Example:
```redis
INCR unread:user1:conv123
# Returns: 1

GET unread:user1:conv123
# Returns: "1"

DEL unread:user1:conv123  # Clear when user reads messages
```

#### Total Unread Badge Count
```
Key: unread:{userId}:total
Type: String (counter)
Value: Total unread messages across all conversations
TTL: None
Purpose: Display badge count on app icon
```

Example:
```redis
INCRBY unread:user1:total 5  # Add 5 unread messages
GET unread:user1:total
# Returns: "5"

DECRBY unread:user1:total 3  # Mark 3 as read
GET unread:user1:total
# Returns: "2"
```

---

### 6. Pub/Sub Channels

#### Message Created Event
```
Channel: events:message.created
Pattern: Publish/Subscribe
Payload: JSON
{
  "conversationId": "conv123",
  "messageId": "msg456",
  "senderId": "user789",
  "participantIds": ["user1", "user2"]
}
Purpose: Notify other services (notification-service) about new messages
```

Example:
```redis
# Publisher (Chat Service)
PUBLISH events:message.created '{"conversationId":"conv123","messageId":"msg456","senderId":"user789","participantIds":["user1","user2"]}'

# Subscriber (Notification Service)
SUBSCRIBE events:message.created
# Receives: {"conversationId":"conv123","messageId":"msg456",...}
```

#### User Presence Events
```
Channel: events:user.online
Channel: events:user.offline
Payload: {"userId": "user123", "timestamp": "2025-11-16T10:00:00Z"}
Purpose: Broadcast user online/offline status changes
```

Example:
```redis
PUBLISH events:user.online '{"userId":"user123","timestamp":"2025-11-16T10:00:00Z"}'
PUBLISH events:user.offline '{"userId":"user123","timestamp":"2025-11-16T10:05:00Z"}'
```

---

### 7. Last Seen Timestamps (Recommended Addition)

#### User Last Seen
```
Key: lastseen:{userId}
Type: String
Value: ISO 8601 timestamp
TTL: None
Purpose: Track when user was last active
```

Example:
```redis
SET lastseen:user123 "2025-11-16T10:30:00Z"
GET lastseen:user123
# Returns: "2025-11-16T10:30:00Z"
```

---

### 8. Conversation Member Cache (Recommended Addition)

#### Conversation Participants
```
Key: conversation:{conversationId}:participants
Type: Set
Members: userId1, userId2, ...
TTL: 1 hour
Purpose: Quick lookup of conversation members without DB query
```

Example:
```redis
SADD conversation:conv123:participants "user1" "user2" "user3"
SISMEMBER conversation:conv123:participants "user1"
# Returns: 1 (true)

SMEMBERS conversation:conv123:participants
# Returns: ["user1", "user2", "user3"]

EXPIRE conversation:conv123:participants 3600
```

---

## Redis Configuration

### Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
NOTIFICATION_REDIS_CHANNEL=events:message.created
MESSAGE_RATE_LIMIT=20
MESSAGE_RATE_WINDOW=60000
```

### Connection Settings
- **Retry Strategy**: Exponential backoff (50ms * attempt, max 2000ms)
- **Max Retries**: Unlimited (keeps retrying)
- **Connection Pool**: 3 clients (client, publisher, subscriber)

---

## Usage Examples

### Check if User is Online
```typescript
const isOnline = await redisService.isUserOnline('507f1f77bcf86cd799439011');
console.log(isOnline); // true or false
```

### Add User Socket Connection
```typescript
await redisService.addUserSocket('507f1f77bcf86cd799439011', 'socketId123');
```

### Remove User Socket and Check Offline
```typescript
await redisService.removeUserSocket('507f1f77bcf86cd799439011', 'socketId123');
// Automatically sets user offline if no more sockets
```

### Rate Limit Check
```typescript
const canSend = await redisService.checkMessageRateLimit('507f1f77bcf86cd799439011');
if (!canSend) {
  throw new Error('Rate limit exceeded');
}
```

### Publish Message Event
```typescript
await redisService.publishMessageCreated({
  conversationId: 'conv123',
  messageId: 'msg456',
  senderId: 'user789',
  participantIds: ['user1', 'user2'],
});
```

---

## Key Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `user:` | User-related data | `user:123:online` |
| `socket:` | Socket-related mappings | `socket:abc:user` |
| `typing:` | Typing indicators | `typing:conv1:user2` |
| `rate:` | Rate limiting counters | `rate:message:user1` |
| `messages:` | Message caching | `messages:conv1:recent` |
| `unread:` | Unread counts | `unread:user1:conv2` |
| `lastseen:` | Last activity | `lastseen:user1` |
| `conversation:` | Conversation metadata | `conversation:conv1:participants` |
| `events:` | Pub/Sub channels | `events:message.created` |

---

## Performance Considerations

### TTL Strategy
- **Short TTL (5s)**: Typing indicators (ephemeral state)
- **Medium TTL (1h)**: Cached messages, conversation participants
- **No TTL**: Presence, unread counts (cleared explicitly)

### Memory Optimization
- Use `LTRIM` to limit list sizes (e.g., 100 recent messages)
- Set TTL on all cached data to prevent memory bloat
- Use Sets for membership checks (O(1) lookup)
- Compress JSON payloads if storing large objects

### Indexing Strategy
- Prefix keys by entity type for easy pattern matching
- Use Sets for many-to-many relationships
- Avoid `KEYS` in production (use `SCAN` instead)

---

## Monitoring

### Key Metrics to Track
```redis
INFO stats  # Get Redis statistics
DBSIZE      # Total number of keys
MEMORY STATS # Memory usage breakdown

# Monitor specific patterns
SCAN 0 MATCH user:*:online COUNT 100
SCAN 0 MATCH rate:message:* COUNT 100
```

### Health Checks
```typescript
// Check Redis connection
await redisService.getClient().ping();
// Returns: PONG
```

---

## Migration & Cleanup

### Clear All Typing Indicators
```redis
EVAL "return redis.call('del', unpack(redis.call('keys', 'typing:*')))" 0
```

### Reset Rate Limits
```redis
EVAL "return redis.call('del', unpack(redis.call('keys', 'rate:message:*')))" 0
```

### Clear Expired Sessions
```bash
# Use Redis built-in TTL expiration (automatic)
# Or manually with SCAN + DEL pattern
```

---

## Security Considerations

1. **Authentication**: Always use `REDIS_PASSWORD` in production
2. **Network**: Bind Redis to localhost or private network only
3. **ACL**: Use Redis 6+ ACL for fine-grained permissions
4. **Encryption**: Enable TLS for Redis connections in production

---

## Future Enhancements

### Potential Additions
1. **Session Management**: Store active user sessions
2. **Geolocation Cache**: Cache user locations for proximity search
3. **Media Upload Queue**: Track pending file uploads
4. **Search Cache**: Cache conversation/message search results
5. **Blocked Users**: Cache blocked user lists per user
6. **Delivery Receipts**: Track message delivery status
