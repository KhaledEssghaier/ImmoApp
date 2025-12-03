/**
 * Script to create the first superadmin user
 * Run: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Admin User Schema
const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['moderator', 'admin', 'superadmin'], default: 'moderator' },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists with email: admin@example.com');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Name:', existingAdmin.name);
      process.exit(0);
    }

    // Create new admin
    const passwordHash = await bcrypt.hash('YourSecurePassword123!', 10);
    
    const admin = new AdminUser({
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin User',
      role: 'superadmin',
      isActive: true,
    });

    await admin.save();

    console.log('✅ Superadmin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email:', admin.email);
    console.log('Password: YourSecurePassword123!');
    console.log('Role:', admin.role);
    console.log('');
    console.log('You can now login at: http://localhost:3011');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
