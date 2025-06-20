# FinTrack - Financial Management Application

## Overview
FinTrack is a comprehensive financial management application built with React Native/Expo for the frontend and Node.js/Express with SQLite for the backend. The application provides complete financial tracking, customer management, supplier management, invoicing, and reporting capabilities.

## Features

### Core Features
- **User Authentication & Authorization**: Custom JWT-based authentication system with role-based access control
- **Business Management**: Multi-tenant architecture supporting multiple businesses
- **Customer Management**: Complete customer database with contact information and credit tracking
- **Supplier Management**: Supplier database with payment terms and balance tracking
- **Transaction Management**: Comprehensive transaction recording with multiple types and categories
- **Invoice Management**: Full invoice lifecycle from creation to payment tracking
- **Receipt Management**: Digital receipt storage and management
- **Financial Reporting**: Profit & loss, cash flow, and dashboard reports
- **Notifications**: Real-time notifications for important events
- **Analytics**: Customer behavior and financial analytics

### Technical Features
- **Cross-Platform**: React Native/Expo for iOS and Android
- **Backend API**: Node.js/Express RESTful API
- **Database**: SQLite with comprehensive schema
- **Authentication**: JWT-based authentication with password reset functionality
- **Security**: Password hashing, input validation, rate limiting
- **Real-time**: WebSocket support for notifications
- **File Upload**: Receipt image storage
- **Pagination**: Efficient data loading with pagination
- **Search & Filtering**: Advanced search and filtering capabilities

## Architecture

### Frontend (React Native/Expo)
- **Navigation**: React Navigation with drawer and tab navigation
- **State Management**: React Context for authentication and global state
- **API Integration**: Axios-based API service with interceptors
- **UI Components**: Custom components with consistent styling
- **Form Handling**: React Hook Form for form validation
- **Storage**: AsyncStorage for local data persistence

### Backend (Node.js/Express)
- **Framework**: Express.js with middleware for security and validation
- **Database**: SQLite with comprehensive schema
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Express-validator for input validation
- **Security**: Helmet, CORS, rate limiting
- **File Handling**: Multer for file uploads
- **Error Handling**: Comprehensive error handling and logging

### Database Schema
The application uses a comprehensive SQLite database with the following main tables:
- **businesses**: Multi-tenant business information
- **users**: User accounts with role-based access
- **customers**: Customer database with contact and financial information
- **suppliers**: Supplier database with payment terms
- **transactions**: Financial transactions with detailed categorization
- **invoices**: Invoice management with status tracking
- **receipts**: Receipt storage with image support
- **categories**: Transaction categorization
- **notifications**: User notifications
- **analytics**: Financial and customer analytics

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- SQLite3

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   PORT=3001
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   ```

5. Initialize the database:
   ```bash
   npm run init-db
   ```

6. Run database migrations (if needed):
   ```bash
   npm run migrate
   ```

7. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

3. Run on device or simulator:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Customers
- `GET /api/customers` - Get customers with pagination and filtering
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Suppliers
- `GET /api/suppliers` - Get suppliers with pagination and filtering
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Transactions
- `GET /api/transactions` - Get transactions with pagination and filtering
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Invoices
- `GET /api/invoices` - Get invoices with pagination and filtering
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### Receipts
- `GET /api/receipts` - Get receipts with pagination and filtering
- `POST /api/receipts` - Create new receipt
- `GET /api/receipts/:id` - Get receipt by ID
- `PUT /api/receipts/:id` - Update receipt
- `DELETE /api/receipts/:id` - Delete receipt

### Reports
- `GET /api/reports/profit-loss` - Profit & loss report
- `GET /api/reports/cash-flow` - Cash flow report
- `GET /api/reports/dashboard` - Dashboard summary

## Security Features

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Password hashing using bcrypt
- Role-based access control (admin, user, accountant)
- Password reset functionality with secure tokens
- Session management with automatic token refresh

### Input Validation & Sanitization
- Express-validator for request validation
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- File upload validation and size limits

### Security Headers & Middleware
- Helmet.js for security headers
- CORS configuration
- Rate limiting to prevent abuse
- Request size limits
- Error handling without sensitive information exposure

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Implement proper error handling

### Testing
- Unit tests for API endpoints
- Integration tests for database operations
- Frontend component testing
- API endpoint testing with supertest

### Database
- Use migrations for schema changes
- Implement proper indexing for performance
- Use transactions for data integrity
- Regular database backups

## Deployment

### Backend Deployment
1. Set up production environment variables
2. Configure database for production
3. Set up SSL/TLS certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)
6. Configure logging and monitoring

### Frontend Deployment
1. Build production bundle
2. Configure app store deployment
3. Set up CI/CD pipeline
4. Configure analytics and crash reporting

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For support and questions, please contact the development team or create an issue in the repository.
