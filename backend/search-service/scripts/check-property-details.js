// Script to check property details including transaction types
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

async function checkPropertyDetails() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get all properties with transaction types
    const properties = await collection.find({ isDeleted: { $ne: true } })
      .project({ title: 1, propertyType: 1, transactionType: 1, price: 1 })
      .toArray();

    console.log(`\n📋 Properties with transaction types:\n`);
    properties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title}`);
      console.log(`      Type: ${prop.propertyType}`);
      console.log(`      Transaction: ${prop.transactionType}`);
      console.log(`      Price: ${prop.price}€\n`);
    });

    // Count by transaction type
    const saleCount = await collection.countDocuments({ transactionType: 'sale', isDeleted: { $ne: true } });
    const rentCount = await collection.countDocuments({ transactionType: 'rent', isDeleted: { $ne: true } });

    console.log(`📊 Summary:`);
    console.log(`   For SALE: ${saleCount}`);
    console.log(`   For RENT: ${rentCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkPropertyDetails();
