# Quick Start Guide - Favorites Service

## Backend Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend/favorites-service
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
# Edit .env with your MongoDB and Redis URLs
```

### 3. Start Service
```bash
npm run start:dev
```

✅ Service running at: http://localhost:3009/api/v1  
✅ API Docs: http://localhost:3009/api/docs

---

## Flutter Integration (10 minutes)

### 1. Add to pubspec.yaml
```yaml
dependencies:
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  connectivity_plus: ^6.0.0
```

### 2. Copy Flutter Files

Copy these files to your Flutter project:
```
lib/features/favorites/
├── data/
│   └── datasources/
│       ├── favorites_remote_datasource.dart
│       └── favorites_local_datasource.dart
├── models/
│   └── favorite_state.dart
├── providers/
│   └── favorites_provider.dart
├── widgets/
│   └── favorite_button.dart
└── presentation/
    └── screens/
        └── wishlist_page.dart
```

### 3. Initialize in main.dart
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter(); // Add this
  
  runApp(ProviderScope(child: MyApp()));
}
```

### 4. Add Favorite Button
```dart
// In property card or detail page
CompactFavoriteButton(propertyId: property.id)
```

### 5. Add to Navigation
```dart
// Bottom nav or menu
IconButton(
  icon: Icon(Icons.favorite),
  onPressed: () => Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => WishlistPage()),
  ),
)
```

---

## Test the Integration

### 1. Backend Health Check
```bash
curl http://localhost:3009/api/v1/health
```

### 2. Add Favorite (with JWT)
```bash
curl -X POST http://localhost:3009/api/v1/favorites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "64b8f5e2c1234567890abcde"}'
```

### 3. Get Favorites
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3009/api/v1/favorites/ids
```

### 4. Test Flutter App
1. Run app: `flutter run`
2. Tap heart icon on property card
3. Go offline (airplane mode)
4. Tap more heart icons
5. Go back online
6. Check wishlist page - should auto-sync

---

## Common Issues & Fixes

### ❌ "Redis connection refused"
**Fix**: Start Redis
```bash
redis-server
# or
docker run -d -p 6379:6379 redis:alpine
```

### ❌ "MongoDB connection failed"
**Fix**: Start MongoDB
```bash
mongod
# or
docker run -d -p 27017:27017 mongo:6
```

### ❌ "JWT token invalid"
**Fix**: Login first to get valid token
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'
```

### ❌ "Hive not initialized"
**Fix**: Add to main.dart before runApp:
```dart
await Hive.initFlutter();
```

---

## Production Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas connection
- [ ] Configure Redis Cloud/ElastiCache
- [ ] Enable CORS for your domain only
- [ ] Add rate limiting middleware
- [ ] Set up monitoring (PM2, Datadog)
- [ ] Configure backup strategy
- [ ] Test failover scenarios
- [ ] Load test with 1000+ concurrent users

---

## Support

For issues or questions, check:
- Full README.md
- API documentation at /api/docs
- Example curl commands in README

**Happy Coding! 🚀**
