import * as bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

async function fixPassword() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  const email = 'jean.dupont@example.com';
  const password = 'Password123!';
  
  console.log(`🔐 Checking ${email}...`);
  
  const user = await db.collection('users').findOne({ email });
  
  if (!user) {
    console.log('❌ User not found');
    await client.close();
    return;
  }
  
  console.log(`   Current hash: ${user.passwordHash}`);
  
  // Test if current password works
  const currentMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`   Current password matches: ${currentMatch ? '✅' : '❌'}`);
  
  if (!currentMatch) {
    // Update password
    const newHash = await bcrypt.hash(password, 10);
    await db.collection('users').updateOne(
      { email },
      { $set: { passwordHash: newHash } }
    );
    console.log(`   ✅ Updated password hash to: ${newHash}`);
    
    // Verify new hash
    const verifyUser = await db.collection('users').findOne({ email });
    const newMatch = await bcrypt.compare(password, verifyUser.passwordHash);
    console.log(`   New password matches: ${newMatch ? '✅' : '❌'}`);
  }
  
  await client.close();
}

fixPassword().catch(console.error);
