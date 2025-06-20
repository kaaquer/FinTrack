const jwt = require('jsonwebtoken');
const { getRow } = require('../database/init');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await getRow(
      'SELECT user_id, business_id, email, first_name, last_name, role, is_active FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Add user info to request
    req.user = user;
    req.businessId = user.business_id;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user has accountant role
const requireAccountant = (req, res, next) => {
  if (!['admin', 'accountant'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accountant access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAccountant
}; 