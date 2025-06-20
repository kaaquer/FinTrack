const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all receipts with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('categoryId').optional().isInt(),
  query('customerId').optional().isInt(),
  query('supplierId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      page = 1, 
      limit = 20, 
      search, 
      startDate, 
      endDate, 
      categoryId, 
      customerId, 
      supplierId 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.business_id = ?';
    const params = [req.businessId];

    if (search) {
      whereClause += ' AND (r.description LIKE ? OR r.reference_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (startDate) {
      whereClause += ' AND r.receipt_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND r.receipt_date <= ?';
      params.push(endDate);
    }

    if (categoryId) {
      whereClause += ' AND r.category_id = ?';
      params.push(categoryId);
    }

    if (customerId) {
      whereClause += ' AND r.customer_id = ?';
      params.push(customerId);
    }

    if (supplierId) {
      whereClause += ' AND r.supplier_id = ?';
      params.push(supplierId);
    }

    // Get receipts with related data
    const receipts = await getAll(`
      SELECT 
        r.receipt_id,
        r.receipt_number,
        r.receipt_date,
        r.amount,
        r.payment_method,
        r.reference_number,
        r.description,
        r.image_url,
        r.created_at,
        c.customer_name,
        s.supplier_name,
        cat.category_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM receipts r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON r.category_id = cat.category_id
      LEFT JOIN users u ON r.created_by = u.user_id
      ${whereClause}
      ORDER BY r.receipt_date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM receipts r
      ${whereClause}
    `, params);

    // Get summary statistics
    const summary = await getRow(`
      SELECT 
        SUM(amount) as total_amount,
        COUNT(*) as total_receipts,
        AVG(amount) as average_amount
      FROM receipts r
      ${whereClause}
    `, params);

    res.json({
      receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      },
      summary
    });

  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Failed to get receipts' });
  }
});

// Get receipt by ID
router.get('/:id', async (req, res) => {
  try {
    const receipt = await getRow(`
      SELECT 
        r.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM receipts r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON r.category_id = cat.category_id
      LEFT JOIN users u ON r.created_by = u.user_id
      WHERE r.receipt_id = ? AND r.business_id = ?
    `, [req.params.id, req.businessId]);

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ receipt });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

// Create new receipt
router.post('/', [
  body('receiptDate').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'other']),
  body('description').optional().trim(),
  body('referenceNumber').optional().trim(),
  body('categoryId').optional().isInt(),
  body('customerId').optional().isInt(),
  body('supplierId').optional().isInt(),
  body('invoiceId').optional().isInt(),
  body('imageUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      receiptDate,
      amount,
      paymentMethod,
      description,
      referenceNumber,
      categoryId,
      customerId,
      supplierId,
      invoiceId,
      imageUrl
    } = req.body;

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create receipt
    const result = await runQuery(`
      INSERT INTO receipts (
        business_id, receipt_number, receipt_date, amount, payment_method, reference_number,
        description, category_id, customer_id, supplier_id, invoice_id, image_url, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      req.businessId, receiptNumber, receiptDate, amount, paymentMethod, referenceNumber,
      description, categoryId, customerId, supplierId, invoiceId, imageUrl, req.user.user_id
    ]);

    // Update customer/supplier balance if applicable
    if (customerId) {
      await runQuery(`
        UPDATE customers 
        SET current_balance = current_balance - ? 
        WHERE customer_id = ? AND business_id = ?
      `, [amount, customerId, req.businessId]);
    }

    if (supplierId) {
      await runQuery(`
        UPDATE suppliers 
        SET current_balance = current_balance - ? 
        WHERE supplier_id = ? AND business_id = ?
      `, [amount, supplierId, req.businessId]);
    }

    // Update invoice if linked
    if (invoiceId) {
      await runQuery(`
        UPDATE invoices 
        SET paid_amount = paid_amount + ?, balance_due = balance_due - ?
        WHERE invoice_id = ? AND business_id = ?
      `, [amount, amount, invoiceId, req.businessId]);
    }

    const newReceipt = await getRow(`
      SELECT 
        r.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name
      FROM receipts r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON r.category_id = cat.category_id
      WHERE r.receipt_id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt: newReceipt
    });

  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// Update receipt
