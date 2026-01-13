const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

async function fetchAPI(endpoint: string, options: RequestOptions = {}) {
    const { token, ...customConfig } = options;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customConfig.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        // Check local storage for token if not provided
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('crm_user');
            if (stored) {
                try {
                    const { token: storedToken } = JSON.parse(stored);
                    if (storedToken) {
                        headers['Authorization'] = `Bearer ${storedToken}`;
                    }
                } catch (e) {
                    // Ignore error
                }
            }
        }
    }

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            // Optional: Redirect to login or clear storage
            // localStorage.removeItem('crm_user');
            // window.location.href = '/login';
        }

        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            return Promise.reject(data);
        }
    } catch (error) {
        return Promise.reject(error);
    }
}

export const api = {
    // Auth
    login: (credentials: any) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    register: (userData: any) => fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    getMe: () => fetchAPI('/auth/me', { method: 'GET' }),

    // Users
    getUsers: (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        return fetchAPI(`/users?${query}`, { method: 'GET' });
    },
    getUser: (id: string) => fetchAPI(`/users/${id}`, { method: 'GET' }),
    updateUser: (id: string, data: any) => fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteUser: (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
    getAvailableEmployees: () => fetchAPI('/users/available-employees', { method: 'GET' }),

    // Teams
    getTeams: () => fetchAPI('/teams', { method: 'GET' }),
    createTeam: (data: any) => fetchAPI('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getTeamMembers: (id: string) => fetchAPI(`/teams/${id}/members`, { method: 'GET' }),
    addTeamMember: (id: string, userId: string) => fetchAPI(`/teams/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
    }),
    removeTeamMember: (id: string, userId: string) => fetchAPI(`/teams/${id}/members/${userId}`, { method: 'DELETE' }),

    // Leads
    getLeads: (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        return fetchAPI(`/leads?${query}`, { method: 'GET' });
    },
    getLead: (id: string) => fetchAPI(`/leads/${id}`, { method: 'GET' }),
    createLead: (data: any) => fetchAPI('/leads', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateLead: (id: string, data: any) => fetchAPI(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteLead: (id: string) => fetchAPI(`/leads/${id}`, { method: 'DELETE' }),
    assignLead: (id: string, employeeId: string) => fetchAPI(`/leads/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
    }),
    bulkAssignLeads: (leadIds: string[], employeeId: string) => fetchAPI('/leads/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({ leadIds, employeeId }),
    }),

    // Stats & Dashboard
    getDashboardStats: () => fetchAPI('/stats/dashboard', { method: 'GET' }),
    getPipelineStats: () => fetchAPI('/stats/pipeline', { method: 'GET' }),
    getLeaderboard: () => fetchAPI('/stats/leaderboard', { method: 'GET' }),
    getRecentActivity: () => fetchAPI('/stats/activity', { method: 'GET' }),
    getTodaysTasks: () => fetchAPI('/stats/tasks/today', { method: 'GET' }),
    getRevenueData: () => fetchAPI('/stats/revenue', { method: 'GET' }),

    // Deals
    getDeals: (filters?: Record<string, string>) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        return fetchAPI(`/deals?${query}`, { method: 'GET' });
    },
    getDealsByStage: () => fetchAPI('/deals/pipeline', { method: 'GET' }),
    createDeal: (data: Record<string, unknown>) => fetchAPI('/deals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateDeal: (id: string, data: Record<string, unknown>) => fetchAPI(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteDeal: (id: string) => fetchAPI(`/deals/${id}`, { method: 'DELETE' }),

    // Customers
    getCustomers: (filters?: Record<string, string>) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        return fetchAPI(`/customers?${query}`, { method: 'GET' });
    },
    createCustomer: (data: Record<string, unknown>) => fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateCustomer: (id: string, data: Record<string, unknown>) => fetchAPI(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteCustomer: (id: string) => fetchAPI(`/customers/${id}`, { method: 'DELETE' }),

    // Follow-ups
    getFollowUps: (filters?: Record<string, string>) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        return fetchAPI(`/followups?${query}`, { method: 'GET' });
    },
    createFollowUp: (data: Record<string, unknown>) => fetchAPI('/followups', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    completeFollowUp: (id: string) => fetchAPI(`/followups/${id}/complete`, { method: 'POST' }),
    updateFollowUp: (id: string, data: Record<string, unknown>) => fetchAPI(`/followups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteFollowUp: (id: string) => fetchAPI(`/followups/${id}`, { method: 'DELETE' }),

    // Invoices
    getInvoices: (filters?: Record<string, string>) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        return fetchAPI(`/invoices?${query}`, { method: 'GET' });
    },
    getInvoice: (id: string) => fetchAPI(`/invoices/${id}`, { method: 'GET' }),
    getInvoicePdfData: (id: string) => fetchAPI(`/invoices/${id}/pdf`, { method: 'GET' }),
    createInvoice: (data: Record<string, unknown>) => fetchAPI('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateInvoiceStatus: (id: string, status: string) => fetchAPI(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    sendInvoiceEmail: (id: string) => fetchAPI(`/invoices/${id}/send`, { method: 'POST' }),
};
