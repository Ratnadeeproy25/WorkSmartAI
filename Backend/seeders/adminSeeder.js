const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/adminModel');
const { connectDB } = require('../connect/connectDB');

dotenv.config();

const adminData = [
  {
    id: 'ADM001',
    name: 'Admin User',
    email: 'admin@worksmartai.com',
    password: 'admin123',
    role: 'Admin',
    accessLevel: 'Full',
    status: 'Active'
  }
];

const seedAdmins = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Delete existing admins
    await Admin.deleteMany({});
    console.log('Previous admin data deleted');
    
    // Insert new admins
    const createdAdmins = await Admin.insertMany(adminData);
    console.log(`${createdAdmins.length} admin accounts created`);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding admin data:', error);
    process.exit(1);
  }
};

// Execute seeder function
seedAdmins(); 