import express, { Request, Response, RequestHandler } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} from '../controllers/customer.controller';

const router = express.Router();

// GET /api/customers
router.get('/', getCustomers as RequestHandler);

// GET /api/customers/stats
router.get('/stats', getCustomerStats as RequestHandler);

// GET /api/customers/:id
router.get('/:id', getCustomerById as RequestHandler);

// POST /api/customers
router.post('/', createCustomer);

// PUT /api/customers/:id
router.put('/:id', updateCustomer as RequestHandler);

// DELETE /api/customers/:id
router.delete('/:id', deleteCustomer as RequestHandler);

export default router;
