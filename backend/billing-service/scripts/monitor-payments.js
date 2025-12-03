const mongoose = require('mongoose');
require('dotenv').config();

const { Schema, Types } = mongoose;

const PaymentSchema = new Schema({
  userId: Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  stripeSessionId: String,
  propertyId: String
}, { timestamps: true });

const SubscriptionSchema = new Schema({
  userId: Types.ObjectId,
  totalCredits: Number,
  remainingCredits: Number,
  price: Number,
  paymentId: String,
  isActive: Boolean
}, { timestamps: true });

async function monitorPayments() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
  console.log('📊 Monitoring payments for user: 691af17ff62a194ac5762aa1\n');
  
  const Payment = mongoose.model('Payment', PaymentSchema);
  const Subscription = mongoose.model('Subscription', SubscriptionSchema);
  const userId = new Types.ObjectId('691af17ff62a194ac5762aa1');

  // Watch for changes
  const paymentChangeStream = Payment.watch([
    { $match: { 'fullDocument.userId': userId } }
  ]);

  const subscriptionChangeStream = Subscription.watch([
    { $match: { 'fullDocument.userId': userId } }
  ]);

  console.log('👀 Watching for payment changes...');
  console.log('🔔 Complete a test payment now!\n');

  paymentChangeStream.on('change', async (change) => {
    console.log('\n🎯 PAYMENT EVENT DETECTED!');
    console.log('Operation:', change.operationType);
    
    if (change.fullDocument) {
      const doc = change.fullDocument;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💳 Payment ID:', doc._id);
      console.log('📝 Type:', doc.type);
      console.log('💰 Amount: $' + (doc.amount / 100).toFixed(2));
      console.log('✅ Status:', doc.status);
      console.log('🔗 Stripe Session:', doc.stripeSessionId);
      console.log('⏰ Created:', doc.createdAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Show current totals
    const totalPayments = await Payment.countDocuments({ userId });
    const successfulPayments = await Payment.countDocuments({ userId, status: 'success' });
    console.log(`📊 Total payments: ${totalPayments} (${successfulPayments} successful)\n`);
  });

  subscriptionChangeStream.on('change', async (change) => {
    console.log('\n🎉 SUBSCRIPTION EVENT DETECTED!');
    console.log('Operation:', change.operationType);
    
    if (change.fullDocument) {
      const doc = change.fullDocument;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎫 Subscription ID:', doc._id);
      console.log('💎 Total Credits:', doc.totalCredits);
      console.log('✨ Remaining Credits:', doc.remainingCredits);
      console.log('💰 Price: $' + (doc.price / 100).toFixed(2));
      console.log('🔗 Payment ID:', doc.paymentId);
      console.log('🟢 Active:', doc.isActive);
      console.log('⏰ Created:', doc.createdAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  });

  // Show initial state
  console.log('📋 INITIAL STATE:');
  const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
  const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
  
  console.log(`  Payments: ${payments.length}`);
  payments.forEach(p => {
    console.log(`    - ${p.type} | $${(p.amount/100).toFixed(2)} | ${p.status}`);
  });
  
  console.log(`  Subscriptions: ${subscriptions.length}`);
  subscriptions.forEach(s => {
    console.log(`    - ${s.remainingCredits}/${s.totalCredits} credits | $${(s.price/100).toFixed(2)}`);
  });
  console.log('\n');
}

monitorPayments().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
