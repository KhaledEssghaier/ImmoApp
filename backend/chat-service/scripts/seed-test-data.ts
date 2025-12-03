import { MongoClient, ObjectId } from 'mongodb';
import Redis from 'ioredis';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/immobilier_app';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

async function seed() {
  console.log('🌱 Starting seed process...');

  // Connect to MongoDB
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db();
  console.log('✅ Connected to MongoDB');

  // Connect to Redis
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
  });
  console.log('✅ Connected to Redis');

  try {
    // Test user IDs - using real user from database: 507f1f77bcf86cd799439012
    const user1Id = new ObjectId('507f1f77bcf86cd799439012');
    const user2Id = new ObjectId('507f1f77bcf86cd799439013');

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await db.collection('chats').deleteMany({
      $or: [
        { user1: user1Id },
        { user2: user1Id },
        { user1: user2Id },
        { user2: user2Id }
      ]
    });
    await db.collection('messages').deleteMany({
      senderId: { $in: [user1Id, user2Id] },
    });

    // Create test conversation
    console.log('📝 Creating test conversation...');
    const conversationId = new ObjectId();
    const now = new Date();
    const conversation = {
      _id: conversationId,
      user1: user1Id,
      user2: user2Id,
      lastMessage: 'Hello! This is a test message',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('chats').insertOne(conversation);
    console.log(`✅ Created conversation: ${conversationId}`);

    // Create test messages
    console.log('💬 Creating test messages...');
    const messages = [
      {
        _id: new ObjectId(),
        chatId: conversationId,
        senderId: user1Id,
        text: 'Hello! This is a test message',
        isRead: true,
        createdAt: new Date(Date.now() - 60000), // 1 minute ago
      },
      {
        _id: new ObjectId(),
        chatId: conversationId,
        senderId: user2Id,
        text: 'Hi! Thanks for testing',
        isRead: false,
        createdAt: new Date(Date.now() - 30000), // 30 seconds ago
      },
    ];
    await db.collection('messages').insertMany(messages);
    console.log(`✅ Created ${messages.length} messages`);

    // Test Redis connection
    console.log('🔍 Testing Redis...');
    await redis.set('test:key', 'test-value');
    const value = await redis.get('test:key');
    console.log(`✅ Redis test: ${value === 'test-value' ? 'PASSED' : 'FAILED'}`);
    await redis.del('test:key');

    // Set test user online
    console.log('👤 Setting test users online in Redis...');
    await redis.set(`user:${user1Id}:online`, 'true');
    await redis.sadd(`user:${user1Id}:sockets`, 'test-socket-1');
    await redis.set(`user:${user2Id}:online`, 'true');
    await redis.sadd(`user:${user2Id}:sockets`, 'test-socket-2');
    console.log('✅ Test users set to online');

    // Print summary
    console.log('\n📊 Seed Summary:');
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`User 1 ID: ${user1Id}`);
    console.log(`User 2 ID: ${user2Id}`);
    console.log(`Messages: ${messages.length}`);
    console.log('\n✅ Seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await mongoClient.close();
    await redis.quit();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
