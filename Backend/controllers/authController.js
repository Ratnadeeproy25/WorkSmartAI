const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Admin = require('../models/adminModel');
const jwt = require('jsonwebtoken');

// Secret key for JWT token - use a strong secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'worksmartAI_super_secure_secret_key_2024_change_in_production';

// Login with email and password
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    
    // Find user based on role
    if (role === 'employee') {
      user = await Employee.findOne({ email });
    } else if (role === 'manager') {
      // First try to find in Manager collection
      user = await Manager.findOne({ email });
      
      // If not found, check for employee with manager role
      if (!user) {
        user = await Employee.findOne({ 
          email,
          role: 'manager'
        });
        
        // Set role explicitly for token generation
        if (user) {
          user.isEmployeeManager = true;
        }
      }
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active (except for admins who don't have a status field)
    if (role !== 'admin' && user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Check if password matches
    let passwordMatches = false;
    
    if (role === 'admin') {
      // For admin, use the comparePassword method that handles bcrypt
      passwordMatches = await user.comparePassword(password);
    } else {
      // For employee and manager, use bcrypt comparison as well
      passwordMatches = await user.comparePassword(password);
    }
    
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: role,
        userId: user.id,
        isEmployeeManager: user.isEmployeeManager || false
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return user info and token
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        department: user.department,
        position: user.position,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify email exists
exports.verifyEmail = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    let user;
    
    // Find user based on role
    if (role === 'employee') {
      user = await Employee.findOne({ email });
    } else if (role === 'manager') {
      user = await Manager.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Email exists
    res.status(200).json({
      success: true,
      message: 'Email verified'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login with QR code
exports.loginWithQr = async (req, res) => {
  try {
    const { email, qrOtp, role } = req.body;

    if (!email || !qrOtp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and QR OTP'
      });
    }

    let user;
    
    // Find user based on role
    if (role === 'employee') {
      user = await Employee.findOne({ email });
    } else if (role === 'manager') {
      user = await Manager.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email'
      });
    }

    // Check if user is active (except for admins who don't have a status field)
    if (role !== 'admin' && user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // In a real implementation, we would verify the QR OTP against a stored value
    // For now, we just accept the provided OTP (as QR generation is done in frontend)

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: role,
        userId: user.id,
        isEmployeeManager: user.isEmployeeManager || false
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return user info and token
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        department: user.department,
        position: user.position,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const { id, role, isEmployeeManager } = req.user;
    
    let user;
    
    // Find user based on role
    if (role === 'employee') {
      user = await Employee.findById(id).select('-password');
    } else if (role === 'manager') {
      // Check if this is an employee with manager role
      if (isEmployeeManager) {
        user = await Employee.findById(id).select('-password');
      } else {
        user = await Manager.findById(id).select('-password');
      }
    } else if (role === 'admin') {
      user = await Admin.findById(id).select('-password');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user._doc,
        role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
}; 