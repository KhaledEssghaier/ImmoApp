import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/appimmo-auth';
const USER_ID = '507f1f77bcf86cd799439012';
const PASSWORD = 'Password123!';

async function updatePassword() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  try {
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(USER_ID) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('Email: test.user@example.com');
      console.log('Password: Password123!');
      console.log('User ID:', USER_ID);
    } else {
      console.log('❌ User not found');
    }

  } finally {
    await client.close();
  }
}

updatePassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
