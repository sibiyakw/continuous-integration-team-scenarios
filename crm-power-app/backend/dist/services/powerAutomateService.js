"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerPowerAutomateFlow = exports.powerAutomateService = exports.PowerAutomateService = void 0;
const axios_1 = __importDefault(require("axios"));
class PowerAutomateService {
    constructor() {
        this.webhookUrl = null;
        this.webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL || null;
        if (this.webhookUrl) {
            this.client = axios_1.default.create({
                baseURL: this.webhookUrl,
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        else {
            console.warn('Power Automate webhook URL not configured. Email notifications will be logged only.');
            this.client = axios_1.default.create({
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            console.error('Power Automate API Error:', error.response?.data || error.message);
            // Don't throw errors for notification failures to avoid disrupting main flow
            return Promise.resolve({ status: 200, data: { success: false, mocked: true } });
        });
    }
    async triggerFlow(eventType, data) {
        try {
            const payload = {
                eventType,
                data
            };
            if (this.webhookUrl) {
                await this.client.post('', payload);
                console.log(`✅ Power Automate flow triggered for ${eventType}`);
            }
            else {
                // Log the trigger if no webhook is configured
                console.log(`📧 Mock Power Automate trigger for ${eventType}:`, JSON.stringify(payload, null, 2));
            }
        }
        catch (error) {
            console.error(`❌ Failed to trigger Power Automate flow for ${eventType}:`, error);
            // Don't rethrow to avoid disrupting main application flow
        }
    }
    async sendEmailNotification(notification) {
        try {
            const payload = {
                action: 'send-email',
                ...notification
            };
            if (this.webhookUrl) {
                await this.client.post('', payload);
                console.log(`✅ Email notification sent to: ${notification.to.join(', ')}`);
            }
            else {
                // Log the email notification if no webhook is configured
                console.log(`📧 Mock email notification:`, {
                    to: notification.to,
                    subject: notification.subject,
                    bodyLength: notification.body.length
                });
            }
        }
        catch (error) {
            console.error('❌ Failed to send email notification:', error);
        }
    }
    async processInboundEmail(emailData) {
        try {
            const { from, subject, body, attachments, messageId, timestamp } = emailData;
            // Extract ticket information from email
            const ticketInfo = this.extractTicketFromEmail(subject, body);
            // Create a new ticket from the email
            const ticketData = {
                title: ticketInfo.title || `Email: ${subject}`,
                description: ticketInfo.description || body,
                priority: ticketInfo.priority || this.determinePriorityFromEmail(subject, body),
                category: ticketInfo.category || 'Email',
                customerId: `EMAIL_${from.email}`,
                customerEmail: from.email,
                customerName: from.name || from.email,
                attachments: attachments || [],
                source: 'email',
                messageId
            };
            // Trigger the new-ticket flow
            await this.triggerFlow('new-ticket', ticketData);
            return {
                success: true,
                ticketId: ticketData.id,
                message: 'Email processed and ticket created'
            };
        }
        catch (error) {
            console.error('❌ Failed to process inbound email:', error);
            return {
                success: false,
                error: 'Failed to process email'
            };
        }
    }
    async sendTicketAssignmentNotification(agentEmail, ticketId, ticketTitle, customerName) {
        const subject = `New Ticket Assignment: ${ticketTitle}`;
        const body = `
You have been assigned a new ticket:

Ticket ID: ${ticketId}
Title: ${ticketTitle}
Customer: ${customerName}

Please log in to the CRM system to view and manage this ticket.
    `.trim();
        await this.sendEmailNotification({
            to: [agentEmail],
            subject,
            body
        });
    }
    async sendTicketStatusChangeNotification(customerEmail, ticketId, ticketTitle, newStatus) {
        const subject = `Ticket Status Update: ${ticketTitle}`;
        const body = `
Your ticket status has been updated:

Ticket ID: ${ticketId}
Title: ${ticketTitle}
New Status: ${newStatus}

Thank you for your patience.
    `.trim();
        await this.sendEmailNotification({
            to: [customerEmail],
            subject,
            body
        });
    }
    async sendEscalationNotification(ticketId, ticketTitle, priority, customerName, assignedAgent) {
        const subject = `🚨 URGENT: High Priority Ticket Escalation - ${ticketTitle}`;
        const body = `
A high priority ticket requires immediate attention:

Ticket ID: ${ticketId}
Title: ${ticketTitle}
Priority: ${priority}
Customer: ${customerName}
Assigned Agent: ${assignedAgent || 'Unassigned'}

Please review this ticket immediately.
    `.trim();
        // Send to management team
        const managementEmails = process.env.MANAGEMENT_EMAILS?.split(',') || [];
        await this.sendEmailNotification({
            to: managementEmails,
            subject,
            body
        });
    }
    async sendCustomerSatisfactionSurvey(customerEmail, ticketId, ticketTitle) {
        const subject = `How did we do? - Ticket ${ticketId}`;
        const body = `
Thank you for contacting our support team. Your ticket "${ticketTitle}" has been resolved.

We would appreciate your feedback on your experience. Please take a moment to rate our service:

📝 [Customer Satisfaction Survey Link]

Your feedback helps us improve our service.

Thank you,
The Support Team
    `.trim();
        await this.sendEmailNotification({
            to: [customerEmail],
            subject,
            body
        });
    }
    extractTicketFromEmail(subject, body) {
        // Simple extraction logic - in a real implementation, this would be more sophisticated
        const titleMatch = subject.match(/^Subject:\s*(.+)$/m) || subject.match(/^(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : subject;
        const priorityMatch = body.match(/priority:\s*(high|medium|low)/i) ||
            subject.match(/\[(urgent|high|medium|low)\]/i);
        let priority = 'Medium';
        if (priorityMatch) {
            const p = priorityMatch[1].toLowerCase();
            if (p === 'urgent' || p === 'high')
                priority = 'High';
            else if (p === 'low')
                priority = 'Low';
        }
        const categoryMatch = body.match(/category:\s*(.+)/i) ||
            subject.match(/\[(.+?)\]/);
        const category = categoryMatch ? categoryMatch[1].trim() : 'General';
        return {
            title,
            description: body,
            priority,
            category
        };
    }
    determinePriorityFromEmail(subject, body) {
        const text = (subject + ' ' + body).toLowerCase();
        // Urgent keywords
        if (text.includes('urgent') || text.includes('emergency') || text.includes('critical') ||
            text.includes('asap') || text.includes('immediately')) {
            return 'High';
        }
        // Low priority keywords
        if (text.includes('question') || text.includes('inquiry') || text.includes('information') ||
            text.includes('when you have time')) {
            return 'Low';
        }
        return 'Medium';
    }
    async createTeamsNotification(ticketId, ticketTitle, priority, assignedAgent) {
        const payload = {
            action: 'send-teams-notification',
            ticketId,
            ticketTitle,
            priority,
            assignedAgent
        };
        try {
            if (this.webhookUrl) {
                await this.client.post('', payload);
                console.log(`✅ Teams notification sent for ticket ${ticketId}`);
            }
            else {
                console.log(`📧 Mock Teams notification for ticket ${ticketId}`);
            }
        }
        catch (error) {
            console.error('❌ Failed to send Teams notification:', error);
        }
    }
}
exports.PowerAutomateService = PowerAutomateService;
// Export a singleton instance and the trigger function for easy importing
exports.powerAutomateService = new PowerAutomateService();
const triggerPowerAutomateFlow = (eventType, data) => {
    return exports.powerAutomateService.triggerFlow(eventType, data);
};
exports.triggerPowerAutomateFlow = triggerPowerAutomateFlow;
exports.default = PowerAutomateService;
