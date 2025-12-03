// This script checks if you have a LOCAL MongoDB running with old data
const { MongoClient } = require('mongodb');

const LOCAL_MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

async function checkLocalMongoDB() {
  const client = new MongoClient(LOCAL_MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL MongoDB (localhost:27017)\n');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const count = await collection.countDocuments({});
    console.log(`📊 Properties in LOCAL MongoDB: ${count}\n`);

    if (count > 0) {
      const properties = await collection.find({}).limit(10).toArray();
      console.log('📋 Properties in LOCAL database:\n');
      properties.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.title} (${prop._id})`);
      });

      console.log('\n⚠️  You have OLD properties in LOCAL MongoDB!');
      console.log('The property-service was using LOCAL MongoDB instead of MongoDB Atlas.');
      console.log('\n💡 Solution: Delete these old properties or ignore them (they are outdated).');
      console.log('After restarting property-service, it will now use MongoDB Atlas.\n');
    } else {
      console.log('✅ No properties found in LOCAL MongoDB.');
    }

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('ℹ️  LOCAL MongoDB is NOT running (this is OK)');
      console.log('Property service will use MongoDB Atlas after restart.\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.close();
  }
}

checkLocalMongoDB();
