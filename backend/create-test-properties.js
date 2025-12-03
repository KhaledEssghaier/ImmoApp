const axios = require('axios');

// You'll need to replace this with a valid JWT token from your app
// To get token: Login to the app, check browser/app storage
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const API_URL = 'http://localhost:3000/api/v1';

const testProperties = [
  {
    title: 'Luxury Apartment in Paris',
    description: 'Beautiful 3-bedroom apartment in the heart of Champs-Élysées with stunning views and modern amenities.',
    price: 850000,
    propertyType: 'apartment',
    transactionType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    surface: 120,
    amenities: ['parking', 'elevator', 'balcony', 'gym'],
    address: {
      street: 'Avenue des Champs-Élysées',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      zipCode: '75008'
    },
    location: {
      type: 'Point',
      coordinates: [2.3522, 48.8566]
    },
    images: []
  },
  {
    title: 'Modern House in Suburbs',
    description: 'Spacious family house with garden and garage. Perfect for families looking for comfort and space.',
    price: 925000,
    propertyType: 'house',
    transactionType: 'rent',
    bedrooms: 4,
    bathrooms: 3,
    surface: 180,
    amenities: ['garden', 'garage', 'fireplace'],
    address: {
      street: 'Rue de la Paix',
      city: 'Versailles',
      state: 'Île-de-France',
      country: 'France',
      zipCode: '78000'
    },
    location: {
      type: 'Point',
      coordinates: [2.1301, 48.8049]
    },
    images: []
  }
];

async function createProperties() {
  console.log('🚀 Starting to create test properties...\n');

  for (const property of testProperties) {
    try {
      console.log(`📝 Creating property: ${property.title}`);
      
      const response = await axios.post(
        `${API_URL}/properties`,
        property,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Created: ${property.title}`);
      console.log(`   ID: ${response.data._id || response.data.id}`);
      console.log(`   Price: $${property.price.toLocaleString()}\n`);
      
    } catch (error) {
      console.error(`❌ Error creating ${property.title}:`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Message: ${JSON.stringify(error.response.data)}\n`);
      } else {
        console.error(`   ${error.message}\n`);
      }
    }
  }

  console.log('✨ Done!');
}

// Get auth token helper
console.log('⚠️  IMPORTANT: You need to set AUTH_TOKEN in this file');
console.log('To get your token:');
console.log('1. Login to the app');
console.log('2. Open browser DevTools > Application > Local Storage');
console.log('3. Find the auth token and copy it');
console.log('4. Replace AUTH_TOKEN variable in this script\n');

if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('❌ Please set a valid AUTH_TOKEN first!\n');
  process.exit(1);
}

createProperties();
