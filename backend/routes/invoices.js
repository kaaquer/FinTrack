const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all invoices with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('customerId').optional().isInt()
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
      status, 
      startDate, 
      endDate, 
      customerId 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.business_id = ?';
    const params = [req.businessId];

    if (search) {
      whereClause += ' AND (i.invoice_number LIKE ? OR i.notes LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    if (startDate) {
      whereClause += ' AND i.invoice_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND i.invoice_date <= ?';
      params.push(endDate);
    }

    if (customerId) {
      whereClause += ' AND i.customer_id = ?';
      params.push(customerId);
    }

    // Get invoices with customer info
    const invoices = await getAll(`
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.due_date,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        i.paid_amount,
        i.balance_due,
        i.status,
        i.notes,
        i.created_at,
        c.customer_name,
        c.email as customer_email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.customer_id
      ${whereClause}
      ORDER BY i.invoice_date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM invoices i
      ${whereClause}
    `, params);

    // Get summary statistics
    const summary = await getRow(`
      SELECT 
        SUM(total_amount) as total_invoiced,
        SUM(paid_amount) as total_paid,
        SUM(balance_due) as total_outstanding,
        COUNT(*) as total_invoices
      FROM invoices i
      ${whereClause}
    `, params);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      },
      summary
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await getRow(`
      SELECT 
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.customer_id
      WHERE i.invoice_id = ? AND i.business_id = ?
    `, [req.params.id, req.businessId]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get invoice items
    const items = await getAll(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ? 
      ORDER BY line_number
    `, [req.params.id]);

    res.json({
      invoice,
      items
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Create new invoice
router.post('/', [
  body('customerId').isInt(),
  body('invoiceDate').notEmpty(),
  body('dueDate').optional(),
  body('subtotal').isFloat({ min: 0 }),
  body('taxAmount').optional().isFloat({ min: 0 }),
  body('totalAmount').isFloat({ min: 0.01 }),
  body('notes').optional().trim(),
  body('terms').optional().trim(),
  body('items').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerId,
      invoiceDate,
      dueDate,
      subtotal,
      taxAmount = 0,
      totalAmount,
      notes,
      terms,
      items
    } = req.body;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create invoice
    const result = await runQuery(`
      INSERT INTO invoices (
        business_id, customer_id, invoice_number, invoice_date, due_date, subtotal,
        tax_amount, total_amount, paid_amount, balance_due, status, notes, terms, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'draft', ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      req.businessId, customerId, invoiceNumber, invoiceDate, dueDate, subtotal,
      taxAmount, totalAmount, totalAmount, notes, terms, req.user.user_id
    ]);

    // Create invoice items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await runQuery(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price, line_total, tax_rate, line_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        result.id, item.productId, item.description, item.quantity, item.unitPrice,
        item.lineTotal, item.taxRate || 0, i + 1
      ]);
    }

    const newInvoice = await getRow(`
      SELECT 
        i.*,
        c.customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.customer_id
      WHERE i.invoice_id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice status
router.put('/:id/status', [
  body('status').isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    // Check if invoice exists and belongs to business
    const invoice = await getRow(
      'SELECT invoice_id FROM invoices WHERE invoice_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await runQuery(
      'UPDATE invoices SET status = ?, updated_at = datetime("now") WHERE invoice_id = ? AND business_id = ?',
      [status, req.params.id, req.businessId]
    );

    res.json({ message: 'Invoice status updated successfully' });

  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    // Check if invoice exists and belongs to business
    const invoice = await getRow(
      'SELECT invoice_id, status FROM invoices WHERE invoice_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft invoices can be deleted' });
    }

    // Delete invoice items first (cascade)
    await runQuery(
      'DELETE FROM invoice_items WHERE invoice_id = ?',
      [req.params.id]
    );

    // Delete invoice
    await runQuery(
      'DELETE FROM invoices WHERE invoice_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'Invoice deleted successfully' });

  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router; 