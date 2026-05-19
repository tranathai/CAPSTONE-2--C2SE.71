const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getPool } = require('../config/database');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'temporary_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
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
    const pool = getPool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Validate role
    if (!['student', 'teacher', 'supervisor'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vai trò không hợp lệ' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [email, hashedPassword, fullName, role]
    );

    // Generate token
    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: result.insertId,
        email,
        fullName,
        role
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

// @desc    Login user
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
    const pool = getPool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT id, email, full_name, password_hash, role FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    const user = users[0];

    // Check if role matches
    if (user.role !== role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vai trò không khớp với tài khoản' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
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

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const pool = getPool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const [users] = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = ?', [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    const user = users[0];
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};

// @desc    Get all users (debug only)
// @route   GET /api/auth/debug/users
// @access  Public
exports.getAllMockUsers = async (req, res) => {
  try {
    const pool = getPool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const [users] = await pool.query('SELECT id, email, full_name, role FROM users');

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};
