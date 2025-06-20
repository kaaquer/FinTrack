const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await getAll(`
      SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at
      FROM users u
      WHERE u.business_id = ?
      ORDER BY u.created_at DESC
    `, [req.businessId]);

    res.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await getRow(`
      SELECT 
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.user_id = ? AND u.business_id = ?
    `, [req.params.id, req.businessId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create new user (admin only)
router.post('/', requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['user', 'accountant', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await getRow(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await runQuery(`
      INSERT INTO users (
        business_id, email, password_hash, first_name, last_name, role, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [req.businessId, email, hashedPassword, firstName, lastName, role]);

    const newUser = await getRow(`
      SELECT 
        user_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at
      FROM users 
      WHERE user_id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('role').optional().isIn(['user', 'accountant', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user exists and belongs to business
    const existingUser = await getRow(
      'SELECT user_id FROM users WHERE user_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, role, isActive } = req.body;

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
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.params.id, req.businessId);

    await runQuery(
      `UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now') 
       WHERE user_id = ? AND business_id = ?`,
      params
    );

    const updatedUser = await getRow(`
      SELECT 
        user_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        updated_at
      FROM users 
      WHERE user_id = ?
    `, [req.params.id]);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Check if user exists and belongs to business
    const user = await getRow(
      'SELECT user_id FROM users WHERE user_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin user
    const adminCount = await getRow(`
      SELECT COUNT(*) as count
      FROM users
      WHERE business_id = ? AND role = 'admin' AND is_active = 1
    `, [req.businessId]);

    const isAdmin = await getRow(`
      SELECT role FROM users WHERE user_id = ? AND business_id = ?
    `, [req.params.id, req.businessId]);

    if (isAdmin.role === 'admin' && adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete user
    await runQuery(
      'DELETE FROM users WHERE user_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 