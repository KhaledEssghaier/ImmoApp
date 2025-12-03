/**
 * Script to seed sample reports for testing
 * Run: node scripts/seed-reports.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Report Schema
const reportSchema = new mongoose.Schema({
  reportedBy: { type: String, required: true },
  targetType: { type: String, enum: ['property', 'user', 'message'], required: true },
  targetId: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'in_review', 'resolved', 'invalid'], default: 'open' },
  assignedTo: { type: String },
  resolution: { type: String },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

// Sample reports data
const sampleReports = [
  {
    reportedBy: '507f1f77bcf86cd799439011',
    targetType: 'property',
    targetId: '507f1f77bcf86cd799439012',
    reason: 'fraud',
    description: 'This property listing appears to be fraudulent. The photos are stolen from another website.',
    status: 'open',
  },
  {
    reportedBy: '507f1f77bcf86cd799439013',
    targetType: 'user',
    targetId: '507f1f77bcf86cd799439014',
    reason: 'spam',
    description: 'User is sending spam messages to multiple users.',
    status: 'in_review',
    assignedTo: '507f1f77bcf86cd799439015',
  },
  {
    reportedBy: '507f1f77bcf86cd799439016',
    targetType: 'property',
    targetId: '507f1f77bcf86cd799439017',
    reason: 'inappropriate_content',
    description: 'Property contains inappropriate images and offensive language.',
    status: 'open',
  },
  {
    reportedBy: '507f1f77bcf86cd799439018',
    targetType: 'message',
    targetId: '507f1f77bcf86cd799439019',
    reason: 'harassment',
    description: 'User is harassing me with threatening messages.',
    status: 'resolved',
    assignedTo: '507f1f77bcf86cd799439020',
    resolution: 'User has been warned and the threatening messages have been removed.',
  },
  {
    reportedBy: '507f1f77bcf86cd799439021',
    targetType: 'property',
    targetId: '507f1f77bcf86cd799439022',
    reason: 'misinformation',
    description: 'Property price is significantly lower than market value, appears to be a scam.',
    status: 'in_review',
    assignedTo: '507f1f77bcf86cd799439023',
  },
  {
    reportedBy: '507f1f77bcf86cd799439024',
    targetType: 'user',
    targetId: '507f1f77bcf86cd799439025',
    reason: 'fake_profile',
    description: 'This appears to be a fake account impersonating a real estate agent.',
    status: 'open',
  },
  {
    reportedBy: '507f1f77bcf86cd799439026',
    targetType: 'property',
    targetId: '507f1f77bcf86cd799439027',
    reason: 'duplicate',
    description: 'This is a duplicate listing of property ID 507f1f77bcf86cd799439028',
    status: 'resolved',
    assignedTo: '507f1f77bcf86cd799439029',
    resolution: 'Duplicate listing removed.',
  },
  {
    reportedBy: '507f1f77bcf86cd799439030',
    targetType: 'message',
    targetId: '507f1f77bcf86cd799439031',
    reason: 'spam',
    description: 'Receiving unsolicited promotional messages.',
    status: 'invalid',
    assignedTo: '507f1f77bcf86cd799439032',
    resolution: 'Not a violation - user opted into promotional messages.',
  },
  {
    reportedBy: '507f1f77bcf86cd799439033',
    targetType: 'property',
    targetId: '507f1f77bcf86cd799439034',
    reason: 'fraud',
    description: 'Property does not exist at the stated address. Verified with local authorities.',
    status: 'in_review',
    assignedTo: '507f1f77bcf86cd799439035',
  },
  {
    reportedBy: '507f1f77bcf86cd799439036',
    targetType: 'user',
    targetId: '507f1f77bcf86cd799439037',
    reason: 'inappropriate_behavior',
    description: 'User is making inappropriate advances during property viewings.',
    status: 'open',
  },
];

async function seedReports() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing reports
    await Report.deleteMany({});
    console.log('Cleared existing reports');

    // Insert sample reports
    const reports = await Report.insertMany(sampleReports);
    console.log(`✅ Successfully created ${reports.length} sample reports!`);
    
    console.log('\nReport Summary:');
    console.log('- Open:', reports.filter(r => r.status === 'open').length);
    console.log('- In Review:', reports.filter(r => r.status === 'in_review').length);
    console.log('- Resolved:', reports.filter(r => r.status === 'resolved').length);
    console.log('- Invalid:', reports.filter(r => r.status === 'invalid').length);
    console.log('\nBy Type:');
    console.log('- Property:', reports.filter(r => r.targetType === 'property').length);
    console.log('- User:', reports.filter(r => r.targetType === 'user').length);
    console.log('- Message:', reports.filter(r => r.targetType === 'message').length);
    console.log('\nYou can now view these reports at: http://localhost:3011/dashboard/reports');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reports:', error.message);
    process.exit(1);
  }
}

seedReports();
