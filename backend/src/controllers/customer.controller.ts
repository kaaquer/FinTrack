import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../models/customer.model';

const customerRepository = AppDataSource.getRepository(Customer);

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await customerRepository.find({
            order: {
                createdAt: 'DESC'
            }
        });
        
        res.json(customers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const customer = await customerRepository.findOneBy({ id: req.params.id });
        
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
        const newCustomer = customerRepository.create(req.body);
        const savedCustomer = await customerRepository.save(newCustomer);
        res.status(201).json(savedCustomer);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await customerRepository.findOneBy({ id: req.params.id });
        
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        customerRepository.merge(customer, req.body);
        const updatedCustomer = await customerRepository.save(customer);
        res.json(updatedCustomer);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const result = await customerRepository.delete(req.params.id);
        
        if (result.affected === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCustomerStats = async (req: Request, res: Response) => {
    try {
        const totalCustomers = await customerRepository.count();
        const activeCustomers = await customerRepository.count({ where: { status: 'Active' } });
        const leads = await customerRepository.count({ where: { status: 'Lead' } });
        const inactiveCustomers = await customerRepository.count({ where: { status: 'Inactive' } });
        
        const totalRevenue = await customerRepository
            .createQueryBuilder('customer')
            .select('SUM(customer.totalSpent)', 'total')
            .getRawOne();

        res.json({
            totalCustomers,
            activeCustomers,
            leads,
            inactiveCustomers,
            totalRevenue: totalRevenue?.total || 0
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
