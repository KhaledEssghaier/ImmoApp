// Script to delete the 10 sample properties created by seed-properties.ts
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

// These are titles from the seed data - we'll delete properties with these exact titles
const seedPropertyTitles = [
  'Luxury Villa with Ocean View',
  'Modern Downtown Apartment',
  'Cozy Family House',
  'Beachfront Villa Paradise',
  'Urban Loft for Rent',
  'Commercial Office Space',
  'Spacious Suburban House',
  'Luxury Penthouse',
  'Investment Land Plot',
  'Mountain View Chalet'
];

async function deleteSeedData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Find seed properties
    const seedProperties = await collection.find({
      title: { $in: seedPropertyTitles }
    }).toArray();

    console.log(`\n📊 Found ${seedProperties.length} seed properties to delete:`);
    seedProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} (${prop.type || prop.propertyType})`);
    });

    if (seedProperties.length === 0) {
      console.log('\n✅ No seed data found. Database is clean.');
      return;
    }

    // Delete seed properties
    const result = await collection.deleteMany({
      title: { $in: seedPropertyTitles }
    });

    console.log(`\n✅ Deleted ${result.deletedCount} seed properties`);

    // Count remaining properties
    const remainingCount = await collection.countDocuments({ isDeleted: { $ne: true } });
    console.log(`\n📊 Remaining properties in database: ${remainingCount}`);

    // Show sample of remaining properties
    const remaining = await collection.find({ isDeleted: { $ne: true } })
      .limit(5)
      .project({ title: 1, propertyType: 1, price: 1 })
      .toArray();

    if (remaining.length > 0) {
      console.log('\n📋 Sample of remaining properties:');
      remaining.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.title} (${prop.propertyType}) - ${prop.price}€`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

deleteSeedData();
