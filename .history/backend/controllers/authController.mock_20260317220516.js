const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// File path to persist mock users across restarts
const DATA_FILE = path.join(__dirname, '..', 'mock_users_data.json');

// Load users from file (or start with empty array)
let mockUsers = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    mockUsers = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 Loaded ${mockUsers.length} mock user(s) from file.`);
  }
} catch (e) {
  console.warn('⚠️  Could not read mock data file, starting fresh:', e.message);
  mockUsers = [];
}

const saveMockUsers = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockUsers, null, 2), 'utf-8');
  } catch (e) {
    console.error('❌ Could not save mock data:', e.message);
  }
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'temporary_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user (MOCK - no database)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Validate role
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vai trò không hợp lệ' 
      });
    }

    // Create mock user
    const newUser = {
      id: 'user_' + Date.now(),
      email,
      password, // In production, this would be hashed
      fullName,
      role,
      createdAt: new Date()
    };

    mockUsers.push(newUser);
    saveMockUsers();

    // Generate token
    const token = generateToken(newUser.id);

    console.log('✅ Mock user registered:', email, '- Role:', role);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};

// @desc    Login user (MOCK - no database)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, role } = req.body;

    // Check if user exists
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if role matches
    if (user.role !== role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vai trò không khớp với tài khoản' 
      });
    }

    // Check password (simple check - no hashing in mock)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Generate token
    const token = generateToken(user.id);

    console.log('✅ Mock user logged in:', email, '- Role:', role);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};

// @desc    Get current user info (MOCK - no database)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};

// Helper to view all mock users (for debugging)
exports.getAllMockUsers = (req, res) => {
  res.json({
    success: true,
    count: mockUsers.length,
    users: mockUsers.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role
    }))
  });
};
