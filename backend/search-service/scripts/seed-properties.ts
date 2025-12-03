import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority';
const DATABASE_NAME = 'immobilier_app';
const COLLECTION_NAME = 'properties';

const sampleProperties = [
  {
    title: 'Luxury Villa with Ocean View',
    description: 'Beautiful 5-bedroom villa with stunning ocean views, modern amenities, and spacious garden.',
    price: 1200000,
    type: 'VILLA',
    status: 'FOR_SALE',
    rooms: 5,
    bathrooms: 4,
    surface: 450,
    address: {
      street: '123 Ocean Drive',
      city: 'Miami',
      zipCode: '33139',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-80.1918, 25.7617], // [longitude, latitude]
    },
    features: ['pool', 'garden', 'parking', 'security', 'ocean_view'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    ownerId: '507f1f77bcf86cd799439011',
    isActive: true,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    title: 'Modern Downtown Apartment',
    description: 'Sleek 2-bedroom apartment in the heart of downtown with city views and premium finishes.',
    price: 450000,
    type: 'APARTMENT',
    status: 'FOR_SALE',
    rooms: 2,
    bathrooms: 2,
    surface: 120,
    address: {
      street: '456 Main Street',
      city: 'New York',
      zipCode: '10001',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128],
    },
    features: ['elevator', 'parking', 'balcony', 'air_conditioning', 'furnished'],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    ownerId: '507f1f77bcf86cd799439012',
    isActive: true,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    title: 'Cozy Family House',
    description: 'Charming 3-bedroom house in quiet neighborhood, perfect for families.',
    price: 380000,
    type: 'HOUSE',
    status: 'FOR_SALE',
    rooms: 3,
    bathrooms: 2,
    surface: 180,
    address: {
      street: '789 Maple Avenue',
      city: 'Los Angeles',
      zipCode: '90001',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522],
    },
    features: ['garden', 'parking', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
    ownerId: '507f1f77bcf86cd799439013',
    isActive: true,
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    title: 'Beachfront Villa Paradise',
    description: 'Exclusive beachfront villa with private beach access, infinity pool, and luxury amenities.',
    price: 2500000,
    type: 'VILLA',
    status: 'FOR_SALE',
    rooms: 6,
    bathrooms: 5,
    surface: 600,
    address: {
      street: '1 Beach Road',
      city: 'Malibu',
      zipCode: '90265',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-118.7798, 34.0259],
    },
    features: ['pool', 'beach_access', 'garden', 'parking', 'security', 'furnished', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
    ownerId: '507f1f77bcf86cd799439014',
    isActive: true,
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-18'),
  },
  {
    title: 'Urban Loft for Rent',
    description: 'Stylish industrial loft in trendy neighborhood, available for rent.',
    price: 2500,
    type: 'APARTMENT',
    status: 'FOR_RENT',
    rooms: 1,
    bathrooms: 1,
    surface: 85,
    address: {
      street: '321 Industrial Street',
      city: 'Chicago',
      zipCode: '60601',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781],
    },
    features: ['elevator', 'parking', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    ownerId: '507f1f77bcf86cd799439015',
    isActive: true,
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-11-12'),
  },
  {
    title: 'Commercial Office Space',
    description: 'Prime commercial office space in business district, fully equipped.',
    price: 850000,
    type: 'COMMERCIAL',
    status: 'FOR_SALE',
    rooms: 0,
    bathrooms: 3,
    surface: 300,
    address: {
      street: '555 Business Blvd',
      city: 'San Francisco',
      zipCode: '94102',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
    },
    features: ['elevator', 'parking', 'security', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'],
    ownerId: '507f1f77bcf86cd799439016',
    isActive: true,
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    title: 'Spacious Suburban House',
    description: 'Large 4-bedroom house with backyard, garage, and modern kitchen.',
    price: 520000,
    type: 'HOUSE',
    status: 'FOR_SALE',
    rooms: 4,
    bathrooms: 3,
    surface: 250,
    address: {
      street: '888 Elm Street',
      city: 'Austin',
      zipCode: '78701',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-97.7431, 30.2672],
    },
    features: ['garden', 'parking', 'pool', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    ownerId: '507f1f77bcf86cd799439017',
    isActive: true,
    createdAt: new Date('2024-09-05'),
    updatedAt: new Date('2024-11-08'),
  },
  {
    title: 'Luxury Penthouse',
    description: 'Top-floor penthouse with panoramic city views and private terrace.',
    price: 1800000,
    type: 'APARTMENT',
    status: 'FOR_SALE',
    rooms: 3,
    bathrooms: 3,
    surface: 280,
    address: {
      street: '999 Skyline Avenue',
      city: 'Seattle',
      zipCode: '98101',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-122.3321, 47.6062],
    },
    features: ['elevator', 'balcony', 'parking', 'security', 'furnished', 'air_conditioning'],
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
    ownerId: '507f1f77bcf86cd799439018',
    isActive: true,
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-11-16'),
  },
  {
    title: 'Investment Land Plot',
    description: 'Prime land for development in growing area, zoned for residential.',
    price: 250000,
    type: 'LAND',
    status: 'FOR_SALE',
    rooms: 0,
    bathrooms: 0,
    surface: 2000,
    address: {
      street: 'Highland Road',
      city: 'Denver',
      zipCode: '80201',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-104.9903, 39.7392],
    },
    features: [],
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    ownerId: '507f1f77bcf86cd799439019',
    isActive: true,
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-10-20'),
  },
  {
    title: 'Mountain View Chalet',
    description: 'Rustic chalet with breathtaking mountain views, perfect for weekend getaways.',
    price: 680000,
    type: 'HOUSE',
    status: 'FOR_SALE',
    rooms: 4,
    bathrooms: 2,
    surface: 220,
    address: {
      street: '77 Mountain Trail',
      city: 'Aspen',
      zipCode: '81611',
      country: 'USA',
    },
    location: {
      type: 'Point',
      coordinates: [-106.8175, 39.1911],
    },
    features: ['fireplace', 'parking', 'garden', 'mountain_view'],
    images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800'],
    ownerId: '507f1f77bcf86cd799439020',
    isActive: true,
    createdAt: new Date('2024-08-22'),
    updatedAt: new Date('2024-11-14'),
  },
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Clear existing properties (optional)
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing properties`);

    // Insert sample properties
    const result = await collection.insertMany(sampleProperties);
    console.log(`✅ Inserted ${result.insertedCount} sample properties`);

    console.log('\n📊 Database seeded successfully!');
    console.log(`   Database: ${DATABASE_NAME}`);
    console.log(`   Collection: ${COLLECTION_NAME}`);
    console.log(`   Properties: ${result.insertedCount}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('👋 Connection closed');
  }
}

seedDatabase();
