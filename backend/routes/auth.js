const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('businessName').notEmpty().trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, businessName } = req.body;

    // Check if user already exists
    const existingUser = await getRow('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create business first
    const businessResult = await runQuery(
      'INSERT INTO businesses (business_name, created_at, updated_at) VALUES (?, datetime("now"), datetime("now"))',
      [businessName]
    );

    const businessId = businessResult.id;

    // Create user
    const userResult = await runQuery(
      `INSERT INTO users (business_id, email, password_hash, first_name, last_name, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'admin', datetime('now'), datetime('now'))`,
      [businessId, email, hashedPassword, firstName, lastName]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: userResult.id, businessId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userResult.id,
        email,
        firstName,
        lastName,
        role: 'admin',
        businessId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user with business info
    const user = await getRow(`
      SELECT u.user_id, u.business_id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.is_active,
             b.business_name
      FROM users u
      JOIN businesses b ON u.business_id = b.business_id
      WHERE u.email = ?
    `, [email]);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await runQuery(
      'UPDATE users SET last_login = datetime("now") WHERE user_id = ?',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, businessId: user.business_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        businessId: user.business_id,
        businessName: user.business_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getRow(`
      SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.last_login,
             b.business_name, b.business_type, b.address, b.city, b.state, b.country
      FROM users u
      JOIN businesses b ON u.business_id = b.business_id
      WHERE u.user_id = ?
    `, [req.user.user_id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName } = req.body;
    const updates = [];
    const params = [];

    if (firstName) {
      updates.push('first_name = ?');
      params.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      params.push(lastName);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.user.user_id);

    await runQuery(
      `UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now') WHERE user_id = ?`,
      params
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const user = await getRow('SELECT password_hash FROM users WHERE user_id = ?', [req.user.user_id]);
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE user_id = ?',
      [hashedPassword, req.user.user_id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password - send reset email
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await getRow('SELECT user_id, email FROM users WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await runQuery(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?',
      [resetToken, resetTokenExpiry.toISOString(), user.user_id]
    );

    // In a real application, you would send an email here
    // For now, we'll just log the token (in production, remove this)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await getRow(
      'SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await runQuery(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime("now") WHERE user_id = ?',
      [hashedPassword, user.user_id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router; 