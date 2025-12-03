import * as bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

async function testPassword() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  // Test both users
  const users = [
    { email: 'test@example.com', password: 'Test1234!' },
    { email: 'marie.martin@example.com', password: 'Password123!' }
  ];
  
  for (const testUser of users) {
    console.log(`\n🔐 Testing ${testUser.email}...`);
    
    const user = await db.collection('users').findOne({ email: testUser.email });
    
    if (!user) {
      console.log('❌ User not found');
      continue;
    }
    
    console.log(`   Hash in DB: ${user.passwordHash}`);
    
    const isMatch = await bcrypt.compare(testUser.password, user.passwordHash);
    console.log(`   Password "${testUser.password}" matches: ${isMatch ? '✅' : '❌'}`);
    
    if (!isMatch) {
      // Try updating it
      const newHash = await bcrypt.hash(testUser.password, 10);
      await db.collection('users').updateOne(
        { email: testUser.email },
        { $set: { passwordHash: newHash } }
      );
      console.log(`   ✅ Updated password hash`);
      
      // Verify new hash
      const updatedUser = await db.collection('users').findOne({ email: testUser.email });
      const newMatch = await bcrypt.compare(testUser.password, updatedUser.passwordHash);
      console.log(`   New password matches: ${newMatch ? '✅' : '❌'}`);
    }
  }
  
  await client.close();
}

testPassword().catch(console.error);
