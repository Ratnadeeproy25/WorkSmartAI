const mongoose = require('mongoose');
const Manager = require('../models/managerModel');
const { connectDB } = require('../connect/connectDB');
const dotenv = require('dotenv');

dotenv.config();

// Initial managers data
const managers = [
  {
    id: 'MG001',
    name: 'Manager One',
    email: 'manager.one@example.com',
    password: 'password123',
    department: 'Development',
    position: 'Team Lead',
    status: 'Active'
  },
  {
    id: 'MG002',
    name: 'Manager Two',
    email: 'manager.two@example.com',
    password: 'password123',
    department: 'Design',
    position: 'Design Lead',
    status: 'Active' 
  },
  {
    id: 'MG003',
    name: 'Manager Three',
    email: 'manager.three@example.com',
    password: 'password123',
    department: 'Marketing',
    position: 'Marketing Lead',
    status: 'Active'
  },
  {
    id: 'MG004',
    name: 'Manager Four',
    email: 'manager.four@example.com',
    password: 'password123',
    department: 'HR',
    position: 'HR Lead',
    status: 'Inactive'
  }
];

// Seed the database
const seedDatabase = async () => {
  try {
    // Connect to the database
    const connected = await connectDB();
    
    if (!connected) {
      console.error("Failed to connect to the database. Check your MongoDB connection.");
      process.exit(1);
    }
    
    // Delete existing managers
    await Manager.deleteMany({});
    console.log('Deleted all existing managers');
    
    // Create new managers
    await Manager.insertMany(managers);
    console.log('Successfully added sample managers');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    
    // Close connection if it's open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    process.exit(1);
  }
};

// Run the seeder
seedDatabase(); 