const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
// Using REAL database controller
const { register, login, getMe, getAllMockUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail().withMessage('Gmail không đúng định dạng vui lòng nhập lại')
    .matches(/^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/)
    .withMessage('Gmail không đúng định dạng vui lòng nhập lại'),
  body('password')
    .isLength({ min: 6 })
    .matches(/[A-Z]/)
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Mật khẩu tối thiểu 6 ký tự bao gồm chữ in hoa và ký tự đặc biệt'),
  body('name').notEmpty().withMessage('Họ tên không được để trống'),
  body('role').isIn(['student', 'supervisor']).withMessage('Vai trò không hợp lệ')
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Gmail không đúng định dạng vui lòng nhập lại')
    .matches(/^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/)
    .withMessage('Gmail không đúng định dạng vui lòng nhập lại'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  body('role').isIn(['student', 'supervisor']).withMessage('Vai trò không hợp lệ')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

// Debug route to see all mock users
router.get('/debug/users', getAllMockUsers);

module.exports = router;
