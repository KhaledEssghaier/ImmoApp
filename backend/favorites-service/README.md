# Favorites Service - Real Estate App

Complete Favorites/Wishlist microservice with backend (NestJS + MongoDB + Redis) and Flutter mobile integration featuring offline-first architecture with optimistic updates.

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│   Flutter Client    │
│  (Offline Queue)    │
└──────────┬──────────┘
           │ JWT Auth
           ▼
┌─────────────────────┐
│  Favorites Service  │
│   (NestJS:3009)     │
└──────┬──────────────┘
       │
   ┌───┴───┬───────┬─────────┐
   ▼       ▼       ▼         ▼
 MongoDB  Redis  Events  Property
(Favorites)(Cache)(Emit) (Counts)
```

## 📦 Features

### Backend
- ✅ REST API with JWT authentication
- ✅ MongoDB with unique compound indexes
- ✅ Redis caching (30s TTL for IDs)
- ✅ Event emission (favorite.added/removed)
- ✅ Atomic property favorites count updates
- ✅ Idempotent add/remove operations
- ✅ Sync endpoint for offline reconciliation
- ✅ Comprehensive unit & E2E tests
- ✅ Docker support with health checks

### Frontend (Flutter)
- ✅ Optimistic UI updates
- ✅ Offline queue with Hive persistence
- ✅ Auto-sync on reconnect
- ✅ Animated heart button with loading states
- ✅ Wishlist page with sync status indicators
- ✅ Riverpod state management
- ✅ Network connectivity detection

---

## 🚀 Backend Setup

### Prerequisites
- Node.js 20+
- MongoDB 6+
- Redis 7+

### Installation

```bash
cd backend/favorites-service
npm install
```

### Environment Configuration

Create `.env` file:

```env
PORT=3009
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/immobilier_favorites
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FAVORITES_CACHE_TTL=30
API_PREFIX=api/v1
```

### Database Indexes

The service automatically creates these indexes:

```javascript
// Unique compound index (prevent duplicates)
{ userId: 1, propertyId: 1 } unique: true

// Property favorites count index
{ propertyId: 1 }

// User favorites sorted by newest
{ userId: 1, createdAt: -1 }
```

### Run Development Server

```bash
npm run start:dev
```

Server runs on: `http://localhost:3009/api/v1`

API Docs: `http://localhost:3009/api/docs`

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Docker Deployment

```bash
# Build image
docker build -t appimmo-favorites-service .

# Run with docker-compose
docker-compose up favorites-service
```

---

## 📡 API Endpoints

### Add Favorite
```bash
POST /api/v1/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "64b8f5e2c1234567890abcde",
  "source": "mobile"
}

# Response: 201 Created (or 200 if already exists - idempotent)
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "propertyId": "64b8f5e2c1234567890abcde",
    "source": "mobile",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Favorite added successfully"
}
```

### Remove Favorite
```bash
DELETE /api/v1/favorites/:propertyId
Authorization: Bearer <token>

# Response: 204 No Content (idempotent)
```

### Get Favorite IDs (Fast Sync)
```bash
GET /api/v1/favorites/ids
Authorization: Bearer <token>

# Response: 200 OK (cached 30s)
{
  "success": true,
  "data": [
    "64b8f5e2c1234567890abcde",
    "64b8f5e2c1234567890abcdf"
  ],
  "count": 2
}
```

### Get Favorites (Paginated)
```bash
GET /api/v1/favorites?page=1&limit=20
Authorization: Bearer <token>

# Response: 200 OK
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Sync Favorites
```bash
POST /api/v1/favorites/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyIds": [
    "64b8f5e2c1234567890abcde",
    "64b8f5e2c1234567890abcdf",
    "64b8f5e2c1234567890abcd0"
  ],
  "source": "mobile"
}

# Response: 200 OK
{
  "success": true,
  "data": {
    "added": ["64b8f5e2c1234567890abcd0"],
    "removed": ["64b8f5e2c1234567890abcd1"],
    "current": [
      "64b8f5e2c1234567890abcde",
      "64b8f5e2c1234567890abcdf",
      "64b8f5e2c1234567890abcd0"
    ]
  },
  "message": "Sync complete: 1 added, 1 removed"
}
```

### Get Property Favorites Count
```bash
GET /api/v1/properties/:propertyId/favorites/count

