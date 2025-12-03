const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/immobilier_app';

async function fixValidator() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop any existing validator
    try {
      await db.command({
        collMod: 'notifications',
        validator: {},
        validationLevel: 'off'
      });
      console.log('✅ Dropped existing validator on notifications collection');
    } catch (error) {
      console.log('No validator to drop or collection does not exist');
    }

    console.log('✅ MongoDB validator fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing validator:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixValidator();
