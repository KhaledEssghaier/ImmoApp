import * as bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

async function debugLogin() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  const email = 'test@example.com';
  const password = 'Test1234!';
  
  console.log(`🔍 Debugging login for ${email}...`);
  
  // Find user
  const user = await db.collection('users').findOne({ email, isDeleted: false });
  
  if (!user) {
    console.log('❌ User not found with isDeleted: false');
    
    // Check without isDeleted
    const userAny = await db.collection('users').findOne({ email });
    if (userAny) {
      console.log(`   Found user but isDeleted: ${userAny.isDeleted}`);
    } else {
      console.log('   User does not exist at all');
    }
  } else {
    console.log('✅ User found');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   isDeleted: ${user.isDeleted}`);
    console.log(`   passwordHash: ${user.passwordHash}`);
    
    // Test password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`\n🔐 Password comparison:`);
    console.log(`   Input: "${password}"`);
    console.log(`   Hash: ${user.passwordHash}`);
    console.log(`   Match: ${isValid ? '✅ YES' : '❌ NO'}`);
  }
  
  await client.close();
}

debugLogin().catch(console.error);