# Response: 200 OK (cached 5min)
{
  "success": true,
  "data": {
    "propertyId": "64b8f5e2c1234567890abcde",
    "favoritesCount": 42
  }
}
```

### Check if Property is Favorited
```bash
GET /api/v1/favorites/check/:propertyId
Authorization: Bearer <token>

# Response: 200 OK
{
  "success": true,
  "data": {
    "propertyId": "64b8f5e2c1234567890abcde",
    "isFavorited": true
  }
}
```

---

## 📱 Flutter Integration

### Add Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter_riverpod: ^2.6.1
  dio: ^5.7.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  connectivity_plus: ^6.0.0
```

### Initialize Hive

In `main.dart`:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for offline storage
  await Hive.initFlutter();
  
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### Usage Examples

#### 1. Add Favorite Button to Property Card

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/favorites/widgets/favorite_button.dart';

class PropertyCard extends StatelessWidget {
  final Property property;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Stack(
        children: [
          // Property image and info...
          
          // Favorite button
          Positioned(
            top: 8,
            right: 8,
            child: CompactFavoriteButton(
              propertyId: property.id,
            ),
          ),
        ],
      ),
    );
  }
}
```

#### 2. Property Detail Page with Large Button

```dart
LargeFavoriteButton(
  propertyId: property.id,
  showLabel: true,
)
```

#### 3. Navigate to Wishlist Page

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => WishlistPage(),
  ),
);
```

#### 4. Programmatic Favorite Toggle

```dart
// In a ConsumerWidget or ConsumerStatefulWidget
ref.read(favoritesProvider.notifier).toggleFavorite(propertyId);
```

#### 5. Check if Property is Favorited

```dart
final isFavorite = ref.watch(isFavoriteProvider(propertyId));

if (isFavorite) {
  // Show filled heart
} else {
  // Show outlined heart
}
```

#### 6. Listen to Sync Status

```dart
final hasPending = ref.watch(hasPendingFavoritesProvider);

if (hasPending) {
  // Show "Syncing..." indicator
}
```

---

## 🔄 Offline Sync Algorithm

### How It Works

1. **User Action (Add/Remove)**
   ```
   ├─ Update UI immediately (optimistic)
   ├─ Save to local cache (Hive)
   ├─ Check network connectivity
   │
   ├─ If ONLINE:
   │  ├─ Try API call
   │  ├─ Success → Mark as synced
   │  └─ Failure → Add to offline queue
   │
   └─ If OFFLINE:
      └─ Add to offline queue (FIFO)
   ```

2. **On Reconnect**
   ```
   ├─ Process pending queue (FIFO order)
   │  ├─ For each operation:
   │  │  ├─ Execute API call
   │  │  ├─ Success → Remove from queue
   │  │  └─ Failure → Mark as failed, keep in queue
   │  │
   ├─ Fetch server state (GET /favorites/ids)
   ├─ Reconcile differences
   └─ Update local cache
   ```

3. **Sync Endpoint Logic**
   ```
   Client sends: [id1, id2, id3]
   Server has:   [id2, id4, id5]
   
   Server actions:
   ├─ Add: id1, id3 (in client, not in server)
   ├─ Remove: id4, id5 (in server, not in client)
   └─ Return: [id1, id2, id3] (final state)
   ```

### Conflict Resolution

- **Client state wins**: If pending operations exist, client changes are applied to server
- **Server as source of truth**: If no pending operations, server state overwrites client
- **Last-write-wins**: For concurrent operations on different devices

### Status Indicators

- **Synced** ✓: Green checkmark, operation completed
- **Pending** ⏳: Orange spinner, queued for sync
- **Failed** ⚠️: Red warning badge, will retry on next sync

---

## 🧪 Testing

### Backend Tests

#### Unit Test Example
```typescript
it('should be idempotent - adding same favorite twice returns 200', async () => {
  const propertyId = '64b8f5e2c1234567890abcdf';
  
  // Add first time
  await request(app.getHttpServer())
    .post('/api/v1/favorites')
    .set('Authorization', authToken)
    .send({ propertyId })
    .expect(201);
  
  // Add second time (idempotent)
  await request(app.getHttpServer())
    .post('/api/v1/favorites')
    .set('Authorization', authToken)
    .send({ propertyId })
    .expect(200);
});
```

