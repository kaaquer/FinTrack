const express = require('express');
const { query, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get profit and loss report
router.get('/profit-loss', [
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    // Get revenue
    const revenue = await getRow(`
      SELECT SUM(total_amount) as total_revenue
      FROM transactions
      WHERE business_id = ? 
        AND transaction_type IN ('income', 'sale', 'receipt')
        AND transaction_date BETWEEN ? AND ?
        AND status = 'posted'
    `, [req.businessId, startDate, endDate]);

    // Get expenses
    const expenses = await getRow(`
      SELECT SUM(total_amount) as total_expenses
      FROM transactions
      WHERE business_id = ? 
        AND transaction_type IN ('expense', 'purchase', 'payment')
        AND transaction_date BETWEEN ? AND ?
        AND status = 'posted'
    `, [req.businessId, startDate, endDate]);

    // Get expenses by category
    const expensesByCategory = await getAll(`
      SELECT 
        cat.category_name,
        SUM(t.total_amount) as amount
      FROM transactions t
      JOIN categories cat ON t.category_id = cat.category_id
      WHERE t.business_id = ? 
        AND t.transaction_type IN ('expense', 'purchase', 'payment')
        AND t.transaction_date BETWEEN ? AND ?
        AND t.status = 'posted'
      GROUP BY cat.category_id, cat.category_name
      ORDER BY amount DESC
    `, [req.businessId, startDate, endDate]);

    const totalRevenue = revenue.total_revenue || 0;
    const totalExpenses = expenses.total_expenses || 0;
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      period: { startDate, endDate },
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      expensesByCategory
    });

  } catch (error) {
    console.error('Get profit-loss report error:', error);
    res.status(500).json({ error: 'Failed to get profit-loss report' });
  }
});

// Get cash flow report
router.get('/cash-flow', [
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    // Get cash inflows
    const inflows = await getRow(`
      SELECT SUM(total_amount) as total_inflows
      FROM transactions
      WHERE business_id = ? 
        AND transaction_type IN ('income', 'sale', 'receipt')
        AND transaction_date BETWEEN ? AND ?
        AND status = 'posted'
    `, [req.businessId, startDate, endDate]);

    // Get cash outflows
    const outflows = await getRow(`
      SELECT SUM(total_amount) as total_outflows
      FROM transactions
      WHERE business_id = ? 
        AND transaction_type IN ('expense', 'purchase', 'payment')
        AND transaction_date BETWEEN ? AND ?
        AND status = 'posted'
    `, [req.businessId, startDate, endDate]);

    // Get monthly cash flow
    const monthlyCashFlow = await getAll(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN transaction_type IN ('income', 'sale', 'receipt') THEN total_amount ELSE 0 END) as inflows,
        SUM(CASE WHEN transaction_type IN ('expense', 'purchase', 'payment') THEN total_amount ELSE 0 END) as outflows
      FROM transactions
      WHERE business_id = ? 
        AND transaction_date BETWEEN ? AND ?
        AND status = 'posted'
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month
    `, [req.businessId, startDate, endDate]);

    const totalInflows = inflows.total_inflows || 0;
    const totalOutflows = outflows.total_outflows || 0;
    const netCashFlow = totalInflows - totalOutflows;

    res.json({
      period: { startDate, endDate },
      inflows: totalInflows,
      outflows: totalOutflows,
      netCashFlow,
      monthlyCashFlow
    });

  } catch (error) {
    console.error('Get cash flow report error:', error);
    res.status(500).json({ error: 'Failed to get cash flow report' });
  }
});

// Get customer summary report
router.get('/customers', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE c.business_id = ?';
    const params = [req.businessId];

    if (startDate && endDate) {
      whereClause += ' AND t.transaction_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get customer summary
    const customerSummary = await getAll(`
      SELECT 
        c.customer_name,
        c.status,
        COUNT(t.transaction_id) as transaction_count,
        SUM(CASE WHEN t.transaction_type IN ('sale', 'income') THEN t.total_amount ELSE 0 END) as total_sales,
        SUM(CASE WHEN t.transaction_type = 'payment' THEN t.total_amount ELSE 0 END) as total_payments,
        c.current_balance
      FROM customers c
      LEFT JOIN transactions t ON c.customer_id = t.customer_id ${startDate && endDate ? 'AND t.transaction_date BETWEEN ? AND ?' : ''}
      ${whereClause}
      GROUP BY c.customer_id, c.customer_name, c.status, c.current_balance
      ORDER BY total_sales DESC
    `, params);

    res.json({
      customerSummary,
      period: startDate && endDate ? { startDate, endDate } : null
    });

  } catch (error) {
    console.error('Get customer summary report error:', error);
    res.status(500).json({ error: 'Failed to get customer summary report' });
  }
});

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get current month summary
    const currentMonthSummary = await getRow(`
      SELECT 
        SUM(CASE WHEN transaction_type IN ('income', 'sale', 'receipt') THEN total_amount ELSE 0 END) as income,
        SUM(CASE WHEN transaction_type IN ('expense', 'purchase', 'payment') THEN total_amount ELSE 0 END) as expenses,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE business_id = ? 
        AND strftime('%Y-%m', transaction_date) = ?
        AND status = 'posted'
    `, [req.businessId, currentMonth]);

    // Get outstanding invoices
    const outstandingInvoices = await getRow(`
      SELECT 
        COUNT(*) as count,
        SUM(balance_due) as total_amount
      FROM invoices
      WHERE business_id = ? AND balance_due > 0
    `, [req.businessId]);

    // Get customer count
    const customerCount = await getRow(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers
      FROM customers
      WHERE business_id = ?
    `, [req.businessId]);

    // Get recent transactions
    const recentTransactions = await getAll(`
      SELECT 
        transaction_id,
        transaction_date,
        description,
        total_amount,
        transaction_type,
        status
      FROM transactions
      WHERE business_id = ?
      ORDER BY transaction_date DESC
      LIMIT 10
    `, [req.businessId]);

    res.json({
      currentMonth: currentMonth,
      currentMonthSummary: {
        income: currentMonthSummary.income || 0,
        expenses: currentMonthSummary.expenses || 0,
        transactionCount: currentMonthSummary.transaction_count || 0
      },
      outstandingInvoices: {
        count: outstandingInvoices.count || 0,
        totalAmount: outstandingInvoices.total_amount || 0
      },
      customerCount: {
        total: customerCount.total_customers || 0,
        active: customerCount.active_customers || 0
      },
      recentTransactions
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

module.exports = router; 