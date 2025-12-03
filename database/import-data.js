// ============================================
// Import Sample Data Script
// Real Estate Mobile Application
// ============================================

use immobilier_app;

print("📥 Importing sample data...\n");

// ============================================
// 1. USERS
// ============================================
print("👥 Inserting users...");

db.users.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "fullName": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "passwordHash": "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36K2Z1UbxUbL9N.3xvtWg3u",
    "phone": "+33612345678",
    "profileImage": "https://s3.amazonaws.com/profiles/jean_dupont.jpg",
    "role": "user",
    "createdAt": ISODate("2025-01-10T10:30:00Z"),
    "updatedAt": ISODate("2025-01-12T14:15:00Z"),
    "isDeleted": false
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439012"),
    "fullName": "Marie Martin",
    "email": "marie.martin@example.com",
    "passwordHash": "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36K2Z1UbxUbL9N.3xvtWg3u",
    "phone": "+33698765432",
    "profileImage": "https://s3.amazonaws.com/profiles/marie_martin.jpg",
    "role": "user",
    "createdAt": ISODate("2025-01-05T09:20:00Z"),
    "updatedAt": ISODate("2025-01-14T11:30:00Z"),
    "isDeleted": false
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439013"),
    "fullName": "Admin User",
    "email": "admin@immobilier.com",
    "passwordHash": "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36K2Z1UbxUbL9N.3xvtWg3u",
    "phone": "+33600000000",
    "profileImage": "https://s3.amazonaws.com/profiles/admin.jpg",
    "role": "admin",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-14T16:00:00Z"),
    "isDeleted": false
  }
]);

print("✅ Users inserted: " + db.users.countDocuments());

// ============================================
// 2. PROPERTIES
// ============================================
print("\n🏠 Inserting properties...");

db.properties.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439021"),
    "ownerId": ObjectId("507f1f77bcf86cd799439011"),
    "title": "Luxury 3BR Apartment in Paris City Center",
    "description": "Beautiful modern apartment with stunning views of the Eiffel Tower. Located in the heart of Paris, close to metro stations, shops, and restaurants. Features include hardwood floors, modern kitchen with high-end appliances, spacious living room, and a balcony.",
    "price": 850000,
    "type": "apartment",
    "transactionType": "sell",
    "area": 120.5,
    "rooms": 3,
    "bathrooms": 2,
    "images": [
      "https://s3.amazonaws.com/properties/paris_apt_001.jpg",
      "https://s3.amazonaws.com/properties/paris_apt_002.jpg",
      "https://s3.amazonaws.com/properties/paris_apt_003.jpg",
      "https://s3.amazonaws.com/properties/paris_apt_004.jpg"
    ],
    "location": {
      "type": "Point",
      "coordinates": [2.3522, 48.8566],
      "address": "123 Avenue des Champs-Élysées",
      "city": "Paris",
      "country": "France"
    },
    "createdAt": ISODate("2025-01-10T14:30:00Z"),
    "updatedAt": ISODate("2025-01-12T09:15:00Z"),
    "isDeleted": false
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439022"),
    "ownerId": ObjectId("507f1f77bcf86cd799439011"),
    "title": "Charming 4BR House in Lyon Suburb",
    "description": "Spacious family house with garden and garage. Perfect for families, located in a quiet neighborhood with excellent schools nearby. Features include large kitchen, separate dining room, home office, and outdoor patio.",
    "price": 2500,
    "type": "house",
    "transactionType": "rent",
    "area": 180.0,
    "rooms": 4,
    "bathrooms": 3,
    "images": [
      "https://s3.amazonaws.com/properties/lyon_house_001.jpg",
      "https://s3.amazonaws.com/properties/lyon_house_002.jpg",
      "https://s3.amazonaws.com/properties/lyon_house_003.jpg"
    ],
    "location": {
      "type": "Point",
      "coordinates": [4.8357, 45.7640],
      "address": "45 Rue de la République",
      "city": "Lyon",
      "country": "France"
    },
    "createdAt": ISODate("2025-01-08T11:00:00Z"),
    "updatedAt": ISODate("2025-01-08T11:00:00Z"),
    "isDeleted": false
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439023"),
    "ownerId": ObjectId("507f1f77bcf86cd799439011"),
    "title": "Stunning Villa with Pool in Nice",
    "description": "Magnificent villa with panoramic sea views, private pool, and landscaped gardens. High-end finishes throughout, home cinema, gym, and wine cellar. A true luxury property.",
    "price": 3500000,
    "type": "villa",
    "transactionType": "sell",
    "area": 350.0,
    "rooms": 6,
    "bathrooms": 5,
    "images": [
      "https://s3.amazonaws.com/properties/nice_villa_001.jpg",
      "https://s3.amazonaws.com/properties/nice_villa_002.jpg",
      "https://s3.amazonaws.com/properties/nice_villa_003.jpg",
      "https://s3.amazonaws.com/properties/nice_villa_004.jpg",
      "https://s3.amazonaws.com/properties/nice_villa_005.jpg"
    ],
    "location": {
      "type": "Point",
      "coordinates": [7.2619, 43.7034],
      "address": "12 Boulevard de la Croisette",
      "city": "Nice",
      "country": "France"
    },
    "createdAt": ISODate("2025-01-12T16:45:00Z"),
    "updatedAt": ISODate("2025-01-13T10:20:00Z"),
    "isDeleted": false
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439024"),
    "ownerId": ObjectId("507f1f77bcf86cd799439011"),
    "title": "Modern Office Space in Business District",
    "description": "Premium office space in the heart of La Défense business district. Open plan layout with meeting rooms, modern facilities, and 24/7 security. Excellent transport links.",
    "price": 5000,
    "type": "office",
    "transactionType": "rent",
    "area": 200.0,
    "rooms": 0,
    "bathrooms": 2,
    "images": [
      "https://s3.amazonaws.com/properties/office_001.jpg",
      "https://s3.amazonaws.com/properties/office_002.jpg"
    ],
    "location": {
      "type": "Point",
      "coordinates": [2.2380, 48.8920],
      "address": "15 Esplanade du Général de Gaulle",
      "city": "La Défense",
      "country": "France"
    },
    "createdAt": ISODate("2025-01-09T13:30:00Z"),
    "updatedAt": ISODate("2025-01-09T13:30:00Z"),
    "isDeleted": false
  }
]);

