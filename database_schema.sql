-- Enhanced FinTrack Database Schema
-- Compatible with React Native FinTrack Application

-- 1. Businesses Table (must be first - no dependencies)
CREATE TABLE businesses (
    business_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    business_type TEXT,
    tax_id TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Users Table (depends on businesses)
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'accountant')),
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    reset_token TEXT,
    reset_token_expiry TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- 3. Categories Table (depends on businesses)
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    category_type TEXT NOT NULL CHECK(category_type IN ('income', 'expense')),
    parent_category_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- 4. Accounts Table (depends on businesses)
CREATE TABLE accounts (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    account_code TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK(account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_subtype TEXT,
    parent_account_id INTEGER,
    current_balance REAL DEFAULT 0.00,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (parent_account_id) REFERENCES accounts(account_id)
);

-- 5. Customers Table (depends on businesses)
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'individual' CHECK(customer_type IN ('individual', 'business')),
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    tax_id TEXT,
    credit_limit REAL DEFAULT 0.00,
    current_balance REAL DEFAULT 0.00,
    status TEXT DEFAULT 'lead' CHECK(status IN ('active', 'inactive', 'lead')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- 6. Suppliers Table (depends on businesses)
CREATE TABLE suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    current_balance REAL DEFAULT 0.00,
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- 7. Products Table (depends on businesses)
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    product_code TEXT,
    product_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_price REAL,
    cost_price REAL,
    quantity_on_hand REAL DEFAULT 0.00,
    reorder_level REAL DEFAULT 0.00,
    is_service INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- 8. Transactions Table (depends on businesses, categories, customers, suppliers, users)
CREATE TABLE transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    transaction_number TEXT UNIQUE,
    transaction_date TEXT NOT NULL,
    description TEXT,
    reference_number TEXT,
    total_amount REAL NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense', 'sale', 'purchase', 'payment', 'receipt', 'journal')),
    category_id INTEGER,
    customer_id INTEGER,
    supplier_id INTEGER,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'posted', 'cancelled')),
    payment_method TEXT CHECK(payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'other')),
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 9. Transaction Details Table (depends on transactions, accounts)
CREATE TABLE transaction_details (
    detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit_amount REAL DEFAULT 0.00,
    credit_amount REAL DEFAULT 0.00,
    description TEXT,
    line_number INTEGER,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

-- 10. Invoices Table (depends on businesses, customers, users)
CREATE TABLE invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date TEXT NOT NULL,
    due_date TEXT,
    subtotal REAL NOT NULL,
    tax_amount REAL DEFAULT 0.00,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0.00,
    balance_due REAL NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    terms TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 11. Invoice Items Table (depends on invoices, products)
CREATE TABLE invoice_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    tax_rate REAL DEFAULT 0.00,
    line_number INTEGER,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 12. Receipts Table (depends on businesses, customers, suppliers, categories, invoices, users)
CREATE TABLE receipts (
    receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER,
    supplier_id INTEGER,
    receipt_number TEXT UNIQUE NOT NULL,
    receipt_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'other')),
    reference_number TEXT,
    description TEXT,
    category_id INTEGER,
    invoice_id INTEGER,
    image_url TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 13. Notifications Table (depends on businesses, users)
CREATE TABLE notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL CHECK(notification_type IN ('payment', 'reminder', 'alert', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    related_id INTEGER,
    related_type TEXT,
    action_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 14. Financial Reports Table (depends on businesses)
CREATE TABLE financial_reports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    report_type TEXT NOT NULL CHECK(report_type IN ('profit_loss', 'balance_sheet', 'cash_flow', 'trial_balance')),
    report_period_start TEXT NOT NULL,
    report_period_end TEXT NOT NULL,
    report_data TEXT,
    generated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- 15. Customer Analytics Table (depends on businesses, customers)
CREATE TABLE customer_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    total_sales REAL DEFAULT 0.00,
    total_payments REAL DEFAULT 0.00,
    outstanding_balance REAL DEFAULT 0.00,
    last_transaction_date TEXT,
    transaction_count INTEGER DEFAULT 0,
    average_transaction_amount REAL DEFAULT 0.00,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 16. User Settings Table (depends on users)
CREATE TABLE user_settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(user_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_business_date ON transactions(business_id, transaction_date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_supplier ON transactions(supplier_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_invoices_business_date ON invoices(business_id, invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_receipts_business_date ON receipts(business_id, receipt_date);
CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_suppliers_business ON suppliers(business_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_users_business ON users(business_id);

-- Insert a default business so business_id=1 exists for foreign key inserts
INSERT INTO businesses (business_name) VALUES ('Default Business');

-- Insert default categories
INSERT INTO categories (business_id, category_name, category_type) VALUES 
(1, 'Sales Revenue', 'income'),
(1, 'Service Revenue', 'income'),
(1, 'Other Income', 'income'),
(1, 'Office Supplies', 'expense'),
(1, 'Utilities', 'expense'),
(1, 'Rent', 'expense'),
(1, 'Equipment', 'expense'),
(1, 'Marketing', 'expense'),
(1, 'Travel', 'expense'),
(1, 'Other Expenses', 'expense');

-- Insert default accounts
INSERT INTO accounts (business_id, account_code, account_name, account_type, account_subtype) VALUES 
(1, '1000', 'Cash', 'asset', 'current'),
(1, '1100', 'Accounts Receivable', 'asset', 'current'),
(1, '1200', 'Inventory', 'asset', 'current'),
(1, '2000', 'Accounts Payable', 'liability', 'current'),
(1, '3000', 'Owner Equity', 'equity', 'capital'),
(1, '4000', 'Sales Revenue', 'revenue', 'sales'),
(1, '5000', 'Cost of Goods Sold', 'expense', 'cogs'),
(1, '6000', 'Operating Expenses', 'expense', 'operating'); 