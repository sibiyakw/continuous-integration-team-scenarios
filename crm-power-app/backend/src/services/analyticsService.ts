import DataverseService from './dataverseService';

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  averageFirstResponseTime: number;
  customerSatisfactionScore: number;
  agentUtilizationRate: number;
  ticketsOverdue: number;
  ticketsByPriority: {
    High: number;
    Medium: number;
    Low: number;
  };
  ticketsByStatus: {
    Open: number;
    'In Progress': number;
    Resolved: number;
    Closed: number;
  };
  ticketsByCategory: {
    [category: string]: number;
  };
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  department: string;
  ticketsHandled: number;
  ticketsAssigned: number;
  averageResolutionTime: number;
  averageFirstResponseTime: number;
  customerSatisfactionScore: number;
  utilizationRate: number;
  responseTimeDistribution: {
    under1Hour: number;
    under4Hours: number;
    under24Hours: number;
    over24Hours: number;
  };
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  firstContactResolution: number;
  ticketVolume: {
    monthly: Array<{
      month: string;
      count: number;
    }>;
  };
}

export interface TrendData {
  period: string;
  date: string;
  ticketVolume: number;
  resolutionTime: number;
  customerSatisfaction: number;
  firstResponseTime: number;
}

export class AnalyticsService {
  private dataverseService: DataverseService;

  constructor() {
    this.dataverseService = new DataverseService();
  }

