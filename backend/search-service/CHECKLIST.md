# Search Service - Setup & Verification Checklist

Use this checklist to verify that the Search Service is properly set up and working.

---

## 📋 Pre-Deployment Checklist

### ✅ Backend Prerequisites

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB Atlas account created
- [ ] MongoDB Atlas cluster running
- [ ] Redis installed or Docker available
- [ ] Git repository set up

### ✅ Environment Setup

- [ ] `.env` file created in `backend/search-service/`
- [ ] `PORT` set to 3007
- [ ] `MONGODB_URI` configured with valid connection string
- [ ] `REDIS_HOST` and `REDIS_PORT` configured
- [ ] `JWT_SECRET` set (same as other services)
- [ ] All other environment variables configured

### ✅ Dependencies Installation

```bash
cd backend/search-service
npm install
```

- [ ] Dependencies installed successfully
- [ ] No errors in package installation
- [ ] `node_modules/` folder created

---

## 🗄️ MongoDB Atlas Setup

### ✅ Database Configuration

- [ ] Database `immobilier_app` exists
- [ ] Collection `properties` exists
- [ ] Collection has sample documents (at least 10 for testing)
- [ ] Documents have required fields (title, description, price, location, etc.)

### ✅ MongoDB Atlas Search Index (CRITICAL!)

This is the MOST IMPORTANT step. Without this, search will not work!

- [ ] Logged into MongoDB Atlas
- [ ] Navigated to cluster → Search tab
- [ ] Clicked "Create Search Index"
- [ ] Selected "JSON Editor"
- [ ] Pasted index configuration from README.md
- [ ] Named index: `properties_search`
- [ ] Selected database: `immobilier_app`
- [ ] Selected collection: `properties`
- [ ] Index status shows "ready" (wait 3-5 minutes)

**Verify Index:**
```javascript
// In mongosh or Atlas console
use immobilier_app
db.properties.getSearchIndexes()
```

Expected output:
```json
[
  {
    "name": "properties_search",
    "status": "ready",
    ...
  }
]
```

### ✅ Database Indexes

- [ ] Text index created on `title`, `description`, `address.city`, `features`
- [ ] Geo index (2dsphere) created on `location.coordinates`
- [ ] Additional indexes on `price`, `type`, `status`, etc.

**Verify Indexes:**
```javascript
db.properties.getIndexes()
```

---

## 🔴 Redis Setup

### ✅ Redis Installation

**Option 1: Docker (Recommended)**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```
- [ ] Redis container running

**Option 2: Windows Redis**
```bash
redis-server
```
- [ ] Redis server running

### ✅ Redis Verification

```bash
redis-cli ping
```
- [ ] Returns "PONG"

```bash
redis-cli INFO
```
- [ ] Shows Redis server info

---

## 🚀 Service Startup

### ✅ Development Mode

```bash
cd backend/search-service
npm run start:dev
```

- [ ] Service starts without errors
- [ ] Shows "NestJS application successfully started"
- [ ] Port 3007 is open
- [ ] No connection errors in logs

### ✅ Service Logs Check

Look for these messages:
- [ ] ✅ "MongoDB connected successfully"
- [ ] ✅ "Redis connected successfully"
- [ ] ✅ "Search Service running on port 3007"
- [ ] ❌ No "ERROR" messages
- [ ] ❌ No "Connection failed" messages

---

## 🧪 API Testing

### ✅ Health Check

```bash
curl http://localhost:3007/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

- [ ] Returns 200 OK
- [ ] MongoDB status is "connected"
- [ ] Redis status is "connected"

### ✅ Basic Search

```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":10}'
```

- [ ] Returns 200 OK
- [ ] Response has `data` array
- [ ] Response has `pagination` object
- [ ] `data` array contains properties

### ✅ Search with Query

```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query":"villa","page":1,"limit":10}'
```

- [ ] Returns results
- [ ] Results match search query

### ✅ Search with Filters

```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "priceMin": 100000,
      "priceMax": 500000,
      "propertyType": "HOUSE"
    },
    "page": 1,
    "limit": 10
  }'
```

- [ ] Returns filtered results
- [ ] All results match filter criteria

### ✅ Autocomplete

```bash
curl "http://localhost:3007/api/v1/search/suggest?q=vil&limit=5"
```

- [ ] Returns array of suggestions
- [ ] Suggestions are relevant

### ✅ Geo Search

```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "geo": {
      "lat": 36.8,
      "lng": 10.2,
      "radiusKm": 10
    },
    "page": 1,
    "limit": 10
  }'
```

- [ ] Returns nearby properties
- [ ] Properties have `distance` field

---

## 🧪 Unit Tests

```bash
cd backend/search-service
npm test
```

