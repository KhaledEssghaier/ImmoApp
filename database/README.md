# 🏠 Immobilier App - MongoDB Database Documentation

Complete MongoDB schema and architecture for a real estate mobile application built with Flutter.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Database Structure](#database-structure)
4. [Setup Instructions](#setup-instructions)
5. [Collections Details](#collections-details)
6. [Indexing Strategy](#indexing-strategy)
7. [Microservices Architecture](#microservices-architecture)
8. [Image Storage Strategy](#image-storage-strategy)
9. [Query Examples](#query-examples)
10. [Best Practices](#best-practices)
11. [Backup & Maintenance](#backup--maintenance)

---

## 🎯 Overview

This database design supports a full-featured real estate mobile application with:

- ✅ User authentication and authorization
- ✅ Property listings (apartments, houses, villas, offices, terrain)
- ✅ Favorites system
- ✅ Real-time chat messaging
- ✅ Push notifications
- ✅ Geospatial search
- ✅ Full-text search
- ✅ Content reporting system
- ✅ Soft delete support
- ✅ Session management with JWT

**MongoDB Version:** 6.0+  
**Schema Validation:** JSON Schema  
**Total Collections:** 8

---

## 🚀 Quick Start

### Prerequisites

- MongoDB 6.0 or higher
- MongoDB Shell (`mongosh`)
- MongoDB Compass (optional, for GUI)

### Installation Steps

1. **Clone or navigate to the database folder:**
   ```bash
   cd database
   ```

2. **Start MongoDB (if not running):**
   ```bash
   # Windows (if MongoDB is installed as a service)
   net start MongoDB

   # Or run mongod directly
   mongod --dbpath "C:\data\db"
   ```

3. **Run the database creation script:**
   ```bash
   mongosh < script.js
   ```

   Or connect to MongoDB and run:
   ```bash
   mongosh
   > load("script.js")
   ```

4. **Verify the setup:**
   ```bash
   mongosh
   > use immobilier_app
   > show collections
   > db.users.getIndexes()
   ```

5. **(Optional) Load sample data:**
   ```bash
   mongosh < sample-data.js
   ```

---

## 📊 Database Structure

### Collections Overview

| Collection | Documents | Purpose | Microservice |
|------------|-----------|---------|--------------|
| `users` | ~10K-100K | User accounts | Auth Service |
| `sessions` | ~50K-200K | JWT refresh tokens | Auth Service |
| `properties` | ~100K-1M | Property listings | Property Service |
| `reports` | ~1K-10K | Content reports | Property Service |
| `favorites` | ~500K-5M | User favorites | Favorites Service |
| `chats` | ~50K-500K | Chat conversations | Chat Service |
| `messages` | ~1M-10M | Chat messages | Chat Service |
| `notifications` | ~1M-5M | User notifications | Notifications Service |

### File Structure

```
database/
├── README.md                          # This file
├── script.js                          # MongoDB initialization script
├── schemas.json                       # Detailed schema documentation
├── sample-data.js                     # Sample test data
├── microservices-architecture.md     # Microservices design doc
└── queries/                           # (Optional) Common queries
```

---

## 🛠️ Setup Instructions

### Option 1: Local Development

1. **Install MongoDB:**
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Add MongoDB to PATH

2. **Create data directory:**
   ```bash
   mkdir C:\data\db
   ```

3. **Start MongoDB:**
   ```bash
   mongod
   ```

4. **Run setup script:**
   ```bash
   mongosh < script.js
   ```

### Option 2: Docker

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:6.0
       container_name: immobilier_mongo
       ports:
         - "27017:27017"
       environment:
         MONGO_INITDB_DATABASE: immobilier_app
       volumes:
         - ./database/script.js:/docker-entrypoint-initdb.d/script.js:ro
         - mongodb_data:/data/db
   
   volumes:
     mongodb_data:
   ```

2. **Start container:**
   ```bash
   docker-compose up -d
   ```

### Option 3: MongoDB Atlas (Cloud)

1. **Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Get connection string:**
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/immobilier_app
   ```

3. **Connect and run script:**
   ```bash
   mongosh "mongodb+srv://cluster.mongodb.net/immobilier_app" --username <user>
   > load("script.js")
   ```

---

## 📁 Collections Details

### 1. users
**Purpose:** Store user accounts and authentication data

**Key Fields:**
- `email` (unique) - User email
- `passwordHash` - Bcrypt hashed password
- `role` - "user" or "admin"
- `isDeleted` - Soft delete flag

**Indexes:**
- Unique index on `email`
- Index on `phone`
- Index on `role` and `isDeleted`

---

### 2. properties
**Purpose:** Real estate property listings

**Key Fields:**
- `ownerId` - Reference to users._id
- `type` - apartment, house, villa, office, terrain
- `transactionType` - sell or rent
- `location` - GeoJSON Point with coordinates
- `images` - Array of image URLs

**Indexes:**
- `2dsphere` index on `location` for geospatial queries
- Compound index on `type` and `transactionType`
- Full-text index on `title` and `description`
- Index on `price` for range queries

**Geospatial Query Example:**
```javascript
// Find properties within 5km of Paris center
db.properties.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [2.3522, 48.8566]
      },
      $maxDistance: 5000
    }
  }
})
```

---

### 3. favorites
**Purpose:** Track user favorite properties

**Key Fields:**
- `userId` - Reference to users._id
- `propertyId` - Reference to properties._id

**Indexes:**
- Unique compound index on `(userId, propertyId)` to prevent duplicates
- Individual indexes on `userId` and `propertyId`

---

### 4. chats
**Purpose:** Chat conversations between users

**Key Fields:**
- `user1`, `user2` - Participant IDs
- `propertyId` - Optional, related property
- `lastMessage` - Preview text
- `lastMessageAt` - Timestamp for sorting

**Indexes:**
- Compound index on `(user1, user2)`
- Index on `updatedAt` for sorting by recent activity

---

### 5. messages
**Purpose:** Individual chat messages

**Key Fields:**
- `chatId` - Reference to chats._id
- `senderId` - Reference to users._id
- `text` - Message content
- `images` - Array of image URLs
- `isRead` - Read status

**Indexes:**
- Compound index on `(chatId, createdAt)` for pagination
- Index on `isRead` for unread counts

---

### 6. notifications
**Purpose:** User notifications (in-app and push)

**Key Fields:**
- `userId` - Recipient
- `type` - message, favorite, property, system, alert
- `message` - Notification text
- `data` - Additional metadata (JSON)
- `isRead` - Read status

**Indexes:**
- Compound index on `(userId, createdAt)` for user's notifications
- Index on `isRead` for filtering

---

### 7. reports
**Purpose:** Report abusive content or users

**Key Fields:**
- `reporterId` - User who reported
- `entityType` - property, user, or message
- `entityId` - ID of reported entity
- `reason` - spam, fraud, inappropriate, etc.
- `status` - pending, reviewed, resolved, rejected

**Indexes:**
- Compound index on `(entityType, entityId)`
- Compound index on `(status, createdAt)`

---

### 8. sessions
**Purpose:** JWT refresh token storage

**Key Fields:**
- `userId` - Reference to users._id
- `refreshToken` - JWT token (unique)
- `expiresAt` - TTL timestamp
- `deviceInfo` - Device metadata
- `isActive` - Session status

**Indexes:**
- Unique index on `refreshToken`
- TTL index on `expiresAt` (auto-delete expired sessions)
- Index on `userId` and `isActive`

---

## 🔍 Indexing Strategy

### Primary Indexes
- **Unique indexes** on `email`, `refreshToken`, `(userId, propertyId)` pair
- **Geospatial index** (`2dsphere`) on `properties.location`
- **Full-text index** on `properties.title` and `properties.description`

### Performance Indexes
- **Compound indexes** for common query patterns:
  - `(type, transactionType)` on properties
  - `(userId, createdAt)` on favorites, notifications
  - `(chatId, createdAt)` on messages

### TTL Index
- **Automatic cleanup** on `sessions.expiresAt` (removes expired sessions)

### Query Optimization
```javascript
// Before: Slow query without index
db.properties.find({ price: { $gte: 100000, $lte: 500000 } })

// After: Fast query with index on price
db.properties.createIndex({ price: 1 })
```

---

## 🏗️ Microservices Architecture

The database is designed to support a microservices architecture where each service has its own database:

### Service Distribution

1. **Auth Service** (`auth_db`)
   - Collections: `users`, `sessions`
   - Port: 3001

2. **Property Service** (`property_db`)
   - Collections: `properties`, `reports`
   - Port: 3002

3. **Favorites Service** (`favorites_db`)
   - Collections: `favorites`
   - Port: 3003

4. **Chat Service** (`chat_db`)
   - Collections: `chats`, `messages`
   - Port: 3004

5. **Notifications Service** (`notifications_db`)
   - Collections: `notifications`
   - Port: 3005

**See:** `microservices-architecture.md` for detailed architecture documentation.

---

## 🖼️ Image Storage Strategy

### Option 1: GridFS (MongoDB)
**Pros:** Simple, no external dependencies  
**Cons:** Limited scalability, slower retrieval

```javascript
// Store image in GridFS
const bucket = new GridFSBucket(db);
const uploadStream = bucket.openUploadStream('property_image.jpg');
fs.createReadStream('./image.jpg').pipe(uploadStream);
```

### Option 2: Cloud Storage (Recommended) ✅
**Providers:** AWS S3, Google Cloud Storage, Cloudinary

**Pros:** 
- Scalable
- Fast CDN delivery
- Image optimization
- Automatic backups

**Cons:** Additional cost

**Implementation:**
```javascript
// Upload to S3
const s3 = new AWS.S3();
const params = {
  Bucket: 'immobilier-images',
  Key: `properties/${propertyId}/${filename}`,
  Body: imageBuffer,
  ContentType: 'image/jpeg'
};
const result = await s3.upload(params).promise();

// Store URL in MongoDB
db.properties.updateOne(
  { _id: propertyId },
  { $push: { images: result.Location } }
);
```

**Recommended Structure:**
```
s3://immobilier-images/
├── properties/
│   ├── {propertyId}/
│   │   ├── image1.jpg
│   │   └── image2.jpg
├── profiles/
│   └── {userId}.jpg
└── messages/
    └── {chatId}/
        └── {messageId}.jpg
```

---

## 🔎 Query Examples

### Search Properties by Location
```javascript
// Find apartments for rent in Paris
db.properties.find({
  type: "apartment",
  transactionType: "rent",
  "location.city": "Paris",
  isDeleted: false
}).sort({ createdAt: -1 })
```

### Geospatial Search (Nearby Properties)
```javascript
// Find properties within 10km of coordinates
db.properties.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [2.3522, 48.8566] // [longitude, latitude]
      },
      $maxDistance: 10000 // meters
    }
  }
})
```

### Full-Text Search
```javascript
// Search properties by keywords
db.properties.find({
  $text: { $search: "luxury apartment balcony" }
}).sort({ score: { $meta: "textScore" } })
```

### Get User's Favorites with Details
```javascript
db.favorites.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $lookup: {
      from: "properties",
      localField: "propertyId",
      foreignField: "_id",
      as: "property"
  }},
  { $unwind: "$property" },
  { $sort: { createdAt: -1 } }
])
```

### Unread Messages Count
```javascript
db.messages.aggregate([
  { 
    $match: { 
      chatId: ObjectId("..."),
      senderId: { $ne: ObjectId("currentUserId") },
      isRead: false 
    } 
  },
  { $count: "unreadCount" }
])
```

---

## ✅ Best Practices

### 1. Always Use Indexes
- Add indexes for fields used in `find()`, `sort()`, and `aggregate()`
- Use `explain()` to analyze query performance

### 2. Soft Delete Instead of Hard Delete
```javascript
// Don't do this
db.properties.deleteOne({ _id: propertyId })

// Do this
db.properties.updateOne(
  { _id: propertyId },
  { $set: { isDeleted: true, deletedAt: new Date() } }
)
```

### 3. Pagination for Large Result Sets
```javascript
const page = 1;
const limit = 20;
const skip = (page - 1) * limit;

db.properties.find({ isDeleted: false })
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 })
```

### 4. Use Projection to Limit Fields
```javascript
// Only fetch needed fields
db.properties.find(
  { type: "apartment" },
  { title: 1, price: 1, images: 1, location: 1 }
)
```

### 5. Validate Input Before Queries
```javascript
// Prevent NoSQL injection
const sanitizedEmail = email.replace(/[.$]/g, '');
db.users.findOne({ email: sanitizedEmail })
```

### 6. Connection Pooling
```javascript
const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10
});
```

---

## 🔧 Backup & Maintenance

### Backup Strategy

#### 1. Automated Daily Backups
```bash
# Backup entire database
mongodump --db immobilier_app --out /backups/$(date +%Y%m%d)

# Backup specific collection
mongodump --db immobilier_app --collection properties --out /backups/properties
```

#### 2. Restore from Backup
```bash
# Restore entire database
mongorestore --db immobilier_app /backups/20250114/immobilier_app

# Restore specific collection
mongorestore --db immobilier_app --collection properties /backups/properties/properties.bson
```

### Maintenance Tasks

#### 1. Rebuild Indexes (Monthly)
```javascript
db.properties.reIndex()
```

#### 2. Database Statistics
```javascript
db.stats()
db.properties.stats()
```

#### 3. Clean Expired Sessions (if TTL not working)
```javascript
db.sessions.deleteMany({
  expiresAt: { $lt: new Date() }
})
```

#### 4. Monitor Performance
```javascript
// Show slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

---

## 📚 Additional Resources

### Documentation
- [MongoDB Manual](https://docs.mongodb.com/)
- [Mongoose ODM](https://mongoosejs.com/) (for Node.js)
- [GeoJSON Specification](https://geojson.org/)

### Tools
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [Robo 3T](https://robomongo.org/) - Alternative GUI
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Managed cloud database

### Related Files
- `schemas.json` - Complete JSON schema documentation
- `sample-data.js` - Sample documents for testing
- `microservices-architecture.md` - Architecture design document

---

## 🤝 Contributing

For questions or improvements, please:
1. Check existing documentation
2. Test changes with sample data
3. Update relevant documentation files
4. Follow MongoDB best practices

---

## 📄 License

This database schema is part of the Immobilier App project.

---

**Version:** 1.0  
**Last Updated:** 2025-01-14  
**MongoDB Version:** 6.0+  
**Maintained by:** Development Team

---

## 🎉 Quick Commands Cheat Sheet

```bash
# Connect to MongoDB
mongosh

# Switch to database
use immobilier_app

# Show all collections
show collections

# Count documents
db.users.countDocuments()

# Find one document
db.users.findOne()

# Show indexes
db.properties.getIndexes()

# Explain query performance
db.properties.find({ type: "apartment" }).explain("executionStats")

# Drop collection (careful!)
db.collection_name.drop()

# Backup
mongodump --db immobilier_app --out ./backup

# Restore
mongorestore --db immobilier_app ./backup/immobilier_app
```

---

**Ready to get started?** Run `mongosh < script.js` to create your database! 🚀
