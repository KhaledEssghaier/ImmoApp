// ============================================
// MongoDB Schema Creation Script
// Real Estate Mobile Application
// MongoDB 6+ Compatible
// ============================================

// Switch to the database
use immobilier_app;

print("🚀 Creating database: immobilier_app");
print("================================================");

// ============================================
// 1. USERS COLLECTION
// ============================================
print("\n📁 Creating users collection...");

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["fullName", "email", "passwordHash", "role", "createdAt"],
      properties: {
        fullName: { 
          bsonType: "string",
          description: "Full name of the user - required"
        },
        email: { 
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "User email - must be valid and unique"
        },
        passwordHash: { 
          bsonType: "string",
          minLength: 60,
          description: "Hashed password (bcrypt) - required"
        },
        phone: { 
          bsonType: "string",
          description: "Phone number - optional"
        },
        profileImage: { 
          bsonType: "string",
          description: "URL to profile image - optional"
        },
        role: { 
          enum: ["user", "admin"],
          description: "User role - required"
        },
        createdAt: { 
          bsonType: "date",
          description: "Account creation timestamp"
        },
        updatedAt: { 
          bsonType: "date",
          description: "Last update timestamp"
        },
        isDeleted: { 
          bsonType: "bool",
          description: "Soft delete flag"
        }
      }
    }
  }
});

// Users Indexes
db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email" });
db.users.createIndex({ phone: 1 }, { name: "idx_users_phone" });
db.users.createIndex({ role: 1 }, { name: "idx_users_role" });
db.users.createIndex({ isDeleted: 1 }, { name: "idx_users_deleted" });

print("✅ Users collection created with indexes");

// ============================================
// 2. PROPERTIES COLLECTION
// ============================================
print("\n📁 Creating properties collection...");

db.createCollection("properties", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ownerId", "title", "price", "type", "transactionType", "location", "createdAt"],
      properties: {
        ownerId: { 
          bsonType: "objectId",
          description: "Reference to users._id - required"
        },
        title: { 
          bsonType: "string",
          minLength: 5,
          maxLength: 200,
          description: "Property title - required"
        },
        description: { 
          bsonType: "string",
          maxLength: 5000,
          description: "Detailed property description"
        },
        price: { 
          bsonType: "number",
          minimum: 0,
          description: "Property price - required"
        },
        type: { 
          enum: ["apartment", "house", "terrain", "office", "villa"],
          description: "Property type - required"
        },
        transactionType: { 
          enum: ["sell", "rent"],
          description: "Transaction type - required"
        },
        area: { 
          bsonType: "number",
          minimum: 0,
          description: "Area in square meters"
        },
        rooms: { 
          bsonType: "int",
          minimum: 0,
          description: "Number of rooms"
        },
        bathrooms: { 
          bsonType: "int",
          minimum: 0,
          description: "Number of bathrooms"
        },
        images: { 
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Array of image URLs"
        },
        location: {
          bsonType: "object",
          required: ["type", "coordinates"],
          properties: {
            type: { 
              enum: ["Point"],
              description: "GeoJSON type"
            },
            coordinates: { 
              bsonType: "array",
              minItems: 2,
              maxItems: 2,
              items: { bsonType: "double" },
              description: "[longitude, latitude]"
            },
            address: { 
              bsonType: "string",
              description: "Full street address"
            },
            city: { 
              bsonType: "string",
              description: "City name"
            },
            country: { 
              bsonType: "string",
              description: "Country name"
            }
          }
        },
        createdAt: { 
          bsonType: "date",
          description: "Creation timestamp"
        },
        updatedAt: { 
          bsonType: "date",
          description: "Last update timestamp"
        },
        isDeleted: { 
          bsonType: "bool",
          description: "Soft delete flag"
        }
      }
    }
  }
});

// Properties Indexes
db.properties.createIndex({ price: 1 }, { name: "idx_properties_price" });
db.properties.createIndex({ type: 1, transactionType: 1 }, { name: "idx_properties_type_transaction" });
db.properties.createIndex({ location: "2dsphere" }, { name: "idx_properties_location" });
db.properties.createIndex({ ownerId: 1 }, { name: "idx_properties_owner" });
db.properties.createIndex({ isDeleted: 1 }, { name: "idx_properties_deleted" });
db.properties.createIndex({ createdAt: -1 }, { name: "idx_properties_created" });
db.properties.createIndex({ title: "text", description: "text" }, { name: "idx_properties_fulltext" });

