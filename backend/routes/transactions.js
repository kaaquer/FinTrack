const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all transactions with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('type').optional().isIn(['income', 'expense', 'sale', 'purchase', 'payment', 'receipt', 'journal']),
  query('status').optional().isIn(['draft', 'posted', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('categoryId').optional().isInt()
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
      type, 
      status, 
      startDate, 
      endDate, 
      categoryId 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.business_id = ?';
    const params = [req.businessId];

    if (search) {
      whereClause += ' AND (t.description LIKE ? OR t.reference_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      whereClause += ' AND t.transaction_type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (startDate) {
      whereClause += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    if (categoryId) {
      whereClause += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    // Get transactions with related data
    const transactions = await getAll(`
      SELECT 
        t.transaction_id,
        t.transaction_number,
        t.transaction_date,
        t.description,
        t.reference_number,
        t.total_amount,
        t.transaction_type,
        t.status,
        t.payment_method,
        t.created_at,
        c.customer_name,
        s.supplier_name,
        cat.category_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON t.category_id = cat.category_id
      LEFT JOIN users u ON t.created_by = u.user_id
      ${whereClause}
      ORDER BY t.transaction_date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `, params);

    // Get summary statistics
    const summary = await getRow(`
      SELECT 
        SUM(CASE WHEN transaction_type IN ('income', 'sale', 'receipt') THEN total_amount ELSE 0 END) as total_income,
        SUM(CASE WHEN transaction_type IN ('expense', 'purchase', 'payment') THEN total_amount ELSE 0 END) as total_expenses,
        COUNT(*) as total_transactions
      FROM transactions t
      ${whereClause}
    `, params);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      },
      summary
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await getRow(`
      SELECT 
        t.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON t.category_id = cat.category_id
      LEFT JOIN users u ON t.created_by = u.user_id
      WHERE t.transaction_id = ? AND t.business_id = ?
    `, [req.params.id, req.businessId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get transaction details (account entries)
    const details = await getAll(`
      SELECT 
        td.*,
        a.account_name,
        a.account_code
      FROM transaction_details td
      JOIN accounts a ON td.account_id = a.account_id
      WHERE td.transaction_id = ?
      ORDER BY td.line_number
    `, [req.params.id]);

    res.json({
      transaction,
      details
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Create new transaction
router.post('/', [
  body('transactionDate').notEmpty(),
  body('description').notEmpty().trim(),
  body('totalAmount').isFloat({ min: 0.01 }),
  body('transactionType').isIn(['income', 'expense', 'sale', 'purchase', 'payment', 'receipt', 'journal']),
  body('categoryId').optional().isInt(),
  body('customerId').optional().isInt(),
  body('supplierId').optional().isInt(),
  body('paymentMethod').optional().isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'other']),
  body('referenceNumber').optional().trim(),
  body('details').isArray({ min: 1 }),
  body('details.*.accountId').isInt(),
  body('details.*.debitAmount').isFloat({ min: 0 }),
  body('details.*.creditAmount').isFloat({ min: 0 }),
  body('details.*.description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      transactionDate,
      description,
      totalAmount,
      transactionType,
      categoryId,
      customerId,
      supplierId,
      paymentMethod,
      referenceNumber,
      details
    } = req.body;

    // Validate that debits equal credits
    const totalDebits = details.reduce((sum, detail) => sum + parseFloat(detail.debitAmount), 0);
    const totalCredits = details.reduce((sum, detail) => sum + parseFloat(detail.creditAmount), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ error: 'Total debits must equal total credits' });
    }

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create transaction
    const transactionResult = await runQuery(`
      INSERT INTO transactions (
        business_id, transaction_number, transaction_date, description, reference_number,
        total_amount, transaction_type, category_id, customer_id, supplier_id, status,
        payment_method, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, datetime('now'), datetime('now'))
    `, [
      req.businessId, transactionNumber, transactionDate, description, referenceNumber,
      totalAmount, transactionType, categoryId, customerId, supplierId, paymentMethod, req.user.user_id
    ]);

    // Create transaction details
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      await runQuery(`
        INSERT INTO transaction_details (
          transaction_id, account_id, debit_amount, credit_amount, description, line_number
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        transactionResult.id, detail.accountId, detail.debitAmount, detail.creditAmount,
        detail.description || '', i + 1
      ]);
    }

    // Update account balances
    for (const detail of details) {
      const netChange = parseFloat(detail.creditAmount) - parseFloat(detail.debitAmount);
      await runQuery(`
        UPDATE accounts 
        SET current_balance = current_balance + ? 
        WHERE account_id = ? AND business_id = ?
      `, [netChange, detail.accountId, req.businessId]);
    }

    // Update customer/supplier balances if applicable
    if (customerId && ['sale', 'payment'].includes(transactionType)) {
      const balanceChange = transactionType === 'sale' ? totalAmount : -totalAmount;
      await runQuery(`
        UPDATE customers 
        SET current_balance = current_balance + ? 
        WHERE customer_id = ? AND business_id = ?
      `, [balanceChange, customerId, req.businessId]);
    }

    if (supplierId && ['purchase', 'payment'].includes(transactionType)) {
      const balanceChange = transactionType === 'purchase' ? totalAmount : -totalAmount;
      await runQuery(`
        UPDATE suppliers 
        SET current_balance = current_balance + ? 
        WHERE supplier_id = ? AND business_id = ?
      `, [balanceChange, supplierId, req.businessId]);
    }

    const newTransaction = await getRow(`
      SELECT 
        t.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON t.category_id = cat.category_id
      WHERE t.transaction_id = ?
    `, [transactionResult.id]);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: newTransaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', [
  body('transactionDate').optional().notEmpty(),
  body('description').optional().notEmpty().trim(),
  body('totalAmount').optional().isFloat({ min: 0.01 }),
  body('transactionType').optional().isIn(['income', 'expense', 'sale', 'purchase', 'payment', 'receipt', 'journal']),
  body('categoryId').optional().isInt(),
  body('customerId').optional().isInt(),
  body('supplierId').optional().isInt(),
  body('paymentMethod').optional().isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'other']),
  body('referenceNumber').optional().trim(),
  body('status').optional().isIn(['draft', 'posted', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if transaction exists and belongs to business
    const existingTransaction = await getRow(
      'SELECT transaction_id, status FROM transactions WHERE transaction_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow updates to draft transactions
    if (existingTransaction.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft transactions can be updated' });
    }

    const {
      transactionDate,
      description,
      totalAmount,
      transactionType,
      categoryId,
      customerId,
      supplierId,
      paymentMethod,
      referenceNumber,
      status
    } = req.body;

    const updates = [];
    const params = [];

    if (transactionDate) {
      updates.push('transaction_date = ?');
      params.push(transactionDate);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (totalAmount) {
      updates.push('total_amount = ?');
      params.push(totalAmount);
    }
    if (transactionType) {
      updates.push('transaction_type = ?');
      params.push(transactionType);
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
    if (paymentMethod) {
      updates.push('payment_method = ?');
      params.push(paymentMethod);
    }
    if (referenceNumber !== undefined) {
      updates.push('reference_number = ?');
      params.push(referenceNumber);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.params.id, req.businessId);

    await runQuery(
      `UPDATE transactions SET ${updates.join(', ')}, updated_at = datetime('now') 
       WHERE transaction_id = ? AND business_id = ?`,
      params
    );

    const updatedTransaction = await getRow(`
      SELECT 
        t.*,
        c.customer_name,
        s.supplier_name,
        cat.category_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
      LEFT JOIN categories cat ON t.category_id = cat.category_id
      WHERE t.transaction_id = ?
    `, [req.params.id]);

    res.json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    // Check if transaction exists and belongs to business
    const transaction = await getRow(
      'SELECT transaction_id, status FROM transactions WHERE transaction_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow deletion of draft transactions
    if (transaction.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft transactions can be deleted' });
    }

    // Delete transaction details first (cascade)
    await runQuery(
      'DELETE FROM transaction_details WHERE transaction_id = ?',
      [req.params.id]
    );

    // Delete transaction
    await runQuery(
      'DELETE FROM transactions WHERE transaction_id = ? AND business_id = ?',
      [req.params.id, req.businessId]
    );

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get transaction summary/dashboard data
router.get('/dashboard/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE business_id = ?';
    const params = [req.businessId];

    if (startDate) {
      whereClause += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    // Get summary by type
    const summaryByType = await getAll(`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM transactions
      ${whereClause}
      GROUP BY transaction_type
    `, params);

    // Get monthly trends
    const monthlyTrends = await getAll(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN transaction_type IN ('income', 'sale', 'receipt') THEN total_amount ELSE 0 END) as income,
        SUM(CASE WHEN transaction_type IN ('expense', 'purchase', 'payment') THEN total_amount ELSE 0 END) as expenses,
        COUNT(*) as transaction_count
      FROM transactions
      ${whereClause}
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month DESC
      LIMIT 12
    `, params);

    // Get top categories
    const topCategories = await getAll(`
      SELECT 
        cat.category_name,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_amount
      FROM transactions t
      JOIN categories cat ON t.category_id = cat.category_id
      ${whereClause}
      GROUP BY cat.category_id, cat.category_name
      ORDER BY total_amount DESC
      LIMIT 10
    `, params);

    res.json({
      summaryByType,
      monthlyTrends,
      topCategories
    });

  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ error: 'Failed to get transaction summary' });
  }
});

module.exports = router; 