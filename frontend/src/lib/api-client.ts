import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip auto-redirect for auth endpoints (login, register, etc.)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/verify-otp') ||
            originalRequest.url?.includes('/auth/forgot-password') ||
            originalRequest.url?.includes('/auth/reset-password');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const userId = localStorage.getItem('userId');

                if (refreshToken && userId) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        userId,
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } else {
                    // No refresh token available, redirect immediately
                    throw new Error('No refresh token');
                }
            } catch (refreshError) {
                // Refresh failed or no token available, clear storage and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('user');
                    localStorage.removeItem('screenAccess');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        } else if (error.response?.status === 401 && originalRequest._retry && !isAuthEndpoint) {
            // If it's already a retry and we still get 401, redirect to login to avoid loops
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('user');
                localStorage.removeItem('screenAccess');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