print("✅ Properties collection created with indexes (including geo and full-text)");

// ============================================
// 3. FAVORITES COLLECTION
// ============================================
print("\n📁 Creating favorites collection...");

db.createCollection("favorites", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "propertyId", "createdAt"],
      properties: {
        userId: { 
          bsonType: "objectId",
          description: "Reference to users._id - required"
        },
        propertyId: { 
          bsonType: "objectId",
          description: "Reference to properties._id - required"
        },
        createdAt: { 
          bsonType: "date",
          description: "Favorite added timestamp"
        }
      }
    }
  }
});

// Favorites Indexes
db.favorites.createIndex({ userId: 1 }, { name: "idx_favorites_user" });
db.favorites.createIndex({ propertyId: 1 }, { name: "idx_favorites_property" });
db.favorites.createIndex({ userId: 1, propertyId: 1 }, { unique: true, name: "idx_favorites_unique" });
db.favorites.createIndex({ createdAt: -1 }, { name: "idx_favorites_created" });

print("✅ Favorites collection created with unique compound index");

// ============================================
// 4. CHATS COLLECTION
// ============================================
print("\n📁 Creating chats collection...");

db.createCollection("chats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user1", "user2", "createdAt"],
      properties: {
        user1: { 
          bsonType: "objectId",
          description: "First participant user ID"
        },
        user2: { 
          bsonType: "objectId",
          description: "Second participant user ID"
        },
        propertyId: { 
          bsonType: "objectId",
          description: "Related property (optional)"
        },
        lastMessage: { 
          bsonType: "string",
          description: "Preview of last message"
        },
        lastMessageAt: { 
          bsonType: "date",
          description: "Timestamp of last message"
        },
        createdAt: { 
          bsonType: "date",
          description: "Chat creation timestamp"
        },
        updatedAt: { 
          bsonType: "date",
          description: "Last update timestamp"
        }
      }
    }
  }
});

// Chats Indexes
db.chats.createIndex({ user1: 1, user2: 1 }, { name: "idx_chats_participants" });
db.chats.createIndex({ propertyId: 1 }, { name: "idx_chats_property" });
db.chats.createIndex({ updatedAt: -1 }, { name: "idx_chats_updated" });

print("✅ Chats collection created with indexes");

// ============================================
// 5. MESSAGES COLLECTION
// ============================================
print("\n📁 Creating messages collection...");

db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatId", "senderId", "createdAt"],
      properties: {
        chatId: { 
          bsonType: "objectId",
          description: "Reference to chats._id - required"
        },
        senderId: { 
          bsonType: "objectId",
          description: "Reference to users._id - required"
        },
        text: { 
          bsonType: "string",
          maxLength: 5000,
          description: "Message text content"
        },
        images: { 
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Array of image URLs"
        },
        isRead: { 
          bsonType: "bool",
          description: "Message read status"
        },
        createdAt: { 
          bsonType: "date",
          description: "Message sent timestamp"
        }
      }
    }
  }
});

// Messages Indexes
db.messages.createIndex({ chatId: 1, createdAt: -1 }, { name: "idx_messages_chat_time" });
db.messages.createIndex({ senderId: 1 }, { name: "idx_messages_sender" });
db.messages.createIndex({ isRead: 1 }, { name: "idx_messages_read" });

print("✅ Messages collection created with indexes");

// ============================================
// 6. NOTIFICATIONS COLLECTION
// ============================================
print("\n📁 Creating notifications collection...");

db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "message", "createdAt"],
      properties: {
        userId: { 
          bsonType: "objectId",
          description: "Reference to users._id - required"
        },
        type: { 
          enum: ["message", "favorite", "property", "system", "alert"],
          description: "Notification type - required"
        },
        title: { 
          bsonType: "string",
          maxLength: 200,
          description: "Notification title"
        },
        message: { 
          bsonType: "string",
          maxLength: 1000,
          description: "Notification message - required"
        },
        data: { 
          bsonType: "object",
          description: "Additional data (property ID, chat ID, etc.)"
        },
        isRead: { 
          bsonType: "bool",
          description: "Read status"
        },
        createdAt: { 
          bsonType: "date",
          description: "Notification timestamp"
        }
      }
    }
  }
});