#### Concurrency Test
```typescript
it('should handle concurrent add requests without duplicates', async () => {
  const propertyId = '64b8f5e2c1234567890abcdf';
  
  // Send 10 concurrent requests
  const requests = Array(10).fill(null).map(() =>
    request(app.getHttpServer())
      .post('/api/v1/favorites')
      .set('Authorization', authToken)
      .send({ propertyId }),
  );
  
  await Promise.all(requests);
  
  // Verify only 1 favorite created
  const favorites = await connection
    .collection('favorites')
    .find({ propertyId })
    .toArray();
  
  expect(favorites.length).toBe(1);
});
```

### Flutter Widget Tests

```dart
testWidgets('FavoriteButton shows loading when pending', (tester) async {
  // TODO: Implement widget test
  // Verify CircularProgressIndicator appears for pending state
});

testWidgets('Wishlist page syncs on load', (tester) async {
  // TODO: Implement integration test
  // Mock network responses and verify sync behavior
});
```

---

## 🔧 Configuration Options

### Property Favorites Count

The service supports two modes for counting favorites per property:

#### Option 1: Materialized Counter (Default)
```typescript
// Updates properties.favoritesCount atomically
await propertiesCollection.updateOne(
  { _id: propertyId },
  { $inc: { favoritesCount: increment } }
);
```

**Pros**: Fast reads, no counting queries  
**Cons**: Requires properties collection access

#### Option 2: Count on Demand
```typescript
// Comment out incrementPropertyFavoritesCount() calls
// Use countDocuments when needed:
const count = await favoriteModel.countDocuments({ propertyId });
```

**Pros**: No coupling with properties service  
**Cons**: Slower, requires query on each read

### Cache TTL Configuration

Adjust in `.env`:
```env
FAVORITES_CACHE_TTL=30  # Favorites IDs cache (seconds)
```

Redis cache keys:
- `favorites:ids:{userId}` - 30s TTL
- `property:favorites:count:{propertyId}` - 300s (5min) TTL

---

## 📊 Monitoring & Events

### Event Emission

The service emits events for other microservices:

```typescript
// favorite.added
{
  userId: '64b8...',
  propertyId: '64b8...',
  source: 'mobile',
  timestamp: '2024-01-15T10:30:00Z'
}

// favorite.removed
{
  userId: '64b8...',
  propertyId: '64b8...',
  timestamp: '2024-01-15T10:31:00Z'
}
```

### Consumers (Other Services)

- **Analytics Service**: Track user preferences
- **Notification Service**: Send alerts when favorited property updated
- **Property Service**: Update favorites count, track popularity
- **Recommendation Service**: Use for collaborative filtering

### Health Check

```bash
GET /api/v1/health

# Response
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🐛 Troubleshooting

### Issue: Favorites not syncing

**Solution**:
1. Check network connectivity
2. Verify JWT token is valid
3. Check pending queue: `ref.read(favoritesProvider).pendingQueue`
4. Manually trigger sync: `ref.read(favoritesProvider.notifier).syncWithServer()`

### Issue: Duplicate favorites created

**Solution**:
- Verify MongoDB unique index exists: `{ userId: 1, propertyId: 1 }`
- Check logs for E11000 errors (duplicate key)

### Issue: Redis cache not working

**Solution**:
1. Verify Redis connection: `redis-cli ping`
2. Check REDIS_URL environment variable
3. Monitor logs for Redis errors

### Issue: Property count not updating

**Solution**:
1. Verify properties collection exists
2. Check MongoDB connection permissions
3. Ensure `incrementPropertyFavoritesCount()` is called

---

## 📈 Performance Optimization

### Tips

1. **Batch Operations**: Use sync endpoint for multiple changes
2. **Cache Warming**: Pre-fetch favorites on login
3. **Lazy Loading**: Load wishlist properties on-demand
4. **Index Optimization**: Ensure all indexes are created
5. **Redis Connection Pooling**: Use ioredis cluster for production

### Scaling

- **Horizontal Scaling**: Service is stateless, scale with load balancer
- **MongoDB Sharding**: Shard by `userId` for large datasets
- **Redis Cluster**: Use Redis cluster for high-traffic scenarios
- **CDN**: Cache property images separately

---

## 📝 License

MIT

---

## 👥 Contributors

AppImmo Team

---

## 🔗 Related Services

- **Auth Service** (Port 3001): User authentication
- **Property Service** (Port 3002): Property management
- **API Gateway** (Port 3000): Request routing
- **Chat Service** (Port 3005): Messaging
- **Notification Service** (Port 3006): Push notifications

---

**Built with ❤️ using NestJS, MongoDB, Redis, and Flutter**
