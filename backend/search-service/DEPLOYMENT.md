# Search Service - Complete Deployment Guide

## 📋 Overview

This guide covers the complete setup and deployment of the Search Service for the Real Estate mobile app.

## 🔧 Prerequisites

- [x] Node.js 20+ installed
- [x] MongoDB Atlas account
- [x] Redis server (local or cloud)
- [x] npm or yarn
- [x] Existing backend services running (auth, property, etc.)

---

## 🚀 Part 1: Backend Setup

### Step 1: Install Dependencies

```powershell
cd backend/search-service
npm install
```

### Step 2: Configure Environment

Create `.env` file in `backend/search-service/`:

```env
# Server
PORT=3007
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app?retryWrites=true&w=majority

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cache Settings
CACHE_TTL=60
SEARCH_MAX_RESULTS=100
DEFAULT_PAGE_SIZE=20

# Security
JWT_SECRET=your-jwt-secret-key
INTERNAL_API_KEY=search_svc_key
```

### Step 3: Create MongoDB Atlas Search Index

**CRITICAL STEP**: Without this index, search will not work!

#### Option A: Using MongoDB Atlas UI

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click **"Search"** tab
4. Click **"Create Search Index"**
5. Choose **"JSON Editor"**
6. Select database: `immobilier_app`
7. Select collection: `properties`
8. Paste this JSON configuration:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "address": {
        "type": "document",
        "fields": {
          "city": {
            "type": "string",
            "analyzer": "lucene.standard"
          },
          "street": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "features": {
        "type": "string",
        "analyzer": "lucene.keyword"
      },
      "type": {
        "type": "string",
        "analyzer": "lucene.keyword"
      },
      "status": {
        "type": "string",
        "analyzer": "lucene.keyword"
      },
      "price": {
        "type": "number"
      },
      "rooms": {
        "type": "number"
      },
      "bathrooms": {
        "type": "number"
      },
      "surface": {
        "type": "number"
      },
      "location": {
        "type": "geo"
      },
      "isActive": {
        "type": "boolean"
      },
      "createdAt": {
        "type": "date"
      }
    }
  }
}
```

9. Name the index: **`properties_search`**
10. Click **"Create Search Index"**
11. Wait 3-5 minutes for index to build

#### Option B: Using mongosh (Command Line)

```javascript
use immobilier_app

db.properties.createSearchIndex({
  name: "properties_search",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        title: { type: "string", analyzer: "lucene.standard" },
        description: { type: "string", analyzer: "lucene.standard" },
        "address.city": { type: "string", analyzer: "lucene.standard" },
        features: { type: "string", analyzer: "lucene.keyword" },
        type: { type: "string", analyzer: "lucene.keyword" },
        status: { type: "string", analyzer: "lucene.keyword" },
        price: { type: "number" },
        rooms: { type: "number" },
        bathrooms: { type: "number" },
        surface: { type: "number" },
        location: { type: "geo" },
        isActive: { type: "boolean" },
        createdAt: { type: "date" }
      }
    }
  }
})
```

### Step 4: Verify Search Index

```javascript
// In mongosh
db.properties.getSearchIndexes()
```

You should see your index with status `"ready"`.

### Step 5: Start Redis (if not running)

```powershell
# Windows (using Docker)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or using Windows Redis
redis-server
```

### Step 6: Run the Service

```powershell
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Step 7: Test the API

Open a new terminal:

```powershell
# Health check
curl http://localhost:3007/api/v1/health

# Test search
curl -X POST http://localhost:3007/api/v1/search -H "Content-Type: application/json" -d "{\"query\":\"villa\",\"page\":1,\"limit\":10}"

# Test autocomplete
curl http://localhost:3007/api/v1/search/suggest?q=vil&limit=5
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T16:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

## 📱 Part 2: Flutter Integration

### Step 1: Add Dependencies

In `pubspec.yaml`:

```yaml
dependencies:
  dio: ^5.4.0
  flutter_riverpod: ^2.4.9
  json_annotation: ^4.8.1

dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

```powershell
flutter pub get
```

### Step 2: Generate JSON Serialization

```powershell
flutter pub run build_runner build --delete-conflicting-outputs
```

This generates:
- `search_result.g.dart`
- Any other `*.g.dart` files for models

### Step 3: Update API Base URL

In `lib/features/search/presentation/providers/search_providers.dart`, update:

```dart
final searchDioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: 'http://10.0.2.2:3007/api/v1', // Android Emulator
    // baseUrl: 'http://localhost:3007/api/v1', // iOS Simulator
    // baseUrl: 'https://your-domain.com/api/v1', // Production
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  return dio;
});
```

### Step 4: Add Search Screen to Routes

In `lib/main.dart` or your router:

```dart
import 'features/search/presentation/screens/search_screen.dart';

// Add route
routes: {
  '/search': (context) => const SearchScreen(),
  // ... other routes
}
```

### Step 5: Add Search Button to Home Screen

```dart
// In your home screen
ElevatedButton.icon(
  onPressed: () {
    Navigator.pushNamed(context, '/search');
  },
  icon: const Icon(Icons.search),
  label: const Text('Search Properties'),
)
```

---

## 🐳 Part 3: Docker Deployment (Optional)

### Using Docker Compose

```powershell
cd backend/search-service

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f search-service

# Stop services
docker-compose down
```

### Using Docker Only

```powershell
# Build image
docker build -t search-service .

# Run container
docker run -d \
  --name search-service \
  -p 3007:3007 \
  --env-file .env \
  search-service

# View logs
docker logs -f search-service
```

---

## 🧪 Part 4: Testing

### Backend Tests

```powershell
cd backend/search-service

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Manual Testing Checklist

- [ ] Health endpoint returns 200
- [ ] Basic search returns results
- [ ] Full-text search works (try "villa sea view")
- [ ] Price filters work (priceMin/Max)
- [ ] Property type filter works
- [ ] Bedrooms/bathrooms filters work
- [ ] Geo search returns nearby properties
- [ ] Sorting works (price_asc, price_desc, newest)
- [ ] Pagination works (page 2, 3, etc.)
- [ ] Autocomplete suggestions appear
- [ ] Cache is working (check Redis or logs)

### Flutter Testing

1. Open the app
2. Navigate to Search screen
3. Try searching for "villa"
4. Apply filters (price range, bedrooms, etc.)
5. Test sorting options
6. Scroll to load more results
7. Tap on a property to view details

---

## 🔍 Part 5: Troubleshooting

### Issue: "No results found" or Empty Array

**Solution:**
1. Check if MongoDB Atlas Search index is created and status is "ready"
2. Verify collection has documents: `db.properties.countDocuments()`
3. Check if documents have `isActive: true`
4. Review service logs for errors

### Issue: "MongoDB connection failed"

**Solution:**
1. Check `MONGODB_URI` in `.env`
2. Verify MongoDB Atlas network access (add your IP)
3. Check if cluster is running
4. Test connection with mongosh

### Issue: "Redis connection failed"

**Solution:**
1. Start Redis: `redis-server` or `docker run redis`
2. Check `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Test connection: `redis-cli ping` (should return "PONG")

### Issue: "Search is slow"

**Solution:**
1. Check if Atlas Search index is built
2. Verify caching is working (check logs for "Cache hit")
3. Increase cache TTL in `.env`
4. Add more MongoDB indexes
5. Check MongoDB Atlas cluster tier (upgrade if needed)

### Issue: "Flutter app cannot connect to backend"

**Solution:**
1. For Android Emulator, use `http://10.0.2.2:3007`
2. For iOS Simulator, use `http://localhost:3007`
3. For physical device, use your computer's IP: `http://192.168.x.x:3007`
4. Check Windows Firewall settings
5. Verify backend is running: `curl http://localhost:3007/api/v1/health`

---

## 📊 Part 6: Monitoring & Performance

### Key Metrics to Track

1. **Response Time**:
   - With cache: < 100ms (target)
   - Without cache: < 500ms (target)
   
