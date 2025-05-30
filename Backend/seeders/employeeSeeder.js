const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const { connectDB } = require('../connect/connectDB');
const dotenv = require('dotenv');

dotenv.config();

// Initial employees data
const employees = [
  {
    id: 'EM001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    department: 'Development',
    position: 'Developer',
    status: 'Active'
  },
  {
    id: 'EM002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    department: 'Design',
    position: 'Designer',
    status: 'Active' 
  },
  {
    id: 'EM003',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    password: 'password123',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'Active'
  },
  {
    id: 'EM004',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    password: 'password123',
    department: 'HR',
    position: 'HR Specialist',
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
    
    // Delete existing employees
    await Employee.deleteMany({});
    console.log('Deleted all existing employees');
    
    // Create new employees
    await Employee.insertMany(employees);
    console.log('Successfully added sample employees');
    
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