import * as bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

async function updatePassword() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  const userId = '507f1f77bcf86cd799439012';
  const newPassword = 'Password123!';
  
  console.log(`🔐 Updating password for user ${userId}...`);
  
  const hash = await bcrypt.hash(newPassword, 10);
  
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash: hash } }
  );
  
  if (result.modifiedCount > 0) {
    console.log('✅ Password updated successfully');
    console.log(`Email: marie.martin@example.com`);
    console.log(`Password: ${newPassword}`);
  } else {
    console.log('❌ User not found or password unchanged');
  }
  
  await client.close();
}

updatePassword().catch(console.error);