router.put('/:id', [
  body('receiptDate').optional().notEmpty(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('paymentMethod').optional().isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'other']),
  body('description').optional().trim(),
  body('referenceNumber').optional().trim(),
  body('categoryId').optional().isInt(),
  body('customerId').optional().isInt(),
  body('supplierId').optional().isInt(),
  body('invoiceId').optional().isInt(),
  body('imageUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if receipt exists and belongs to business
    const existingReceipt = await getRow(
      'SELECT receipt_id, amount, customer_id, supplier_id, invoice_id FROM receipts WHERE receipt_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const {
      receiptDate,
      amount,
      paymentMethod,
      description,
      referenceNumber,
      categoryId,
      customerId,
      supplierId,
      invoiceId,
      imageUrl
    } = req.body;

    const updates = [];
    const params = [];

    if (receiptDate) {
      updates.push('receipt_date = ?');
      params.push(receiptDate);
    }
    if (amount) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (paymentMethod) {
      updates.push('payment_method = ?');
      params.push(paymentMethod);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (referenceNumber !== undefined) {
      updates.push('reference_number = ?');
      params.push(referenceNumber);
    }
    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(categoryId);
    }
    if (customerId !== undefined) {
      updates.push('customer_id = ?');
      params.push(customerId);
    }
    if (supplierId !== undefined) {
      updates.push('supplier_id = ?');
      params.push(supplierId);
    }
    if (invoiceId !== undefined) {
      updates.push('invoice_id = ?');
      params.push(invoiceId);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.params.id, req.businessId);

    await runQuery(
      `UPDATE receipts SET ${updates.join(', ')} WHERE receipt_id = ? AND business_id = ?`,
      params
    );

    // Handle balance updates if amount changed
    if (amount && amount !== existingReceipt.amount) {
      const amountDifference = amount - existingReceipt.amount;

      if (existingReceipt.customer_id) {
        await runQuery(`
          UPDATE customers 
          SET current_balance = current_balance - ? 
          WHERE customer_id = ? AND business_id = ?
        `, [amountDifference, existingReceipt.customer_id, req.businessId]);
      }

      if (existingReceipt.supplier_id) {
        await runQuery(`
          UPDATE suppliers 
          SET current_balance = current_balance - ? 
          WHERE supplier_id = ? AND business_id = ?
        `, [amountDifference, existingReceipt.supplier_id, req.businessId]);
      }

      if (existingReceipt.invoice_id) {
        await runQuery(`
          UPDATE invoices 
          SET paid_amount = paid_amount + ?, balance_due = balance_due - ?
          WHERE invoice_id = ? AND business_id = ?
        `, [amountDifference, amountDifference, existingReceipt.invoice_id, req.businessId]);
      }
    }

    const updatedReceipt = await getRow(`
      SELECT 
        r.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name
      FROM receipts r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON r.category_id = cat.category_id
      WHERE r.receipt_id = ?
    `, [req.params.id]);

    res.json({
      message: 'Receipt updated successfully',
      receipt: updatedReceipt
    });

  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ error: 'Failed to update receipt' });
  }
});

// Delete receipt
router.delete('/:id', async (req, res) => {
  try {
    // Check if receipt exists and belongs to business
    const receipt = await getRow(
      'SELECT receipt_id, amount, customer_id, supplier_id, invoice_id FROM receipts WHERE receipt_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Reverse balance updates
    if (receipt.customer_id) {
      await runQuery(`
        UPDATE customers 
        SET current_balance = current_balance + ? 
        WHERE customer_id = ? AND business_id = ?
      `, [receipt.amount, receipt.customer_id, req.businessId]);
    }

    if (receipt.supplier_id) {
      await runQuery(`
        UPDATE suppliers 
        SET current_balance = current_balance + ? 
        WHERE supplier_id = ? AND business_id = ?
      `, [receipt.amount, receipt.supplier_id, req.businessId]);
    }

    if (receipt.invoice_id) {
      await runQuery(`
        UPDATE invoices 
        SET paid_amount = paid_amount - ?, balance_due = balance_due + ?
        WHERE invoice_id = ? AND business_id = ?
      `, [receipt.amount, receipt.amount, receipt.invoice_id, req.businessId]);
    }

    // Delete receipt
    await runQuery(
      'DELETE FROM receipts WHERE receipt_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'Receipt deleted successfully' });

  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// Get receipt summary/dashboard data
router.get('/dashboard/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE business_id = ?';
    const params = [req.businessId];

    if (startDate) {
      whereClause += ' AND receipt_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND receipt_date <= ?';
      params.push(endDate);
    }

    // Get summary by payment method
    const summaryByPaymentMethod = await getAll(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM receipts
      ${whereClause}
      GROUP BY payment_method
    `, params);

    // Get monthly trends
    const monthlyTrends = await getAll(`
      SELECT 
        strftime('%Y-%m', receipt_date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as receipt_count
      FROM receipts
      ${whereClause}
      GROUP BY strftime('%Y-%m', receipt_date)
      ORDER BY month DESC
      LIMIT 12
    `, params);

    // Get top categories
    const topCategories = await getAll(`
      SELECT 
        cat.category_name,
        COUNT(*) as receipt_count,
        SUM(r.amount) as total_amount
      FROM receipts r
      JOIN categories cat ON r.category_id = cat.category_id
      ${whereClause}
      GROUP BY cat.category_id, cat.category_name
      ORDER BY total_amount DESC
      LIMIT 10
    `, params);

    res.json({
      summaryByPaymentMethod,
      monthlyTrends,
      topCategories
    });

  } catch (error) {
    console.error('Get receipt summary error:', error);
    res.status(500).json({ error: 'Failed to get receipt summary' });
  }
});

module.exports = router; 