- [ ] All tests pass
- [ ] No test failures
- [ ] Coverage report generated

---

## 📱 Flutter Integration

### ✅ Flutter Setup

- [ ] Dependencies added to `pubspec.yaml`
- [ ] `flutter pub get` executed successfully
- [ ] No dependency conflicts

### ✅ Code Generation

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

- [ ] `search_result.g.dart` generated
- [ ] No generation errors

### ✅ API Base URL Configuration

- [ ] Dio provider configured
- [ ] Base URL set correctly:
  - Android Emulator: `http://10.0.2.2:3007/api/v1`
  - iOS Simulator: `http://localhost:3007/api/v1`
  - Physical Device: `http://YOUR_IP:3007/api/v1`

### ✅ Flutter App Testing

**Run the App:**
```bash
flutter run
```

- [ ] App builds successfully
- [ ] No compilation errors

**Test Search Screen:**
- [ ] Navigate to Search screen
- [ ] Search bar appears
- [ ] Type a query (e.g., "villa")
- [ ] Properties appear in results
- [ ] Loading indicator shows while searching
- [ ] Results display correctly with images, price, details

**Test Filters:**
- [ ] Open filter bottom sheet
- [ ] Set price range
- [ ] Select property type
- [ ] Select features
- [ ] Apply filters
- [ ] Results update correctly
- [ ] "Filters Applied" button shows

**Test Sorting:**
- [ ] Open sort options
- [ ] Select "Price: Low to High"
- [ ] Results sort correctly
- [ ] Select "Price: High to Low"
- [ ] Results re-sort
- [ ] Select "Newest"
- [ ] Recent properties appear first

**Test Pagination:**
- [ ] Scroll to bottom of list
- [ ] More results load automatically
- [ ] Loading indicator appears
- [ ] No duplicate properties

**Test Property Details:**
- [ ] Tap on a property card
- [ ] Property details screen opens
- [ ] All information displays correctly

---

## 🔍 Cache Verification

### ✅ Redis Cache Check

```bash
redis-cli

# In Redis CLI:
KEYS search:*
```

- [ ] Cache keys exist after searches
- [ ] Keys have expiration (TTL)

```bash
TTL search:xxxx
```

- [ ] Returns positive number (seconds remaining)

### ✅ Cache Performance

**First Search:**
- [ ] Takes 200-500ms (no cache)
- [ ] Logs show "Cache miss"

**Second Search (same params):**
- [ ] Takes < 100ms (cache hit)
- [ ] Logs show "Cache hit"

---

## 🐳 Docker Deployment (Optional)

### ✅ Docker Build

```bash
cd backend/search-service
docker build -t search-service .
```

- [ ] Image builds successfully
- [ ] No build errors

### ✅ Docker Run

```bash
docker run -p 3007:3007 --env-file .env search-service
```

- [ ] Container starts
- [ ] Health check passes
- [ ] API endpoints work

### ✅ Docker Compose

```bash
docker-compose up -d
```

- [ ] Both services start (search-service + redis)
- [ ] Services are healthy
- [ ] Network connectivity works

```bash
docker-compose ps
```

- [ ] All services show "Up"

---

## 🔒 Security Verification

### ✅ Rate Limiting

**Test Search Endpoint (30/min):**
- [ ] Make 35 rapid requests
- [ ] After 30, get 429 (Too Many Requests)

**Test Autocomplete (60/min):**
- [ ] Make 65 rapid requests
- [ ] After 60, get 429

### ✅ Input Validation

**Test Invalid Page:**
```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"page":-1,"limit":10}'
```
- [ ] Returns 400 Bad Request
- [ ] Error message explains validation issue

**Test Invalid Limit:**
```bash
curl -X POST http://localhost:3007/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":1000}'
```
- [ ] Returns 400 Bad Request

---

## 📊 Performance Testing

### ✅ Response Time Targets

**Search (with cache):**
- [ ] < 100ms average

**Search (without cache):**
- [ ] < 500ms average

**Autocomplete:**
- [ ] < 200ms average

**Health Check:**
- [ ] < 50ms average

### ✅ Load Testing (Optional)

