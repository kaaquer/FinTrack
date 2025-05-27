import { Request, Response } from 'express';
import Customer, { ICustomer } from '../models/customer.model';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-__v');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerStats = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });
    const leads = await Customer.countDocuments({ status: 'Lead' });
    const inactiveCustomers = await Customer.countDocuments({ status: 'Inactive' });
    
    const totalRevenue = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalSpent' }
        }
      }
    ]);

    res.json({
      totalCustomers,
      activeCustomers,
      leads,
      inactiveCustomers,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
