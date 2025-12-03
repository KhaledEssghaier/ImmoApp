// MongoDB seed data for properties with correct schema
db = db.getSiblingDB('immobilier_app');

db.properties.insertMany([
  {
    ownerId: ObjectId("507f1f77bcf86cd799439011"),
    title: "Luxury Apartment in Paris",
    description: "Beautiful modern apartment with stunning views of the Eiffel Tower",
    price: 850000,
    propertyType: "apartment",
    transactionType: "sale",
    bedrooms: 3,
    bathrooms: 2,
    surface: 120.5,
    amenities: ["WiFi", "Parking", "Elevator"],
    location: {
      type: "Point",
      coordinates: [2.3522, 48.8566]
    },
    address: {
      country: "France",
      city: "Paris",
      street: "15 Avenue des Champs-Élysées",
      zipcode: "75008"
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: ObjectId("507f1f77bcf86cd799439011"),
    title: "Charming House in Lyon",
    description: "Spacious family house with garden and garage",
    price: 2500,
    propertyType: "house",
    transactionType: "rent",
    bedrooms: 4,
    bathrooms: 3,
    surface: 180,
    amenities: ["Garden", "Garage", "Pool"],
    location: {
      type: "Point",
      coordinates: [4.8357, 45.764]
    },
    address: {
      country: "France",
      city: "Lyon",
      street: "23 Rue de la République",
      zipcode: "69002"
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ownerId: ObjectId("507f1f77bcf86cd799439011"),
    title: "Stunning Villa in Nice",
    description: "Magnificent villa with panoramic sea views and private pool",
    price: 3500000,
    propertyType: "villa",
    transactionType: "sale",
    bedrooms: 6,
    bathrooms: 5,
    surface: 350,
    amenities: ["Pool", "Garden", "Sea View", "Gym"],
    location: {
      type: "Point",
      coordinates: [7.2619, 43.7034]
    },
    address: {
      country: "France",
      city: "Nice",
      street: "10 Promenade des Anglais",
      zipcode: "06000"
    },
    mediaIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("Inserted " + db.properties.countDocuments() + " properties");
