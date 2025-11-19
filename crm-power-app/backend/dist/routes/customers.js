"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataverseService_1 = __importDefault(require("../services/dataverseService"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const dataverseService = new dataverseService_1.default();
// Get all customers with filtering and pagination
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { company, page = '1', limit = '20' } = req.query;
        const filter = {};
        if (company)
            filter.company = company;
        filter.page = parseInt(page);
        filter.limit = parseInt(limit);
        const result = await dataverseService.getCustomers(filter);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customers'
        });
    }
});
// Get customer tickets history
router.get('/:id/tickets', auth_1.authenticateToken, async (req, res) => {
    try {
        const customerId = req.params.id;
        // Check permissions
        if (req.user.role === 'Customer' && req.user.id !== customerId) {
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
    }
    catch (error) {
        console.error('Error fetching customer tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer tickets'
        });
    }
});
// Create new customer (Agent only)
router.post('/', auth_1.requireAgent, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create customer'
        });
    }
});
exports.default = router;