Use tools like Apache Bench or Artillery:

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 -p search.json -T application/json http://localhost:3007/api/v1/search
```

- [ ] No errors under load
- [ ] Response times remain acceptable
- [ ] No memory leaks

---

## 🚦 Integration Verification

### ✅ Multi-Service Test

**Start all services:**
```bash
cd backend
./start-all-simple.ps1
```

- [ ] API Gateway (3000) running
- [ ] Auth Service (3001) running
- [ ] Property Service (3002) running
- [ ] Chat Service (3005) running
- [ ] Notification Service (3006) running
- [ ] **Search Service (3007) running** ✨

**Test through API Gateway (if configured):**
```bash
curl http://localhost:3000/search/health
```

- [ ] Gateway routes to search service
- [ ] Authentication works (if required)

---

## 📝 Documentation Check

### ✅ Documentation Files

- [ ] README.md exists and is complete
- [ ] DEPLOYMENT.md exists and is detailed
- [ ] SUMMARY.md exists
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions clear

### ✅ Code Comments

- [ ] Controllers have comments
- [ ] Services have method descriptions
- [ ] DTOs have field descriptions
- [ ] Complex logic explained

---

## 🎯 Final Acceptance Criteria

### ✅ Backend Acceptance

- [ ] ✅ Service starts without errors
- [ ] ✅ Health endpoint returns 200
- [ ] ✅ MongoDB connected
- [ ] ✅ Redis connected
- [ ] ✅ Atlas Search index created and ready
- [ ] ✅ Basic search works
- [ ] ✅ Full-text search works
- [ ] ✅ All filters work
- [ ] ✅ Geo search works
- [ ] ✅ Sorting works
- [ ] ✅ Pagination works
- [ ] ✅ Autocomplete works
- [ ] ✅ Caching works
- [ ] ✅ All unit tests pass
- [ ] ✅ Rate limiting works
- [ ] ✅ Input validation works

### ✅ Flutter Acceptance

- [ ] ✅ App builds successfully
- [ ] ✅ Search screen displays
- [ ] ✅ Search bar functional
- [ ] ✅ Results display correctly
- [ ] ✅ Filter bottom sheet works
- [ ] ✅ All filters functional
- [ ] ✅ Sorting works
- [ ] ✅ Pagination/infinite scroll works
- [ ] ✅ Property details navigation works
- [ ] ✅ Loading states show
- [ ] ✅ Error states handled
- [ ] ✅ Empty state shows when no results

### ✅ Performance Acceptance

- [ ] ✅ Search responds in < 500ms (without cache)
- [ ] ✅ Search responds in < 100ms (with cache)
- [ ] ✅ Cache hit rate > 70% (after warm-up)
- [ ] ✅ No memory leaks
- [ ] ✅ Handles 100+ concurrent users

### ✅ Integration Acceptance

- [ ] ✅ Works with existing backend services
- [ ] ✅ Shares MongoDB database
- [ ] ✅ Integrates with Flutter app
- [ ] ✅ Can be started with `start-all-simple.ps1`
- [ ] ✅ No conflicts with other services

---

## 🎉 Deployment Ready Checklist

### ✅ Ready for Production

- [ ] All tests pass
- [ ] Performance targets met
- [ ] Security measures in place
- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Logging configured
- [ ] Monitoring set up (optional)
- [ ] Backup strategy (Redis + MongoDB)

### ✅ Production Environment

- [ ] Production `.env` configured
- [ ] MongoDB Atlas production cluster ready
- [ ] Redis production instance ready
- [ ] SSL/TLS certificates (if needed)
- [ ] Domain name configured (if needed)
- [ ] CORS configured for production domain
- [ ] Rate limits adjusted for production load

---

## 🐛 Troubleshooting Guide

### If Health Check Fails:

1. Check MongoDB connection:
   ```bash
   mongosh "your-mongodb-uri"
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   ```

3. Check service logs for errors

### If Search Returns No Results:

1. Verify MongoDB Atlas Search index exists and is "ready"
2. Check collection has documents
3. Verify documents have `isActive: true`
4. Check service logs for errors

### If Search is Slow:

1. Verify Atlas Search index is built
2. Check cache is working (Redis logs)
3. Verify MongoDB indexes exist
4. Check MongoDB Atlas cluster tier

### If Flutter Cannot Connect:

1. Check correct IP address:
   - Android Emulator: `10.0.2.2`
   - iOS Simulator: `localhost`
   - Physical device: Your computer's local IP

2. Check Windows Firewall
3. Verify backend is running
4. Check Dio base URL configuration

---

## ✅ Sign-Off

### Developer Sign-Off

- [ ] I have completed all setup steps
- [ ] I have verified all tests pass
- [ ] I have tested the API manually
- [ ] I have tested the Flutter integration
- [ ] I have reviewed the documentation
- [ ] The service is ready for use

**Date:** ________________

**Developer:** ________________

---

## 📞 Support

If you encounter issues not covered in this checklist:

1. Review service logs: `npm run start:dev`
2. Check MongoDB Atlas logs
3. Check Redis logs: `redis-cli MONITOR`
4. Review DEPLOYMENT.md troubleshooting section
5. Check GitHub issues (if applicable)

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Complete
