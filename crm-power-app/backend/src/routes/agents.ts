import express from 'express';
import DataverseService from '../services/dataverseService';
import { authenticateToken, requireAgent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const dataverseService = new DataverseService();

// Get all agents with filtering
router.get('/', requireAgent, async (req: AuthenticatedRequest, res) => {
  try {
    const { department, isActive } = req.query;

    const filter: any = {};
    if (department) filter.department = department as string;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const agents = await dataverseService.getAgents(filter);

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

// Get current agent's assigned tickets
router.get('/me/tickets', requireAgent, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await dataverseService.getTickets({
      assignedAgentId: req.user!.id,
      page: 1,
      limit: 50
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching agent tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned tickets'
    });
  }
});

export default router;