print("✅ Properties inserted: " + db.properties.countDocuments());

// ============================================
// 3. FAVORITES
// ============================================
print("\n⭐ Inserting favorites...");

db.favorites.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439031"),
    "userId": ObjectId("507f1f77bcf86cd799439012"),
    "propertyId": ObjectId("507f1f77bcf86cd799439021"),
    "createdAt": ISODate("2025-01-11T15:30:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439032"),
    "userId": ObjectId("507f1f77bcf86cd799439012"),
    "propertyId": ObjectId("507f1f77bcf86cd799439023"),
    "createdAt": ISODate("2025-01-13T09:45:00Z")
  }
]);

print("✅ Favorites inserted: " + db.favorites.countDocuments());

// ============================================
// 4. CHATS
// ============================================
print("\n💬 Inserting chats...");

db.chats.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439041"),
    "user1": ObjectId("507f1f77bcf86cd799439012"),
    "user2": ObjectId("507f1f77bcf86cd799439011"),
    "propertyId": ObjectId("507f1f77bcf86cd799439021"),
    "lastMessage": "Is the apartment still available?",
    "lastMessageAt": ISODate("2025-01-14T10:30:00Z"),
    "createdAt": ISODate("2025-01-11T16:00:00Z"),
    "updatedAt": ISODate("2025-01-14T10:30:00Z")
  }
]);

print("✅ Chats inserted: " + db.chats.countDocuments());

// ============================================
// 5. MESSAGES
// ============================================
print("\n📨 Inserting messages...");

db.messages.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439051"),
    "chatId": ObjectId("507f1f77bcf86cd799439041"),
    "senderId": ObjectId("507f1f77bcf86cd799439012"),
    "text": "Hello, I'm interested in your apartment in Paris. Is it still available?",
    "images": [],
    "isRead": true,
    "createdAt": ISODate("2025-01-11T16:00:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439052"),
    "chatId": ObjectId("507f1f77bcf86cd799439041"),
    "senderId": ObjectId("507f1f77bcf86cd799439011"),
    "text": "Hello Marie! Yes, the apartment is still available. Would you like to schedule a viewing?",
    "images": [],
    "isRead": true,
    "createdAt": ISODate("2025-01-11T16:15:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439053"),
    "chatId": ObjectId("507f1f77bcf86cd799439041"),
    "senderId": ObjectId("507f1f77bcf86cd799439012"),
    "text": "That would be great! I'm available this weekend. Saturday afternoon works for me.",
    "images": [],
    "isRead": true,
    "createdAt": ISODate("2025-01-11T16:20:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439054"),
    "chatId": ObjectId("507f1f77bcf86cd799439041"),
    "senderId": ObjectId("507f1f77bcf86cd799439011"),
    "text": "Perfect! Here's additional information about the building amenities.",
    "images": ["https://s3.amazonaws.com/messages/building_amenities.jpg"],
    "isRead": true,
    "createdAt": ISODate("2025-01-12T09:30:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439055"),
    "chatId": ObjectId("507f1f77bcf86cd799439041"),
    "senderId": ObjectId("507f1f77bcf86cd799439012"),
    "text": "Is the apartment still available?",
    "images": [],
    "isRead": false,
    "createdAt": ISODate("2025-01-14T10:30:00Z")
  }
]);

print("✅ Messages inserted: " + db.messages.countDocuments());

// ============================================
// 6. NOTIFICATIONS
// ============================================
print("\n🔔 Inserting notifications...");

