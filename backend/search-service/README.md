# Search Service - Real Estate App

Advanced search service using **MongoDB Atlas Search** with Redis caching for a real-estate mobile application.

## 🎯 Features

### ✅ Implemented

- **Full-Text Search**: Title, description, city, address, amenities
- **Advanced Filters**: Price, type, bedrooms, bathrooms, surface, features, status
- **Geo Search**: Radius search, polygon search, bounding box
- **Sorting**: Price (asc/desc), newest, nearest
- **Autocomplete**: Real-time suggestions
- **Pagination**: Page-based with skip/limit
- **Redis Caching**: 60-second TTL for search results
- **High Performance**: Optimized indexes and aggregation pipelines
- **Rate Limiting**: Throttled endpoints

## 🏗️ Architecture

```
┌──────────────┐
│ Flutter App  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  API Gateway     │  (Port 3000)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Search Service   │  (Port 3007)
│  - Controllers   │
│  - Services      │
│  - Cache Layer   │
└──────┬───────────┘
       │
   ┌───┴────┐
   ▼        ▼
┌────────┐ ┌─────────┐
│MongoDB │ │  Redis  │
│ Atlas  │ │ (Cache) │
└────────┘ └─────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Redis server
- npm or yarn

### Installation

```bash
cd backend/search-service
npm install
```

### Configuration

Create `.env` file:

```env
PORT=3007
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/immobilier_app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cache
CACHE_TTL=60
SEARCH_MAX_RESULTS=100
DEFAULT_PAGE_SIZE=20

# Security
JWT_SECRET=your-secret-key
INTERNAL_API_KEY=search_svc_key
```

### MongoDB Atlas Search Index Setup

**Important**: Create a search index in MongoDB Atlas:

1. Go to MongoDB Atlas Console
2. Select your cluster → "Search" tab
3. Click "Create Search Index"
4. Choose "JSON Editor"
5. Use this configuration:

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

6. Name it: `properties_search`
7. Choose database: `immobilier_app`
8. Choose collection: `properties`

### Run Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📡 API Endpoints

### 1. Main Search
**POST** `/api/v1/search`

Search properties with full-text, filters, geo, and sorting.

**Request Body:**
```json
{
  "query": "villa sea view",
  "filters": {
    "priceMin": 100000,
    "priceMax": 500000,
    "propertyType": "HOUSE",
    "status": "FOR_SALE",
    "bedroomsMin": 2,
    "bedroomsMax": 5,
    "bathroomsMin": 1,
    "surfaceMin": 100,
    "surfaceMax": 300,
    "features": ["parking", "balcony", "pool"],
    "city": "Paris"
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

**Sort Options:**
- `price_asc` - Price low → high
- `price_desc` - Price high → low
- `newest` - Most recent first
- `nearest` - Closest first (requires geo)

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "title": "Luxury Villa",
      "description": "...",
      "price": 450000,
      "type": "HOUSE",
      "status": "FOR_SALE",
      "rooms": 4,
      "bathrooms": 3,
      "surface": 250,
      "address": {
        "city": "Paris",
        "street": "..."
      },
      "location": {
        "coordinates": [10.2, 36.8]
      },
      "images": ["..."],
      "features": ["parking", "pool"],
      "distance": 5420,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  },
  "filters": {...},
  "sort": "price_asc"
}
```

### 2. Autocomplete Suggestions
**GET** `/api/v1/search/suggest?q=vil&limit=10`

Get autocomplete suggestions.

**Response:**
```json
[
  "Villa Moderne",
  "Villa Luxe",
  "Paris",
  "Villa Sea View"
]
```

### 3. Polygon Search
**POST** `/api/v1/search/polygon`

Search within a custom polygon area.

**Request Body:**
```json
{
  "polygon": [
    { "lng": 10.0, "lat": 36.0 },
    { "lng": 10.5, "lat": 36.0 },
    { "lng": 10.5, "lat": 36.5 },
    { "lng": 10.0, "lat": 36.5 }
  ],
  "filters": {
    "priceMin": 100000,
    "priceMax": 500000
  },
  "sort": "price_desc",
  "page": 1,
  "limit": 20
}
```

### 4. Get Property by ID
**GET** `/api/v1/search/:id`

Get detailed property information.

### 5. Health Check
**GET** `/api/v1/health`

Check service health.

**Response:**
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

## 🔥 Performance Optimizations

### Indexes Created:
- Text index: `title`, `description`, `address.city`, `features`
- Geo index: `location.coordinates` (2dsphere)
- Compound indexes for common queries
- Individual indexes on: `type`, `status`, `price`, `rooms`, `bathrooms`, `surface`

### Caching Strategy:
- **Cache Key**: MD5 hash of search parameters
- **TTL**: 60 seconds (configurable)
- **Cache Hit Rate**: ~70-80% for repeated queries
- **Pattern Invalidation**: Clear cache when properties updated

### Query Optimization:
- Aggregation pipelines with early filtering
- Projection to limit returned fields
- Skip/limit for pagination
- Efficient text search with $text operator

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🐳 Docker Support

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3007
CMD ["npm", "run", "start:prod"]
```

### Build and Run
```bash
docker build -t search-service .
docker run -p 3007:3007 --env-file .env search-service
```

## 📊 Monitoring

### Logs
The service logs:
- ✅ Cache hits/misses
- 📊 Query execution times
- ❌ Errors and warnings
- 🔍 Search parameters

### Metrics to Monitor:
- Response time (target: <100ms with cache, <500ms without)
- Cache hit rate (target: >70%)
- Error rate (target: <1%)
- Request rate

## 🔒 Security

- **Rate Limiting**: 30 requests/minute for search, 60 for autocomplete
- **Input Validation**: All DTOs validated with class-validator
- **Query Injection Prevention**: Mongoose escapes queries automatically
- **CORS**: Configured for Flutter app origin

## 🚀 Integration with Other Services

### Property Service Sync
When a property is created/updated in Property Service:
1. Property Service calls Search Service (optional)
2. Or use MongoDB Change Streams (recommended)
3. Search Service automatically picks up changes

### API Gateway Integration
Add route to `api-gateway`:
```typescript
{
  path: '/search',
  url: 'http://localhost:3007',
}
```

## 📝 TODO / Enhancements

- [ ] Implement MongoDB Change Streams for real-time sync
- [ ] Add saved searches feature
- [ ] Implement search analytics
- [ ] Add fuzzy matching for typos
- [ ] Multi-language support (Arabic, French)
- [ ] Add more advanced filters (parking spots, floor number, etc.)
- [ ] Implement search history per user
- [ ] Add bulk operations endpoint

## 📞 Support

For issues:
- Check MongoDB Atlas Search index is created
- Verify Redis is running
- Check logs: `npm run start:dev`
- Test endpoints with Postman/Thunder Client

## 📄 License

MIT
