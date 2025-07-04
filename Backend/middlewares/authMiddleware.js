const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Admin = require('../models/adminModel');
const mongoose = require('mongoose');

// Use environment variable with fallback - use a strong secret in production
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'worksmartAI_super_secure_secret_key_2024_change_in_production');

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required for production deployment");
  process.exit(1);
}

// Find a manager by ID in either Manager or Employee collections
const findManagerById = async (id) => {
  // First check the Manager collection
  let user = await Manager.findById(id).select('-password');
  
  // If not found and it's a valid ObjectId, try the Employee collection with role=manager
  if (!user && mongoose.Types.ObjectId.isValid(id)) {
    user = await Employee.findOne({
      _id: id,
      role: 'manager'
    }).select('-password');
    
    // Add role explicitly if found in Employee collection
    if (user) {
      user.role = 'manager';
    }
  }
  
  return user;
};

// Protect routes - only authenticated users can access
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log('Decoded token:', decoded); // Remove debug logging

      // Set user in request based on role
      let user = null;
      
      if (decoded.role === 'employee') {
        // Primary lookup by MongoDB _id
        user = await Employee.findById(decoded.id).select('-password');
        
        // Fallback lookups if primary fails
        if (!user) {
          const fallbackQueries = [
            { id: decoded.userId }, // Custom ID field
            { email: decoded.email }, // Email lookup
            { id: decoded.id } // Custom ID with decoded.id
          ].filter(query => Object.values(query)[0]); // Only include queries with valid values

          for (const query of fallbackQueries) {
            user = await Employee.findOne(query).select('-password');
            if (user) break;
          }
        }
      } else if (decoded.role === 'manager') {
        // Check if this is an employee with manager role
        if (decoded.isEmployeeManager) {
          user = await Employee.findById(decoded.id).select('-password');
          
          // Verify the user has manager role
          if (user && user.role !== 'manager') {
            return res.status(403).json({
              success: false,
              message: 'User does not have manager privileges'
            });
          }
        } else {
          // Try to find manager in Manager collection first
          user = await findManagerById(decoded.id);
          
          // Fallback lookups for managers
          if (!user) {
            const fallbackQueries = [
              { collection: 'Manager', query: { email: decoded.email } },
              { collection: 'Manager', query: { id: decoded.id } },
              { collection: 'Employee', query: { email: decoded.email, role: 'manager' } },
              { collection: 'Employee', query: { id: decoded.id, role: 'manager' } }
            ].filter(item => Object.values(item.query)[0] || Object.values(item.query)[1]);

            for (const { collection, query } of fallbackQueries) {
              if (collection === 'Manager') {
                user = await Manager.findOne(query).select('-password');
              } else {
                user = await Employee.findOne(query).select('-password');
              }
              if (user) break;
            }
          }
        }
      } else if (decoded.role === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
        
        // Fallback for admin
        if (!user && decoded.email) {
          user = await Admin.findOne({ email: decoded.email }).select('-password');
        }
      }

      if (user) {
        req.user = user;
        // Ensure role is set correctly
        req.user.role = decoded.role;
        // Preserve additional flags
        if (decoded.isEmployeeManager) {
          req.user.isEmployeeManager = true;
        }
        
        next();
      } else {
        console.error('Token valid but user not found:', {
          role: decoded.role,
          id: decoded.id,
          email: decoded.email,
          isEmployeeManager: decoded.isEmployeeManager
        });
        return res.status(401).json({
          success: false,
          message: 'User not found with this token'
        });
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
});

// Restrict routes - only specific roles can access
const restrict = (...roles) => {
  return (req, res, next) => {
    // Special case for employees with manager role
    if (req.user.role === 'employee' && req.user.isEmployeeManager && roles.includes('manager')) {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource`
      });
    }
    next();
  };
};

// Manager only middleware - only managers can access
const managerOnly = asyncHandler(async (req, res, next) => {
  // Allow both dedicated managers and employees with manager role
  if (req.user.role !== 'manager' && !(req.user.role === 'employee' && req.user.isEmployeeManager)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can access this resource'
    });
  }
  next();
});

// Admin only middleware - only admins can access
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can access this resource'
    });
  }
  next();
});

module.exports = { protect, restrict, managerOnly, adminOnly }; 