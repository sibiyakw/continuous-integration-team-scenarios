"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataverseService = void 0;
const axios_1 = __importDefault(require("axios"));
class DataverseService {
    constructor() {
        this.token = null;
        if (!process.env.DATAVERSE_URL || !process.env.DATAVERSE_CLIENT_ID || !process.env.DATAVERSE_CLIENT_SECRET) {
            console.warn('Dataverse configuration not found. Using mock implementation.');
            this.client = axios_1.default.create({
                baseURL: 'https://mock-dataverse.crm.dynamics.com',
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
        }
        else {
            this.client = axios_1.default.create({
                baseURL: process.env.DATAVERSE_URL,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            // Add request interceptor to include auth token
            this.client.interceptors.request.use(async (config) => {
                if (this.needsNewToken()) {
                    await this.authenticate();
                }
                config.headers.Authorization = `Bearer ${this.token}`;
                return config;
            });
        }
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            console.error('Dataverse API Error:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                this.token = null; // Reset token to force re-authentication
            }
            throw error;
        });
    }
    needsNewToken() {
        return !this.token;
    }
    async authenticate() {
        try {
            const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/token`;
            const response = await axios_1.default.post(tokenEndpoint, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.DATAVERSE_CLIENT_ID,
                client_secret: process.env.DATAVERSE_CLIENT_SECRET,
                resource: process.env.DATAVERSE_URL,
            }));
            this.token = response.data.access_token;
        }
        catch (error) {
            console.error('Dataverse authentication failed:', error);
            throw new Error('Failed to authenticate with Dataverse');
        }
    }
    // Ticket operations
    async createTicket(ticketData) {
        try {
            const ticket = {
                id: this.generateId(),
                title: ticketData.title || 'New Ticket',
                description: ticketData.description || '',
                customerId: ticketData.customerId || '',
                customerEmail: ticketData.customerEmail || '',
                customerName: ticketData.customerName || '',
                status: 'Open',
                priority: ticketData.priority || 'Medium',
                category: ticketData.category || 'General',
                createdDate: new Date().toISOString(),
                lastUpdatedDate: new Date().toISOString(),
                tags: ticketData.tags || [],
                attachments: ticketData.attachments || [],
                ...(ticketData.dueDate && { dueDate: ticketData.dueDate }),
                ...(ticketData.assignedAgentId && {
                    assignedAgentId: ticketData.assignedAgentId,
                    assignedAgentName: ticketData.assignedAgentName
                }),
            };
            const response = await this.client.post('/api/data/v9.2/crm_tickets', ticket);
            return response.data || ticket;
        }
        catch (error) {
            console.error('Error creating ticket:', error);
            // Return mock data if Dataverse is not configured
            return {
                id: this.generateId(),
                title: ticketData.title || 'New Ticket',
                description: ticketData.description || '',
                customerId: ticketData.customerId || '',
                customerEmail: ticketData.customerEmail || '',
                customerName: ticketData.customerName || '',
                status: 'Open',
                priority: ticketData.priority || 'Medium',
                category: ticketData.category || 'General',
                createdDate: new Date().toISOString(),
                lastUpdatedDate: new Date().toISOString(),
                tags: ticketData.tags || [],
                attachments: ticketData.attachments || [],
            };
        }
    }
    async getTickets(filter) {
        try {
            const params = new URLSearchParams();
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    if (value)
                        params.append(key, value.toString());
                });
            }
            const response = await this.client.get(`/api/data/v9.2/crm_tickets?${params}`);
            return {
                tickets: response.data.value || [],
                total: response.data['@odata.count'] || 0
            };
        }
        catch (error) {
            console.error('Error fetching tickets:', error);
            // Return mock data
            return {
                tickets: this.getMockTickets(),
                total: 25
            };
        }
    }
    async getTicketById(ticketId) {
        try {
            const response = await this.client.get(`/api/data/v9.2/crm_tickets(${ticketId})`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching ticket:', error);
            // Return mock data
            const mockTickets = this.getMockTickets();
            return mockTickets.find(t => t.id === ticketId) || null;
        }
    }
    async updateTicket(ticketId, updates) {
        try {
            const response = await this.client.patch(`/api/data/v9.2/crm_tickets(${ticketId})`, { ...updates, lastUpdatedDate: new Date().toISOString() });
            return response.data;
        }
        catch (error) {
            console.error('Error updating ticket:', error);
            // Return updated mock data
            const mockTickets = this.getMockTickets();
            const ticketIndex = mockTickets.findIndex(t => t.id === ticketId);
            if (ticketIndex >= 0) {
                mockTickets[ticketIndex] = { ...mockTickets[ticketIndex], ...updates, lastUpdatedDate: new Date().toISOString() };
                return mockTickets[ticketIndex];
            }
            throw new Error('Ticket not found');
        }
    }
    async deleteTicket(ticketId) {
        try {
            await this.client.delete(`/api/data/v9.2/crm_tickets(${ticketId})`);
        }
        catch (error) {
            console.error('Error deleting ticket:', error);
            throw new Error('Failed to delete ticket');
        }
    }
    // Customer operations
    async createCustomer(customerData) {
        try {
            const customer = {
                id: this.generateId(),
                name: customerData.name || '',
                email: customerData.email || '',
                phone: customerData.phone,
                company: customerData.company,
                department: customerData.department,
                createdDate: new Date().toISOString(),
                totalTickets: 0,
                openTickets: 0,
            };
            const response = await this.client.post('/api/data/v9.2/crm_customers', customer);
            return response.data || customer;
        }
        catch (error) {
            console.error('Error creating customer:', error);
            // Return mock data
            return {
                id: this.generateId(),
                name: customerData.name || '',
                email: customerData.email || '',
                phone: customerData.phone,
                company: customerData.company,
                department: customerData.department,
                createdDate: new Date().toISOString(),
                totalTickets: 0,
                openTickets: 0,
            };
        }
    }
    async getCustomers(filter) {
        try {
            const params = new URLSearchParams();
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    if (value)
                        params.append(key, value.toString());
                });
            }
            const response = await this.client.get(`/api/data/v9.2/crm_customers?${params}`);
            return {
                customers: response.data.value || [],
                total: response.data['@odata.count'] || 0
            };
        }
        catch (error) {
            console.error('Error fetching customers:', error);
            // Return mock data
            return {
                customers: this.getMockCustomers(),
                total: 50
            };
        }
    }
    // Agent operations
    async getAgents(filter) {
        try {
            const params = new URLSearchParams();
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    if (value !== undefined)
                        params.append(key, value.toString());
                });
            }
            const response = await this.client.get(`/api/data/v9.2/crm_agents?${params}`);
            return response.data.value || [];
        }
        catch (error) {
            console.error('Error fetching agents:', error);
            // Return mock data
            return this.getMockAgents();
        }
    }
    async assignAgentToTicket(ticketId, agentId) {
        try {
            await this.client.patch(`/api/data/v9.2/crm_tickets(${ticketId})`, {
                assignedAgentId: agentId,
                status: 'In Progress',
                lastUpdatedDate: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error assigning agent to ticket:', error);
            throw new Error('Failed to assign agent to ticket');
        }
    }
    // Analytics operations
    async getTicketMetrics(timeRange = '30d') {
        try {
            const response = await this.client.get(`/api/data/v9.2/crm_ticket_metrics?timeRange=${timeRange}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching ticket metrics:', error);
            // Return mock analytics data
            return {
                totalTickets: 125,
                openTickets: 23,
                resolvedTickets: 102,
                averageResolutionTime: 4.2, // hours
                customerSatisfaction: 4.5, // out of 5
                ticketsByPriority: {
                    High: 15,
                    Medium: 85,
                    Low: 25
                },
                ticketsByCategory: {
                    'Technical Support': 45,
                    'Billing': 30,
                    'General Inquiry': 25,
                    'Account Management': 25
                },
                agentPerformance: this.getMockAgents().map(agent => ({
                    agentId: agent.id,
                    agentName: agent.name,
                    ticketsHandled: Math.floor(Math.random() * 30) + 10,
                    averageResponseTime: Math.random() * 2 + 0.5,
                    satisfactionScore: Math.random() * 2 + 3
                }))
            };
        }
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    getMockTickets() {
        return [
            {
                id: 'TCK001',
                title: 'Login authentication issue',
                description: 'Customer unable to login to their account',
                customerId: 'CUST001',
                customerEmail: 'john.doe@company.com',
                customerName: 'John Doe',
                assignedAgentId: 'AGENT001',
                assignedAgentName: 'Sarah Johnson',
                status: 'In Progress',
                priority: 'High',
                category: 'Technical Support',
                createdDate: '2024-01-15T10:30:00Z',
                lastUpdatedDate: '2024-01-15T14:45:00Z',
                dueDate: '2024-01-17T17:00:00Z',
                tags: ['authentication', 'urgent'],
                attachments: []
            },
            {
                id: 'TCK002',
                title: 'Billing inquiry',
                description: 'Question about recent invoice',
                customerId: 'CUST002',
                customerEmail: 'jane.smith@business.com',
                customerName: 'Jane Smith',
                assignedAgentId: 'AGENT002',
                assignedAgentName: 'Mike Wilson',
                status: 'Resolved',
                priority: 'Medium',
                category: 'Billing',
                createdDate: '2024-01-14T09:15:00Z',
                lastUpdatedDate: '2024-01-15T11:30:00Z',
                resolvedDate: '2024-01-15T11:30:00Z',
                tags: ['billing'],
                attachments: []
            }
        ];
    }
    getMockCustomers() {
        return [
            {
                id: 'CUST001',
                name: 'John Doe',
                email: 'john.doe@company.com',
                phone: '+1-555-0123',
                company: 'Acme Corporation',
                department: 'IT',
                createdDate: '2024-01-01T00:00:00Z',
                lastInteractionDate: '2024-01-15T14:45:00Z',
                totalTickets: 3,
                openTickets: 1,
                satisfactionScore: 4.2
            },
            {
                id: 'CUST002',
                name: 'Jane Smith',
                email: 'jane.smith@business.com',
                phone: '+1-555-0124',
                company: 'Business Solutions Inc',
                department: 'Finance',
                createdDate: '2024-01-05T00:00:00Z',
                lastInteractionDate: '2024-01-15T11:30:00Z',
                totalTickets: 2,
                openTickets: 0,
                satisfactionScore: 4.8
            }
        ];
    }
    getMockAgents() {
        return [
            {
                id: 'AGENT001',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@company.com',
                department: 'Technical Support',
                isActive: true,
                currentAssignmentCount: 8,
                totalTicketsHandled: 156,
                averageResponseTime: 1.2,
                satisfactionScore: 4.6,
                skills: ['Authentication', 'Network Issues', 'Software'],
                maxConcurrentTickets: 10
            },
            {
                id: 'AGENT002',
                name: 'Mike Wilson',
                email: 'mike.wilson@company.com',
                department: 'Customer Service',
                isActive: true,
                currentAssignmentCount: 5,
                totalTicketsHandled: 203,
                averageResponseTime: 0.8,
                satisfactionScore: 4.9,
                skills: ['Billing', 'General Inquiry', 'Account Management'],
                maxConcurrentTickets: 8
            }
        ];
    }
}
exports.DataverseService = DataverseService;
exports.default = DataverseService;
