const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all customers with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'lead']),
  query('type').optional().isIn(['individual', 'business'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, search, status, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.business_id = ?';
    const params = [req.businessId];

    if (search) {
      whereClause += ' AND (c.customer_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND c.customer_type = ?';
      params.push(type);
    }

    // Get customers with analytics
    const customers = await getAll(`
      SELECT 
        c.customer_id,
        c.customer_name,
        c.customer_type,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.country,
        c.status,
        c.credit_limit,
        c.current_balance,
        c.created_at,
        ca.total_sales,
        ca.total_payments,
        ca.outstanding_balance,
        ca.last_transaction_date,
        ca.transaction_count,
        ca.average_transaction_amount
      FROM customers c
      LEFT JOIN customer_analytics ca ON c.customer_id = ca.customer_id
      ${whereClause}
      ORDER BY c.customer_name
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `, params);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await getRow(`
      SELECT 
        c.*,
        ca.total_sales,
        ca.total_payments,
        ca.outstanding_balance,
        ca.last_transaction_date,
        ca.transaction_count,
        ca.average_transaction_amount
      FROM customers c
      LEFT JOIN customer_analytics ca ON c.customer_id = ca.customer_id
      WHERE c.customer_id = ? AND c.business_id = ?
    `, [req.params.id, req.businessId]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get recent transactions
    const transactions = await getAll(`
      SELECT transaction_id, transaction_date, description, total_amount, transaction_type, status
      FROM transactions
      WHERE customer_id = ? AND business_id = ?
      ORDER BY transaction_date DESC
      LIMIT 10
    `, [req.params.id, req.businessId]);

    // Get recent invoices
    const invoices = await getAll(`
      SELECT invoice_id, invoice_number, invoice_date, due_date, total_amount, paid_amount, balance_due, status
      FROM invoices
      WHERE customer_id = ? AND business_id = ?
      ORDER BY invoice_date DESC
      LIMIT 10
    `, [req.params.id, req.businessId]);

    res.json({
      customer,
      recentTransactions: transactions,
      recentInvoices: invoices
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

// Create new customer
router.post('/', [
  body('customerName').notEmpty().trim(),
  body('customerType').optional().isIn(['individual', 'business']),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('taxId').optional().trim(),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'lead']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      customerType = 'individual',
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      creditLimit = 0,
      status = 'lead',
      notes
    } = req.body;

    // Check if customer with same email already exists
    if (email) {
      const existingCustomer = await getRow(
        'SELECT customer_id FROM customers WHERE email = ? AND business_id = ?',
        [email, req.businessId]
      );
      if (existingCustomer) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    const result = await runQuery(`
      INSERT INTO customers (
        business_id, customer_name, customer_type, email, phone, address, city, state, 
        country, postal_code, tax_id, credit_limit, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      req.businessId, customerName, customerType, email, phone, address, city, state,
      country, postalCode, taxId, creditLimit, status, notes
    ]);

    // Initialize customer analytics
    await runQuery(`
      INSERT INTO customer_analytics (
        business_id, customer_id, total_sales, total_payments, outstanding_balance,
        transaction_count, average_transaction_amount, updated_at
      ) VALUES (?, ?, 0, 0, 0, 0, 0, datetime('now'))
    `, [req.businessId, result.id]);

    const newCustomer = await getRow(
      'SELECT * FROM customers WHERE customer_id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', [
  body('customerName').optional().notEmpty().trim(),
  body('customerType').optional().isIn(['individual', 'business']),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('taxId').optional().trim(),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'lead']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if customer exists and belongs to business
    const existingCustomer = await getRow(
      'SELECT customer_id FROM customers WHERE customer_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const {
      customerName,
      customerType,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      creditLimit,
      status,
      notes
    } = req.body;

    // Check if email is being changed and if it conflicts
    if (email) {
      const emailConflict = await getRow(
        'SELECT customer_id FROM customers WHERE email = ? AND business_id = ? AND customer_id != ?',
        [email, req.businessId, req.params.id]
      );
      if (emailConflict) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    const updates = [];
    const params = [];

    if (customerName) {
      updates.push('customer_name = ?');
      params.push(customerName);
    }
    if (customerType) {
      updates.push('customer_type = ?');
      params.push(customerType);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      params.push(city);
    }
    if (state !== undefined) {
      updates.push('state = ?');
      params.push(state);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      params.push(country);
    }
    if (postalCode !== undefined) {
      updates.push('postal_code = ?');
      params.push(postalCode);
    }
    if (taxId !== undefined) {
      updates.push('tax_id = ?');
      params.push(taxId);
    }
    if (creditLimit !== undefined) {
      updates.push('credit_limit = ?');
      params.push(creditLimit);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.params.id, req.businessId);

    await runQuery(
      `UPDATE customers SET ${updates.join(', ')}, updated_at = datetime('now') 
       WHERE customer_id = ? AND business_id = ?`,
      params
    );

    const updatedCustomer = await getRow(
      'SELECT * FROM customers WHERE customer_id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    // Check if customer exists and belongs to business
    const customer = await getRow(
      'SELECT customer_id FROM customers WHERE customer_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has related transactions or invoices
    const hasTransactions = await getRow(
      'SELECT transaction_id FROM transactions WHERE customer_id = ? AND business_id = ? LIMIT 1',
      [req.params.id, req.businessId]
    );

    const hasInvoices = await getRow(
      'SELECT invoice_id FROM invoices WHERE customer_id = ? AND business_id = ? LIMIT 1',
      [req.params.id, req.businessId]
    );

    if (hasTransactions || hasInvoices) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing transactions or invoices. Consider deactivating instead.' 
      });
    }

    // Delete customer analytics first
    await runQuery(
      'DELETE FROM customer_analytics WHERE customer_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    // Delete customer
    await runQuery(
      'DELETE FROM customers WHERE customer_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'Customer deleted successfully' });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Get customer dashboard metrics
router.get('/:id/metrics', async (req, res) => {
  try {
    const customer = await getRow(
      'SELECT customer_id FROM customers WHERE customer_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get monthly sales data
    const monthlySales = await getAll(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN transaction_type = 'sale' THEN total_amount ELSE 0 END) as sales,
        SUM(CASE WHEN transaction_type = 'payment' THEN total_amount ELSE 0 END) as payments,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE customer_id = ? AND business_id = ?
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month DESC
      LIMIT 12
    `, [req.params.id, req.businessId]);

    // Get outstanding invoices
    const outstandingInvoices = await getAll(`
      SELECT invoice_id, invoice_number, invoice_date, due_date, balance_due, status
      FROM invoices
      WHERE customer_id = ? AND business_id = ? AND balance_due > 0
      ORDER BY due_date ASC
    `, [req.params.id, req.businessId]);

    // Get recent activity
    const recentActivity = await getAll(`
      SELECT 
        'transaction' as type,
        transaction_id as id,
        transaction_date as date,
        description,
        total_amount as amount,
        transaction_type,
        status
      FROM transactions
      WHERE customer_id = ? AND business_id = ?
      UNION ALL
      SELECT 
        'invoice' as type,
        invoice_id as id,
        invoice_date as date,
        invoice_number as description,
        total_amount as amount,
        'invoice' as transaction_type,
        status
      FROM invoices
      WHERE customer_id = ? AND business_id = ?
      ORDER BY date DESC
      LIMIT 20
    `, [req.params.id, req.businessId, req.params.id, req.businessId]);

    res.json({
      monthlySales,
      outstandingInvoices,
      recentActivity
    });

  } catch (error) {
    console.error('Get customer metrics error:', error);
    res.status(500).json({ error: 'Failed to get customer metrics' });
  }
});

module.exports = router; 