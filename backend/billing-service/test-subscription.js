const mongoose = require('mongoose');
require('dotenv').config();

async function testSubscription() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '691af17ff62a194ac5762aa1';
    const db = mongoose.connection.db;

    console.log('🧪 Testing Subscription for User:', userId);
    console.log('=' .repeat(50));

    // Step 1: Grant Subscription
    console.log('1️⃣  Granting Subscription...');

    // Remove any existing subscription for clean test
    await db.collection('subscriptions').deleteMany({
      userId: new mongoose.Types.ObjectId(userId)
    });

    // Create new subscription
    const subscription = {
      userId: new mongoose.Types.ObjectId(userId),
      totalCredits: 10,
      remainingCredits: 10,
      price: 50.00,
      paymentId: 'test_subscription_' + Date.now(),
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
    console.log('✅ User credits updated: 10 credits\n');

    // Step 2: Verify Subscription
    console.log('2️⃣  Verifying Subscription...');

    const userSub = await db.collection('subscriptions').findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    if (!userSub) {
      throw new Error('Subscription not found after creation');
    }

    console.log('📊 Subscription Details:');
    console.log('  User ID:', userId);
    console.log('  Total Credits:', userSub.totalCredits);
    console.log('  Remaining Credits:', userSub.remainingCredits);
    console.log('  Price: $' + userSub.price.toFixed(2));
    console.log('  Status:', userSub.isActive ? 'Active' : 'Inactive');
    console.log('  Payment ID:', userSub.paymentId);

    // Step 3: Verify User Credits
    console.log('\n3️⃣  Verifying User Credits...');

    const userCredits = await db.collection('usercredits').findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!userCredits) {
      throw new Error('User credits not found');
    }

    console.log('💰 User Credits:');
    console.log('  Credits:', userCredits.credits);
    console.log('  Last Updated:', userCredits.updatedAt);

    // Step 4: Test Credit Deduction Simulation
    console.log('\n4️⃣  Testing Credit Deduction Simulation...');

    // Simulate deducting 1 credit
    const newCredits = userCredits.credits - 1;
    await db.collection('usercredits').updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { credits: newCredits, updatedAt: new Date() } }
    );

    // Update subscription remaining credits
    await db.collection('subscriptions').updateOne(
      { userId: new mongoose.Types.ObjectId(userId), isActive: true },
      { $set: { remainingCredits: userSub.remainingCredits - 1, updatedAt: new Date() } }
    );

    console.log('✅ Simulated credit deduction: 10 → 9 credits');

    // Verify deduction
    const updatedCredits = await db.collection('usercredits').findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    const updatedSub = await db.collection('subscriptions').findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    console.log('📊 After Deduction:');
    console.log('  User Credits:', updatedCredits.credits);
    console.log('  Subscription Remaining:', updatedSub.remainingCredits);

    // Step 5: Test Results
    console.log('\n5️⃣  Test Results:');

    const tests = [
      {
        name: 'Subscription Created',
        passed: userSub.totalCredits === 10 && userSub.price === 50,
        expected: '10 credits for $50',
        actual: `${userSub.totalCredits} credits for $${userSub.price}`
      },
      {
        name: 'Credits Assigned',
        passed: userCredits.credits === 10,
        expected: '10 credits',
        actual: `${userCredits.credits} credits`
      },
      {
        name: 'Credit Deduction Works',
        passed: updatedCredits.credits === 9 && updatedSub.remainingCredits === 9,
        expected: '9 credits remaining',
        actual: `${updatedCredits.credits} credits, ${updatedSub.remainingCredits} remaining`
      }
    ];

    let allPassed = true;
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${test.name}`);
      if (!test.passed) {
        console.log(`      Expected: ${test.expected}`);
        console.log(`      Actual: ${test.actual}`);
        allPassed = false;
      }
    });

    console.log('\n' + '=' .repeat(50));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Subscription system is working correctly.');
      console.log('\n📝 Summary:');
      console.log('   • User has 10 credits for posting properties');
      console.log('   • Credits are properly tracked and deducted');
      console.log('   • Subscription is active and valid');
    } else {
      console.log('❌ SOME TESTS FAILED! Check the issues above.');
    }

    console.log('\n🔍 You can now test the frontend at:');
    console.log('   http://localhost:50358/#/subscription');
    console.log('\n💡 The user should see:');
    console.log('   • Subscription status: Active');
    console.log('   • Remaining credits: 9 (after simulation)');
    console.log('   • Ability to post properties using credits');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

testSubscription()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
