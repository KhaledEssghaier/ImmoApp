const mongoose = require('mongoose');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log(`📦 Database: ${mongoose.connection.name}`);

    // Create collections with validation
    const collections = [
      {
        name: 'payments',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'type', 'amount', 'status', 'stripeSessionId'],
            properties: {
              userId: { bsonType: 'objectId' },
              type: { enum: ['single_post', 'subscription'] },
              amount: { bsonType: 'number' },
              status: { enum: ['pending', 'success', 'failed', 'refunded'] },
              stripeSessionId: { bsonType: 'string' },
              stripePaymentIntentId: { bsonType: 'string' },
              propertyId: { bsonType: 'objectId' },
              subscriptionId: { bsonType: 'objectId' },
              paidAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'subscriptions',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'totalCredits', 'remainingCredits', 'price', 'paymentId', 'isActive'],
            properties: {
              userId: { bsonType: 'objectId' },
              totalCredits: { bsonType: 'number' },
              remainingCredits: { bsonType: 'number' },
              price: { bsonType: 'number' },
              paymentId: { bsonType: 'string' },
              isActive: { bsonType: 'bool' },
              expiresAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'usercredits',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'credits'],
            properties: {
              userId: { bsonType: 'objectId' },
              credits: { bsonType: 'number', minimum: 0 },
            },
          },
        },
      },
    ];

    // Create collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    for (const collection of collections) {
      if (existingNames.includes(collection.name)) {
        console.log(`⏭️  Collection '${collection.name}' already exists`);
      } else {
        await db.createCollection(collection.name, {
          validator: collection.validator,
        });
        console.log(`✅ Created collection: ${collection.name}`);
      }
    }

    // Create indexes
    console.log('\n📊 Creating indexes...');

    // Payments indexes
    await db.collection('payments').createIndex({ userId: 1, status: 1 });
    await db.collection('payments').createIndex({ stripeSessionId: 1 }, { unique: true });
    await db.collection('payments').createIndex({ propertyId: 1 });
    await db.collection('payments').createIndex({ createdAt: -1 });
    console.log('✅ Created indexes for payments');

    // Subscriptions indexes
    await db.collection('subscriptions').createIndex({ userId: 1, isActive: 1 });
    await db.collection('subscriptions').createIndex({ createdAt: -1 });
    console.log('✅ Created indexes for subscriptions');

    // User credits indexes
    await db.collection('usercredits').createIndex({ userId: 1 }, { unique: true });
    console.log('✅ Created indexes for usercredits');

    console.log('\n🎉 Database initialization complete!');
    console.log('\n📋 Collections created:');
    const finalCollections = await db.listCollections().toArray();
    finalCollections.forEach(c => console.log(`  - ${c.name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

initDatabase();
