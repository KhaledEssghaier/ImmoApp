// Script to add existing MongoDB users to Firebase Auth
// Run: node scripts/add_firebase_user.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../path/to/serviceAccountKey.json'); // You need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function addUserToFirebase(email, password) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });
    console.log('Successfully created Firebase user:', userRecord.uid);
    console.log('Email:', email);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

// Add your user
addUserToFirebase('khaledessghaier01@gmail.com', 'temporary_password_123');

// Note: User will need to use "Forgot Password" to set their actual password
