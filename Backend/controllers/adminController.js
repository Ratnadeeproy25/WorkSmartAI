const Admin = require('../models/adminModel');

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    console.error('Error getting admins:', err);
    res.status(500).json({ message: 'Failed to get admins' });
  }
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findOne({ id: req.params.id }).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (err) {
    console.error('Error getting admin:', err);
    res.status(500).json({ message: 'Failed to get admin details' });
  }
};

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { id, name, email, password, accessLevel } = req.body;
    
    // Check if admin ID or email already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ id }, { email }]
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this ID or email already exists' 
      });
    }
    
    const newAdmin = new Admin({
      id,
      name,
      email,
      password,
      accessLevel: accessLevel || 'Limited'
    });
    
    await newAdmin.save();
    
    // Return admin without password
    const adminToReturn = { ...newAdmin.toObject() };
    delete adminToReturn.password;
    
    res.status(201).json(adminToReturn);
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ message: 'Failed to create admin' });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, accessLevel } = req.body;
    const adminId = req.params.id;
    
    const admin = await Admin.findOne({ id: adminId });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check if new email already exists (if email is being updated)
    if (email !== admin.email) {
      const emailExists = await Admin.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update fields
    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.accessLevel = accessLevel || admin.accessLevel;
    
    // Update password if provided
    if (req.body.password) {
      admin.password = req.body.password;
    }
    
    await admin.save();
    
    // Return admin without password
    const adminToReturn = { ...admin.toObject() };
    delete adminToReturn.password;
    
    res.json(adminToReturn);
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ message: 'Failed to update admin' });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ id: req.params.id });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    await Admin.deleteOne({ id: req.params.id });
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ message: 'Failed to delete admin' });
  }
};

// Toggle admin status (active/inactive)
exports.toggleAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findOne({ id: req.params.id });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    admin.status = admin.status === 'Active' ? 'Inactive' : 'Active';
    await admin.save();
    
    // Return admin without password
    const adminToReturn = { ...admin.toObject() };
    delete adminToReturn.password;
    
    res.json(adminToReturn);
  } catch (err) {
    console.error('Error toggling admin status:', err);
    res.status(500).json({ message: 'Failed to update admin status' });
  }
};

// Generate unique admin ID
exports.generateAdminId = async (req, res) => {
  try {
    // Get the current highest admin ID
    const highestAdmin = await Admin.findOne({}, { id: 1 })
      .sort({ id: -1 })
      .collation({ locale: 'en_US', numericOrdering: true });
    
    let newId = 'ADM001';
    
    if (highestAdmin) {
      // Extract the number part and increment
      const idNumber = parseInt(highestAdmin.id.replace('ADM', ''));
      newId = `ADM${(idNumber + 1).toString().padStart(3, '0')}`;
    }
    
    res.json({ adminId: newId });
  } catch (err) {
    console.error('Error generating admin ID:', err);
    res.status(500).json({ message: 'Failed to generate admin ID' });
  }
}; 