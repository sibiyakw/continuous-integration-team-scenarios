"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const dataverseService_1 = __importDefault(require("../services/dataverseService"));
const auth_1 = require("../middleware/auth");
const powerAutomateService_1 = require("../services/powerAutomateService");
const router = express_1.default.Router();
const dataverseService = new dataverseService_1.default();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
// Get all tickets with filtering and pagination
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { status, priority, customerId, assignedAgentId, page = '1', limit = '20' } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (customerId)
            filter.customerId = customerId;
        if (assignedAgentId)
            filter.assignedAgentId = assignedAgentId;
        filter.page = parseInt(page);
        filter.limit = parseInt(limit);
        // If customer role, only show their tickets
        if (req.user.role === 'Customer') {
            filter.customerId = req.user.id;
        }
        const result = await dataverseService.getTickets(filter);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tickets'
        });
    }
});
// Get a specific ticket by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await dataverseService.getTicketById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        // Check permissions
        if (req.user.role === 'Customer' && ticket.customerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        res.json({
            success: true,
            data: ticket
        });
    }
    catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticket'
        });
    }
});
// Create a new ticket
router.post('/', auth_1.authenticateToken, upload.array('attachments', 5), async (req, res) => {
    try {
        const { title, description, priority, category, dueDate } = req.body;
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }
        // Prepare attachments array
        const attachments = req.files ? req.files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            sharePointUrl: `/uploads/${file.filename}`,
            uploadedDate: new Date().toISOString(),
            uploadedBy: req.user.displayName
        })) : [];
        const ticketData = {
            title,
            description,
            priority: priority || 'Medium',
            category: category || 'General',
            dueDate: dueDate || null,
            attachments,
            customerId: req.user.role === 'Customer' ? req.user.id : req.body.customerId,
            customerEmail: req.user.email,
            customerName: req.user.displayName
        };
        const ticket = await dataverseService.createTicket(ticketData);
        // Trigger Power Automate flow for new ticket notification
        try {
            await (0, powerAutomateService_1.triggerPowerAutomateFlow)('new-ticket', {
                ticketId: ticket.id,
                title: ticket.title,
                priority: ticket.priority,
                customerEmail: ticket.customerEmail,
                customerName: ticket.customerName
            });
        }
        catch (automationError) {
            console.warn('Failed to trigger Power Automate flow:', automationError);
            // Don't fail the request if automation fails
        }
        res.status(201).json({
            success: true,
            data: ticket
        });
    }
    catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create ticket'
        });
    }
});
// Update a ticket
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const updates = req.body;
        // Get the current ticket to check permissions
        const currentTicket = await dataverseService.getTicketById(ticketId);
        if (!currentTicket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        // Check permissions
        if (req.user.role === 'Customer' && currentTicket.customerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        // Customers can only update certain fields
        if (req.user.role === 'Customer') {
            const allowedUpdates = ['description'];
            const actualUpdates = Object.keys(updates);
            const hasInvalidUpdates = actualUpdates.some(key => !allowedUpdates.includes(key));
            if (hasInvalidUpdates) {
                return res.status(403).json({
                    success: false,
                    error: 'Customers can only update ticket description'
                });
            }
        }
        // Add resolution date if status is being changed to Resolved
        if (updates.status === 'Resolved' && currentTicket.status !== 'Resolved') {
            updates.resolvedDate = new Date().toISOString();
        }
        const updatedTicket = await dataverseService.updateTicket(ticketId, updates);
        // Trigger Power Automate flow for status changes
        if (updates.status && updates.status !== currentTicket.status) {
            try {
                await (0, powerAutomateService_1.triggerPowerAutomateFlow)('ticket-status-changed', {
                    ticketId: updatedTicket.id,
                    oldStatus: currentTicket.status,
                    newStatus: updatedTicket.status,
                    assignedAgentId: updatedTicket.assignedAgentId,
                    customerEmail: updatedTicket.customerEmail
                });
            }
            catch (automationError) {
                console.warn('Failed to trigger Power Automate flow:', automationError);
            }
        }
        res.json({
            success: true,
            data: updatedTicket
        });
    }
    catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update ticket'
        });
    }
});
// Assign agent to ticket (Agent only)
router.post('/:id/assign', auth_1.requireAgent, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { agentId } = req.body;
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }
        await dataverseService.assignAgentToTicket(ticketId, agentId);
        const updatedTicket = await dataverseService.getTicketById(ticketId);
        res.json({
            success: true,
            data: updatedTicket
        });
    }
    catch (error) {
        console.error('Error assigning agent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign agent to ticket'
        });
    }
});
// Bulk update tickets (Agent only)
router.post('/bulk-update', auth_1.requireAgent, async (req, res) => {
    try {
        const { ticketIds, updates } = req.body;
        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Ticket IDs array is required'
            });
        }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Updates object is required'
            });
        }
        const updatedTickets = [];
        for (const ticketId of ticketIds) {
            try {
                const ticket = await dataverseService.updateTicket(ticketId, updates);
                updatedTickets.push(ticket);
            }
            catch (error) {
                console.error(`Failed to update ticket ${ticketId}:`, error);
            }
        }
        res.json({
            success: true,
            data: {
                updatedCount: updatedTickets.length,
                tickets: updatedTickets
            }
        });
    }
    catch (error) {
        console.error('Error bulk updating tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk update tickets'
        });
    }
});
// Delete a ticket (Admin only)
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;
        // Only admins can delete tickets
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'Only administrators can delete tickets'
            });
        }
        await dataverseService.deleteTicket(ticketId);
        res.json({
            success: true,
            message: 'Ticket deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete ticket'
        });
    }
});
// Get ticket metrics and analytics
router.get('/metrics/analytics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        // Customers can only see their own metrics
        let metrics;
        if (req.user.role === 'Customer') {
            const customerTickets = await dataverseService.getTickets({
                customerId: req.user.id,
                limit: 1000
            });
            metrics = {
                totalTickets: customerTickets.total,
                openTickets: customerTickets.tickets.filter(t => t.status === 'Open').length,
                resolvedTickets: customerTickets.tickets.filter(t => t.status === 'Resolved').length,
                averageResolutionTime: 4.2, // Mock calculation
            };
        }
        else {
            metrics = await dataverseService.getTicketMetrics(timeRange);
        }
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching ticket metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticket metrics'
        });
    }
});
exports.default = router;
