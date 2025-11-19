import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('crm-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse(response: Response) {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const token = localStorage.getItem('crm-token');
        if (token) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
            });

            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              localStorage.setItem('crm-token', refreshData.data.token);
              // Retry the original request with new token
              return this.retryRequest(response, refreshData.data.token);
            } else {
              // Refresh failed, logout
              localStorage.removeItem('crm-token');
              localStorage.removeItem('crm-user');
              window.location.href = '/login';
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            localStorage.removeItem('crm-token');
            localStorage.removeItem('crm-user');
            window.location.href = '/login';
          }
        }
      }
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  private async retryRequest(originalResponse: Response, newToken: string) {
    const url = originalResponse.url;
    const options: RequestInit = {
      method: originalResponse.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`,
      },
    };

    return fetch(url, options).then(response => this.handleResponse(response));
  }

  // Auth endpoints
  async getAuthUrl() {
    const response = await fetch(`${API_BASE_URL}/api/auth/microsoft/url`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async handleAuthCallback(code: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/microsoft/callback`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Ticket endpoints
  async getTickets(params?: {
    status?: string;
    priority?: string;
    customerId?: string;
    assignedAgentId?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await fetch(`${API_BASE_URL}/api/tickets?${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTicketById(ticketId: string) {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createTicket(ticketData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('crm-token')}`,
      },
      body: ticketData,
    });
    return this.handleResponse(response);
  }

  async updateTicket(ticketId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async assignAgentToTicket(ticketId: string, agentId: string) {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ agentId }),
    });
    return this.handleResponse(response);
  }

  async bulkUpdateTickets(ticketIds: string[], updates: any) {
    const response = await fetch(`${API_BASE_URL}/api/tickets/bulk-update`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ticketIds, updates }),
    });
    return this.handleResponse(response);
  }

  async deleteTicket(ticketId: string) {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Customer endpoints
  async getCustomers(params?: {
    company?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await fetch(`${API_BASE_URL}/api/customers?${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCustomerTickets(customerId: string) {
    const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/tickets`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createCustomer(customerData: any) {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(customerData),
    });
    return this.handleResponse(response);
  }

  // Agent endpoints
  async getAgents(params?: {
    department?: string;
    isActive?: boolean;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await fetch(`${API_BASE_URL}/api/agents?${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAgentTickets() {
    const response = await fetch(`${API_BASE_URL}/api/agents/me/tickets`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Analytics endpoints
  async getDashboardMetrics(timeRange?: string) {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAgentPerformance(timeRange?: string) {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/agents/performance${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCustomerAnalytics(customerId?: string) {
    const queryString = customerId ? `?customerId=${customerId}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/customers${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTicketTrends(timeRange?: string) {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/trends${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getResolutionReport(timeRange?: string) {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/reports/resolution${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getSatisfactionReport(timeRange?: string) {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics/reports/satisfaction${queryString}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // File upload endpoint
  async uploadFile(file: File, ticketId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId) {
      formData.append('ticketId', ticketId);
    }

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('crm-token')}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
export default apiService;