2. **Cache Hit Rate**:
   - Target: > 70%
   - Check logs for "Cache hit" vs "Cache miss"

3. **Error Rate**:
   - Target: < 1%
   - Monitor for 500 errors

### Logs to Monitor

```powershell
# Watch service logs
npm run start:dev

# Look for:
# ✅ "Cache hit for key: ..."
# 📊 "Search completed in 245ms"
# ❌ "Error: ..."
```

### Redis Monitoring

```powershell
redis-cli

# Check cache keys
KEYS search:*

# Get cache stats
INFO stats

# Monitor cache in real-time
MONITOR
```

---

## 🚢 Part 7: Production Deployment

### Environment Variables for Production

```env
PORT=3007
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:pwd@prod-cluster.mongodb.net/immobilier_app
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
CACHE_TTL=300
JWT_SECRET=your-very-secure-secret
```

### Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable CORS only for your domain
- [ ] Use HTTPS in production
- [ ] Enable rate limiting (already configured)
- [ ] Set up MongoDB Atlas IP whitelist
- [ ] Use Redis with password (AUTH)
- [ ] Enable MongoDB Atlas audit logs
- [ ] Set up alerts for errors

### Performance Optimization

1. **MongoDB Atlas**:
   - Use M10+ cluster tier for production
   - Enable auto-scaling
   - Monitor slow queries
   
2. **Redis**:
   - Use Redis Cloud or ElastiCache
   - Enable persistence (AOF or RDB)
   - Set maxmemory-policy to allkeys-lru

3. **Backend**:
   - Enable gzip compression
   - Use CDN for static assets
   - Implement request queuing
   - Add more cache layers

---

## 📚 Part 8: API Documentation

### Main Search Endpoint

**POST** `/api/v1/search`

**Rate Limit**: 30 requests/minute

**Example Request**:
```json
{
  "query": "luxury villa",
  "filters": {
    "priceMin": 100000,
    "priceMax": 500000,
    "propertyType": "VILLA",
    "status": "FOR_SALE",
    "bedroomsMin": 3,
    "features": ["pool", "garden"]
  },
  "geo": {
    "lat": 36.8,
    "lng": 10.2,
    "radiusKm": 10
  },
  "sort": "price_asc",
  "page": 1,
  "limit": 20
}
```

**Example Response**:
```json
{
  "data": [
    {
      "_id": "...",
      "title": "Luxury Villa",
      "price": 450000,
      "type": "VILLA",
      "rooms": 4,
      "bathrooms": 3,
      "surface": 300,
      "address": {
        "city": "Tunis",
        "street": "Avenue Habib Bourguiba"
      },
      "location": {
        "type": "Point",
        "coordinates": [10.2, 36.8]
      },
      "features": ["pool", "garden", "parking"],
      "images": ["https://..."],
      "distance": 5420
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

---

## ✅ Final Checklist

### Backend:
- [ ] MongoDB Atlas Search index created
- [ ] Redis running and connected
- [ ] Environment variables configured
- [ ] Service starts without errors
- [ ] Health endpoint returns 200
- [ ] Search API returns results
- [ ] Autocomplete works

### Flutter:
- [ ] Dependencies installed
- [ ] JSON serialization generated
- [ ] API base URL configured
- [ ] Search screen added to routes
- [ ] Search functionality tested

### Integration:
- [ ] Flutter app connects to backend
- [ ] Search returns results
- [ ] Filters work correctly
- [ ] Pagination loads more results
- [ ] Property details screen opens

### Production:
- [ ] Environment variables secured
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Logs configured

---

## 🎉 Success!

Your Search Service is now fully deployed! 

**Test it:**
1. Open your Flutter app
2. Navigate to Search screen
3. Search for properties
4. Apply filters and sorting
5. View property details

For support or issues, check:
- Service logs: `npm run start:dev`
- Redis: `redis-cli MONITOR`
- MongoDB Atlas: Monitoring tab
- Flutter logs: `flutter logs`
