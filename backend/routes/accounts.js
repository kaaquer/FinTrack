const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAll } = require('../database/init');

const router = express.Router();

// Get all accounts for the current business
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await getAll(
      `SELECT account_id, account_code, account_name, account_type, account_subtype, current_balance, is_active, created_at
       FROM accounts
       WHERE business_id = ?
       ORDER BY account_code` ,
      [req.businessId]
    );
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

module.exports = router; 