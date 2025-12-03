# API Testing Commands - Favorites Service

## Prerequisites

```bash
# 1. Start the service
cd backend/favorites-service
npm run start:dev

# 2. Get JWT token (from auth service)
export TOKEN="your-jwt-token-here"
```

---

## Health Check

```bash
# Basic health check (no auth required)
curl http://localhost:3009/api/v1/favorites/health

# Expected: {"status":"ok","service":"favorites-service","timestamp":"2024-01-15T10:30:00.000Z"}
```

---

## Add Favorite

```bash
# Add a favorite property
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "64b8f5e2c1234567890abcde",
    "source": "mobile"
  }'

# Expected Response (201 Created):
# {
#   "success": true,
#   "data": {
#     "_id": "...",
#     "userId": "...",
#     "propertyId": "64b8f5e2c1234567890abcde",
#     "source": "mobile",
#     "createdAt": "2024-01-15T10:30:00Z"
#   },
#   "message": "Favorite added successfully"
# }

# Idempotency test - run again with same propertyId
# Expected: 200 OK (returns existing favorite)
```

---

## Get Favorite IDs (Fast Sync)

```bash
# Get list of favorite property IDs (cached 30s)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/ids

# Expected Response:
# {
#   "success": true,
#   "data": [
#     "64b8f5e2c1234567890abcde",
#     "64b8f5e2c1234567890abcdf",
#     "64b8f5e2c1234567890abcd0"
#   ],
#   "count": 3
# }

# Test cache - run twice quickly, second should be from cache (check logs)
```

---

## Get Paginated Favorites

```bash
# Get first page (20 items)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites?page=1&limit=20"

# Expected Response:
# {
#   "success": true,
#   "data": [
#     {
#       "_id": "...",
#       "userId": "...",
#       "propertyId": "64b8f5e2c1234567890abcde",
#       "source": "mobile",
#       "createdAt": "2024-01-15T10:30:00Z"
#     }
#   ],
#   "pagination": {
#     "page": 1,
#     "limit": 20,
#     "total": 45,
#     "pages": 3
#   }
# }

# Get second page
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites?page=2&limit=20"

# Get with smaller limit
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites?page=1&limit=5"
```

---

## Remove Favorite

```bash
# Remove a favorite property
curl -X DELETE http://localhost:3009/api/v1/favorites/64b8f5e2c1234567890abcde \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 204 No Content (empty body)

# Idempotency test - run again with same propertyId
# Expected: 204 No Content (still succeeds)
```

---

## Sync Favorites

```bash
# Sync client state with server
curl -X POST http://localhost:3009/api/v1/favorites/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyIds": [
      "64b8f5e2c1234567890abcde",
      "64b8f5e2c1234567890abcdf",
      "64b8f5e2c1234567890abcd0"
    ],
    "source": "mobile"
  }'

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "added": ["64b8f5e2c1234567890abcd0"],
#     "removed": ["64b8f5e2c1234567890abcd1"],
#     "current": [
#       "64b8f5e2c1234567890abcde",
#       "64b8f5e2c1234567890abcdf",
#       "64b8f5e2c1234567890abcd0"
#     ]
#   },
#   "message": "Sync complete: 1 added, 1 removed"
# }

# Test reconciliation:
# 1. Add properties A, B, C via API
# 2. Send sync with [B, D, E]
# 3. Server should add D, E and remove A, C (keeping B)
```

---

## Check if Property is Favorited

```bash
# Check specific property
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/check/64b8f5e2c1234567890abcde

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "propertyId": "64b8f5e2c1234567890abcde",
#     "isFavorited": true
#   }
# }

# Test with non-favorited property
# Expected: isFavorited = false
```

---

## Get Property Favorites Count

```bash
# Get count for a property (no auth required)
curl http://localhost:3009/api/v1/properties/64b8f5e2c1234567890abcde/favorites/count

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "propertyId": "64b8f5e2c1234567890abcde",
#     "favoritesCount": 42
#   }
# }

# Test atomic increment:
# 1. Check count (e.g., 10)
# 2. Add favorite
# 3. Check count again (should be 11)
# 4. Remove favorite
# 5. Check count again (should be 10)
```

---

## Get Property Favorites (Admin)

```bash
# Get all users who favorited a property
curl http://localhost:3009/api/v1/properties/64b8f5e2c1234567890abcde/favorites?page=1&limit=50

# Expected Response:
# {
#   "success": true,
#   "data": [
#     {
#       "_id": "...",
#       "userId": "user1_id",
#       "propertyId": "64b8f5e2c1234567890abcde",
#       "createdAt": "2024-01-15T10:30:00Z"
#     },
#     {
#       "_id": "...",
#       "userId": "user2_id",
#       "propertyId": "64b8f5e2c1234567890abcde",
#       "createdAt": "2024-01-15T10:31:00Z"
#     }
#   ],
#   "pagination": {
#     "page": 1,
#     "limit": 50,
#     "total": 42
#   }
# }
```

---

## Error Cases to Test

### 1. Missing Token
```bash
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "64b8f5e2c1234567890abcde"}'

# Expected: 401 Unauthorized
```

### 2. Invalid Token
```bash
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer invalid-token-xyz" \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "64b8f5e2c1234567890abcde"}'

# Expected: 401 Unauthorized
```

### 3. Missing Required Field
```bash
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "mobile"}'

# Expected: 400 Bad Request (propertyId is required)
```

### 4. Invalid Property ID Format
```bash
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "invalid-id"}'

# Expected: 400 Bad Request or 500 (depending on validation)
```

---

## Concurrency Test