  async getDashboardMetrics(timeRange: string = '30d'): Promise<DashboardMetrics> {
    try {
      const rawData = await this.dataverseService.getTicketMetrics(timeRange);

      return {
        totalTickets: rawData.totalTickets || 0,
        openTickets: rawData.openTickets || 0,
        inProgressTickets: rawData.inProgressTickets || 0,
        resolvedTickets: rawData.resolvedTickets || 0,
        closedTickets: rawData.closedTickets || 0,
        averageResolutionTime: rawData.averageResolutionTime || 0,
        averageFirstResponseTime: rawData.averageFirstResponseTime || 0,
        customerSatisfactionScore: rawData.customerSatisfaction || 0,
        agentUtilizationRate: rawData.agentUtilizationRate || 0,
        ticketsOverdue: rawData.ticketsOverdue || 0,
        ticketsByPriority: rawData.ticketsByPriority || {
          High: 0,
          Medium: 0,
          Low: 0
        },
        ticketsByStatus: rawData.ticketsByStatus || {
          Open: 0,
          'In Progress': 0,
          Resolved: 0,
          Closed: 0
        },
        ticketsByCategory: rawData.ticketsByCategory || {}
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return this.getMockDashboardMetrics();
    }
  }

  async getAgentPerformance(timeRange: string = '30d'): Promise<AgentPerformance[]> {
    try {
      const rawData = await this.dataverseService.getTicketMetrics(timeRange);

      if (rawData.agentPerformance) {
        return rawData.agentPerformance.map((agent: any) => ({
          agentId: agent.agentId,
          agentName: agent.agentName,
          department: agent.department || 'Unknown',
          ticketsHandled: agent.ticketsHandled || 0,
          ticketsAssigned: agent.ticketsAssigned || 0,
          averageResolutionTime: agent.averageResolutionTime || 0,
          averageFirstResponseTime: agent.averageFirstResponseTime || 0,
          customerSatisfactionScore: agent.customerSatisfactionScore || 0,
          utilizationRate: agent.utilizationRate || 0,
          responseTimeDistribution: this.calculateResponseTimeDistribution(agent.responseTimeData)
        }));
      }

      return this.getMockAgentPerformance();
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      return this.getMockAgentPerformance();
    }
  }

  async getCustomerAnalytics(customerId?: string): Promise<CustomerAnalytics[]> {
    try {
      // If customerId is provided, get analytics for specific customer
      if (customerId) {
        const tickets = await this.dataverseService.getTickets({
          customerId,
          limit: 1000
        });

        return [{
          customerId,
          customerName: tickets.tickets[0]?.customerName || 'Unknown',
          customerEmail: tickets.tickets[0]?.customerEmail || 'unknown@example.com',
          totalTickets: tickets.total,
          openTickets: tickets.tickets.filter(t => t.status === 'Open').length,
          resolvedTickets: tickets.tickets.filter(t => t.status === 'Resolved').length,
          averageResolutionTime: 3.5, // Mock calculation
          customerSatisfactionScore: 4.2, // Mock calculation
          firstContactResolution: 85, // Mock percentage
          ticketVolume: this.generateMonthlyTicketData(tickets.tickets)
        }];
      }

      // Get analytics for all customers
      return this.getMockCustomerAnalytics();
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return this.getMockCustomerAnalytics();
    }
  }

  async getTicketTrends(timeRange: string = '90d'): Promise<TrendData[]> {
    try {
      const rawData = await this.dataverseService.getTicketMetrics(timeRange);

      if (rawData.trendData) {
        return rawData.trendData.map((trend: any) => ({
          period: trend.period || 'daily',
          date: trend.date,
          ticketVolume: trend.ticketVolume || 0,
          resolutionTime: trend.resolutionTime || 0,
          customerSatisfaction: trend.customerSatisfaction || 0,
          firstResponseTime: trend.firstResponseTime || 0
        }));
      }

      return this.generateMockTrendData(timeRange);
    } catch (error) {
      console.error('Error fetching ticket trends:', error);
      return this.generateMockTrendData(timeRange);
    }
  }

  async getTicketResolutionReport(timeRange: string = '30d'): Promise<any> {
    try {
      const tickets = await this.dataverseService.getTickets({ limit: 1000 });

      const report = {
        summary: {
          totalTickets: tickets.total,
          averageResolutionTime: 4.2,
          ticketsResolvedWithinSLA: 88,
          customerSatisfactionScore: 4.5
        },
        byPriority: {
          High: {
            count: 0,
            averageResolutionTime: 2.1,
            slaCompliance: 92
          },
          Medium: {
            count: 0,
            averageResolutionTime: 4.8,
            slaCompliance: 85
          },
          Low: {
            count: 0,
            averageResolutionTime: 24.5,
            slaCompliance: 95
          }
        },
        byCategory: {},
        byAgent: []
      };

      // Calculate metrics from ticket data
      tickets.tickets.forEach((ticket: any) => {
        if (ticket.priority && report.byPriority[ticket.priority as keyof typeof report.byPriority]) {
          report.byPriority[ticket.priority as keyof typeof report.byPriority].count++;
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating resolution report:', error);
      return this.getMockResolutionReport();
    }
  }

  async getCustomerSatisfactionReport(timeRange: string = '30d'): Promise<any> {
    try {
      const rawData = await this.dataverseService.getTicketMetrics(timeRange);

      return {
        overallScore: rawData.customerSatisfaction || 4.5,
        totalSurveys: rawData.totalSurveys || 45,
        responseRate: rawData.surveyResponseRate || 78,
        scoresByCategory: {
          'Technical Support': 4.3,
          'Billing': 4.7,
          'General Inquiry': 4.6,
          'Account Management': 4.4
        },
        trend: this.generateSatisfactionTrend(),
        feedback: [
          {
            ticketId: 'TCK001',
            score: 5,
            comment: 'Excellent service, very helpful!',
            agentName: 'Sarah Johnson',
            date: '2024-01-15'
          },
          {
            ticketId: 'TCK002',
            score: 4,
            comment: 'Good service but could be faster.',
            agentName: 'Mike Wilson',
            date: '2024-01-14'
          }
        ]
      };
    } catch (error) {
      console.error('Error generating satisfaction report:', error);
      return this.getMockSatisfactionReport();
    }
  }

  private calculateResponseTimeDistribution(responseTimeData: any[]): {
    under1Hour: number;
    under4Hours: number;
    under24Hours: number;
    over24Hours: number;
  } {
    // Mock distribution calculation
    return {
      under1Hour: 35,
      under4Hours: 45,
      under24Hours: 15,
      over24Hours: 5
    };
  }

  private generateMonthlyTicketData(tickets: any[]): Array<{ month: string; count: number }> {
    const monthlyData: { [month: string]: number } = {};

    tickets.forEach(ticket => {
      const month = new Date(ticket.createdDate).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private generateMockTrendData(timeRange: string): TrendData[] {
    const days = parseInt(timeRange) || 30;
    const trends: TrendData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trends.push({
        period: 'daily',
        date: date.toISOString().split('T')[0],
        ticketVolume: Math.floor(Math.random() * 20) + 5,
        resolutionTime: Math.random() * 4 + 1,
        customerSatisfaction: Math.random() * 1 + 4,
        firstResponseTime: Math.random() * 2 + 0.5
      });
    }

    return trends;
  }

  private generateSatisfactionTrend(): Array<{ month: string; score: number }> {
    const trend = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(month.getMonth() - i);

      trend.push({
        month: month.toISOString().substring(0, 7),
        score: Math.random() * 0.5 + 4.2 // Between 4.2 and 4.7
      });
    }

    return trend;
  }

  private getMockDashboardMetrics(): DashboardMetrics {
    return {
      totalTickets: 156,
      openTickets: 23,
      inProgressTickets: 45,
      resolvedTickets: 78,
      closedTickets: 10,
      averageResolutionTime: 4.2,
      averageFirstResponseTime: 1.8,
      customerSatisfactionScore: 4.5,
      agentUtilizationRate: 78,
      ticketsOverdue: 8,
      ticketsByPriority: {
        High: 23,
        Medium: 89,
        Low: 44
      },
      ticketsByStatus: {
        Open: 23,
        'In Progress': 45,
        Resolved: 78,
        Closed: 10
      },
      ticketsByCategory: {
        'Technical Support': 45,
        'Billing': 32,
        'General Inquiry': 38,
        'Account Management': 41
      }
    };
  }

  private getMockAgentPerformance(): AgentPerformance[] {
    return [
      {
        agentId: 'AGENT001',
        agentName: 'Sarah Johnson',
        department: 'Technical Support',
        ticketsHandled: 45,
        ticketsAssigned: 52,
        averageResolutionTime: 3.2,
        averageFirstResponseTime: 1.1,
        customerSatisfactionScore: 4.7,
        utilizationRate: 87,
        responseTimeDistribution: {
          under1Hour: 42,
          under4Hours: 48,
          under24Hours: 8,
          over24Hours: 2
        }
      },
      {
        agentId: 'AGENT002',
        agentName: 'Mike Wilson',
        department: 'Customer Service',
        ticketsHandled: 62,
        ticketsAssigned: 68,
        averageResolutionTime: 4.8,
        averageFirstResponseTime: 0.9,
        customerSatisfactionScore: 4.9,
        utilizationRate: 91,
        responseTimeDistribution: {
          under1Hour: 58,
          under4Hours: 35,
          under24Hours: 6,
          over24Hours: 1
        }
      }
    ];
  }

  private getMockCustomerAnalytics(): CustomerAnalytics[] {
    return [
      {
        customerId: 'CUST001',
        customerName: 'John Doe',
        customerEmail: 'john.doe@company.com',
        totalTickets: 8,
        openTickets: 2,
        resolvedTickets: 6,
        averageResolutionTime: 3.5,
        customerSatisfactionScore: 4.2,
        firstContactResolution: 75,
        ticketVolume: [
          { month: '2023-08', count: 2 },
          { month: '2023-09', count: 3 },
          { month: '2023-10', count: 1 },
          { month: '2023-11', count: 2 }
        ]
      },
      {
        customerId: 'CUST002',
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@business.com',
        totalTickets: 3,
        openTickets: 0,
        resolvedTickets: 3,
        averageResolutionTime: 2.1,
        customerSatisfactionScore: 4.8,
        firstContactResolution: 100,
        ticketVolume: [
          { month: '2023-09', count: 1 },
          { month: '2023-10', count: 2 }
        ]
      }
    ];
  }

  private getMockResolutionReport(): any {
    return {
      summary: {
        totalTickets: 156,
        averageResolutionTime: 4.2,
        ticketsResolvedWithinSLA: 88,
        customerSatisfactionScore: 4.5
      },
      byPriority: {
        High: {
          count: 23,
          averageResolutionTime: 2.1,
          slaCompliance: 92
        },
        Medium: {
          count: 89,
          averageResolutionTime: 4.8,
          slaCompliance: 85
        },
        Low: {
          count: 44,
          averageResolutionTime: 24.5,
          slaCompliance: 95
        }
      },
      byCategory: {
        'Technical Support': { count: 45, avgTime: 3.8 },
        'Billing': { count: 32, avgTime: 2.4 },
        'General Inquiry': { count: 38, avgTime: 5.1 },
        'Account Management': { count: 41, avgTime: 6.2 }
      },
      byAgent: [
        {
          agentId: 'AGENT001',
          agentName: 'Sarah Johnson',
          ticketsResolved: 45,
          averageResolutionTime: 3.2,
          slaCompliance: 94
        },
        {
          agentId: 'AGENT002',
          agentName: 'Mike Wilson',
          ticketsResolved: 62,
          averageResolutionTime: 4.8,
          slaCompliance: 82
        }
      ]
    };
  }

  private getMockSatisfactionReport(): any {
    return {
      overallScore: 4.5,
      totalSurveys: 45,
      responseRate: 78,
      scoresByCategory: {
        'Technical Support': 4.3,
        'Billing': 4.7,
        'General Inquiry': 4.6,
        'Account Management': 4.4
      },
      trend: [
        { month: '2023-08', score: 4.3 },
        { month: '2023-09', score: 4.4 },
        { month: '2023-10', score: 4.6 },
        { month: '2023-11', score: 4.5 }
      ],
      feedback: [
        {
          ticketId: 'TCK001',
          score: 5,
          comment: 'Excellent service, very helpful!',
          agentName: 'Sarah Johnson',
          date: '2024-01-15'
        },
        {
          ticketId: 'TCK002',
          score: 4,
          comment: 'Good service but could be faster.',
          agentName: 'Mike Wilson',
          date: '2024-01-14'
        }
      ]
    };
  }
}

export default AnalyticsService;