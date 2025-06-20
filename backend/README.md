 # FinTrack Backend API

A comprehensive Node.js/Express backend API for the FinTrack financial management application.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Customer Management**: Complete CRUD operations for customer data
- **Supplier Management**: Full supplier lifecycle management
- **Transaction Management**: Financial transaction processing with double-entry bookkeeping
- **Receipt Management**: Digital receipt storage and processing
- **Invoice Management**: Invoice creation, tracking, and payment processing
- **Financial Reporting**: Profit & Loss, Cash Flow, and Customer reports
- **Notification System**: Real-time notifications for users
- **User Management**: Multi-user support with role-based permissions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your settings
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Configuration

Create a `config.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./database/fintrack.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Customers
- `GET /api/customers` - Get all customers (with pagination, search, filters)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/metrics` - Get customer metrics

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/suppliers/:id/metrics` - Get supplier metrics

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/dashboard/summary` - Get transaction summary

### Receipts
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/:id` - Get receipt by ID
- `POST /api/receipts` - Create new receipt
- `PUT /api/receipts/:id` - Update receipt
- `DELETE /api/receipts/:id` - Delete receipt
- `GET /api/receipts/dashboard/summary` - Get receipt summary

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### Reports
- `GET /api/reports/profit-loss` - Profit & Loss report
- `GET /api/reports/cash-flow` - Cash Flow report
- `GET /api/reports/customers` - Customer summary report
- `GET /api/reports/dashboard` - Dashboard summary

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

All API endpoints (except authentication) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

The backend uses a comprehensive SQLite database with the following main tables:

- **users** - User accounts and authentication
- **businesses** - Business information
- **customers** - Customer data and analytics
- **suppliers** - Supplier information
- **transactions** - Financial transactions
- **transaction_details** - Double-entry bookkeeping details
- **invoices** - Invoice management
- **invoice_items** - Invoice line items
- **receipts** - Receipt storage and processing
- **categories** - Transaction categorization
- **accounts** - Chart of accounts
- **notifications** - User notifications
- **financial_reports** - Cached financial reports
- **customer_analytics** - Customer performance metrics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Cross-origin resource sharing control
- **Helmet**: Security headers middleware
- **SQL Injection Protection**: Parameterized queries

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error information (development only)"
}
```

## Development

### Running Tests
```bash
npm test
```

### Database Reset
```bash
npm run init-db
```

### Code Linting
```bash
npm run lint
```

## Production Deployment

1. **Set environment variables**
   - Change `NODE_ENV` to `production`
   - Use a strong `JWT_SECRET`
   - Configure proper `CORS_ORIGIN`

2. **Database setup**
   - Ensure database directory is writable
   - Consider using a production database (PostgreSQL, MySQL)

3. **Security considerations**
   - Use HTTPS in production
   - Implement proper logging
   - Set up monitoring and alerting
   - Regular security updates

## API Documentation

For detailed API documentation, refer to the individual route files or use tools like Postman/Swagger to explore the endpoints.

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.