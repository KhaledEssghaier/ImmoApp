// Script to check all properties in the database
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Count all properties
    const totalCount = await collection.countDocuments({});
    const activeCount = await collection.countDocuments({ isDeleted: { $ne: true } });
    
    console.log(`\n📊 Total properties: ${totalCount}`);
    console.log(`📊 Active properties (not deleted): ${activeCount}`);
    console.log(`📊 Soft-deleted properties: ${totalCount - activeCount}`);

    // Get all properties
    const allProps = await collection.find({}).toArray();
    
    if (allProps.length === 0) {
      console.log('\n⚠️  Database is EMPTY!');
      console.log('Your 5 test properties (clanca, kjh, jkhcja, etc.) are NOT in the database.');
      console.log('\n💡 Solution: Create new properties through the Flutter app');
      return;
    }

    console.log('\n📋 All properties in database:');
    allProps.forEach((prop, index) => {
      const deleted = prop.isDeleted ? ' [DELETED]' : '';
      const type = prop.propertyType || prop.type;
      console.log(`   ${index + 1}. ${prop.title} (${type}) - ${prop.price}€${deleted}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkDatabase();
