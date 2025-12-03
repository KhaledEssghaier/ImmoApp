// Script to check ALL properties in database with full details
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

async function checkAllProperties() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get ALL properties (including deleted)
    const allProperties = await collection.find({}).toArray();

    console.log(`📊 Total properties in database: ${allProperties.length}\n`);

    if (allProperties.length === 0) {
      console.log('⚠️  Database is EMPTY!\n');
      return;
    }

    console.log('📋 ALL properties with details:\n');
    allProperties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.title}`);
      console.log(`   ID: ${prop._id}`);
      console.log(`   Type: ${prop.propertyType}`);
      console.log(`   Transaction: ${prop.transactionType}`);
      console.log(`   Price: ${prop.price}€`);
      console.log(`   isDeleted: ${prop.isDeleted || false}`);
      console.log(`   Created: ${prop.createdAt}`);
      console.log('');
    });

    // Check for duplicates
    const activeCount = await collection.countDocuments({ isDeleted: { $ne: true } });
    const deletedCount = await collection.countDocuments({ isDeleted: true });

    console.log('📊 Summary:');
    console.log(`   Active properties: ${activeCount}`);
    console.log(`   Deleted properties: ${deletedCount}`);
    console.log(`   Total: ${allProperties.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkAllProperties();