```bash
# Test with parallel requests (requires GNU parallel or similar)
# This tests the unique index - all should succeed but only 1 record created

seq 1 10 | parallel -j 10 \
  'curl -X POST http://localhost:3009/api/v1/favorites \
    -H "Authorization: Bearer '"$TOKEN"'" \
    -H "Content-Type: application/json" \
    -d "{\"propertyId\": \"64b8f5e2c1234567890abcde\"}"'

# Verify only 1 record in database:
# mongo immobilier_favorites
# > db.favorites.countDocuments({propertyId: ObjectId("64b8f5e2c1234567890abcde")})
# Expected: 1
```

---

## Load Test

```bash
# Simple load test with Apache Bench (ab)
# Add 100 favorites (sequential)

# First, get token
TOKEN="your-token-here"

# Create test file
echo "POST /api/v1/favorites" > test.txt
echo "Authorization: Bearer $TOKEN" >> test.txt
echo "Content-Type: application/json" >> test.txt
echo "" >> test.txt
echo '{"propertyId": "64b8f5e2c1234567890abcde"}' >> test.txt

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p test.txt -T "application/json" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/ids

# Check results:
# - Requests per second
# - Mean time per request
# - Failed requests (should be 0)
```

---

## Cache Testing

```bash
# Test Redis cache behavior

# 1. Clear Redis cache
redis-cli FLUSHALL

# 2. First call (cache MISS - check logs)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/ids

# 3. Second call within 30s (cache HIT - check logs, should be faster)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/ids

# 4. Wait 31 seconds, third call (cache MISS - expired)
sleep 31
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3009/api/v1/favorites/ids
```

---

## MongoDB Queries (Direct Testing)

```bash
# Connect to MongoDB
mongo immobilier_favorites

# Check indexes
db.favorites.getIndexes()
# Expected: Unique compound index on {userId: 1, propertyId: 1}

# Count total favorites
db.favorites.countDocuments()

# Find favorites for a user
db.favorites.find({userId: ObjectId("your-user-id")}).pretty()

# Find all users who favorited a property
db.favorites.find({propertyId: ObjectId("property-id")}).pretty()

# Check for duplicates (should return 0)
db.favorites.aggregate([
  { $group: { 
      _id: { userId: "$userId", propertyId: "$propertyId" },
      count: { $sum: 1 }
  }},
  { $match: { count: { $gt: 1 } }}
])

# Check property favorites count in properties collection
db.properties.findOne({_id: ObjectId("property-id")}, {favoritesCount: 1})
```

---

## Integration Test Flow

```bash
#!/bin/bash
# Complete integration test

TOKEN="your-token-here"
PROPERTY_ID="64b8f5e2c1234567890abcde"

echo "=== Integration Test Started ==="

# 1. Health check
echo "\n1. Health Check..."
curl -s http://localhost:3009/api/v1/favorites/health | jq .

# 2. Get initial favorites (should be empty or have existing)
echo "\n2. Get initial favorites..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites/ids" | jq .count

# 3. Add favorite
echo "\n3. Adding favorite..."
curl -s -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\": \"$PROPERTY_ID\"}" | jq .success

# 4. Verify it was added
echo "\n4. Verifying favorite was added..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites/check/$PROPERTY_ID" | jq .data.isFavorited

# 5. Check count increased
echo "\n5. Checking property favorites count..."
curl -s "http://localhost:3009/api/v1/properties/$PROPERTY_ID/favorites/count" | jq .data.favoritesCount

# 6. Remove favorite
echo "\n6. Removing favorite..."
curl -s -X DELETE "http://localhost:3009/api/v1/favorites/$PROPERTY_ID" \
  -H "Authorization: Bearer $TOKEN" -w "\nStatus: %{http_code}\n"

# 7. Verify it was removed
echo "\n7. Verifying favorite was removed..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3009/api/v1/favorites/check/$PROPERTY_ID" | jq .data.isFavorited

echo "\n=== Integration Test Complete ==="
```

---

## Troubleshooting Commands

```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Check if Redis is running
redis-cli ping

# View service logs
cd backend/favorites-service
npm run start:dev
# Watch for: "✓ Redis connected", "🚀 Favorites Service running"

# Check MongoDB collections
mongo immobilier_favorites --eval "db.getCollectionNames()"

# Check Redis keys
redis-cli KEYS "favorites:*"

# Get Redis key value
redis-cli GET "favorites:ids:your-user-id"

# Clear specific cache
redis-cli DEL "favorites:ids:your-user-id"

# Monitor Redis activity
redis-cli MONITOR

# Check MongoDB connection
mongo $MONGO_URI --eval "db.stats()"
```

---

## Quick Test Script

Save as `test-favorites.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3009/api/v1"
TOKEN="${1:-your-default-token}"

# Test functions
test_health() {
  echo "Testing health endpoint..."
  curl -s "$BASE_URL/favorites/health" | jq .
}

test_add() {
  echo "Testing add favorite..."
  curl -s -X POST "$BASE_URL/favorites" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"propertyId": "64b8f5e2c1234567890abcde"}' | jq .
}

test_list() {
  echo "Testing list favorites..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/favorites/ids" | jq .
}

test_remove() {
  echo "Testing remove favorite..."
  curl -s -X DELETE "$BASE_URL/favorites/64b8f5e2c1234567890abcde" \
    -H "Authorization: Bearer $TOKEN" -w "\nHTTP Status: %{http_code}\n"
}

# Run all tests
test_health
test_add
test_list
test_remove

echo "All tests complete!"
```

Usage: `./test-favorites.sh your-jwt-token`

---

**Happy Testing! 🧪**
