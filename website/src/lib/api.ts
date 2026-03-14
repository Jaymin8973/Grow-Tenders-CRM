const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Tender {
  id: string;
  title: string;
  description: string;
  status: string;
  referenceId?: string;
  tenderUrl?: string;
  state?: string;
  city?: string;
  categoryName?: string;
  category?: { id: string; name: string };
  publishDate?: string;
  closingDate?: string;
  value?: number;
  requirements?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType?: string;
    size?: number;
  }>;
  _count?: { attachments: number };
  createdAt: string;
  accessLevel?: 'limited' | 'full';
  subscriptionRequired?: boolean;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface TenderStats {
  totalTenders: number;
  activeTenders: number;
  categories: Category[];
  states: Array<{ name: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateInquiryRequest {
  name: string;
  email: string;
  phone?: string;
  type?: string;
  subject: string;
  message: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Tenders
  getTenders: async (params?: {
    category?: string;
    search?: string;
    state?: string;
    city?: string;
    department?: string;
    ministry?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Tender>> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.state) searchParams.set('state', params.state);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.department) searchParams.set('department', params.department);
    if (params?.ministry) searchParams.set('ministry', params.ministry);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<PaginatedResponse<Tender>>(`/public/tenders${query ? `?${query}` : ''}`);
  },

  getTenderStates: async (): Promise<string[]> => {
    return fetchApi<string[]>('/public/tenders/states');
  },

  getTenderCities: async (state: string): Promise<string[]> => {
    const params = new URLSearchParams();
    params.set('state', state);
    return fetchApi<string[]>(`/public/tenders/cities?${params.toString()}`);
  },

  getTenderDepartments: async (): Promise<string[]> => {
    return fetchApi<string[]>('/public/tenders/departments');
  },

  getTenderById: async (id: string): Promise<Tender> => {
    return fetchApi<Tender>(`/public/tenders/${id}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    return fetchApi<Category[]>('/public/tenders/categories');
  },

  // Stats
  getStats: async (): Promise<TenderStats> => {
    return fetchApi<TenderStats>('/public/tenders/stats');
  },

  // Saved Tenders
  saveTender: async (tenderId: string, notes?: string): Promise<any> => {
    return fetchApi(`/public/tenders/saved/${tenderId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  unsaveTender: async (tenderId: string): Promise<{ message: string }> => {
    return fetchApi(`/public/tenders/saved/${tenderId}`, {
      method: 'DELETE',
    });
  },

  getSavedTenders: async (limit?: number, offset?: number): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    const query = params.toString();
    return fetchApi(`/public/tenders/saved${query ? `?${query}` : ''}`);
  },

  checkIfSaved: async (tenderId: string): Promise<{ isSaved: boolean; savedAt: string | null; notes: string | null }> => {
    return fetchApi(`/public/tenders/saved/${tenderId}/check`);
  },

  // Profile
  getProfile: async (): Promise<any> => {
    return fetchApi('/public/auth/me');
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    position?: string;
    address?: string;
    city?: string;
    state?: string;
  }): Promise<any> => {
    return fetchApi('/public/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Alerts
  getAlertPreferences: async (): Promise<any> => {
    return fetchApi('/public/alerts/preferences');
  },

  updateAlertPreferences: async (data: {
    statePreferences?: string[];
    categoryPreferences?: string[];
    emailRecipients?: string[];
  }): Promise<any> => {
    return fetchApi('/public/alerts/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getAlertHistory: async (limit: number = 20, offset: number = 0): Promise<any> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return fetchApi(`/public/alerts/history?${params.toString()}`);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> => {
    return fetchApi('/public/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Inquiries
  submitInquiry: async (data: CreateInquiryRequest): Promise<{ message: string }> => {
    return fetchApi('/public/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Tender History
  getMyTenderHistory: async (limit: number = 20, offset: number = 0): Promise<any> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return fetchApi(`/public/tenders/history/my?${params.toString()}`);
  },

  getTenderHistory: async (tenderId: string, limit: number = 20, offset: number = 0): Promise<any> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return fetchApi(`/public/tenders/${tenderId}/history?${params.toString()}`);
  },
};

// Utility functions
export function formatCurrency(value: number | undefined | null): string {
  if (!value) return '₹0';
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)} K`;
  }
  return `₹${value}`;
}

export function daysRemaining(closeDate: string | undefined | null): number {
  if (!closeDate) return 0;
  const close = new Date(closeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  close.setHours(0, 0, 0, 0);
  const diff = close.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
