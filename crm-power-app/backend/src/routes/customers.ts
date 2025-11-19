import express from 'express';
import DataverseService from '../services/dataverseService';
import { authenticateToken, requireAgent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const dataverseService = new DataverseService();

// Get all customers with filtering and pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { company, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (company) filter.company = company as string;
    filter.page = parseInt(page as string);
    filter.limit = parseInt(limit as string);

    const result = await dataverseService.getCustomers(filter);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
});

// Get customer tickets history
router.get('/:id/tickets', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = req.params.id;

    // Check permissions
    if (req.user!.role === 'Customer' && req.user!.id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await dataverseService.getTickets({
      customerId,
      page: 1,
      limit: 100
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer tickets'
    });
  }
});

// Create new customer (Agent only)
router.post('/', requireAgent, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, phone, company, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const customerData = {
      name,
      email,
      phone,
      company,
      department
    };

    const customer = await dataverseService.createCustomer(customerData);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
});

export default router;