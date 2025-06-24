const Manager = require('../models/managerModel');
const Employee = require('../models/employeeModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const leaveBalanceService = require('../services/leaveBalanceService');

// Get all managers
exports.getAllManagers = async (req, res) => {
  try {
    // Only fetch from the dedicated Manager collection
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new manager
exports.createManager = async (req, res) => {
  try {
    // Check if manager with same ID already exists
    const existingManager = await Manager.findOne({ id: req.body.id });
    if (existingManager) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager with this ID already exists' 
      });
    }
    
    const manager = await Manager.create(req.body);
    
    // Initialize leave balance for the new manager
    try {
      await leaveBalanceService.ensureLeaveBalance(manager._id);
      // console.log(`✅ Leave balance initialized for manager ${manager.name} (${manager.id})`);
    } catch (balanceError) {
      console.error(`❌ Failed to initialize leave balance for manager ${manager.name}:`, balanceError);
      // Don't fail the manager creation if leave balance fails
    }
    
    return res.status(201).json({
      success: true,
      data: manager,
      message: 'Manager created successfully'
    });
  } catch (error) {
    console.error('Error creating manager:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single manager
exports.getManagerById = async (req, res) => {
  try {
    const { id } = req.params;
    let manager;
    
    // First try to find by custom ID (like MG001) in Manager collection
    manager = await Manager.findOne({ id: id });
    
    // If not found and the ID looks like a MongoDB ObjectId, try finding by _id
    if (!manager && id.match(/^[0-9a-fA-F]{24}$/)) {
      // Try Manager collection first
      manager = await Manager.findById(id);
      
      // If not found in Manager collection, try Employee collection with manager role
      if (!manager) {
        const Employee = require('../models/employeeModel');
        manager = await Employee.findOne({ 
          _id: id,
          role: 'manager'
        });
      }
    }
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update manager
exports.updateManager = async (req, res) => {
  try {
    // If ID is being changed, check if new ID already exists
    if (req.body.id && req.body.id !== req.params.id) {
      const existingManager = await Manager.findOne({ id: req.body.id });
      if (existingManager) {
        return res.status(400).json({ 
          success: false, 
          message: 'Manager with this new ID already exists' 
        });
      }
    }
    
    const manager = await Manager.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete manager
exports.deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findOneAndDelete({ id: req.params.id });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle manager status
exports.toggleManagerStatus = async (req, res) => {
  try {
    const manager = await Manager.findOne({ id: req.params.id });
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Toggle status
    manager.status = manager.status === 'Active' ? 'Inactive' : 'Active';
    await manager.save();
    
    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    // Only get departments from the dedicated Manager collection
    const departments = await Manager.distinct('department');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate new manager ID
exports.generateManagerId = async (req, res) => {
  try {
    const lastManager = await Manager.findOne().sort({ id: -1 });
    let newId;
    
    if (lastManager && lastManager.id.startsWith('MG')) {
      const lastNumber = parseInt(lastManager.id.substring(2));
      newId = `MG${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      newId = 'MG001';
    }
    
    res.status(200).json({ success: true, data: { id: newId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initialize leave balances for all managers
exports.initializeManagerLeaveBalances = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const managers = await Manager.find({}, '_id name id');
    
    let created = 0;
    let existing = 0;
    let errors = 0;
    
    // console.log(`�� Initializing leave balances for ${managers.length} managers...`);
    
    const results = await Promise.all(
      managers.map(async (manager) => {
        try {
          const existingBalance = await LeaveBalance.findOne({
            employeeId: manager._id,
            year: currentYear
          });
          
          if (!existingBalance) {
            await LeaveBalance.initializeBalances(manager._id, currentYear);
            // console.log(`✅ Leave balance ensured for ${manager.name} (${manager.id})`);
            return { success: true, manager: manager.name };
          }
          
          return { success: true, manager: manager.name, existed: true };
        } catch (error) {
          console.error(`Error for manager ${manager.name}:`, error);
          return { success: false, manager: manager.name, error: error.message };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      message: `Manager leave balance initialization completed`,
      data: {
        total: managers.length,
        created,
        existing,
        errors
      }
    });
  } catch (error) {
    console.error('Error initializing manager leave balances:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get manager profile by email
exports.getManagerProfile = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Try to find manager in Manager collection first
    let manager = await Manager.findOne({ email });
    let isEmployeeManager = false;
    
    // If not found, try Employee collection with manager role
    if (!manager) {
      manager = await Employee.findOne({ email, role: 'manager' });
      isEmployeeManager = true;
    }
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manager not found' 
      });
    }
    
    // Count employees assigned to this manager
    const teamSize = await Employee.countDocuments({ manager: manager._id });
    
    // Create a profile object with the structure expected by the frontend
    const profileData = {
      name: manager.name,
      role: manager.position,
      employeeId: manager.id,
      profilePicture: manager.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      status: "available",
      contactInfo: {
        email: manager.email,
        phone: manager.phone || "",
        location: manager.location || "",
        teamSize: `${teamSize} ${teamSize === 1 ? 'Member' : 'Members'}`
      },
      department: manager.department || "",
      isEmployeeManager, // Flag to indicate if this manager is from Employee collection
      managerType: isEmployeeManager ? 'employee-manager' : 'dedicated-manager'
    };
    
    res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update manager contact information
exports.updateContactInfo = async (req, res) => {
  try {
    const { email } = req.params;
    const { phone, location } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const manager = await Manager.findOne({ email });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Update contact information
    manager.phone = phone || manager.phone;
    manager.location = location || manager.location;

    await manager.save();

    // Count employees assigned to this manager
    const teamSize = await Employee.countDocuments({ manager: manager._id });

    // Return updated profile data
    const profileData = {
      contactInfo: {
        email: manager.email,
        phone: manager.phone || "",
        location: manager.location || "",
        teamSize: `${teamSize} ${teamSize === 1 ? 'Member' : 'Members'}`
      }
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error updating contact information:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update manager password
exports.updatePassword = async (req, res) => {
  try {
    const { email } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, current password, and new password are required'
      });
    }

    const manager = await Manager.findOne({ email });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Verify current password
    if (manager.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    manager.password = newPassword;
    await manager.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  console.log('Backend: updateProfilePicture controller invoked.');
  try {
    const { email } = req.params;
    const { profilePicture } = req.body;
    console.log(`Backend: Received request for email: ${email}. Profile picture data length: ${profilePicture ? profilePicture.length : 'N/A'}`);

    if (!email || !profilePicture) {
      console.warn('Backend: Email or profilePicture missing.');
      return res.status(400).json({
        success: false,
        message: 'Email and profile picture are required'
      });
    }

    // Check image data size
    const base64Data = profilePicture.split(',')[1] || profilePicture;
    const sizeInBytes = Buffer.from(base64Data, 'base64').length;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    console.log(`Backend: Profile picture size: ${sizeInMB.toFixed(2)}MB`);
    
    if (sizeInMB > 5) {
      console.warn(`Backend: Profile picture size ${sizeInMB.toFixed(2)}MB exceeds 5MB limit.`);
      return res.status(400).json({
        success: false,
        message: 'Profile picture size should be less than 5MB'
      });
    }

    console.log(`Backend: Attempting to find manager with email: ${email}`);
    const manager = await Manager.findOne({ email });

    if (!manager) {
      console.warn(`Backend: Manager not found with email: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    console.log(`Backend: Manager found: ${manager.name} (ID: ${manager.id})`);

    // Update profile picture in database
    manager.profilePicture = profilePicture;
    await manager.save();
    console.log(`Backend: Profile picture updated and saved for manager: ${manager.email}`);

    // Return updated profile data
    res.status(200).json({
      success: true,
      data: {
        profilePicture: manager.profilePicture
      }
    });
  } catch (error) {
    console.error('Backend: Error in updateProfilePicture controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile picture'
    });
  }
}; 