db.notifications.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439061"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "type": "message",
    "title": "New Message",
    "message": "You have a new message from Marie Martin",
    "data": {
      "chatId": ObjectId("507f1f77bcf86cd799439041"),
      "senderId": ObjectId("507f1f77bcf86cd799439012"),
      "messageId": ObjectId("507f1f77bcf86cd799439051")
    },
    "isRead": true,
    "createdAt": ISODate("2025-01-11T16:00:30Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439062"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "type": "favorite",
    "title": "Property Favorited",
    "message": "Someone added your property 'Luxury 3BR Apartment' to their favorites",
    "data": {
      "propertyId": ObjectId("507f1f77bcf86cd799439021"),
      "userId": ObjectId("507f1f77bcf86cd799439012")
    },
    "isRead": true,
    "createdAt": ISODate("2025-01-11T15:30:30Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439063"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "type": "system",
    "title": "Welcome to Immobilier App",
    "message": "Thank you for joining! Complete your profile to get better recommendations.",
    "data": {},
    "isRead": true,
    "createdAt": ISODate("2025-01-10T10:30:30Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439064"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "type": "message",
    "title": "New Message",
    "message": "Marie Martin sent you a message",
    "data": {
      "chatId": ObjectId("507f1f77bcf86cd799439041"),
      "senderId": ObjectId("507f1f77bcf86cd799439012"),
      "messageId": ObjectId("507f1f77bcf86cd799439055")
    },
    "isRead": false,
    "createdAt": ISODate("2025-01-14T10:30:30Z")
  }
]);

print("✅ Notifications inserted: " + db.notifications.countDocuments());

// ============================================
// 7. REPORTS
// ============================================
print("\n🚨 Inserting reports...");

db.reports.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439071"),
    "reporterId": ObjectId("507f1f77bcf86cd799439012"),
    "entityType": "property",
    "entityId": ObjectId("507f1f77bcf86cd799439024"),
    "reason": "spam",
    "description": "This property has been listed multiple times with different prices. Seems like spam.",
    "status": "pending",
    "createdAt": ISODate("2025-01-13T14:20:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439072"),
    "reporterId": ObjectId("507f1f77bcf86cd799439012"),
    "entityType": "property",
    "entityId": ObjectId("507f1f77bcf86cd799439022"),
    "reason": "inappropriate",
    "description": "Property description contains inappropriate language.",
    "status": "resolved",
    "reviewedBy": ObjectId("507f1f77bcf86cd799439013"),
    "reviewedAt": ISODate("2025-01-14T09:00:00Z"),
    "createdAt": ISODate("2025-01-12T11:30:00Z")
  }
]);

print("✅ Reports inserted: " + db.reports.countDocuments());

// ============================================
// 8. SESSIONS
// ============================================
print("\n🔐 Inserting sessions...");

db.sessions.insertMany([
  {
    "_id": ObjectId("507f1f77bcf86cd799439081"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MzY0MjE0MDAsImV4cCI6MTczOTAxMzQwMH0.abc123xyz",
    "deviceInfo": {
      "deviceId": "ABC123XYZ",
      "deviceType": "mobile",
      "os": "Android 13",
      "appVersion": "1.2.3"
    },
    "ipAddress": "192.168.1.100",
    "isActive": true,
    "createdAt": ISODate("2025-01-10T10:30:00Z"),
    "expiresAt": ISODate("2025-02-10T10:30:00Z"),
    "lastActivityAt": ISODate("2025-01-14T16:45:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439082"),
    "userId": ObjectId("507f1f77bcf86cd799439012"),
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTIiLCJpYXQiOjE3MzYyNDc2MDAsImV4cCI6MTczODgzOTYwMH0.def456uvw",
    "deviceInfo": {
      "deviceId": "DEF456UVW",
      "deviceType": "mobile",
      "os": "iOS 17.2",
      "appVersion": "1.2.3"
    },
    "ipAddress": "192.168.1.101",
    "isActive": true,
    "createdAt": ISODate("2025-01-05T09:20:00Z"),
    "expiresAt": ISODate("2025-02-05T09:20:00Z"),
    "lastActivityAt": ISODate("2025-01-14T10:30:00Z")
  },
  {
    "_id": ObjectId("507f1f77bcf86cd799439083"),
    "userId": ObjectId("507f1f77bcf86cd799439013"),
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTMiLCJpYXQiOjE3MzYyNjE2MDAsImV4cCI6MTczODg1MzYwMH0.ghi789rst",
    "deviceInfo": {
      "deviceId": "WEB_SESSION_001",
      "deviceType": "web",
      "os": "Windows 11",
      "appVersion": "1.2.3"
    },
    "ipAddress": "192.168.1.102",
    "isActive": true,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "expiresAt": ISODate("2025-02-01T00:00:00Z"),
    "lastActivityAt": ISODate("2025-01-14T16:00:00Z")
  }
]);

print("✅ Sessions inserted: " + db.sessions.countDocuments());

// ============================================
// SUMMARY
// ============================================
print("\n================================================");
print("✅ Sample data import complete!");
print("================================================");
print("\n📊 Total documents:");
print("  - Users: " + db.users.countDocuments());
print("  - Properties: " + db.properties.countDocuments());
print("  - Favorites: " + db.favorites.countDocuments());
print("  - Chats: " + db.chats.countDocuments());
print("  - Messages: " + db.messages.countDocuments());
print("  - Notifications: " + db.notifications.countDocuments());
print("  - Reports: " + db.reports.countDocuments());
print("  - Sessions: " + db.sessions.countDocuments());
print("\n================================================");
