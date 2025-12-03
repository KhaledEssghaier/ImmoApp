# 🏠 AppImmo - Complete Real Estate Mobile Application

A production-ready, full-stack real estate application built with **Flutter** and **NestJS microservices architecture**. Features include property listings, real-time chat, favorites with offline support, billing system, push notifications, and advanced search capabilities.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Database Structure](#database-structure)
5. [Backend Services](#backend-services)
6. [Frontend Features](#frontend-features)
7. [Getting Started](#getting-started)
8. [API Documentation](#api-documentation)
9. [Security](#security)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## 🎯 Overview

AppImmo is a comprehensive real estate platform that enables users to:
- Browse and search properties with advanced filters
- Create and manage property listings with images
- Save favorite properties with offline support
- Chat in real-time with property owners
- Subscribe to plans or pay-per-post for property uploads
- Receive push notifications for important events
- Manage user profiles and account settings

**Project Type:** Production-ready full-stack application  
**Architecture:** Microservices with API Gateway  
**Hosting:** MongoDB Atlas (Database), Self-hosted/Cloud (Services)  
**Real-time:** WebSocket (Socket.IO) for chat  
**Payments:** Stripe integration

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                        │
│          (Android, iOS, Web - Port 57283)                   │
└────────────┬─────────────────────────────────────────────────┘
             │ HTTP/REST + WebSocket
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 3000)                  │
│  - JWT Authentication        - CORS Handling                │
│  - Rate Limiting (100/min)   - Request Routing              │
│  - Load Balancing            - Logging                      │
└─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┘
      │      │      │      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Auth  │ │Prop. │ │Fav.  │ │Chat  │ │Notif │ │Bill  │ │Admin │
│ 3001 │ │ 3002 │ │ 3004 │ │ 3005 │ │ 3006 │ │ 3007 │ │ 3009 │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
   │        │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┴────────┘
                            │
            ┌───────────────┴──────────────┐
            │                               │
    ┌───────▼────────┐           ┌─────────▼─────────┐
    │ MongoDB Atlas  │           │      Redis        │
    │  (Cloud DB)    │           │ - Pub/Sub         │
    │                │           │ - Sessions        │
    │ - users        │           │ - Cache           │
    │ - properties   │           │ - Queue           │
    │ - favorites    │           └───────────────────┘
    │ - chats        │
    │ - messages     │
    │ - notifications│
    │ - subscriptions│
    │ - payments     │
    └────────────────┘
```

### Microservices Pattern

Each service is:
- **Independent**: Can be deployed separately
- **Scalable**: Horizontal scaling with load balancer
- **Resilient**: Service failure doesn't crash entire system
- **Technology Agnostic**: Can use different tech per service

---

## 🛠️ Tech Stack

### Frontend (Flutter)

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Flutter | 3.10+ |
| Language | Dart | 3.10+ |
| State Management | Riverpod | 2.6.1 |
| HTTP Client | Dio | 5.7.0 |
| Routing | GoRouter | 14.6.2 |
| Real-time | Socket.IO Client | 2.0.3+1 |
| Local Storage | Hive, SQLite, flutter_secure_storage | Latest |
| Firebase | firebase_core, firebase_auth, firebase_messaging | Latest |
| Maps | flutter_map, latlong2 | Latest |
| Image Picker | image_picker | 1.0.7 |
| Payments | url_launcher, webview_flutter | Latest |

### Backend (NestJS)

| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | 11.0+ |
| Language | TypeScript | 5.7+ |
| Database | MongoDB | 8.19+ (Mongoose) |
| Cache/Queue | Redis, Bull | 7+ |
| Authentication | Passport JWT | 11.0+ |
| Real-time | Socket.IO | 4.6+ |
| Validation | class-validator, class-transformer | Latest |
| Security | Helmet, bcrypt | Latest |
| Payments | Stripe | Latest |
| Notifications | Firebase Admin SDK | 12.0+ |
| Email | Nodemailer | 7.0+ |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Database | MongoDB Atlas (Cloud) |
| Cache/Broker | Redis 7+ |
| Container | Docker + Docker Compose |
| API Documentation | Swagger/OpenAPI |
| Testing | Jest, Supertest |

---

## 🗄️ Database Structure

### MongoDB Atlas - 10 Collections

#### 1. **users** (Auth Service)
**Purpose:** User accounts and authentication

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| _id | ObjectId | Unique identifier | Primary |
| email | String | User email (unique) | Unique |
| passwordHash | String | Bcrypt hashed password | - |
| fullName | String | User's full name | - |
| phone | String | Phone number | Indexed |
| profileImage | String | Base64 or URL | - |
| bio | String | User biography | - |
| address | String | User address | - |
| role | String | user/agent/admin | Indexed |
| isVerified | Boolean | Email verification status | - |
| isDeleted | Boolean | Soft delete flag | Indexed |
| createdAt | Date | Account creation | - |
| updatedAt | Date | Last update | - |

#### 2. **sessions** (Auth Service)
**Purpose:** JWT refresh token storage with TTL

#### 3. **properties** (Property Service)
**Purpose:** Real estate listings

| Key Fields | Description |
|------------|-------------|
| ownerId | Reference to user |
| title, description | Property details |
| price, propertyType, transactionType | Listing info |
| bedrooms, bathrooms, surface | Property specs |
| location (GeoJSON) | Geospatial coordinates |
| address | {country, city, street, zipcode} |
| images, mediaIds | Property images |
| status | available/sold/rented |

**Indexes:** 2dsphere (location), text (title+description), price, type+transaction

#### 4. **reports** (Property Service)
Content/user reports for moderation

#### 5. **favorites** (Favorites Service)
User favorite properties with unique compound index (userId + propertyId)

#### 6. **chats** (Chat Service)
Conversation metadata between users

#### 7. **messages** (Chat Service)
Chat messages with read receipts and status tracking

#### 8. **notifications** (Notification Service)
Push and in-app notifications

#### 9. **subscriptions** (Billing Service)
User subscription plans with credit tracking

#### 10. **payments** (Billing Service)
Payment records with Stripe integration

---

## 🔧 Backend Services

### Service Overview

| Service | Port | Purpose | Key Features |
|---------|------|---------|--------------|
| **API Gateway** | 3000 | Central routing | JWT validation, rate limiting, CORS |
| **Auth Service** | 3001 | Authentication | Login, register, JWT tokens, password reset |
| **Property Service** | 3002 | Property management | CRUD, search, geospatial queries |
| **Favorites Service** | 3004 | User favorites | Add/remove, sync support |
| **Chat Service** | 3005 | Real-time messaging | Socket.IO, typing indicators, read receipts |
| **Notification Service** | 3006 | Push notifications | FCM, Bull queue, in-app notifications |
| **Billing Service** | 3007 | Payments | Stripe, subscriptions, credit management |
| **Search Service** | 3008 | Advanced search | Full-text, filters, geospatial |
| **Admin Service** | 3009 | Administration | User/property moderation, analytics |

### 1. API Gateway (Port 3000)

**Role:** Central entry point for all client requests

**Features:**
- JWT token validation on protected routes
- Rate limiting: 100 requests/60 seconds per IP
- CORS configuration for Flutter app
- Request/response logging
- Health check for all services
- API versioning (v1)
- Automatic routing to microservices

**Technology:** NestJS + Throttler + Axios

---

### 2. Auth Service (Port 3001)

**Role:** User authentication and authorization

**Features:**
- User registration with email validation
- Login with JWT (access + refresh tokens)
- Token refresh mechanism
- Password reset with 6-digit verification codes
- Profile management (view, update)
- Change password with verification
- Session management
- Role-based access (user/agent/admin)

**API Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/verify-reset-code
POST   /api/v1/auth/reset-password
GET    /api/v1/users/me
PUT    /api/v1/users/me
POST   /api/v1/users/me/change-password
```

**Security:**
- bcrypt hashing (10 rounds)
- Access tokens: 15min expiry
- Refresh tokens: 30 days expiry
- Reset codes expire in 10 minutes

---

### 3. Property Service (Port 3002)

**Role:** Property listings management

**Features:**
- CRUD operations for properties
- Image upload (base64 encoding)
- Property search with filters
- Geospatial queries (nearby properties)
- Owner's property listing
- Status management
- Soft delete support
- Pagination

**API Endpoints:**
```
GET    /api/v1/properties
GET    /api/v1/properties/:id
POST   /api/v1/properties
PUT    /api/v1/properties/:id
DELETE /api/v1/properties/:id
GET    /api/v1/properties/owner/my-properties
POST   /api/v1/properties/:id/publish
```

---

### 4. Favorites Service (Port 3004)

**Role:** User favorites management

**Features:**
- Add/remove favorites
- List user favorites
- Offline sync support
- Favorite count per property

**API Endpoints:**
```
GET    /api/v1/favorites
POST   /api/v1/favorites/:propertyId
DELETE /api/v1/favorites/:propertyId
```

---

### 5. Chat Service (Port 3005)

**Role:** Real-time messaging

**Features:**
- Socket.IO real-time communication
- Typing indicators (3s debounce)
- Read receipts
- Message editing (15-min window)
- Message deletion
- Presence tracking
- Multi-device support
- Rate limiting (20 msg/60s)
- Redis pub/sub for scaling
- Offline message queue

**Socket.IO Events:**
- `join_conversation`, `leave_conversation`
- `message_send`, `message_edit`, `message_delete`
- `typing`, `message_read`
- `new_message`, `message_status`, `read_receipt`

**REST Endpoints:**
```
GET    /api/v1/chat/conversations
GET    /api/v1/chat/conversations/:id/messages
POST   /api/v1/chat/conversations
```

---

### 6. Notification Service (Port 3006)

**Role:** Push and in-app notifications

**Features:**
- Firebase Cloud Messaging (FCM)
- In-app notification storage
- Bull queue processing
- Redis pub/sub
- Email notifications (optional)
- Mark as read/unread

**API Endpoints:**
```
GET    /api/v1/notifications
POST   /api/v1/notifications (internal)
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
```

---

### 7. Billing Service (Port 3007)

**Role:** Payment processing and subscriptions

**Features:**
- Stripe payment integration
- Two monetization models:
  - **Single Post:** $10 per property
  - **Subscription:** $50 for 10 credits
- Checkout session creation
- Webhook handling
- Credit management
- Payment history
- Automatic property publishing

**API Endpoints:**
```
POST   /api/v1/billing/payments/session
GET    /api/v1/billing/payments/user/:userId
GET    /api/v1/billing/subscriptions/:userId
GET    /api/v1/billing/subscriptions/credits/:userId
POST   /api/v1/billing/subscriptions/deduct
POST   /api/v1/billing/webhook (Stripe only)
```

---

### 8. Search Service (Port 3008)

**Role:** Advanced property search

**Features:**
- Full-text search
- Geospatial queries
- Advanced filters
- Sorting options
- Pagination

---

### 9. Admin Service (Port 3009)

**Role:** Administrative operations

**Features:**
- User management (ban/unban)
- Property moderation
- Report management
- System analytics

---

## 📱 Frontend Features (Flutter)

### Application Structure

```
lib/
├── main.dart                      # App entry point
├── core/
│   ├── api/                       # HTTP clients & API services
│   ├── constants/                 # API URLs, config
│   ├── models/                    # Data models
│   ├── storage/                   # Secure storage
│   └── theme/                     # Dark theme
├── features/
│   ├── auth/                      # Login, signup, password reset
│   ├── home/                      # Main feed
│   ├── property/                  # Property CRUD, detail view
│   ├── profile/                   # Profile management
│   ├── favorites/                 # Wishlist with offline support
│   ├── chat/                      # Real-time messaging
│   ├── notifications/             # Notification list
│   ├── search/                    # Advanced search
│   ├── billing/                   # Subscriptions & payments
│   └── splash/                    # Splash screen
├── routes/                        # GoRouter configuration
└── widgets/                       # Reusable components
```

### Key Features

#### 1. Authentication Module
- Login/signup with validation
- Guest mode (browse without login)
- Password reset with 6-digit code
- JWT token management with auto-refresh
- Secure token storage

#### 2. Property Management
- Property list with pagination
- Filters: type, transaction, price, location
- Property detail with image carousel
- Create/edit with image picker
- Base64 image encoding
- Owner's property management

#### 3. Favorites System
- Heart button with animation
- Optimistic UI updates
- Offline support with Hive
- Pending sync queue
- Auto-sync on network restore
- Wishlist page

#### 4. Real-Time Chat
- Socket.IO client with auto-reconnect
- Typing indicators (animated dots)
- Read receipts (✓/✓✓/✓✓ blue)
- Message status tracking
- Optimistic UI
- Offline message queue with retry
- SQLite local caching
- Infinite scroll pagination

#### 5. Notifications
- Firebase Cloud Messaging
- Background/foreground notifications
- In-app notification list
- Mark as read/unread
- Navigate to related content

#### 6. Billing & Subscriptions
- Stripe checkout via WebView
- Two payment options
- Credit balance display
- Payment history
- Success/failure screens

#### 7. Search & Filters
- Text search
- Property type/transaction filters
- Price range slider
- Location filter
- Sort options

#### 8. Profile Management
- View/edit profile
- Profile image upload
- Change password
- Biography and address
- Account statistics

### UI/UX Features

**Theme:**
- Custom dark theme
- Primary color: #3ABAEC (Teal)
- Material Design 3

**Navigation:**
- Bottom navigation bar (5 tabs)
- GoRouter with auth guards
- Deep linking support

**Loading States:**
- Shimmer effects
- Skeleton screens
- Pull-to-refresh

**Error Handling:**
- Snackbar messages
- Retry buttons
- Offline indicators

---

## 🚀 Getting Started

### Prerequisites

**Required:**
- Flutter SDK 3.10+
- Node.js 20+
- MongoDB Atlas account
- Redis 7+
- Git

**Optional:**
- Docker & Docker Compose
- Stripe account (for billing)
- Firebase project (for notifications)

---

### Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd appimmo
```

#### 2. Setup MongoDB Atlas

1. Create MongoDB Atlas account
2. Create cluster and database: `immobilier_app`
3. Get connection string
4. Whitelist your IP
5. Update `.env` files

#### 3. Setup Backend Services

```bash
cd backend

# Install dependencies for all services
cd api-gateway && npm install && cd ..
cd auth-service && npm install && cd ..
cd property-service && npm install && cd ..
cd favorites-service && npm install && cd ..
cd chat-service && npm install && cd ..
cd notification-service && npm install && cd ..
cd billing-service && npm install && cd ..
cd admin-service && npm install && cd ..
cd search-service && npm install && cd ..
```

#### 4. Setup Redis

```bash
# Windows
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

#### 5. Start Backend Services

**Option A: PowerShell Script (Recommended)**
```powershell
cd backend
.\start-all-simple.ps1
```

**Option B: Docker Compose**
```bash
cd backend
docker-compose up -d
```

#### 6. Setup Flutter App

```bash
# Install dependencies
flutter pub get

# Generate model files
flutter pub run build_runner build --delete-conflicting-outputs

# Run on device/emulator
flutter run
```

---

### Configuration

#### Backend .env Template

```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/immobilier_app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000,http://localhost:57283
```

#### Flutter API Configuration

```dart
// lib/core/constants/api_constants.dart
static const String baseUrl = 'http://localhost:3000/api/v1';
static const String socketUrl = 'http://localhost:3005';

// For Android emulator: http://10.0.2.2:3000
// For iOS simulator: http://localhost:3000
// For real device: http://<your-ip>:3000
```

---

### Test the Application

#### Backend Health Check

```bash
curl http://localhost:3000/api/v1/health
```

#### Test User Credentials

```
Email: jean.dupont@example.com
Password: Password123!
```

#### Run Tests

```bash
# Backend tests
cd backend/auth-service
npm run test

# Flutter tests
flutter test
```

---

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication

All protected endpoints require Bearer token:

```http
Authorization: Bearer <access-token>
```

### Swagger Documentation

Available at: `http://localhost:3001/api` (Auth Service)

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "statusCode": 400
  }
}
```

---

## 🔐 Security

### Backend Security

- JWT tokens with expiry
- bcrypt password hashing (10 rounds)
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/min)
- Input validation
- SQL/NoSQL injection prevention

### Frontend Security

- flutter_secure_storage for tokens
- Client-side validation
- HTTPS only in production
- No sensitive data in logs

---

## 🧪 Testing

### Backend Testing

```bash
cd backend/<service>
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

### Frontend Testing

```bash
flutter test                    # Unit tests
flutter test integration_test   # Integration tests
```

### Test Scripts

- `test-auth.ps1`
- `test-property-endpoints.ps1`
- `test-profile-endpoints.ps1`
- `test-favorites-gateway.ps1`

---

## 🚀 Deployment

### Docker Deployment

```bash
cd backend
docker-compose build
docker-compose up -d
```

### Production Checklist

**Backend:**
- [ ] Update MongoDB to production
- [ ] Set strong JWT secrets
- [ ] Configure CORS origins
- [ ] Set up Redis authentication
- [ ] Configure Stripe production keys
- [ ] Set up monitoring
- [ ] Configure backups

**Frontend:**
- [ ] Update API URLs
- [ ] Build release APK/IPA
- [ ] Configure Firebase production
- [ ] Submit to app stores

---

## 📊 Monitoring & Logging

### Health Checks

```bash
curl http://localhost:3000/api/v1/health
```

### Recommended Tools

- Prometheus + Grafana
- ELK Stack for logs
- Firebase Crashlytics
- Sentry

---

## 📝 Additional Documentation

- [Backend Architecture](backend/README.md)
- [Database Schema](database/README.md)
- [Chat Feature](CHAT_FEATURE_SUMMARY.md)
- [Billing System](BILLING_SYSTEM_COMPLETE.md)
- [Favorites System](FAVORITES_INTEGRATION.md)
- [Profile Management](PROFILE_EDIT_FEATURE.md)
- [Password Reset](PASSWORD_RESET_CODE_SYSTEM.md)

---

## 🎉 Quick Commands

```bash
# Start all backend services
cd backend && .\start-all-simple.ps1

# Stop all services
cd backend && .\stop-all.ps1

# Run Flutter app
flutter run

# Build APK
flutter build apk --release

# Check health
curl http://localhost:3000/api/v1/health

# Generate Flutter models
flutter pub run build_runner build --delete-conflicting-outputs
```

---

**🚀 Ready to go! Your comprehensive real estate platform is set up!**

For questions or issues, refer to service-specific documentation or open an issue on GitHub.

Happy coding! 🎉
