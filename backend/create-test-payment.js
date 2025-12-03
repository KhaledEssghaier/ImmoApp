// Script to create a test payment record in MongoDB
// Run with: node create-test-payment.js

const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://khaled:Mohamed_1990@khaledessghaier.kygzqup.mongodb.net/immobilier_billing?retryWrites=true&w=majority&appName=KhaledEssghaier";
const userId = "691af17ff62a194ac5762aa1";

async function createTestPayment() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('immobilier_billing');
    const paymentsCollection = db.collection('payments');
    
    // Create a test payment record
    const testPayment = {
      userId: new ObjectId(userId),
      type: 'subscription',
      amount: 50,
      status: 'success',
      stripeSessionId: 'test_session_' + Date.now(),
      stripePaymentIntentId: 'pi_test_' + Date.now(),
      subscriptionId: new ObjectId('692636dbcd206e395f6acfc7'),
      metadata: {
        test: true,
        description: 'Test subscription payment'
      },
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await paymentsCollection.insertOne(testPayment);
    console.log('✅ Test payment created:', result.insertedId);
    
    // Verify payment was created
    const count = await paymentsCollection.countDocuments({ 
      userId: new ObjectId(userId),
      status: 'success'
    });
    console.log(`✅ Total successful payments for user: ${count}`);
    
    // Show the payment
    const payments = await paymentsCollection
      .find({ userId: new ObjectId(userId), status: 'success' })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log('\n📋 Payment History:');
    payments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Payment ${payment._id}`);
      console.log(`   Type: ${payment.type}`);
      console.log(`   Amount: $${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Date: ${payment.paidAt || payment.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

createTestPayment();
