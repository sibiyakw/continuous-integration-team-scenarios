import express from 'express';
import AnalyticsService from '../services/analyticsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const analyticsService = new AnalyticsService();

// Get dashboard metrics
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const metrics = await analyticsService.getDashboardMetrics(timeRange as string);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
});

// Get agent performance data
router.get('/agents/performance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const performance = await analyticsService.getAgentPerformance(timeRange as string);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent performance data'
    });
  }
});

// Get customer analytics
router.get('/customers', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { customerId, timeRange = '30d' } = req.query;

    const customerAnalytics = await analyticsService.getCustomerAnalytics(customerId as string);

    res.json({
      success: true,
      data: customerAnalytics
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer analytics'
    });
  }
});

// Get ticket trends
router.get('/trends', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeRange = '90d' } = req.query;

    const trends = await analyticsService.getTicketTrends(timeRange as string);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching ticket trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket trends'
    });
  }
});

// Get ticket resolution report
router.get('/reports/resolution', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const report = await analyticsService.getTicketResolutionReport(timeRange as string);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating resolution report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate resolution report'
    });
  }
});

// Get customer satisfaction report
router.get('/reports/satisfaction', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const report = await analyticsService.getCustomerSatisfactionReport(timeRange as string);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating satisfaction report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate satisfaction report'
    });
  }
});

export default router;