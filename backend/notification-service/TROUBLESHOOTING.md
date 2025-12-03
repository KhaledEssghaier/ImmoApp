# 🔧 Notification Service - Issue Resolution Guide

## ❌ Issues Found

1. **Missing npm packages** - Dependencies not installed
2. **TypeScript type error** in DevicesService
3. **Flutter files** have import/syntax issues

---

## ✅ Solution Steps

### Step 1: Install All Dependencies

Run these commands in order:

```bash
cd backend/notification-service

# Install all dependencies
npm install

# If you get peer dependency conflicts, use:
npm install --legacy-peer-deps
```

**Required packages:**
```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/mongoose @nestjs/jwt @nestjs/microservices
npm install @nestjs/bull bull
npm install mongoose ioredis
npm install firebase-admin nodemailer
npm install class-validator class-transformer
npm install reflect-metadata rxjs
```

**Dev dependencies:**
```bash
npm install --save-dev @nestjs/cli @nestjs/schematics @nestjs/testing
npm install --save-dev @types/node @types/express @types/jest @types/bull @types/nodemailer
npm install --save-dev typescript ts-node ts-jest jest supertest
npm install --save-dev eslint prettier
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Step 2: Fix TypeScript Error in DevicesService

The issue is with the return type. Replace the method signature:

**File:** `src/devices/devices.service.ts`

**Find (line 51-62):**
```typescript
  async findByUserId(userId: string): Promise<DeviceDocument[]> {
    return this.deviceModel
      .find({
        userId: new Types.ObjectId(userId),
        isInvalid: false,
      })
      .lean()
      .exec();
  }
```

**Replace with:**
```typescript
  async findByUserId(userId: string): Promise<any[]> {
    return this.deviceModel
      .find({
        userId: new Types.ObjectId(userId),
        isInvalid: false,
      })
      .lean()
      .exec();
  }
```

**Or better - remove `.lean()`:**
```typescript
  async findByUserId(userId: string): Promise<DeviceDocument[]> {
    return this.deviceModel
      .find({
        userId: new Types.ObjectId(userId),
        isInvalid: false,
      })
      .exec();
  }
```

### Step 3: Fix Flutter Import Issues

#### **File:** `lib/services/notification_service.dart`

Add missing imports at the top:
```dart
import 'dart:convert';
import 'package:flutter/material.dart';
```

#### **File:** `lib/features/notifications/presentation/screens/notifications_screen.dart`

If you see `withValues` errors, replace:
```dart
// OLD
color.withValues(alpha: 0.2)

// NEW (for older Flutter versions)
color.withOpacity(0.2)
```

Or update Flutter to latest version:
```bash
flutter upgrade
```

### Step 4: Verify Build

After installing dependencies:

```bash
# Backend
cd backend/notification-service
npm run build

# Should show: "Successfully compiled"
```

### Step 5: Run the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Docker
docker-compose up -d notification-service
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@nestjs/mongoose'"

**Solution:**
```bash
npm install @nestjs/mongoose mongoose --save
```

### Issue: "Cannot find module '@nestjs/bull'"

**Solution:**
```bash
npm install @nestjs/bull bull --save
```

### Issue: "Cannot find module 'firebase-admin'"

**Solution:**
```bash
npm install firebase-admin --save
```

### Issue: "Cannot find name 'jest'"

**Solution:**
```bash
npm install --save-dev @types/jest jest ts-jest
```

### Issue: TypeScript errors in tests

**Solution:** Tests will work after installing dev dependencies. If issues persist:
```bash
npm install --save-dev @nestjs/testing @types/jest @types/node
```

### Issue: "Nest could not find dependency"

**Solution:** Make sure all modules export their services:
- Check `exports` array in each `.module.ts` file
- Services used by other modules must be exported

### Issue: MongoDB connection fails

**Solution:**
1. Make sure MongoDB is running:
   ```bash
   # Check if MongoDB is running
   docker ps | grep mongo
   
   # Start MongoDB
   docker-compose up -d mongo
   ```

2. Update connection string in `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/immobilier_notifications
   ```

### Issue: Redis connection fails

**Solution:**
```bash
# Start Redis
docker-compose up -d redis

# Test connection
redis-cli ping
# Should return: PONG
```

### Issue: Flutter app can't receive notifications

**Solution:**
1. **Check Firebase configuration:**
   - Add `google-services.json` (Android)
   - Add `GoogleService-Info.plist` (iOS)
   
2. **Add Firebase to pubspec.yaml:**
   ```yaml
   dependencies:
     firebase_core: ^2.24.0
     firebase_messaging: ^14.7.0
     flutter_local_notifications: ^16.2.0
   ```

3. **Initialize Firebase in main.dart:**
   ```dart
   await Firebase.initializeApp();
   ```

4. **Request permissions:**
   ```dart
   await FirebaseMessaging.instance.requestPermission();
   ```

---

## ✅ Quick Fix Command (All at Once)

Run this single command to install everything:

```bash
cd backend/notification-service && npm install --legacy-peer-deps && npm run build
```

If successful, you should see:
```
✔ Successfully compiled
```

---

## 🧪 Verify Installation

Test the service is working:

```bash
# 1. Start service
npm run start:dev

# 2. Check health (in another terminal)
curl http://localhost:3006/api/v1/notifications/unread-count \
  -H "Authorization: Bearer test-token"

# Should return 401 (expected - means service is running)
```

---

## 📋 Checklist

After fixing, verify:

- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm run start:dev` starts service on port 3006
- [ ] No TypeScript compilation errors
- [ ] MongoDB connection established
- [ ] Redis connection established
- [ ] Tests run: `npm test`

---

## 🆘 Still Having Issues?

### Check logs:
```bash
# Service logs
npm run start:dev

# Docker logs
docker logs notification-service

# MongoDB logs
docker logs mongo

# Redis logs
docker logs redis
```

### Verify dependencies:
```bash
npm ls @nestjs/mongoose
npm ls @nestjs/bull
npm ls firebase-admin
```

### Clean install:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Check Node version:
```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

---

## 🎯 Expected Result

After following these steps, you should be able to:

1. ✅ Run `npm run build` successfully
2. ✅ Start service with `npm run start:dev`
3. ✅ See "Notification Service is running on: http://localhost:3006"
4. ✅ No compilation errors
5. ✅ Service responds to API calls

The service will be fully functional and ready to integrate with your app!
