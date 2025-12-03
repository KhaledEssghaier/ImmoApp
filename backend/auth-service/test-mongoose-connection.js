// Quick test to verify auth service can see the user
const mongoose = require('mongoose');

async function testConnection() {
  await mongoose.connect('mongodb://localhost:27017/immobilier_app');
  
  const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    passwordHash: String,
    isDeleted: Boolean
  }), 'users');
  
  const user = await User.findOne({ email: 'test@example.com', isDeleted: false });
  
  console.log('User from Mongoose:', user ? 'FOUND' : 'NOT FOUND');
  if (user) {
    console.log('  Email:', user.email);
    console.log('  Hash:', user.passwordHash);
    console.log('  isDeleted:', user.isDeleted);
  }
  
  await mongoose.disconnect();
}

testConnection();
