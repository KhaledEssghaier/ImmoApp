import * as bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

async function createUser() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  const newPassword = 'Test1234!';
  const hash = await bcrypt.hash(newPassword, 10);
  
  const newUser = {
    _id: new ObjectId('507f1f77bcf86cd799439014'),
    fullName: 'Test User',
    email: 'test@example.com',
    passwordHash: hash,
    phone: '+33600000000',
    role: 'user',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('📝 Creating test user...');
  
  // Delete if exists
  await db.collection('users').deleteOne({ email: 'test@example.com' });
  
  const result = await db.collection('users').insertOne(newUser);
  
  if (result.acknowledged) {
    console.log('✅ User created successfully');
    console.log(`Email: test@example.com`);
    console.log(`Password: ${newPassword}`);
    console.log(`ID: ${newUser._id}`);
  } else {
    console.log('❌ Failed to create user');
  }
  
  await client.close();
}

createUser().catch(console.error);
