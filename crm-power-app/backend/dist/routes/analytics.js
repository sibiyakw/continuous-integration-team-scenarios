"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsService_1 = __importDefault(require("../services/analyticsService"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const analyticsService = new analyticsService_1.default();
// Get dashboard metrics
router.get('/dashboard', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        const metrics = await analyticsService.getDashboardMetrics(timeRange);
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard metrics'
        });
    }
});
// Get agent performance data
router.get('/agents/performance', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        const performance = await analyticsService.getAgentPerformance(timeRange);
        res.json({
            success: true,
            data: performance
        });
    }
    catch (error) {
        console.error('Error fetching agent performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch agent performance data'
        });
    }
});
// Get customer analytics
router.get('/customers', auth_1.authenticateToken, async (req, res) => {
    try {
        const { customerId, timeRange = '30d' } = req.query;
        const customerAnalytics = await analyticsService.getCustomerAnalytics(customerId);
        res.json({
            success: true,
            data: customerAnalytics
        });
    }
    catch (error) {
        console.error('Error fetching customer analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer analytics'
        });
    }
});
// Get ticket trends
router.get('/trends', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '90d' } = req.query;
        const trends = await analyticsService.getTicketTrends(timeRange);
        res.json({
            success: true,
            data: trends
        });
    }
    catch (error) {
        console.error('Error fetching ticket trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticket trends'
        });
    }
});
// Get ticket resolution report
router.get('/reports/resolution', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        const report = await analyticsService.getTicketResolutionReport(timeRange);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating resolution report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate resolution report'
        });
    }
});
// Get customer satisfaction report
router.get('/reports/satisfaction', auth_1.authenticateToken, async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        const report = await analyticsService.getCustomerSatisfactionReport(timeRange);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating satisfaction report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate satisfaction report'
        });
    }
});
exports.default = router;
