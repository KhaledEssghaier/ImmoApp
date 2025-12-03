// Script to create test properties with the CORRECT schema matching property-service
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

// Test owner ID (should match a real user in your database)
const TEST_OWNER_ID = new ObjectId('691af17ff62a194ac5762aa1');

const testProperties = [
  {
    ownerId: TEST_OWNER_ID,
    title: 'Luxury Apartment in Paris',
    description: 'Beautiful modern apartment in the heart of Paris with stunning views',
    price: 850000,
    propertyType: 'apartment',
    transactionType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    surface: 120.5,
    amenities: ['WiFi', 'Parking', 'Elevator', 'Balcony'],
    location: {
      type: 'Point',
      coordinates: [2.3522, 48.8566] // [longitude, latitude] - Paris
    },
    address: {
      country: 'France',
      city: 'Paris',
      street: 'Champs-Élysées',
      zipcode: '75008'
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: TEST_OWNER_ID,
    title: 'Charming House in Lyon',
    description: 'Spacious family house with garden and pool, perfect for families',
    price: 2500,
    propertyType: 'house',
    transactionType: 'rent',
    bedrooms: 4,
    bathrooms: 3,
    surface: 180,
    amenities: ['Garden', 'Pool', 'Parking', 'WiFi'],
    location: {
      type: 'Point',
      coordinates: [4.8357, 45.764] // Lyon
    },
    address: {
      country: 'France',
      city: 'Lyon',
      street: 'Rue République',
      zipcode: '69002'
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: TEST_OWNER_ID,
    title: 'Modern Villa in Tunis',
    description: 'Beautiful villa with modern amenities and sea view',
    price: 450000,
    propertyType: 'villa',
    transactionType: 'sale',
    bedrooms: 5,
    bathrooms: 4,
    surface: 350,
    amenities: ['WiFi', 'Parking', 'Pool', 'Garden', 'Balcony', 'AC'],
    location: {
      type: 'Point',
      coordinates: [10.33053, 36.88744] // Tunis
    },
    address: {
      country: 'Tunisia',
      city: 'Tunis',
      street: 'Avenue Habib Bourguiba',
      zipcode: '1000'
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: TEST_OWNER_ID,
    title: 'Cozy Studio in Downtown',
    description: 'Perfect for students or young professionals, fully furnished',
    price: 800,
    propertyType: 'studio',
    transactionType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    surface: 45,
    amenities: ['WiFi', 'Elevator', 'AC'],
    location: {
      type: 'Point',
      coordinates: [10.1815, 36.8065] // Tunis
    },
    address: {
      country: 'Tunisia',
      city: 'Tunis',
      street: 'Rue de la Liberté',
      zipcode: '1002'
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: TEST_OWNER_ID,
    title: 'Commercial Office Space',
    description: 'Prime location office space with modern facilities',
    price: 5000,
    propertyType: 'office',
    transactionType: 'rent',
    bedrooms: 0,
    bathrooms: 2,
    surface: 200,
    amenities: ['WiFi', 'Parking', 'Elevator', 'AC', 'Security'],
    location: {
      type: 'Point',
      coordinates: [10.1815, 36.8065]
    },
    address: {
      country: 'Tunisia',
      city: 'Tunis',
      street: 'Avenue Mohamed V',
      zipcode: '1000'
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createTestProperties() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Insert test properties
    const result = await collection.insertMany(testProperties);
    console.log(`\n✅ Created ${result.insertedCount} test properties`);

    // Display created properties
    console.log('\n📋 Created properties:');
    testProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} (${prop.propertyType}) - ${prop.price}€ for ${prop.transactionType}`);
    });

    // Verify total count
    const totalCount = await collection.countDocuments({ isDeleted: { $ne: true } });
    console.log(`\n📊 Total active properties in database: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

createTestProperties();