// Notifications Indexes
db.notifications.createIndex({ userId: 1, createdAt: -1 }, { name: "idx_notifications_user_time" });
db.notifications.createIndex({ isRead: 1 }, { name: "idx_notifications_read" });
db.notifications.createIndex({ type: 1 }, { name: "idx_notifications_type" });

print("✅ Notifications collection created with indexes");

// ============================================
// 7. REPORTS COLLECTION
// ============================================
print("\n📁 Creating reports collection...");

db.createCollection("reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reporterId", "entityType", "entityId", "reason", "createdAt"],
      properties: {
        reporterId: { 
          bsonType: "objectId",
          description: "User who reported - required"
        },
        entityType: { 
          enum: ["property", "user", "message"],
          description: "Type of entity being reported - required"
        },
        entityId: { 
          bsonType: "objectId",
          description: "ID of reported entity - required"
        },
        reason: { 
          enum: ["spam", "fraud", "inappropriate", "duplicate", "other"],
          description: "Reason for report - required"
        },
        description: { 
          bsonType: "string",
          maxLength: 2000,
          description: "Detailed description"
        },
        status: { 
          enum: ["pending", "reviewed", "resolved", "rejected"],
          description: "Report status"
        },
        reviewedBy: { 
          bsonType: "objectId",
          description: "Admin who reviewed (users._id)"
        },
        reviewedAt: { 
          bsonType: "date",
          description: "Review timestamp"
        },
        createdAt: { 
          bsonType: "date",
          description: "Report creation timestamp"
        }
      }
    }
  }
});

// Reports Indexes
db.reports.createIndex({ reporterId: 1 }, { name: "idx_reports_reporter" });
db.reports.createIndex({ entityType: 1, entityId: 1 }, { name: "idx_reports_entity" });
db.reports.createIndex({ status: 1, createdAt: -1 }, { name: "idx_reports_status_time" });

print("✅ Reports collection created with indexes");

// ============================================
// 8. SESSIONS COLLECTION
// ============================================
print("\n📁 Creating sessions collection...");

db.createCollection("sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "refreshToken", "createdAt", "expiresAt"],
      properties: {
        userId: { 
          bsonType: "objectId",
          description: "Reference to users._id - required"
        },
        refreshToken: { 
          bsonType: "string",
          description: "JWT refresh token - required"
        },
        deviceInfo: { 
          bsonType: "object",
          properties: {
            deviceId: { bsonType: "string" },
            deviceType: { bsonType: "string" },
            os: { bsonType: "string" },
            appVersion: { bsonType: "string" }
          },
          description: "Device information"
        },
        ipAddress: { 
          bsonType: "string",
          description: "IP address of the session"
        },
        isActive: { 
          bsonType: "bool",
          description: "Session active status"
        },
        createdAt: { 
          bsonType: "date",
          description: "Session creation timestamp"
        },
        expiresAt: { 
          bsonType: "date",
          description: "Session expiration timestamp"
        },
        lastActivityAt: { 
          bsonType: "date",
          description: "Last activity timestamp"
        }
      }
    }
  }
});

// Sessions Indexes
db.sessions.createIndex({ userId: 1 }, { name: "idx_sessions_user" });
db.sessions.createIndex({ refreshToken: 1 }, { unique: true, name: "idx_sessions_token" });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "idx_sessions_ttl" });
db.sessions.createIndex({ isActive: 1 }, { name: "idx_sessions_active" });

print("✅ Sessions collection created with TTL index");

// ============================================
// SUMMARY
// ============================================
print("\n================================================");
print("✅ Database setup complete!");
print("================================================");
print("\n📊 Collections created:");
print("  1. users");
print("  2. properties");
print("  3. favorites");
print("  4. chats");
print("  5. messages");
print("  6. notifications");
print("  7. reports");
print("  8. sessions");
print("\n🔍 Features enabled:");
print("  ✓ JSON Schema validation");
print("  ✓ GeoJSON 2dsphere index for location");
print("  ✓ Full-text search on properties");
print("  ✓ TTL index for session expiration");
print("  ✓ Compound and unique indexes");
print("  ✓ Soft delete support (isDeleted)");
print("\n================================================");
