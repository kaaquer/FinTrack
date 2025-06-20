const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all suppliers with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE s.business_id = ?';
    const params = [req.businessId];

    if (search) {
      whereClause += ' AND (s.supplier_name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (isActive !== undefined) {
      whereClause += ' AND s.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    // Get suppliers
    const suppliers = await getAll(`
      SELECT 
        s.supplier_id,
        s.supplier_name,
        s.contact_person,
        s.email,
        s.phone,
        s.address,
        s.city,
        s.state,
        s.country,
        s.payment_terms,
        s.current_balance,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM suppliers s
      ${whereClause}
      ORDER BY s.supplier_name
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM suppliers s
      ${whereClause}
    `, params);

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await getRow(`
      SELECT * FROM suppliers 
      WHERE supplier_id = ? AND business_id = ?
    `, [req.params.id, req.businessId]);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get recent transactions
    const transactions = await getAll(`
      SELECT transaction_id, transaction_date, description, total_amount, transaction_type, status
      FROM transactions
      WHERE supplier_id = ? AND business_id = ?
      ORDER BY transaction_date DESC
      LIMIT 10
    `, [req.params.id, req.businessId]);

    // Get recent receipts
    const receipts = await getAll(`
      SELECT receipt_id, receipt_number, receipt_date, amount, payment_method, description
      FROM receipts
      WHERE supplier_id = ? AND business_id = ?
      ORDER BY receipt_date DESC
      LIMIT 10
    `, [req.params.id, req.businessId]);

    res.json({
      supplier,
      recentTransactions: transactions,
      recentReceipts: receipts
    });

  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
});

// Create new supplier
router.post('/', [
  body('supplierName').notEmpty().trim(),
  body('contactPerson').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('taxId').optional().trim(),
  body('paymentTerms').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      supplierName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      notes
    } = req.body;

    // Check if supplier with same email already exists
    if (email) {
      const existingSupplier = await getRow(
        'SELECT supplier_id FROM suppliers WHERE email = ? AND business_id = ?',
        [email, req.businessId]
      );
      if (existingSupplier) {
        return res.status(400).json({ error: 'Supplier with this email already exists' });
      }
    }

    const result = await runQuery(`
      INSERT INTO suppliers (
        business_id, supplier_name, contact_person, email, phone, address, city, state, 
        country, postal_code, tax_id, payment_terms, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      req.businessId, supplierName, contactPerson, email, phone, address, city, state,
      country, postalCode, taxId, paymentTerms, notes
    ]);

    const newSupplier = await getRow(
      'SELECT * FROM suppliers WHERE supplier_id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: newSupplier
    });

  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', [
  body('supplierName').optional().notEmpty().trim(),
  body('contactPerson').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('taxId').optional().trim(),
  body('paymentTerms').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if supplier exists and belongs to business
    const existingSupplier = await getRow(
      'SELECT supplier_id FROM suppliers WHERE supplier_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const {
      supplierName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      isActive,
      notes
    } = req.body;

    // Check if email is being changed and if it conflicts
    if (email) {
      const emailConflict = await getRow(
        'SELECT supplier_id FROM suppliers WHERE email = ? AND business_id = ? AND supplier_id != ?',
        [email, req.businessId, req.params.id]
      );
      if (emailConflict) {
        return res.status(400).json({ error: 'Supplier with this email already exists' });
      }
    }

    const updates = [];
    const params = [];

    if (supplierName) {
      updates.push('supplier_name = ?');
      params.push(supplierName);
    }
    if (contactPerson !== undefined) {
      updates.push('contact_person = ?');
      params.push(contactPerson);
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
    if (paymentTerms !== undefined) {
      updates.push('payment_terms = ?');
      params.push(paymentTerms);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
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
      `UPDATE suppliers SET ${updates.join(', ')}, updated_at = datetime('now') 
       WHERE supplier_id = ? AND business_id = ?`,
      params
    );

    const updatedSupplier = await getRow(
      'SELECT * FROM suppliers WHERE supplier_id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier
    });

  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    // Check if supplier exists and belongs to business
    const supplier = await getRow(
      'SELECT supplier_id FROM suppliers WHERE supplier_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier has related transactions or receipts
    const hasTransactions = await getRow(
      'SELECT transaction_id FROM transactions WHERE supplier_id = ? AND business_id = ? LIMIT 1',
      [req.params.id, req.businessId]
    );

    const hasReceipts = await getRow(
      'SELECT receipt_id FROM receipts WHERE supplier_id = ? AND business_id = ? LIMIT 1',
      [req.params.id, req.businessId]
    );

    if (hasTransactions || hasReceipts) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with existing transactions or receipts. Consider deactivating instead.' 
      });
    }

    // Delete supplier
    await runQuery(
      'DELETE FROM suppliers WHERE supplier_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'Supplier deleted successfully' });

  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Get supplier metrics
router.get('/:id/metrics', async (req, res) => {
  try {
    const supplier = await getRow(
      'SELECT supplier_id FROM suppliers WHERE supplier_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get monthly purchase data
    const monthlyPurchases = await getAll(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN transaction_type = 'purchase' THEN total_amount ELSE 0 END) as purchases,
        SUM(CASE WHEN transaction_type = 'payment' THEN total_amount ELSE 0 END) as payments,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE supplier_id = ? AND business_id = ?
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month DESC
      LIMIT 12
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
      WHERE supplier_id = ? AND business_id = ?
      UNION ALL
      SELECT 
        'receipt' as type,
        receipt_id as id,
        receipt_date as date,
        description,
        amount,
        'receipt' as transaction_type,
        'completed' as status
      FROM receipts
      WHERE supplier_id = ? AND business_id = ?
      ORDER BY date DESC
      LIMIT 20
    `, [req.params.id, req.businessId, req.params.id, req.businessId]);

    res.json({
      monthlyPurchases,
      recentActivity
    });

  } catch (error) {
    console.error('Get supplier metrics error:', error);
    res.status(500).json({ error: 'Failed to get supplier metrics' });
  }
});

module.exports = router; 