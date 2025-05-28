const Employee = require('../models/employeeModel');
const leaveBalanceService = require('../services/leaveBalanceService');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    // Only fetch employees with role 'employee' or no role (default is employee)
    const employees = await Employee.find({
      $or: [
        { role: 'employee' },
        { role: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    // Check if employee with same ID already exists
    const existingEmployee = await Employee.findOne({ id: req.body.id });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee with this ID already exists' 
      });
    }
    
    // Prevent creating employees with manager role through this endpoint
    if (req.body.role && req.body.role === 'manager') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot create managers through employee endpoint. Use manager management instead.' 
      });
    }
    
    // Accept manager field and ensure role is set to 'employee'
    const employeeData = { 
      ...req.body,
      role: 'employee' // Explicitly set role to employee
    };
    if (req.body.manager) {
      employeeData.manager = req.body.manager;
    }
    const employee = await Employee.create(employeeData);
    
    // Automatically initialize leave balance for the new employee
    try {
      await leaveBalanceService.ensureLeaveBalance(employee._id);
      // console.log(`✅ Leave balance initialized for new employee: ${employee.name} (${employee.id})`);
    } catch (leaveBalanceError) {
      console.error(`❌ Failed to initialize leave balance for employee ${employee.id}:`, leaveBalanceError);
      // Don't fail the employee creation if leave balance initialization fails
    }
    
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get single employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    // If ID is being changed, check if new ID already exists
    if (req.body.id && req.body.id !== req.params.id) {
      const existingEmployee = await Employee.findOne({ id: req.body.id });
      if (existingEmployee) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee with this new ID already exists' 
        });
      }
    }
    // Accept manager field
    const updateData = { ...req.body };
    if (req.body.manager) {
      updateData.manager = req.body.manager;
    }
    const employee = await Employee.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ id: req.params.id });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle employee status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    // Toggle status
    employee.status = employee.status === 'Active' ? 'Inactive' : 'Active';
    await employee.save();
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    // Only get departments from employees with role 'employee' or no role (default is employee)
    const departments = await Employee.distinct('department', {
      $or: [
        { role: 'employee' },
        { role: { $exists: false } }
      ]
    });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate new employee ID
