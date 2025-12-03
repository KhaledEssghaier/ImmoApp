import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/appimmo-auth';
const USER_ID = '507f1f77bcf86cd799439012';
const PASSWORD = 'Password123!';

async function createUser() {
  console.log('🔐 Creating test user...');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // Create user
    const user = {
      _id: new ObjectId(USER_ID),
      email: 'test.user@example.com',
      password: hashedPassword,
      fullName: 'Test User',
      phone: '+33612345678',
      role: 'USER',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user already exists
    const existing = await db.collection('users').findOne({ _id: user._id });
    if (existing) {
      console.log('⚠️  User already exists - Updating password...');
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      console.log('✅ Password updated successfully!');
      console.log(`User ID: ${USER_ID}`);
      console.log(`Email: ${existing.email}`);
      console.log(`Password: ${PASSWORD}`);
    } else {
      await db.collection('users').insertOne(user);
      console.log('✅ User created successfully!');
      console.log(`User ID: ${USER_ID}`);
      console.log(`Email: test.user@example.com`);
      console.log(`Password: ${PASSWORD}`);
    }

  } catch (error) {
    console.error('❌ Failed to create user:', error);
    throw error;
  } finally {
    await client.close();
  }
}

createUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
