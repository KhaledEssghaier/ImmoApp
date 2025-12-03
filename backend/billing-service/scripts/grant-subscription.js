const mongoose = require('mongoose');
require('dotenv').config();

async function grantSubscription() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '691af17ff62a194ac5762aa1';
    const db = mongoose.connection.db;

    // Create subscription
    const subscription = {
      userId: new mongoose.Types.ObjectId(userId),
      totalCredits: 10,
      remainingCredits: 10,
      price: 50.00,
      paymentId: 'manual_grant_' + Date.now(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('subscriptions').insertOne(subscription);
    console.log('✅ Subscription created:', result.insertedId);

    // Create or update user credits
    await db.collection('usercredits').findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          userId: new mongoose.Types.ObjectId(userId),
          credits: 10,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    console.log('✅ User credits updated: 10 credits');

    // Verify
    const userSub = await db.collection('subscriptions').findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });
    console.log('\n📊 Subscription Details:');
    console.log('  User ID:', userId);
    console.log('  Total Credits:', userSub.totalCredits);
    console.log('  Remaining Credits:', userSub.remainingCredits);
    console.log('  Price: $' + userSub.price.toFixed(2));
    console.log('  Status:', userSub.isActive ? 'Active' : 'Inactive');

    console.log('\n🎉 User now has 10 credits for posting properties!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

grantSubscription()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