exports.generateEmployeeId = async (req, res) => {
  try {
    // First try to find the last employee using numeric sorting
    let lastEmployee = await Employee.findOne({
      id: { $regex: /^EM\d+$/ }
    }).sort({ createdAt: -1 });
    
    // Fallback to sorting by id if the above doesn't work
    if (!lastEmployee) {
      lastEmployee = await Employee.findOne({
        id: { $regex: /^EM\d+$/ }
      }).sort({ id: -1 });
    }
    
    let newId;
    
    if (lastEmployee && lastEmployee.id.startsWith('EM')) {
      // Extract the number part and increment it
      const numericPart = lastEmployee.id.substring(2);
      if (/^\d+$/.test(numericPart)) {
        const lastNumber = parseInt(numericPart);
        newId = `EM${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        // Fallback if the numeric part is not a valid number
        newId = 'EM001';
      }
    } else {
      newId = 'EM001';
    }
    
    res.status(200).json({ success: true, data: { id: newId } });
  } catch (error) {
    console.error('Error generating employee ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employee profile by email
exports.getEmployeeProfile = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // First find the employee
    const employee = await Employee.findOne({ email });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    // Handle manager data - try both Manager collection and Employee with manager role
    let managerData = null;
    if (employee.manager) {
      // First try Manager collection
      const Manager = require('../models/managerModel');
      managerData = await Manager.findById(employee.manager).select('name email id position');
      
      // If not found in Manager collection, try Employee collection with manager role
      if (!managerData) {
        managerData = await Employee.findOne({ 
          _id: employee.manager,
          role: 'manager'
        }).select('name email id position');
      }
    }
    
    // Create a profile object with the structure expected by the frontend
    const profileData = {
      name: employee.name,
      role: employee.position,
      employeeId: employee.id,
      profilePicture: employee.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      status: "available",
      contactInfo: {
        email: employee.email,
        phone: employee.phone || "",
        location: employee.location || ""
      },
      department: employee.department || "",
      manager: managerData ? {
        name: managerData.name,
        position: managerData.position,
        id: managerData.id,
        email: managerData.email
      } : null,
      skills: {
        technical: employee.technicalSkills || [],
        soft: employee.softSkills || []
      },
      performanceData: employee.performanceData || [85, 88, 87, 90, 92, 91],
      timeline: employee.recentActivities || [
        { id: '1', title: 'Onboarded', time: '2 weeks ago', color: 'bg-blue-500' }
      ]
    };
    
    res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set employee shift time
exports.setEmployeeShiftTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time are required'
      });
    }

    // Check if the time format is valid (HH:MM)
    const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeFormatRegex.test(startTime) || !timeFormatRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM (24-hour format)'
      });
    }

    const employee = await Employee.findOne({ id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.shiftTime = {
      start: startTime,
      end: endTime
    };

    await employee.save();

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error setting employee shift time:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Set employee work location
exports.setEmployeeWorkLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, country, postalCode } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const employee = await Employee.findOne({ id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.workLocation = {
      address,
      city: city || '',
      country: country || '',
      postalCode: postalCode || ''
    };

    // Also update the legacy location field for backward compatibility
    employee.location = address + (city ? `, ${city}` : '') + (country ? `, ${country}` : '');

    await employee.save();

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error setting employee work location:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update employee contact information
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

    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update contact information
    employee.phone = phone || employee.phone;
    employee.location = location || employee.location;

    await employee.save();

    // Return updated profile data
    const profileData = {
      contactInfo: {
        email: employee.email,
        phone: employee.phone || "",
        location: employee.location || ""
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

// Update employee password
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

    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify current password
    if (employee.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

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
  try {
    const { email } = req.params;
    const { profilePicture } = req.body;

    if (!email || !profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Email and profile picture are required'
      });
    }

    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update profile picture in database
    employee.profilePicture = profilePicture;
    await employee.save();

    // Return updated profile data
    res.status(200).json({
      success: true,
      data: {
        profilePicture: employee.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to recalculate leave balances from actual leave history
const recalculateLeaveBalances = async (employeeId) => {
  try {
    const Leave = require('../models/leaveModel');
    
    // Get all approved leaves for this employee
    const approvedLeaves = await Leave.find({
      employeeId: employeeId,
      status: 'approved'
    });

    // Calculate used leave days by type
    const usedLeave = {
      annualLeave: 0,
      sickLeave: 0,
      personalLeave: 0
    };

    approvedLeaves.forEach(leave => {
      const days = leave.getDays();
      switch (leave.type) {
        case 'Annual Leave':
          usedLeave.annualLeave += days;
          break;
        case 'Sick Leave':
          usedLeave.sickLeave += days;
          break;
        case 'Personal Leave':
          usedLeave.personalLeave += days;
          break;
      }
    });

    // Update employee leave balances
    const employee = await Employee.findById(employeeId);
    if (employee) {
      employee.leaveBalances.annualLeave.used = usedLeave.annualLeave;
      employee.leaveBalances.sickLeave.used = usedLeave.sickLeave;
      employee.leaveBalances.personalLeave.used = usedLeave.personalLeave;
      await employee.save();
    }

    return usedLeave;
  } catch (error) {
    console.error('Error recalculating leave balances:', error);
    throw error;
  }
};

// Sync leave balances with actual leave history
exports.syncLeaveBalances = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({ id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Recalculate leave balances from actual leave history
    const usedLeave = await recalculateLeaveBalances(employee._id);

    // Get updated employee data
    const updatedEmployee = await Employee.findById(employee._id);

    res.status(200).json({
      success: true,
      message: 'Leave balances synchronized successfully',
      data: {
        employeeId: id,
        previousBalances: {
          annual: employee.leaveBalances.annualLeave,
          sick: employee.leaveBalances.sickLeave,
          personal: employee.leaveBalances.personalLeave
        },
        updatedBalances: {
          annual: updatedEmployee.leaveBalances.annualLeave,
          sick: updatedEmployee.leaveBalances.sickLeave,
          personal: updatedEmployee.leaveBalances.personalLeave
        },
        calculatedUsage: usedLeave
      }
    });
  } catch (error) {
    console.error('Error syncing leave balances:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Initialize leave balances for all employees
exports.initializeAllLeaveBalances = async (req, res) => {
  try {
    console.log('Starting bulk leave balance initialization...');
    
    const result = await leaveBalanceService.initializeAllEmployeeBalances();
    
    res.status(200).json({
      success: true,
      message: 'Leave balances initialized successfully for all employees',
      data: result
    });
  } catch (error) {
    console.error('Error initializing leave balances:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 