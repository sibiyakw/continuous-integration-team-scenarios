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
// Get all agents with filtering
router.get('/', auth_1.requireAgent, async (req, res) => {
    try {
        const { department, isActive } = req.query;
        const filter = {};
        if (department)
            filter.department = department;
        if (isActive !== undefined)
            filter.isActive = isActive === 'true';
        const agents = await dataverseService.getAgents(filter);
        res.json({
            success: true,
            data: agents
        });
    }
    catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch agents'
        });
    }
});
// Get current agent's assigned tickets
router.get('/me/tickets', auth_1.requireAgent, async (req, res) => {
    try {
        const result = await dataverseService.getTickets({
            assignedAgentId: req.user.id,
            page: 1,
            limit: 50
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching agent tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assigned tickets'
        });
    }
});
exports.default = router;
