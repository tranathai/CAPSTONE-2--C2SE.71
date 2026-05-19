const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporary_secret_key');

      // Get user from database
      const pool = getPool();
      if (pool) {
        const [users] = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
          return res.status(401).json({ 
            success: false, 
            message: 'Không tìm thấy người dùng' 
          });
        }
        req.user = { id: users[0].id };
      } else {
        req.user = { id: decoded.id };
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Không có quyền truy cập' 
      });
    }
  } else if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Không có token, quyền truy cập bị từ chối' 
    });
  }
};
